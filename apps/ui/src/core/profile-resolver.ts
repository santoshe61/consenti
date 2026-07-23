import type { ConsentiConfig, ResolvedProfile, ProfileConfig, RegisterableProfileConfig, PublicProfileResponse, GpcMode, ComplianceType, ComplianceGroupId, MainBanner, GpcBanner, PreferenceModal, DeepPartial } from '../types'
import { httpRequest } from '../utils/http'
import { deepMerge, resolveLocale } from '../utils/locale'
import { logger } from '../utils/console'
import { getBrowserGeoHints, encodeGeoHints } from '../utils/geo-hints'
import { EMBEDDED_COMPLIANCE_MAP } from '@consenti/utils'
import { adaptEmbeddedProfile } from '../utils/profile-adapter'
import { peekConsentLocale } from './consent-store'

// ─── Local profile registry ───────────────────────────────────────────────────

const profileRegistry = new Map<Symbol, RegisterableProfileConfig>()

export function registerProfile(type: Symbol, config: RegisterableProfileConfig): void {
  profileRegistry.set(type, config)
}

export function getRegisteredProfile(type: Symbol): RegisterableProfileConfig | undefined {
  return profileRegistry.get(type)
}

/** First registered profile whose `complianceGroup` matches — used to prefer an author's custom profile over the built-in embedded one for that group. */
function findRegisteredProfileForGroup(group: ComplianceGroupId): RegisterableProfileConfig | undefined {
  for (const config of profileRegistry.values()) {
    if (config.complianceGroup === group) return config
  }
  return undefined
}

// ─── mapPublicProfileToResolved ───────────────────────────────────────────────

export function mapPublicProfileToResolved(resp: PublicProfileResponse): ResolvedProfile {
  // resp comes from an HTTP response, so it may still carry the legacy boolean gpcMode
  // shape even though the static type says GpcMode — convert defensively.
  const rawGpcMode = resp.gpcMode as GpcMode | boolean | undefined
  let gpcMode: GpcMode = 'ignore'
  if (typeof rawGpcMode === 'boolean') {
    gpcMode = rawGpcMode ? 'honor' : 'ignore'
  } else if (rawGpcMode) {
    gpcMode = rawGpcMode
  }

  return {
    id: resp.id,
    ...(resp.version !== undefined ? { version: resp.version } : {}),
    defaultLocale: resp.defaultLocale,
    locales: resp.locales,
    cookies: resp.cookies,
    mainBanner: resp.mainBanner,
    allowReceipt: resp.allowReceipt ?? false,
    preferenceModal: resp.preferenceModal,
    ...(resp.expiryDays ? { expiryDays: resp.expiryDays } : {}),
    ...(resp.gpcBanner ? { gpcBanner: resp.gpcBanner } : {}),
    ...(gpcMode ? { gpcMode } : {}),
    ...(resp.darkMode !== undefined ? { darkMode: resp.darkMode } : {}),
    ...(resp.complianceGroup ? { complianceGroup: resp.complianceGroup } : {}),
    ...(resp.complianceConfig ? { complianceConfig: resp.complianceConfig } : {}),
    ...(resp.dpdpa ? { dpdpa: resp.dpdpa } : {}),
    ...(resp.hidePoweredBy !== undefined ? { hidePoweredBy: resp.hidePoweredBy } : {}),
    ...(resp.showFooterMetadata !== undefined ? { showFooterMetadata: resp.showFooterMetadata } : {}),
    ...(resp.enhanceAccessibility !== undefined ? { enhanceAccessibility: resp.enhanceAccessibility } : {}),
  }
}

// ─── sessionStorage cache for /resolve-profile ───────────────────────────────

const CACHE_KEY_PREFIX = '__consenti_resolved_'
const CACHE_TTL_MS = 60 * 60 * 1000

interface ResolvedUrlCache {
  filePath: string
  version: number
  complianceGroup: string
  tenantId: string
  locale: string
  expiresAt: number
}

