import type { Profile, CreateProfileInput, UpdateProfileInput, PublicProfileResponse, ProfileSummary, ProfileVersionEntry, StorageAdapter, LocaleTextContent, ServerUITemplate, LocaleTranslations, Cookie, S3ApiConfig } from '@consenti/types'
import { resolveLocale } from '../core/profile-engine'
import type { ProfileRepo } from '../repositories/profile.repo'
import type { AuditRepo } from '../repositories/audit.repo'
import type { EventEmitter } from 'node:events'
import type { LocaleJsonCacheService } from './locale-json-cache.service'
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { runProfileJsonWrite } from '../workers/profile-json-worker-launcher.js'
import type { WorkerMessage } from '../workers/profile-json-worker-core.js'

function buildTranslations(template: ServerUITemplate, localeContents: Record<string, LocaleTextContent>): Record<string, LocaleTranslations> {
  const result: Record<string, LocaleTranslations> = {}
  for (const [locale, content] of Object.entries(localeContents)) {
    result[locale] = {
      mainBanner: {
        position: template.mainBanner.position,
        ...(template.mainBanner.overlayOpacity !== undefined ? { overlayOpacity: template.mainBanner.overlayOpacity } : {}),
        ...(template.mainBanner.showClose !== undefined ? { showClose: template.mainBanner.showClose } : {}),
        ...(template.mainBanner.showLocaleSwitcher !== undefined ? { showLocaleSwitcher: template.mainBanner.showLocaleSwitcher } : {}),
        ...(template.mainBanner.headingTag !== undefined ? { headingTag: template.mainBanner.headingTag } : {}),
        ...(content.mainBanner.heading !== undefined ? { heading: content.mainBanner.heading } : {}),
        htmlText: content.mainBanner.htmlText,
        buttons: template.mainBanner.buttons.map((btn, i) => ({
          text: content.mainBanner.buttonLabels?.[i] ?? btn.text,
          style: btn.style,
          action: btn.action,
          ...(btn.url !== undefined ? { url: btn.url } : {}),
          ...(btn.type !== undefined ? { type: btn.type } : {}),
          ...(btn.cookies !== undefined ? { cookies: btn.cookies } : {}),
        })),
      },
      gpcBanner: {
        position: template.gpcBanner.position,
        ...(template.gpcBanner.overlayOpacity !== undefined ? { overlayOpacity: template.gpcBanner.overlayOpacity } : {}),
        ...(template.gpcBanner.showClose !== undefined ? { showClose: template.gpcBanner.showClose } : {}),
        ...(template.gpcBanner.showLocaleSwitcher !== undefined ? { showLocaleSwitcher: template.gpcBanner.showLocaleSwitcher } : {}),
        ...(template.gpcBanner.headingTag !== undefined ? { headingTag: template.gpcBanner.headingTag } : {}),
        ...(content.gpcBanner.heading !== undefined ? { heading: content.gpcBanner.heading } : {}),
        htmlText: content.gpcBanner.htmlText,
        buttons: template.gpcBanner.buttons.map((btn, i) => ({
          text: content.gpcBanner.buttonLabels?.[i] ?? btn.text,
          style: btn.style,
          action: btn.action,
          ...(btn.url !== undefined ? { url: btn.url } : {}),
          ...(btn.type !== undefined ? { type: btn.type } : {}),
          ...(btn.cookies !== undefined ? { cookies: btn.cookies } : {}),
        })),
      },
      preferenceModal: {
        ...(template.preferenceModal.position !== undefined ? { position: template.preferenceModal.position } : {}),
        ...(template.preferenceModal.overlayOpacity !== undefined ? { overlayOpacity: template.preferenceModal.overlayOpacity } : {}),
        ...(template.preferenceModal.showClose !== undefined ? { showClose: template.preferenceModal.showClose } : {}),
        ...(template.preferenceModal.showLocaleSwitcher !== undefined ? { showLocaleSwitcher: template.preferenceModal.showLocaleSwitcher } : {}),
        ...(template.preferenceModal.persistent !== undefined ? { persistent: template.preferenceModal.persistent } : {}),
        ...(template.preferenceModal.headingTag !== undefined ? { headingTag: template.preferenceModal.headingTag } : {}),
        ...(template.preferenceModal.mobileFullScreenBreakpoint !== undefined ? { mobileFullScreenBreakpoint: template.preferenceModal.mobileFullScreenBreakpoint } : {}),
        heading: content.preferenceModal.heading ?? '',
        ...(content.preferenceModal.subheading !== undefined ? { subheading: content.preferenceModal.subheading } : {}),
        htmlText: content.preferenceModal.htmlText ?? '',
        buttons: template.preferenceModal.buttons.map((btn, i) => ({
          text: content.preferenceModal.buttonLabels?.[i] ?? btn.text,
          style: btn.style,
          action: btn.action,
          ...(btn.url !== undefined ? { url: btn.url } : {}),
          ...(btn.type !== undefined ? { type: btn.type } : {}),
          ...(btn.cookies !== undefined ? { cookies: btn.cookies } : {}),
        })),
        categories: template.preferenceModal.categories.map(cat => {
          const c = content.preferenceModal.categories.find(c => c.id === cat.id)
          return {
            id: cat.id,
            heading: c?.heading ?? cat.id,
            ...(cat.headingTag !== undefined ? { headingTag: cat.headingTag } : {}),
            htmlText: c?.htmlText ?? '',
            ...(cat.mandatory !== undefined ? { mandatory: cat.mandatory } : {}),
            ...(cat.type !== undefined ? { type: cat.type } : {}),
            ...(cat.legitimateInterest?.enabled ? { legitimateInterest: { enabled: true as const } } : {}),
            cookies: cat.cookies,
          }
        }),
      },
    }
  }
  return result
}

