import type { ConsentiConfig, ResolvedProfile, ProfileConfig, PublicProfileResponse } from '../types'
import { httpRequest } from '../utils/http'
import { resolveLocale } from '../utils/locale'
import { logger } from '../utils/console'
import { getBrowserGeoHints } from '../utils/geo-hints'
import { COMPLIANCE_GROUP_IDS, EMBEDDED_COMPLIANCE_MAP } from '@consenti/utils'
import generalPrivacyConsent from '../profiles/general-privacy-consent'
import noticeOnly from '../profiles/notice-only'
import optIn from '../profiles/opt-in'
import optInBrazil from '../profiles/opt-in-brazil'
import optInChina from '../profiles/opt-in-china'
import optInDpdpa from '../profiles/opt-in-dpdpa'
import optOut from '../profiles/opt-out'
import optOutStrict from '../profiles/opt-out-strict'

const PREBUILT_PROFILE_MAP: Record<string, ResolvedProfile> = {
  'general-privacy-consent': generalPrivacyConsent,
  'notice-only': noticeOnly,
  'opt-in': optIn,
  'opt-in-brazil': optInBrazil,
  'opt-in-china': optInChina,
  'opt-in-dpdpa': optInDpdpa,
  'opt-out': optOut,
  'opt-out-strict': optOutStrict,
}

// ─── Local profile registry ───────────────────────────────────────────────────

const profileRegistry = new Map<string, ProfileConfig>()

export function registerProfile(id: number, config: ProfileConfig): void {
  profileRegistry.set(String(id), config)
}

export function getRegisteredProfile(id: number): ProfileConfig | undefined {
  return profileRegistry.get(String(id))
}

// ─── Default fallback profile ─────────────────────────────────────────────────

export const DEFAULT_PROFILE: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  gpcMode: 'honor',
  cookies: [
    { id: 'functionality_storage', mandatory: true },
    { id: 'analytics_storage', listenGpc: true, expiry: 365 },
    { id: 'ad_storage', listenGpc: true, expiry: 365 },
    { id: 'ad_user_data', listenGpc: true, expiry: 365 },
    { id: 'ad_personalization', listenGpc: true, expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'We value your privacy',
    htmlText:
      'We use cookies to enhance your browsing experience, serve personalised ads or content, ' +
      'and analyse our traffic. By clicking <strong>Accept All</strong> you consent to our use ' +
      'of cookies. You may change your preferences at any time.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject Optional', cookies: '!', style: 'primary', action: 'custom' },
      { text: 'Customize', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Your Privacy Preference Has Been Recognized',
    htmlText:
      'Your browser has sent a Global Privacy Control (GPC) signal. ' +
      "We've applied your privacy preference where required by applicable law. " +
      'You can review or update your cookie choices at any time.',
    buttons: [
      { text: 'Review Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    heading: 'Cookie Preferences',
    subheading: 'Choose which cookies you allow us to use.',
    htmlText:
      'We use different types of cookies to optimise your experience. You can choose to ' +
      'enable or disable each category below. Necessary cookies cannot be disabled as they ' +
      'are required for core site functionality.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are essential for the website to function correctly. ' +
          'They include authentication, security, and accessibility features. ' +
          'They cannot be disabled.',
        mandatory: true,
        cookies: ['functionality_storage'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'These cookies help us understand how visitors interact with our website by ' +
          'collecting and reporting information anonymously. (e.g. Google Analytics)',
        cookies: ['analytics_storage'],
      },
      {
        id: 'cat-advertising',
        heading: 'Advertising',
        htmlText:
          'These cookies are used to deliver advertisements more relevant to you and your interests. ' +
          '(e.g. Google Ads, Meta Pixel)',
        cookies: ['ad_storage', 'ad_user_data', 'ad_personalization'],
      },
    ],
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject Optional', cookies: '!', style: 'primary', action: 'custom' },
      { text: 'Save Selection', style: 'secondary', action: 'submit' },
    ],
  },
}

// ─── mapPublicProfileToResolved ───────────────────────────────────────────────