export function getCachedResolution(
  tenantId: string,
  locale: string,
  cacheEnabled: boolean,
): ResolvedUrlCache | null {
  if (!cacheEnabled) return null
  const key = `${CACHE_KEY_PREFIX}${tenantId}_${locale}`
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw) as ResolvedUrlCache
    if (Date.now() > cached.expiresAt) { sessionStorage.removeItem(key); return null }
    return cached
  } catch { return null }
}

export function setCachedResolution(
  tenantId: string,
  locale: string,
  cacheEnabled: boolean,
  data: Omit<ResolvedUrlCache, 'expiresAt'>,
): void {
  if (!cacheEnabled) return
  const key = `${CACHE_KEY_PREFIX}${tenantId}_${locale}`
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...data, expiresAt: Date.now() + CACHE_TTL_MS }))
  } catch { /* ignore storage failures */ }
}

// ─── Domain allowlist check ───────────────────────────────────────────────────

function isDomainAllowed(profile: PublicProfileResponse, trustDomain: boolean): boolean {
  if (trustDomain) return true
  const origins = profile.allowedOrigins
  if (!origins || origins.length === 0) return true
  const current = window.location.origin
  return origins.some(o => o === current || o === '*')
}

// ─── Pre-built profile loader ─────────────────────────────────────────────────

async function loadPrebuiltProfile(complianceGroup: ComplianceGroupId, _locale?: string): Promise<ResolvedProfile | null> {
  const { DEFAULT_PROFILES } = await import('@consenti/utils/profiles')
  const embedded = DEFAULT_PROFILES[complianceGroup as keyof typeof DEFAULT_PROFILES]
  if (!embedded) return null
  // Deliberately pinned to English — @consenti/utils/profiles now carries de/es/fr/ja overlays
  // for apps/api (seeding + dashboard "Load Defaults"), but the widget's embedded fallback
  // stays English-only until multi-locale prebuilt profiles are explicitly decided on.
  return adaptEmbeddedProfile(embedded, 'en')
}

function isPrebuiltAllowed(complianceGroup: ComplianceGroupId, config: ConsentiConfig): boolean {
  const setting = config.core?.usePrebuiltProfiles ?? 'all'
  if (setting === 'all') return true
  return (setting as string[]).includes(complianceGroup)
}

// ─── Geo hint → complianceGroup ───────────────────────────────────────────────
//
// Timezone is the primary signal: `Intl.DateTimeFormat().resolvedOptions().timeZone`
// is set by the OS/device and can't be spoofed by a browser locale setting, so a
// timezone → country match (via `EMBEDDED_COMPLIANCE_MAP`'s `timezones` field) is
// trusted first. Browser languages are a weaker signal (users travel with their
// language but not always their timezone override) and are only used to either
// disambiguate a timezone shared by multiple countries, or as a fallback when the
// timezone isn't recognized at all.

type CountryEntry = { default: string; timezones?: readonly string[] }

let timezoneCountryIndex: Map<string, string[]> | undefined

function getTimezoneCountryIndex(): Map<string, string[]> {
  if (timezoneCountryIndex) return timezoneCountryIndex
  const index = new Map<string, string[]>()
  const countries = EMBEDDED_COMPLIANCE_MAP.countries as Record<string, CountryEntry>
  for (const [code, data] of Object.entries(countries)) {
    for (const tz of data.timezones ?? []) {
      const codes = index.get(tz) ?? []
      codes.push(code)
      index.set(tz, codes)
    }
  }
  timezoneCountryIndex = index
  return index
}

/** Extract a country code from a BCP47 language tag (e.g. 'de-DE' → 'DE'), if valid. */
function countryFromLangTag(lang: string): string | undefined {
  const parts = lang.replace(/_/g, '-').split('-')
  const tag = parts.length >= 2 ? parts[parts.length - 1]?.toUpperCase() : undefined
  return tag && /^[A-Z]{2}$/.test(tag) && tag in EMBEDDED_COMPLIANCE_MAP.countries ? tag : undefined
}

