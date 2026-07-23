import { writeFileSync, renameSync, mkdirSync, copyFileSync, rmSync, existsSync, readFileSync, lstatSync, symlinkSync, unlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { CookieMap, MainBanner, GpcBanner, PreferenceModal, S3ApiConfig, PublicProfileResponse } from '@consenti/types'
import { s3Put, s3Delete } from '../storage/s3/s3-client.js'

/** One locale's resolved banner/modal content — see `ProfileService`'s `ResolvedLocaleContent`. */
interface ResolvedLocaleContent {
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
}

export interface WorkerMessage {
  action: 'write' | 'activate' | 'deactivate'
  /** Fields shared by every locale's file — locale-specific content lives in `localeContent`.
   * The profile-wide settings (`gpcMode`/`complianceGroup`/etc.) are written into every locale's
   * file identically, since they aren't locale-specific — see `ProfileService.profileWideFields`. */
  profile: {
    id: string
    defaultLocale: string
    locales: string[]
    cookies: CookieMap
    expiryDays?: number
  } & Pick<PublicProfileResponse,
    'gpcMode' | 'complianceGroup' | 'darkMode' | 'allowReceipt' | 'enhanceAccessibility' |
    'showFooterMetadata' | 'allowedOrigins' | 'complianceConfig' | 'dpdpa' | 'hidePoweredBy'
  >
  /** Resolved content for locales included in this save. Any locale in `profile.locales` not
   * present here is carried forward unchanged from `previousVersion`'s file — see
   * `writeVersionDir()`. */
  localeContent: Record<string, ResolvedLocaleContent>
  /** The version to carry forward untouched locale files from. Undefined on create (a new
   * profile has no previous version, so an unlisted locale there simply gets no file). */
  previousVersion?: number
  storagePath: string
  tenantId: string
  profileId: string
  /** Incremented in place on every save — this snapshot's version number. */
  version: number
  complianceGroup: string
  s3Config?: S3ApiConfig
}

function profilesRoot(storagePath: string, tenantId: string): string {
  return join(storagePath, 'profiles', tenantId)
}

/** One snapshot's on-disk directory: grouped under the profile's stable id, keyed by version number. */
function versionDir(storagePath: string, tenantId: string, profileId: string, version: number): string {
  return join(profilesRoot(storagePath, tenantId), profileId, String(version))
}

function complianceDir(storagePath: string, tenantId: string, complianceGroup: string): string {
  return join(profilesRoot(storagePath, tenantId), complianceGroup)
}

function s3Key(tenantId: string, segment: string, locale: string): string {
  return `profiles/${tenantId}/${segment}/${locale}.json`
}

function writeJsonFile(filePath: string, content: string): void {
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, content, 'utf8')
  JSON.parse(content)
  renameSync(tmp, filePath)
}

const PROFILE_WIDE_KEYS = [
  'gpcMode', 'complianceGroup', 'darkMode', 'allowReceipt', 'enhanceAccessibility',
  'showFooterMetadata', 'allowedOrigins', 'complianceConfig', 'dpdpa', 'hidePoweredBy',
] as const

/** Copies whichever profile-wide settings are actually set — same fields on every locale's file,
 * since none of these are locale-specific. */
function profileWideFields(profile: WorkerMessage['profile']): Partial<Pick<WorkerMessage['profile'], typeof PROFILE_WIDE_KEYS[number]>> {
  const result: Partial<Pick<WorkerMessage['profile'], typeof PROFILE_WIDE_KEYS[number]>> = {}
  for (const key of PROFILE_WIDE_KEYS) {
    const value = profile[key]
    if (value !== undefined) (result as Record<string, unknown>)[key] = value
  }
  return result
}

/**
 * Writes every locale's on-disk file for one version in a single atomic pass — each locale gets
 * its own fully-resolved content directly (`localeContent[locale]`), never a merge/overlay onto
 * another locale's content. A locale in `profile.locales` with no entry in `localeContent` (a tab
 * the caller didn't touch this save) is carried forward byte-for-byte from `previousVersion`'s
 * file instead of being silently dropped.
 */