export function mapPublicProfileToResolved(resp: PublicProfileResponse): ResolvedProfile {
  let gpcMode: 'ignore' | 'honor' | 'strict' | undefined
  if      (resp.gpcMode === true)  gpcMode = 'honor'
  else if (resp.gpcMode === false) gpcMode = 'ignore'
  else if (resp.gpcMode)           gpcMode = resp.gpcMode as 'ignore' | 'honor' | 'strict'

  return {
    id: 0,
    profileUuid: resp.id,
    version: resp.version,
    defaultLocale: resp.defaultLocale,
    locales: resp.locales,
    cookies: resp.cookies,
    mainBanner: resp.mainBanner,
    preferenceModal: resp.preferenceModal,
    ...(resp.gpcBanner             ? { gpcBanner: resp.gpcBanner }               : {}),
    ...(gpcMode                    ? { gpcMode }                                  : {}),
    ...(resp.darkMode !== undefined ? { darkMode: resp.darkMode }                 : {}),
    ...(resp.complianceGroup       ? { complianceGroup: resp.complianceGroup }    : {}),
    ...(resp.complianceConfig      ? { complianceConfig: resp.complianceConfig }  : {}),
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

function loadPrebuiltProfile(complianceGroup: string): ResolvedProfile | null {
  return PREBUILT_PROFILE_MAP[complianceGroup] ?? null
}

function isPrebuiltAllowed(complianceGroup: string, config: ConsentiConfig): boolean {
  const setting = config.core.usePrebuiltProfiles ?? 'all'
  if (setting === 'all') return true
  return (setting as string[]).includes(complianceGroup)
}

// ─── Geo hint → complianceGroup ───────────────────────────────────────────────

function resolveGroupFromHints(tz: string, lang: string): string {
  // Try to extract a country code from the BCP47 language tag (e.g. 'de-DE' → 'DE')
  const parts = lang.replace(/_/g, '-').split('-')
  const tag = parts.length >= 2 ? parts[parts.length - 1]?.toUpperCase() : undefined
  const countryCode = tag && /^[A-Z]{2}$/.test(tag) ? tag : undefined

  if (countryCode) {
    const entry = (EMBEDDED_COMPLIANCE_MAP.countries as Record<string, { default: string }>)[countryCode]
    if (entry?.default) return entry.default
  }

  // If language has no country subtag, try the timezone IANA region (e.g. 'Europe/Berlin' → 'DE' area)
  const tzParts = tz.split('/')
  if (tzParts[0] === 'Europe') return 'opt-in'
  if (tzParts[0] === 'America') {
    const city = tzParts[1] ?? ''
    if (['Los_Angeles', 'Denver', 'Chicago', 'New_York', 'Phoenix', 'Anchorage', 'Honolulu'].includes(city)) {
      return 'opt-out'
    }
  }

  // Default: opt-in (GDPR) — strictest, safe for any unknown jurisdiction
  return 'opt-in'
}

// ─── Scenario helpers ─────────────────────────────────────────────────────────

function effectiveLocale(config: ConsentiConfig): string {
  const l = config.core.locale
  return (!l || l === 'auto') ? navigator.language : l
}

function effectiveTenantId(config: ConsentiConfig): string {
  return config.api?.tenantId ?? config.core.tenantId ?? 'default'
}

function isKnownComplianceGroup(value: string): boolean {
  return (COMPLIANCE_GROUP_IDS as readonly string[]).includes(value)
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

/** Scenario 1A — api disabled, compliance.type = 'auto' (client-side geo) */
async function scenario1A(config: ConsentiConfig): Promise<ResolvedProfile> {
  const { tz, lang } = getBrowserGeoHints()
  // Derive complianceGroup from tz + lang.
  // 'opt-in' (GDPR) is the strictest default — safe for any jurisdiction.
  // Full geo-routing via ComplianceMapData is a future enhancement to this path.
  const complianceGroup = resolveGroupFromHints(tz, lang)

  if (isPrebuiltAllowed(complianceGroup, config)) {
    const profile = loadPrebuiltProfile(complianceGroup)
    if (profile) return profile
  }
  return DEFAULT_PROFILE
}

/** Scenario 1B — api disabled, compliance.type = known ComplianceGroupId */
async function scenario1B(complianceGroup: string, config: ConsentiConfig): Promise<ResolvedProfile> {
  if (isPrebuiltAllowed(complianceGroup, config)) {
    const profile = loadPrebuiltProfile(complianceGroup)
    if (profile) return profile
  }
  return DEFAULT_PROFILE
}

/** Scenario 2A — api enabled, compliance.type = 'auto' (server geo-resolve) */
async function scenario2A(config: ConsentiConfig): Promise<ResolvedProfile> {
  const locale = effectiveLocale(config)
  const tenantId = effectiveTenantId(config)
  const cacheEnabled = config.core.cacheResolvedProfiles !== false
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

  const { tz, lang } = getBrowserGeoHints()
  const resolveUrl =
    `${base}/consenti/api/v1/resolve-profile` +
    `?tz=${encodeURIComponent(tz)}&lang=${encodeURIComponent(lang)}` +
    `&locale=${encodeURIComponent(locale)}&tenantId=${encodeURIComponent(tenantId)}`

  let filePath: string
  let complianceGroup: string
  let version: number

  try {
    const resolved = await httpRequest<{
      filePath: string
      tenantId: string
      profileId: string
      complianceGroup: string
      locale: string
      version: number
      warning?: string
    }>(resolveUrl, {}, config.api?.authToken)

    if (resolved.warning === 'locale_not_found') {
      logger.info('Locale not found; using default locale.')
    }

    filePath = resolved.filePath
    complianceGroup = resolved.complianceGroup
    version = resolved.version

    setCachedResolution(tenantId, locale, cacheEnabled, {
      filePath,
      version,
      complianceGroup,
      tenantId,
      locale,
    })
  } catch {
    logger.warn('resolve-profile failed; falling back to pre-built profile.')
    return scenario1A(config)
  }

  const json = await fetchProfileJson(filePath, config.api?.authToken)
    ?? await fetchProfileJson(
      `${base}/consenti/api/v1/profiles/${tenantId}/${complianceGroup}/default.json`,
      config.api?.authToken,
    )

  if (!json) {
    logger.warn('Profile fetch failed; falling back to pre-built profile.')
    return scenario1A(config)
  }

  if (!isDomainAllowed(json, trustDomain)) {
    logger.error(`Domain ${window.location.origin} is not in allowedOrigins for this profile. Falling back to pre-built profile.`)
    return scenario1A(config)
  }

  return mapPublicProfileToResolved(json)
}

/** Scenario 2B — api enabled, compliance.type = known ComplianceGroupId */
async function scenario2B(complianceGroup: string, config: ConsentiConfig): Promise<ResolvedProfile> {
  const locale = effectiveLocale(config)
  const tenantId = effectiveTenantId(config)
  const base = config.api?.baseUrl ?? window.location.origin
  const trustDomain = config.api?.trustDomain ?? false

  const group = config.api?.complianceGroup ?? complianceGroup

  const json = await fetchProfileJson(
    `${base}/consenti/api/v1/profiles/${tenantId}/${group}/${encodeURIComponent(locale)}.json`,
    config.api?.authToken,
  ) ?? await fetchProfileJson(
    `${base}/consenti/api/v1/profiles/${tenantId}/${group}/default.json`,
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

/** Scenario Local — locally registered profile */
async function scenarioLocal(typeValue: string, config: ConsentiConfig): Promise<ResolvedProfile> {
  if (config.api?.enabled) {
    logger.warn('Local profile used instead of server profile. Check compliance.type config.')
  }

  const locale = effectiveLocale(config)
  const local = Array.from(profileRegistry.values()).find(p => p.complianceGroup === typeValue)

  if (local) {
    const resolved = resolveLocale(local.translations ?? {}, locale, local.defaultLocale)
    return {
      id: 0,
      version: 1,
      defaultLocale: local.defaultLocale,
      locales: Object.keys(local.translations ?? {}),
      cookies: local.cookies ?? [],
      mainBanner: resolved.mainBanner,
      ...(resolved.gpcBanner ? { gpcBanner: resolved.gpcBanner } : {}),
      preferenceModal: resolved.preferenceModal,
      ...(local.darkMode !== undefined ? { darkMode: local.darkMode } : {}),
      ...(local.complianceGroup ? { complianceGroup: local.complianceGroup } : {}),
    }
  }

  // Fall back to auto path for the current api mode
  return config.api?.enabled ? scenario2A(config) : scenario1A(config)
}

// ─── resolveProfile dispatcher ────────────────────────────────────────────────

export async function resolveProfile(config: ConsentiConfig): Promise<ResolvedProfile> {
  const complianceType = config.compliance?.type ?? 'auto'
  const apiEnabled = config.api?.enabled ?? false

  try {
    if (complianceType === 'auto') {
      return apiEnabled ? await scenario2A(config) : await scenario1A(config)
    }

    if (isKnownComplianceGroup(complianceType)) {
      return apiEnabled
        ? await scenario2B(complianceType, config)
        : await scenario1B(complianceType, config)
    }

    // Unknown type — treat as local profile key or fall back to auto
    return await scenarioLocal(complianceType, config)
  } catch {
    return DEFAULT_PROFILE
  }
}