function resolveCountryFromHints(tz: string, langs: readonly string[]): string | undefined {
  const tzCountries = getTimezoneCountryIndex().get(tz) ?? []
  const langCountries = langs.map(countryFromLangTag).filter((c): c is string => !!c)

  // Unambiguous timezone match — the strongest signal, use it directly.
  if (tzCountries.length === 1) return tzCountries[0]

  // Timezone shared by multiple countries (e.g. a common IANA zone) — join with
  // the browser's language region(s) to pick the right one.
  if (tzCountries.length > 1) {
    return langCountries.find(c => tzCountries.includes(c)) ?? tzCountries[0]
  }

  // Timezone not in our map at all — fall back to the language region.
  return langCountries[0]
}

function resolveGroupFromHints(tz: string, langs: readonly string[]): ComplianceGroupId {
  const countryCode = resolveCountryFromHints(tz, langs)
  const countries = EMBEDDED_COMPLIANCE_MAP.countries as Record<string, CountryEntry>
  const entry = countryCode ? countries[countryCode] : undefined
  if (entry?.default) return entry.default as ComplianceGroupId

  // Last-resort continent-level fallback for timezones we couldn't map at all
  // (legacy/alias IANA zone names, Antarctic research stations, etc.)
  const tzParts = tz.split('/')
  if (tzParts[0] === 'Europe') return 'opt-in'
  if (tzParts[0] === 'America') return 'opt-out'

  // Default: opt-in (GDPR) — strictest, safe for any unknown jurisdiction
  return 'opt-in'
}

// ─── Scenario helpers ─────────────────────────────────────────────────────────

function effectiveLocale(config: ConsentiConfig): string {
  const l = config.core?.locale
  if (l && l !== 'auto') return l
  // Locale isn't persisted anywhere until a consent decision exists — an undecided visitor
  // always falls through to the browser's language on every page load. A returning, already
  // -consented visitor gets back the locale recorded with that decision.
  const stored = peekConsentLocale(config.core?.storage ?? 'cookie')
  if (stored) return stored
  return navigator.language
}

function effectiveTenantId(config: ConsentiConfig): string {
  return config.api?.tenantId ?? config.core?.tenantId ?? 'default'
}

async function fetchProfileJson(
  url: string,
  authToken: string | undefined,
): Promise<PublicProfileResponse | null> {
  try {
    return await httpRequest<PublicProfileResponse>(url, {}, authToken)
  } catch {
    return null
  }
}

/**
 * Strips the `RegisterableProfileConfig`-only discriminant/authoring fields
 * (`deepMerge`, `translations`, `cookieTemplateId`, `uiTemplateId`, `localeContents`,
 * `regulation`, `regulations`) and returns whatever's left as a `DeepPartial<ResolvedProfile>`
 * overlay — used only for the `deepMerge: true` registry-override path, which is
 * conceptually identical to `profileOverride`: no locale/translations resolution,
 * the provided fields are used exactly as given.
 */
function toDeepPartialResolvedProfile(config: RegisterableProfileConfig): DeepPartial<ResolvedProfile> {
  const c = config as Partial<ProfileConfig>
  return {
    ...(c.id !== undefined ? { id: c.id } : {}),
    ...(c.defaultLocale !== undefined ? { defaultLocale: c.defaultLocale } : {}),
    ...(c.expiryDays !== undefined ? { expiryDays: c.expiryDays } : {}),
    ...(c.cookies !== undefined ? { cookies: c.cookies } : {}),
    ...(c.mainBanner !== undefined ? { mainBanner: c.mainBanner } : {}),
    ...(c.gpcBanner !== undefined ? { gpcBanner: c.gpcBanner } : {}),
    ...(c.preferenceModal !== undefined ? { preferenceModal: c.preferenceModal } : {}),
    ...(c.darkMode !== undefined ? { darkMode: c.darkMode } : {}),
    ...(c.allowedOrigins !== undefined ? { allowedOrigins: c.allowedOrigins } : {}),
    ...(c.dpdpa !== undefined ? { dpdpa: c.dpdpa } : {}),
    ...(c.complianceGroup !== undefined ? { complianceGroup: c.complianceGroup } : {}),
    ...(c.gpcMode !== undefined ? { gpcMode: c.gpcMode } : {}),
    ...(c.hidePoweredBy !== undefined ? { hidePoweredBy: c.hidePoweredBy } : {}),
    ...(c.allowReceipt !== undefined ? { allowReceipt: c.allowReceipt } : {}),
    ...(c.complianceConfig !== undefined ? { complianceConfig: c.complianceConfig } : {}),
    ...(c.showFooterMetadata !== undefined ? { showFooterMetadata: c.showFooterMetadata } : {}),
    ...(c.enhanceAccessibility !== undefined ? { enhanceAccessibility: c.enhanceAccessibility } : {}),
  } as DeepPartial<ResolvedProfile>
}

