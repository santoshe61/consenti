import type { Profile, CreateProfileInput, UpdateProfileInput, PublicProfileResponse, ProfileSummary, ProfileVersionEntry, ArchivedProfileSummary, StorageAdapter, CookieMap, S3ApiConfig, MainBanner, GpcBanner, PreferenceModal, LocaleContentInput, StoredProfileJson } from '@consenti/types'
import type { ProfileRepo } from '../repositories/profile.repo'
import type { AuditRepo } from '../repositories/audit.repo'
import type { EventEmitter } from 'node:events'
import type { LocaleJsonCacheService } from './locale-json-cache.service'
import { readdirSync, readFileSync, existsSync, statSync, lstatSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { join } from 'node:path'
import { runProfileJsonWrite } from '../workers/profile-json-worker-launcher.js'
import type { WorkerMessage } from '../workers/profile-json-worker-core.js'
import { randomUUID } from '../utils/crypto'

/**
 * Merges a profile's `cookiesOverride` deltas onto the template-resolved `CookieMap`. Deltas for
 * a cookie id not present in `cookies` are ignored — overrides tune an existing template-authored
 * parameter, they don't add new ones. `categoriesOverride`/`uiOverride` have no equivalent yet —
 * they're stored on `ProfileConfig` but not applied here (reserved for a future phase).
 */
export function applyCookiesOverride(cookies: CookieMap, override?: Record<string, Partial<CookieMap[string]>>): CookieMap {
  if (!override) return cookies
  const result: CookieMap = { ...cookies }
  for (const [id, delta] of Object.entries(override)) {
    if (!result[id]) continue
    result[id] = { ...result[id], ...delta }
  }
  return result
}

/** One locale's resolved banner/modal content — the unit both `StoredProfileJson`'s own
 * `mainBanner`/`gpcBanner`/`preferenceModal` (default locale) and each non-default locale's
 * on-disk version file store. */
interface ResolvedLocaleContent {
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
}

/**
 * Profile-wide settings (not locale-specific) that belong on every resolved response and every
 * on-disk locale file — `getResolved()`'s DB-fallback path and `writeLocaleFiles()`'s worker
 * input both need the exact same set, so this is the one place they're read off `pj`. Previously
 * only `cookies`/`expiryDays` made this trip; `gpcMode`/`complianceGroup`/`darkMode`/`allowReceipt`/
 * `enhanceAccessibility`/`showFooterMetadata`/`allowedOrigins`/`complianceConfig`/`dpdpa`/
 * `hidePoweredBy` were silently dropped, so a dashboard-configured toggle never reached a real
 * visitor's widget even on an active, API-backed profile.
 */
function profileWideFields(pj: StoredProfileJson): Pick<PublicProfileResponse,
  'gpcMode' | 'complianceGroup' | 'darkMode' | 'allowReceipt' | 'enhanceAccessibility' |
  'showFooterMetadata' | 'allowedOrigins' | 'complianceConfig' | 'dpdpa' | 'hidePoweredBy'
> {
  return {
    ...(pj.gpcMode !== undefined ? { gpcMode: pj.gpcMode } : {}),
    ...(pj.complianceGroup !== undefined ? { complianceGroup: pj.complianceGroup } : {}),
    ...(pj.darkMode !== undefined ? { darkMode: pj.darkMode } : {}),
    ...(pj.allowReceipt !== undefined ? { allowReceipt: pj.allowReceipt } : {}),
    ...(pj.enhanceAccessibility !== undefined ? { enhanceAccessibility: pj.enhanceAccessibility } : {}),
    ...(pj.showFooterMetadata !== undefined ? { showFooterMetadata: pj.showFooterMetadata } : {}),
    ...(pj.allowedOrigins !== undefined ? { allowedOrigins: pj.allowedOrigins } : {}),
    ...(pj.complianceConfig !== undefined ? { complianceConfig: pj.complianceConfig } : {}),
    ...(pj.dpdpa !== undefined ? { dpdpa: pj.dpdpa } : {}),
    ...(pj.hidePoweredBy !== undefined ? { hidePoweredBy: pj.hidePoweredBy } : {}),
  }
}

export class ProfileService {
  constructor(
    private profiles: ProfileRepo,
    private audit: AuditRepo,
    private tenantId: string = 'default',
    private storage?: StorageAdapter,
    private eventBus?: EventEmitter,
    private localeCache?: LocaleJsonCacheService,
    private profilesDir?: string,
    private handleCache?: (paths: string[], profileId: string, isPurge: boolean) => void,
    private s3Config?: S3ApiConfig,
  ) { }

  /** Root directory holding every version snapshot of one logical profile, keyed by its stable id. */
  private versionsRootDir(profileId: string): string {
    return join(this.profilesDir ?? '', this.tenantId, profileId)
  }

  private complianceGroupDir(complianceGroup: string): string {
    return join(this.profilesDir ?? '', this.tenantId, complianceGroup)
  }

  /**
   * The directory key used for activation/hot-serve writes and the "one active profile
   * per group" conflict check — the real `complianceGroup` when set, otherwise the
   * free-form `customComplianceGroup` (which the widget's `compliance.type` targets the
   * same way). Compliance *validation* still only ever runs against a real `complianceGroup`.
   */
  private groupKey(pj: { complianceGroup?: string; customComplianceGroup?: string }): string {
    return pj.complianceGroup || pj.customComplianceGroup || ''
  }

  private profileFilePaths(complianceGroup: string, locales: string[]): string[] {
    const dir = this.complianceGroupDir(complianceGroup)
    return locales.map(l => join(dir, `${l}.json`)).concat(join(dir, 'default.json'))
  }

  /** Resolves this profile's cookie map (consent-template lookup + `cookiesOverride` applied) —
   * the one piece of content still resolved live rather than baked at save time, since cookies
   * are small and never the source of the row-size problem `mainBanner`/`preferenceModal` were. */
  private async resolveCookies(pj: { cookies?: CookieMap; consentTemplateId?: string; cookiesOverride?: Record<string, Partial<CookieMap[string]>> }): Promise<CookieMap> {
    let cookies: CookieMap = pj.cookies ?? {}
    if (pj.consentTemplateId && this.storage) {
      const ct = await this.storage.getConsentTemplate(pj.consentTemplateId)
      if (ct) cookies = ct.cookies
    }
    return applyCookiesOverride(cookies, pj.cookiesOverride)
  }

  /**
   * Writes every locale's on-disk version file for one save (create or an edit) in a single
   * atomic worker call — default locale content comes from `profile.profileJson` itself, every
   * other touched locale from `localeContent`. A locale already in `profileJson.locales` but not
   * present in `localeContent` (a tab the user never opened this session) is carried forward
   * unchanged from `previousVersion` by the worker — never silently dropped.
   */
  private async writeLocaleFiles(
    profile: Profile,
    localeContent: Record<string, LocaleContentInput> | undefined,
    complianceGroup: string,
    previousVersion: number | undefined,
  ): Promise<void> {
    if (!this.profilesDir) return
    const pj = profile.profileJson
    const cookies = await this.resolveCookies(pj)
    const locales = pj.locales?.length ? pj.locales : [profile.defaultLocale]

    const allLocaleContent: Record<string, ResolvedLocaleContent> = {
      [profile.defaultLocale]: {
        mainBanner: pj.mainBanner,
        ...(pj.gpcBanner ? { gpcBanner: pj.gpcBanner } : {}),
        preferenceModal: pj.preferenceModal,
      },
      ...(localeContent ?? {}),
    }

    const isActive = pj.isActive ?? false
    const action: WorkerMessage['action'] = isActive ? 'activate' : 'write'
    const msg: WorkerMessage = {
      action,
      storagePath: join(this.profilesDir, '..'),
      tenantId: this.tenantId,
      profileId: profile.id,
      version: profile.version,
      complianceGroup,
      profile: {
        id: profile.id,
        defaultLocale: profile.defaultLocale,
        locales,
        cookies,
        ...(pj.expiryDays !== undefined ? { expiryDays: pj.expiryDays } : {}),
        ...profileWideFields(pj),
      },
      localeContent: allLocaleContent,
      ...(previousVersion !== undefined ? { previousVersion } : {}),
      ...(this.s3Config?.enabled ? { s3Config: this.s3Config } : {}),
    }
    await runProfileJsonWrite(msg)

    if (isActive) {
      const paths = this.profileFilePaths(complianceGroup, locales)
      this.handleCache?.(paths, profile.id, true)
      this.eventBus?.emit('cache:purge', { paths, profileId: profile.id })
    }
  }

  async create(input: Omit<CreateProfileInput, 'tenantId'>): Promise<Profile> {
    const { localeContent, ...rest } = input
    const profile = await this.profiles.create({ ...rest, tenantId: this.tenantId })
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.created',
      resourceType: 'profile',
      resourceId: profile.id,
      newData: { profileId: profile.id, version: profile.version, complianceGroup: this.groupKey(profile.profileJson) },
    })
    this.eventBus?.emit('profile.created', profile)

    if (this.profilesDir) {
      const complianceGroup = this.groupKey(profile.profileJson)
      await this.writeLocaleFiles(profile, localeContent, complianceGroup, undefined)
      const locales = profile.profileJson.locales?.length ? profile.profileJson.locales : [profile.defaultLocale]
      const paths = this.profileFilePaths(complianceGroup, locales)
      this.handleCache?.(paths, profile.id, false)
      this.eventBus?.emit('cache:warm', { paths, profileId: profile.id })
    }
    return profile
  }

  /**
   * Duplicates a profile as a brand new, always-inactive profile (own `id`, `version` starts at
   * 1 again). Delegates to {@link create} rather than copying on-disk files directly — the
   * resolved-JSON snapshot embeds its own `id`/`version`, so it has to be regenerated for the
   * new profile rather than byte-copied from the source's. Non-default locale content is read
   * back off the source's current version files so the copy carries every locale forward too.
   */
  async copy(id: string, name?: string): Promise<Profile> {
    const src = await this.profiles.get(id)
    if (!src) throw new Error(`Profile ${id} not found`)
    const locales = src.profileJson.locales?.length ? src.profileJson.locales : [src.defaultLocale]
    const localeContent: Record<string, LocaleContentInput> = {}
    for (const locale of locales) {
      if (locale === src.defaultLocale) continue
      const raw = await this.getVersionFile(id, String(src.version), locale)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw) as ResolvedLocaleContent
        localeContent[locale] = {
          mainBanner: parsed.mainBanner,
          ...(parsed.gpcBanner ? { gpcBanner: parsed.gpcBanner } : {}),
          preferenceModal: parsed.preferenceModal,
        }
      } catch { /* skip an unreadable/corrupt locale file — copy proceeds without it */ }
    }
    return this.create({
      name: name ?? `Copy of ${src.name}`,
      defaultLocale: src.defaultLocale,
      profileJson: { ...src.profileJson, isActive: false },
      ...(Object.keys(localeContent).length > 0 ? { localeContent } : {}),
    })
  }

  /**
   * Mutates the existing row in place — `id` is stable across every edit, `version` is
   * incremented. The prior state isn't kept as a separate DB row; its resolved-JSON snapshot
   * on disk (see {@link listVersions}) is the audit trail for that edit.
   */
  async update(id: string, input: UpdateProfileInput): Promise<Profile> {
    const old = await this.profiles.get(id)
    if (!old) throw new Error(`Profile ${id} not found`)
    const { localeContent, ...rest } = input

    // Activation is a dedicated action (activate()/deactivate()), never something the
    // profile editor form sends — carry the old row's isActive forward unless the
    // caller explicitly set it, so editing an active profile doesn't silently deactivate it.
    const carriedIsActive = rest.profileJson?.isActive ?? old.profileJson.isActive
    const profileJson = rest.profileJson
      ? { ...rest.profileJson, ...(carriedIsActive !== undefined ? { isActive: carriedIsActive } : {}) }
      : old.profileJson

    const profile = await this.profiles.update(id, {
      name: rest.name ?? old.name,
      defaultLocale: rest.defaultLocale ?? old.defaultLocale,
      profileJson,
      version: old.version + 1,
    })
    this.localeCache?.invalidate(id)

    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.updated',
      resourceType: 'profile',
      resourceId: profile.id,
      oldData: { profileId: old.id, version: old.version },
      newData: { profileId: profile.id, version: profile.version, complianceGroup: this.groupKey(profile.profileJson) },
    })
    this.eventBus?.emit('profile.updated', { previous: old, current: profile })

    if (this.profilesDir) {
      const complianceGroup = this.groupKey(profile.profileJson)
      await this.writeLocaleFiles(profile, localeContent, complianceGroup, old.version)
    }
    return profile
  }

  async delete(id: string): Promise<void> {
    const old = await this.profiles.get(id)
    await this.profiles.delete(id)
    this.localeCache?.invalidate(id)
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.deleted',
      resourceType: 'profile',
      resourceId: id,
      ...(old != null ? { oldData: { profileId: old.id, version: old.version } } : {}),
    })
    this.eventBus?.emit('profile.deleted', { id, previous: old })

    if (this.profilesDir && old) {
      const complianceGroup = this.groupKey(old.profileJson)
      const wasActive = old.profileJson.isActive ?? false
      if (wasActive && complianceGroup) {
        const locales = old.profileJson.locales?.length ? old.profileJson.locales : [old.defaultLocale]
        await this.runDeactivate(complianceGroup)
        const paths = this.profileFilePaths(complianceGroup, locales)
        this.handleCache?.(paths, id, true)
        this.eventBus?.emit('cache:purge', { paths, profileId: id })
      }
    }
  }

  async activate(id: string): Promise<Profile> {
    const profile = await this.profiles.get(id)
    if (!profile) throw new Error(`Profile ${id} not found`)
    const groupKey = this.groupKey(profile.profileJson)
    const updated = await this.profiles.update(id, {
      profileJson: { ...profile.profileJson, isActive: true },
    })
    this.localeCache?.invalidate(id)

    if (this.profilesDir && groupKey) {
      await this.writeLocaleFiles(updated, undefined, groupKey, profile.version)
    }
    await this.audit.log({ tenantId: this.tenantId, action: 'profile.activated', resourceType: 'profile', resourceId: id })
    this.eventBus?.emit('profile.activated', updated)
    return updated
  }

  async deactivate(id: string): Promise<Profile> {
    const profile = await this.profiles.get(id)
    if (!profile) throw new Error(`Profile ${id} not found`)
    const groupKey = this.groupKey(profile.profileJson)
    const updated = await this.profiles.update(id, {
      profileJson: { ...profile.profileJson, isActive: false },
    })
    this.localeCache?.invalidate(id)

    if (this.profilesDir && groupKey) {
      const locales = profile.profileJson.locales?.length ? profile.profileJson.locales : [profile.defaultLocale]
      await this.runDeactivate(groupKey)
      const paths = this.profileFilePaths(groupKey, locales)
      this.handleCache?.(paths, id, true)
      this.eventBus?.emit('cache:purge', { paths, profileId: id })
    }
    await this.audit.log({ tenantId: this.tenantId, action: 'profile.deactivated', resourceType: 'profile', resourceId: id })
    this.eventBus?.emit('profile.deactivated', updated)
    return updated
  }

  private async runDeactivate(complianceGroup: string): Promise<void> {
    if (!this.profilesDir) return
    const msg: WorkerMessage = {
      action: 'deactivate',
      storagePath: join(this.profilesDir, '..'),
      tenantId: this.tenantId,
      profileId: '',
      version: 0,
      complianceGroup,
      profile: { id: '', defaultLocale: '', locales: [], cookies: {} },
      localeContent: {},
      ...(this.s3Config?.enabled ? { s3Config: this.s3Config } : {}),
    }
    await runProfileJsonWrite(msg)
  }

  async get(id: string): Promise<Profile | null> {
    return this.profiles.get(id)
  }

  /**
   * Resolves one locale's full public response. The default locale's content lives directly on
   * the DB row (`profileJson.mainBanner`/`gpcBanner`/`preferenceModal`) — no template lookups, no
   * live resolution. Any other locale's content lives only in that locale's on-disk version file;
   * this reads it directly, falling back to the default locale's content if the file is missing
   * (e.g. a locale listed but never actually authored yet). This method is not a hot path — the
   * public `/profiles/:tenant/:group/:locale` route serves the static file directly and only
   * falls back to this for previewing an inactive/versioned profile.
   */
  async getResolved(id: string, locale?: string): Promise<PublicProfileResponse | null> {
    const profile = await this.profiles.get(id)
    if (!profile) return null

    const currentLocale = locale ?? profile.defaultLocale

    if (this.localeCache) {
      const cached = this.localeCache.read(id, currentLocale)
      if (cached) return cached
    }

    const pj = profile.profileJson
    const cookies = await this.resolveCookies(pj)
    const locales = pj.locales?.length ? pj.locales : [profile.defaultLocale]

    const defaultContent: ResolvedLocaleContent = {
      mainBanner: pj.mainBanner,
      ...(pj.gpcBanner ? { gpcBanner: pj.gpcBanner } : {}),
      preferenceModal: pj.preferenceModal,
    }

    let content = defaultContent
    if (currentLocale !== profile.defaultLocale) {
      const raw = await this.getVersionFile(id, String(profile.version), currentLocale)
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ResolvedLocaleContent
          content = {
            mainBanner: parsed.mainBanner,
            ...(parsed.gpcBanner ? { gpcBanner: parsed.gpcBanner } : {}),
            preferenceModal: parsed.preferenceModal,
          }
        } catch { /* corrupt/unreadable file — fall back to default locale content below */ }
      }
    }

    const response: PublicProfileResponse = {
      id: profile.id,
      version: profile.version,
      defaultLocale: profile.defaultLocale,
      currentLocale,
      locales,
      cookies,
      ...(pj.expiryDays !== undefined ? { expiryDays: pj.expiryDays } : {}),
      ...profileWideFields(pj),
      ...content,
    }

    if (this.localeCache) {
      try {
        this.localeCache.write(id, currentLocale, response)
      } catch (err) {
        // Non-fatal: the fast-path cache is a read optimization, not the source of truth —
        // getResolved() itself still returns the correct response either way. But a write
        // failure here usually means isPublicProfileResponse() and this response shape have
        // drifted apart, which is worth surfacing rather than silently degrading to zero cache.
        console.warn(`[Consenti] locale cache write failed for ${id}/${currentLocale}:`, err)
      }
    }

    return response
  }

  findActiveByComplianceGroup(complianceGroup: string): Promise<Profile | null> {
    return this.profiles.findActiveByComplianceGroup(this.tenantId, complianceGroup)
  }

  list(): Promise<Profile[]> {
    return this.profiles.list(this.tenantId)
  }

  listSummary(): Promise<ProfileSummary[]> {
    if (!this.storage) return Promise.resolve([])
    return this.storage.listProfilesSummary(this.tenantId)
  }

  /**
   * Lists every version snapshot of `profileId` on disk (newest first), read straight from
   * the version-directory tree — no DB query, `Profile.version` is just the current pointer.
   * Works for archived profiles too (DB row deleted, files still on disk) — the directory
   * tree is the only thing this reads.
   */
  async listVersions(profileId: string): Promise<ProfileVersionEntry[]> {
    if (!this.profilesDir) return []
    const dir = this.versionsRootDir(profileId)
    if (!existsSync(dir)) return []
    const versions: ProfileVersionEntry[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const version = Number(entry.name)
        if (!Number.isInteger(version)) continue
        const vdir = join(dir, entry.name)
        const locales = readdirSync(vdir)
          .filter(f => f.endsWith('.json') && f !== 'default.json')
          .map(f => f.replace('.json', ''))
        let createdAt: string
        try {
          createdAt = statSync(vdir).mtime.toISOString()
        } catch {
          createdAt = new Date().toISOString()
        }
        versions.push({ version, createdAt, locales })
      }
    } catch {
      return []
    }
    return versions.sort((a, b) => b.version - a.version)
  }

  /** Works for archived profiles too — see `listVersions()`. */
  async getVersionFile(profileId: string, version: string, locale: string): Promise<string | null> {
    if (!this.profilesDir) return null
    const dir = join(this.versionsRootDir(profileId), version)
    const filePath = join(dir, `${locale}.json`)
    if (!existsSync(filePath)) {
      const defaultPath = join(dir, 'default.json')
      if (!existsSync(defaultPath)) return null
      return readFileSync(defaultPath, 'utf8')
    }
    return readFileSync(filePath, 'utf8')
  }

  /**
   * Profile-id directories on disk with no matching DB row — deleted profiles whose version
   * snapshots `delete()` never removes. Directory-only read (id, version count, last-modified
   * mtime) — no file content is opened here; that only happens once a specific version is
   * requested via `getVersionFile()`, which works for these ids too.
   */
  async listArchivedProfiles(): Promise<ArchivedProfileSummary[]> {
    if (!this.profilesDir) return []
    const root = join(this.profilesDir, this.tenantId)
    if (!existsSync(root)) return []

    const existingIds = new Set((await this.profiles.list(this.tenantId)).map(p => p.id))
    const results: ArchivedProfileSummary[] = []
    let entries: Dirent[]
    try {
      entries = readdirSync(root, { withFileTypes: true })
    } catch {
      return []
    }
    for (const entry of entries) {
      // complianceGroup hot-serve dirs are symlinks (junctions) — never real profile dirs.
      if (!entry.isDirectory() || existingIds.has(entry.name)) continue
      const dirPath = join(root, entry.name)
      if (lstatSync(dirPath).isSymbolicLink()) continue
      let versionDirs: Dirent[]
      try {
        versionDirs = readdirSync(dirPath, { withFileTypes: true })
      } catch {
        continue
      }
      const versions = versionDirs.filter(v => v.isDirectory() && Number.isInteger(Number(v.name)))
      if (versions.length === 0) continue // not a profile dir (no numbered version subdirs)
      let lastModified = new Date(0).toISOString()
      for (const v of versions) {
        try {
          const mtime = statSync(join(dirPath, v.name)).mtime.toISOString()
          if (mtime > lastModified) lastModified = mtime
        } catch { /* skip unreadable version dir */ }
      }
      results.push({ id: entry.name, versionCount: versions.length, lastModified })
    }
    return results.sort((a, b) => b.lastModified.localeCompare(a.lastModified))
  }

  /**
   * Seeds a default profile for a compliance group from the embedded English profile in
   * `@consenti/utils`, merged with locale text overlays for de/es/fr/ja. Every locale — including
   * non-English ones — is passed through `create()`'s normal `localeContent` path, the same as an
   * author-submitted profile; there is no separate "seeded profile" code path for locale content
   * anymore, which is what previously let a locale silently never make it into the served file.
   * Only creates the profile if no active profile already exists for the compliance group.
   * Safe to call repeatedly (idempotent).
   *
   * @param complianceGroup - One of the 8 compliance group IDs.
   */
  async seedDefaultProfile(complianceGroup: string): Promise<void> {
    const existing = await this.profiles.findActiveByComplianceGroup(this.tenantId, complianceGroup)
    if (existing) return

    const { DEFAULT_PROFILES, resolveLocaleTranslation } = await import('@consenti/utils/profiles')
    const embedded = DEFAULT_PROFILES[complianceGroup as keyof typeof DEFAULT_PROFILES]
    if (!embedded) return

    const enTranslation = embedded.translations['en']
    if (!enTranslation) return

    const otherLocales = ['de', 'es', 'fr', 'ja']
    const locales = ['en', ...otherLocales.filter(lang => resolveLocaleTranslation(complianceGroup, lang) !== undefined)]
    const localeContent: Record<string, LocaleContentInput> = {}
    for (const lang of otherLocales) {
      const resolved = resolveLocaleTranslation(complianceGroup, lang)
      if (resolved) {
        localeContent[lang] = {
          mainBanner: resolved.mainBanner as unknown as MainBanner,
          ...(resolved.gpcBanner ? { gpcBanner: resolved.gpcBanner as unknown as GpcBanner } : {}),
          preferenceModal: resolved.preferenceModal as unknown as PreferenceModal,
        }
      }
    }

    await this.create({
      name: `Default — ${complianceGroup}`,
      defaultLocale: embedded.defaultLocale,
      profileJson: {
        id: randomUUID(),
        defaultLocale: embedded.defaultLocale,
        complianceGroup: embedded.complianceGroup,
        gpcMode: embedded.gpcMode,
        cookies: embedded.cookies as unknown as CookieMap,
        ...(embedded.expiryDays !== undefined ? { expiryDays: embedded.expiryDays } : {}),
        locales,
        mainBanner: enTranslation.mainBanner as unknown as MainBanner,
        ...(enTranslation.gpcBanner ? { gpcBanner: enTranslation.gpcBanner as unknown as GpcBanner } : {}),
        preferenceModal: enTranslation.preferenceModal as unknown as PreferenceModal,
        isActive: true,
      },
      ...(Object.keys(localeContent).length > 0 ? { localeContent } : {}),
    })
  }

  /**
   * Seeds default profiles for all 8 compliance groups.
   * Skips any group that already has an active profile (idempotent).
   */
  async seedAllDefaults(): Promise<void> {
    const { COMPLIANCE_GROUP_IDS } = await import('@consenti/utils')
    await Promise.all(COMPLIANCE_GROUP_IDS.map(g => this.seedDefaultProfile(g)))
  }
}