function normaliseCookieLegalBasis(cookie: Cookie): Cookie {
  if (cookie.legalBasis) return cookie
  if (cookie.mandatory) return { ...cookie, legalBasis: 'mandatory' }
  if (cookie.type) return { ...cookie, legalBasis: cookie.type }
  return cookie
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
    private handleCache?: (paths: string[], version: number, isPurge: boolean) => void,
    private s3Config?: S3ApiConfig,
  ) { }

  private profileDir(profileId: string): string {
    return join(this.profilesDir ?? '', this.tenantId, profileId)
  }

  private complianceGroupDir(complianceGroup: string): string {
    return join(this.profilesDir ?? '', this.tenantId, complianceGroup)
  }

  private profileFilePaths(complianceGroup: string, locales: string[]): string[] {
    const dir = this.complianceGroupDir(complianceGroup)
    return locales.map(l => join(dir, `${l}.json`)).concat(join(dir, 'default.json'))
  }

  async create(input: Omit<CreateProfileInput, 'tenantId'>): Promise<Profile> {
    const profile = await this.profiles.create({ ...input, tenantId: this.tenantId })
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.created',
      resourceType: 'profile',
      resourceId: profile.id,
      newData: profile,
    })
    this.eventBus?.emit('profile.created', profile)

    if (this.profilesDir) {
      const resolved = await this.getResolved(profile.id)
      if (resolved) {
        const complianceGroup = (profile.profileJson as { complianceGroup?: string }).complianceGroup ?? ''
        await this.runWrite({ action: 'write', profile: resolved, profileId: profile.id, version: profile.version, complianceGroup })
        const paths = this.profileFilePaths(complianceGroup, resolved.locales)
        this.handleCache?.(paths, profile.version, false)
        this.eventBus?.emit('cache:warm', { paths, version: profile.version })
      }
    }
    return profile
  }

  async update(id: string, input: UpdateProfileInput): Promise<Profile> {
    const old = await this.profiles.get(id)
    const profile = await this.profiles.update(id, input)
    this.localeCache?.invalidate(id)
    await this.audit.log({
      tenantId: this.tenantId,
      action: 'profile.updated',
      resourceType: 'profile',
      resourceId: id,
      ...(old != null ? { oldData: old } : {}),
      newData: profile,
    })
    this.eventBus?.emit('profile.updated', { previous: old, current: profile })

    if (this.profilesDir) {
      const resolved = await this.getResolved(profile.id)
      if (resolved) {
        const complianceGroup = (profile.profileJson as { complianceGroup?: string }).complianceGroup ?? ''
        const isActive = (profile.profileJson as { isActive?: boolean }).isActive ?? false
        const action: WorkerMessage['action'] = isActive ? 'activate' : 'write'
        await this.runWrite({ action, profile: resolved, profileId: id, version: profile.version, complianceGroup })
        if (isActive) {
          const paths = this.profileFilePaths(complianceGroup, resolved.locales)
          this.handleCache?.(paths, profile.version, true)
          this.eventBus?.emit('cache:purge', { paths, version: profile.version })
        }
      }
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
      ...(old != null ? { oldData: old } : {}),
    })
    this.eventBus?.emit('profile.deleted', { id, previous: old })

    if (this.profilesDir && old) {
      const complianceGroup = (old.profileJson as { complianceGroup?: string }).complianceGroup ?? ''
      const wasActive = (old.profileJson as { isActive?: boolean }).isActive ?? false
      if (wasActive && complianceGroup) {
        const resolved = await this.getResolved(id).catch(() => null)
        const locales = resolved?.locales ?? []
        await this.runWrite({ action: 'deactivate', profile: resolved ?? {} as PublicProfileResponse, profileId: id, version: old.version, complianceGroup })
        const paths = this.profileFilePaths(complianceGroup, locales)
        this.handleCache?.(paths, old.version, true)
        this.eventBus?.emit('cache:purge', { paths, version: old.version })
      }
    }
  }

  async activate(id: string): Promise<Profile> {
    const profile = await this.profiles.get(id)
    if (!profile) throw new Error(`Profile ${id} not found`)
    const pj = profile.profileJson as { complianceGroup?: string; isActive?: boolean }
    const updated = await this.profiles.update(id, {
      profileJson: { ...profile.profileJson, isActive: true },
    })
    this.localeCache?.invalidate(id)

    if (this.profilesDir && pj.complianceGroup) {
      const resolved = await this.getResolved(id)
      if (resolved) {
        await this.runWrite({ action: 'activate', profile: resolved, profileId: id, version: updated.version, complianceGroup: pj.complianceGroup })
        const paths = this.profileFilePaths(pj.complianceGroup, resolved.locales)
        this.handleCache?.(paths, updated.version, false)
        this.eventBus?.emit('cache:warm', { paths, version: updated.version })
      }
    }
    await this.audit.log({ tenantId: this.tenantId, action: 'profile.activated', resourceType: 'profile', resourceId: id })
    this.eventBus?.emit('profile.activated', updated)
    return updated
  }

  async deactivate(id: string): Promise<Profile> {
    const profile = await this.profiles.get(id)
    if (!profile) throw new Error(`Profile ${id} not found`)
    const pj = profile.profileJson as { complianceGroup?: string; isActive?: boolean }
    const updated = await this.profiles.update(id, {
      profileJson: { ...profile.profileJson, isActive: false },
    })
    this.localeCache?.invalidate(id)

    if (this.profilesDir && pj.complianceGroup) {
      const resolved = await this.getResolved(id)
      const locales = resolved?.locales ?? []
      await this.runWrite({ action: 'deactivate', profile: resolved ?? {} as PublicProfileResponse, profileId: id, version: profile.version, complianceGroup: pj.complianceGroup })
      const paths = this.profileFilePaths(pj.complianceGroup, locales)
      this.handleCache?.(paths, profile.version, true)
      this.eventBus?.emit('cache:purge', { paths, version: profile.version })
    }
    await this.audit.log({ tenantId: this.tenantId, action: 'profile.deactivated', resourceType: 'profile', resourceId: id })
    this.eventBus?.emit('profile.deactivated', updated)
    return updated
  }

  private async runWrite(args: { action: WorkerMessage['action']; profile: PublicProfileResponse; profileId: string; version: number; complianceGroup: string }): Promise<void> {
    if (!this.profilesDir) return
    const msg: WorkerMessage = {
      action: args.action,
      profile: args.profile,
      storagePath: join(this.profilesDir, '..'),
      tenantId: this.tenantId,
      profileId: args.profileId,
      version: args.version,
      complianceGroup: args.complianceGroup,
      ...(this.s3Config?.enabled ? { s3Config: this.s3Config } : {}),
    }
    await runProfileJsonWrite(msg)
  }

  async get(id: string, locale?: string): Promise<Profile | null> {
    const profile = await this.profiles.get(id)
    if (!profile) return null
    if (!locale) return profile
    const resolved = resolveLocale(profile.profileJson.translations ?? {}, locale, profile.defaultLocale)
    return {
      ...profile,
      profileJson: {
        ...profile.profileJson,
        translations: { [locale]: resolved },
      },
    }
  }

  async getResolved(id: string, locale?: string): Promise<PublicProfileResponse | null> {
    const profile = await this.profiles.get(id)
    if (!profile) return null

    const currentLocale = locale ?? profile.defaultLocale

    // Fast path: locale JSON cache
    if (this.localeCache) {
      const cached = this.localeCache.read(id, currentLocale)
      if (cached) return cached
    }

    const pj = profile.profileJson
    let cookies = pj.cookies ?? []
    let translations = pj.translations ?? {}

    if (pj.cookieTemplateId && this.storage) {
      const ct = await this.storage.getCookieTemplate(pj.cookieTemplateId)
      if (ct) cookies = ct.cookies
    }

    if (pj.uiTemplateId && pj.localeContents && this.storage) {
      const ut = await this.storage.getUITemplate(pj.uiTemplateId)
      if (ut) translations = buildTranslations(ut, pj.localeContents)
    }

    const localeKeys = pj.localeContents ? Object.keys(pj.localeContents) : Object.keys(translations)
    const resolved = resolveLocale(translations, currentLocale, profile.defaultLocale)
    const response: PublicProfileResponse = {
      id: profile.id,
      version: profile.version,
      defaultLocale: profile.defaultLocale,
      currentLocale,
      locales: localeKeys,
      cookies: cookies.map(normaliseCookieLegalBasis),
      mainBanner: resolved.mainBanner,
      preferenceModal: resolved.preferenceModal,
      ...(resolved.gpcBanner != null ? { gpcBanner: resolved.gpcBanner } : {}),
    }

    if (this.localeCache) {
      try { this.localeCache.write(id, currentLocale, response) } catch { /* non-fatal */ }
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

  listVersions(profileId: string): ProfileVersionEntry[] {
    if (!this.profilesDir) return []
    const dir = this.profileDir(profileId)
    if (!existsSync(dir)) return []
    const versions: ProfileVersionEntry[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const ver = parseInt(entry.name, 10)
        if (isNaN(ver)) continue
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
        versions.push({ version: ver, createdAt, locales })
      }
    } catch {
      return []
    }
    return versions.sort((a, b) => b.version - a.version)
  }

  getVersionFile(profileId: string, version: number, locale: string): string | null {
    if (!this.profilesDir) return null
    const filePath = join(this.profileDir(profileId), String(version), `${locale}.json`)
    if (!existsSync(filePath)) {
      const defaultPath = join(this.profileDir(profileId), String(version), 'default.json')
      if (!existsSync(defaultPath)) return null
      return readFileSync(defaultPath, 'utf8')
    }
    return readFileSync(filePath, 'utf8')
  }
}