/**
 * If an author has `registerProfile()`-registered a profile whose `complianceGroup`
 * matches, prefer it over the built-in embedded profile: `deepMerge: false` (default)
 * fully replaces the built-in (never even fetched); `deepMerge: true` patches the
 * built-in with the registered fields, reusing the same `deepMerge()` utility
 * `profileOverride`/`setProfile()` already use.
 */
async function resolveRegisteredOverride(complianceGroup: ComplianceGroupId, locale: string): Promise<ResolvedProfile | undefined> {
  const override = findRegisteredProfileForGroup(complianceGroup)
  if (!override) return undefined
  if (override.deepMerge) {
    const builtIn = await loadPrebuiltProfile(complianceGroup, locale)
    const partial = toDeepPartialResolvedProfile(override)
    return builtIn ? deepMerge<ResolvedProfile>(builtIn, partial) : (partial as ResolvedProfile)
  }
  return resolveLocalProfileConfig(override as ProfileConfig, locale)
}

/** Scenario 1A — api disabled, compliance.type = 'auto' (client-side geo) */
async function scenario1A(config: ConsentiConfig): Promise<ResolvedProfile> {
  const { tz, lang, langs } = getBrowserGeoHints()
  const complianceGroup = resolveGroupFromHints(tz, langs.length ? langs : [lang])
  const locale = effectiveLocale(config)

  const override = await resolveRegisteredOverride(complianceGroup, locale)
  if (override) return override

  if (!isPrebuiltAllowed(complianceGroup, config)) {
    throw new Error(`Pre-built profile for complianceGroup "${complianceGroup}" is disallowed by usePrebuiltProfiles config.`)
  }
  const profile = await loadPrebuiltProfile(complianceGroup, locale)
  if (!profile) throw new Error(`No embedded profile found for complianceGroup "${complianceGroup}".`)
  return profile
}

/** Scenario 1B — api disabled, compliance.type = known ComplianceGroupId */
async function scenario1B(complianceGroup: ComplianceGroupId, config: ConsentiConfig): Promise<ResolvedProfile> {
  const locale = effectiveLocale(config)

  const override = await resolveRegisteredOverride(complianceGroup, locale)
  if (override) return override

  if (!isPrebuiltAllowed(complianceGroup, config)) {
    throw new Error(`Pre-built profile for complianceGroup "${complianceGroup}" is disallowed by usePrebuiltProfiles config.`)
  }
  const profile = await loadPrebuiltProfile(complianceGroup, locale)
  if (!profile) throw new Error(`No embedded profile found for complianceGroup "${complianceGroup}".`)
  return profile
}