export async function writeVersionDir(msg: WorkerMessage): Promise<void> {
  const { storagePath, tenantId, profileId, version, profile, localeContent, previousVersion, s3Config } = msg
  const dir = versionDir(storagePath, tenantId, profileId, version)
  mkdirSync(dir, { recursive: true })

  const { locales, defaultLocale, cookies, expiryDays } = profile

  for (const locale of locales) {
    let content: string
    const resolved = localeContent[locale]
    if (resolved) {
      const doc = {
        id: profile.id,
        version,
        defaultLocale,
        currentLocale: locale,
        locales,
        cookies,
        ...(expiryDays !== undefined ? { expiryDays } : {}),
        ...profileWideFields(profile),
        mainBanner: resolved.mainBanner,
        ...(resolved.gpcBanner ? { gpcBanner: resolved.gpcBanner } : {}),
        preferenceModal: resolved.preferenceModal,
      }
      content = JSON.stringify(doc, null, 2)
    } else if (previousVersion !== undefined) {
      const prevPath = join(versionDir(storagePath, tenantId, profileId, previousVersion), `${locale}.json`)
      if (!existsSync(prevPath)) continue
      content = readFileSync(prevPath, 'utf8')
    } else {
      continue // create-time, a listed locale with no submitted content — nothing to write yet
    }

    const filePath = join(dir, `${locale}.json`)
    writeJsonFile(filePath, content)

    if (locale === defaultLocale) {
      writeJsonFile(join(dir, 'default.json'), content)
    }

    if (s3Config?.enabled) {
      await s3Put(s3Key(tenantId, `${profileId}/${version}`, locale), content, s3Config)
      if (locale === defaultLocale) {
        await s3Put(s3Key(tenantId, `${profileId}/${version}`, 'default'), content, s3Config)
      }
    }
  }

  if (!existsSync(join(dir, 'default.json'))) {
    const fallbackLocale = locales.includes(defaultLocale) ? defaultLocale : (locales[0] ?? '')
    if (fallbackLocale) {
      const fallbackPath = join(dir, `${fallbackLocale}.json`)
      if (existsSync(fallbackPath)) {
        copyFileSync(fallbackPath, join(dir, 'default.json'))
      }
    }
  }
}

/**
 * Removes whatever currently sits at `linkPath` if it isn't already a symlink — a one-time
 * migration step for directories written by the old copy-based activation. `rename()` can't
 * atomically replace a non-empty real directory, only a symlink (or nothing), so this must run
 * before the first symlink swap for a given compliance group.
 */
function clearNonSymlink(linkPath: string): void {
  if (!existsSync(linkPath)) return
  if (!lstatSync(linkPath).isSymbolicLink()) rmSync(linkPath, { recursive: true, force: true })
}

/**
 * Atomically points `{complianceGroup}/` at this version's already-written, already-verified
 * directory — a directory symlink swap (junction on Windows), not a file copy. The old target
 * is left untouched on disk (it's the previous version's own directory), so there's no window
 * where the live path is missing or a mix of old/new files, and no separate cleanup step for
 * locales that existed on the previous version but not this one.
 */
export async function activateComplianceGroup(msg: WorkerMessage): Promise<void> {
  const { storagePath, tenantId, profileId, version, complianceGroup, s3Config } = msg
  const srcDir = resolve(versionDir(storagePath, tenantId, profileId, version))
  const linkPath = complianceDir(storagePath, tenantId, complianceGroup)

  mkdirSync(profilesRoot(storagePath, tenantId), { recursive: true })
  clearNonSymlink(linkPath)

  const tmpLinkPath = `${linkPath}.new-${randomUUID().slice(0, 8)}`
  symlinkSync(srcDir, tmpLinkPath, 'junction')
  renameSync(tmpLinkPath, linkPath)

  // S3 has no symlink equivalent — a single pointer object plays the same role. Readers
  // (our own route, or an external CDN/edge function) resolve this, then fetch the versioned
  // key directly; the per-locale content itself was already written to that key by writeVersionDir.
  if (s3Config?.enabled) {
    const pointer = JSON.stringify({ profileId, version })
    await s3Put(s3Key(tenantId, complianceGroup, 'pointer'), pointer, s3Config)
  }
}

export async function deactivateComplianceGroup(msg: WorkerMessage): Promise<void> {
  const { storagePath, tenantId, complianceGroup, s3Config } = msg
  const linkPath = complianceDir(storagePath, tenantId, complianceGroup)

  if (existsSync(linkPath)) {
    if (lstatSync(linkPath).isSymbolicLink()) unlinkSync(linkPath)
    else rmSync(linkPath, { recursive: true, force: true }) // migration fallback, see clearNonSymlink
  }

  if (s3Config?.enabled) {
    await s3Delete(s3Key(tenantId, complianceGroup, 'pointer'), s3Config)
  }
}

export async function runWorkerAction(msg: WorkerMessage): Promise<void> {
  if (msg.action === 'write') {
    await writeVersionDir(msg)
  } else if (msg.action === 'activate') {
    await writeVersionDir(msg)
    await activateComplianceGroup(msg)
  } else if (msg.action === 'deactivate') {
    await deactivateComplianceGroup(msg)
  }
}