/** Scenario 2A — api enabled, compliance.type = 'auto' (server geo-resolve) */
async function scenario2A(config: ConsentiConfig): Promise<ResolvedProfile> {
  const locale = effectiveLocale(config)
  const tenantId = effectiveTenantId(config)
  const cacheEnabled = config.core?.cacheResolvedProfiles !== false
  const base = config.api?.baseUrl ?? window.location.origin
  const trustDomain = config.api?.trustDomain ?? false

  const cached = getCachedResolution(tenantId, locale, cacheEnabled)
  if (cached) {
    const json = await fetchProfileJson(cached.filePath, config.api?.authToken)
    if (json) {
      if (!isDomainAllowed(json, trustDomain)) {
        logger.error(`Domain ${window.location.origin} is not in allowedOrigins for this profile. Falling back to pre-built profile.`)
        return scenario1A(config)
      }
      return mapPublicProfileToResolved(json)
    }
  }

  const resolveUrl =
    `${base}/consenti/api/v1/resolve-profile?data=${encodeURIComponent(encodeGeoHints(locale))}`

  let path: string | null
  let complianceGroup: ComplianceGroupId
  let resolvedLocale: string

  try {
    const resolved = await httpRequest<{
      path: string | null
      complianceGroup: string
      locale: string
      found: boolean
    }>(resolveUrl, {}, config.api?.authToken)

    path = resolved.path
    complianceGroup = resolved.complianceGroup as ComplianceGroupId
    resolvedLocale = resolved.locale

    if (resolved.found && path) {
      setCachedResolution(tenantId, locale, cacheEnabled, {
        filePath: `${base}${path}`,
        version: 0,
        complianceGroup,
        tenantId,
        locale: resolvedLocale,
      })
    }
  } catch {
    logger.warn('resolve-profile failed; falling back to pre-built profile.')
    return scenario1A(config)
  }

  // Server has a static file — serve it
  if (path) {
    const json = await fetchProfileJson(`${base}${path}`, config.api?.authToken)
    if (json && isDomainAllowed(json, trustDomain)) return mapPublicProfileToResolved(json)
  }

  // Server resolved the group but has no file (new tenant, seeding pending)
  // Fall back to embedded profile for that group
  if (complianceGroup) {
    const embedded = await loadPrebuiltProfile(complianceGroup, resolvedLocale)
    if (embedded) return embedded
  }

  return scenario1A(config)
}

/** Scenario 2B — api enabled, compliance.type = known ComplianceGroupId */
async function scenario2B(complianceGroup: ComplianceGroupId, config: ConsentiConfig): Promise<ResolvedProfile> {
  const locale = effectiveLocale(config)
  const tenantId = effectiveTenantId(config)
  const base = config.api?.baseUrl ?? window.location.origin
  const trustDomain = config.api?.trustDomain ?? false

  const group = config.api?.complianceGroup ?? complianceGroup

  const json = await fetchProfileJson(
    `${base}/consenti/api/v1/profiles/${tenantId}/${group}/${encodeURIComponent(locale)}`,
    config.api?.authToken,
  ) ?? await fetchProfileJson(
    `${base}/consenti/api/v1/profiles/${tenantId}/${group}/default`,
    config.api?.authToken,
  )

  if (!json) {
    logger.warn(`Could not fetch profile for ${group}; falling back to pre-built.`)
    return scenario1B(group, config)
  }

  if (!isDomainAllowed(json, trustDomain)) {
    logger.error(`Domain ${window.location.origin} is not in allowedOrigins for this profile. Falling back to pre-built profile.`)
    return scenario1B(group, config)
  }

  return mapPublicProfileToResolved(json)
}

/**
 * Resolves a full `ProfileConfig` (author-registered or a registry-override match)
 * to a `ResolvedProfile` for the given locale — merges the base `mainBanner`/
 * `gpcBanner`/`preferenceModal` with that locale's `translations` entry, falling
 * back to the base (untranslated) content when the locale isn't found.
 */
function resolveLocalProfileConfig(localProfile: ProfileConfig, locale: string, typeDescription?: string): ResolvedProfile {
  const resolved = localProfile.translations?.[locale]

  // if translations are not available for the given locale, use the default translations
  if (resolved === undefined) {
    if (locale !== localProfile.defaultLocale) logger.warn(`Unable to resolve requested locale "${locale}" of profile "${typeDescription ?? localProfile.id}", Using default "${localProfile.defaultLocale}".`)
    return {
      id: localProfile.id,
      gpcMode: localProfile.gpcMode ?? "ignore",
      allowReceipt: localProfile.allowReceipt ?? false,
      defaultLocale: localProfile.defaultLocale,
      locales: [localProfile.defaultLocale, ...Object.keys(localProfile.translations ?? {})],
      cookies: localProfile.cookies ?? {},
      ...(localProfile.expiryDays ? { expiryDays: localProfile.expiryDays } : {}),
      mainBanner: localProfile.mainBanner,
      ...(localProfile.gpcBanner ? { gpcBanner: localProfile.gpcBanner } : {}),
      preferenceModal: localProfile.preferenceModal,
      ...(localProfile.darkMode !== undefined ? { darkMode: localProfile.darkMode } : {}),
      ...(localProfile.complianceGroup ? { complianceGroup: localProfile.complianceGroup } : {}),
    }
  }

  // else deepmerge properties with the translations
  const mainBanner = deepMerge<MainBanner>(localProfile.mainBanner, resolved.mainBanner)
  const gpcBanner = localProfile.gpcBanner ? deepMerge<GpcBanner>(localProfile.gpcBanner, resolved.gpcBanner ?? {}) : false
  const preferenceModal = deepMerge<PreferenceModal>(localProfile.preferenceModal ?? {}, resolved.preferenceModal ?? {})

  return {
    id: localProfile.id,
    gpcMode: localProfile.gpcMode ?? "ignore",
    allowReceipt: localProfile.allowReceipt ?? false,
    defaultLocale: localProfile.defaultLocale,
    locales: [localProfile.defaultLocale, ...Object.keys(localProfile.translations ?? {})],
    cookies: localProfile.cookies ?? {},
    ...(localProfile.expiryDays ? { expiryDays: localProfile.expiryDays } : {}),
    mainBanner,
    ...(gpcBanner ? { gpcBanner } : {}),
    preferenceModal,
    ...(localProfile.darkMode !== undefined ? { darkMode: localProfile.darkMode } : {}),
    ...(localProfile.complianceGroup ? { complianceGroup: localProfile.complianceGroup } : {}),
  }
}

/** Scenario Local — locally registered profile */
async function scenarioLocal(typeValue: Symbol, config: ConsentiConfig): Promise<ResolvedProfile> {
  if (config.api?.enabled) {
    logger.warn('Local profile used instead of server profile. Check compliance.type config.')
  }

  const locale = effectiveLocale(config)
  const localProfile = getRegisteredProfile(typeValue)

  if (localProfile) {
    // Explicitly opted into deepMerge — patch the matching built-in profile rather
    // than treating this registration as a complete, standalone profile.
    if (localProfile.deepMerge && localProfile.complianceGroup) {
      const builtIn = await loadPrebuiltProfile(localProfile.complianceGroup, locale)
      const partial = toDeepPartialResolvedProfile(localProfile)
      return builtIn ? deepMerge<ResolvedProfile>(builtIn, partial) : (partial as ResolvedProfile)
    }
    return resolveLocalProfileConfig(localProfile as ProfileConfig, locale, (typeValue as symbol).description)
  }

  logger.error(`Unable to resolve locally registered profile "${(typeValue as symbol).description}", Using compliance.type: 'auto'.`)

  // Fall back to auto path for the current api mode
  return config.api?.enabled ? scenario2A(config) : scenario1A(config)
}

// ─── resolveProfile dispatcher ────────────────────────────────────────────────

export async function resolveProfile(config: ConsentiConfig): Promise<ResolvedProfile> {
  const complianceType = config.compliance?.type ?? 'auto'
  const apiEnabled = config.api?.enabled ?? false

  if (complianceType === 'auto') {
    return apiEnabled ? scenario2A(config) : scenario1A(config)
  }

  // A Symbol targets a client-registered profile (registerProfile()) — never a
  // server-hosted group, built-in or custom.
  if (typeof complianceType === 'symbol') {
    return scenarioLocal(complianceType, config)
  }

  // Any other string — one of the 8 built-in groups, or a profile authored against
  // a custom `customComplianceGroup` — resolves identically: scenario2B hot-serve
  // fetches by group name and falls back to scenario1B's pre-built lookup, which
  // simply has nothing to find for a custom group and surfaces that as the same
  // "No embedded profile found" error the built-in-group path already throws.
  return apiEnabled
    ? scenario2B(complianceType as ComplianceGroupId, config)
    : scenario1B(complianceType as ComplianceGroupId, config)
}
