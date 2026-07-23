/**
 * Maps raw `ConsentValue` records to vendor-specific output formats.
 *
 * Each exported function corresponds to one `ConsentType` value accepted by `getConsent(type)`.
 * They are pure functions that take the stored consent map and the profile's cookie list,
 * returning a vendor-ready object with no side effects.
 */

import type { ConsentValue, CookieMap, CookiePurpose } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ConsentStatus = 'granted' | 'denied' | 'objected'

/**
 * Returns the most permissive consent status for all cookies with a given purpose.
 * 'granted' wins over 'denied' / 'objected'. Returns 'denied' when no matching cookie found.
 */
function getConsentForPurpose(
  consent: ConsentValue,
  cookies: CookieMap,
  purpose: CookiePurpose,
): ConsentStatus {
  let result: ConsentStatus = 'denied'
  for (const [cookieId, cookie] of Object.entries(cookies)) {
    if (cookie.purpose !== purpose) continue
    const status = consent[cookieId]
    if (status === 'granted') return 'granted'
    if (status === 'objected' && result === 'denied') result = 'objected'
  }
  return result
}

// ─── Google Consent Mode v2 ───────────────────────────────────────────────────

const GCM_KEYS = [
  'ad_storage',
  'analytics_storage',
  'ad_user_data',
  'ad_personalization',
  'functionality_storage',
  'personalization_storage',
  'security_storage',
] as const

/**
 * Returns the consent map in Google Consent Mode v2 format.
 * Maps 'objected' → 'denied'; applies safe defaults ('granted') for
 * functionality_storage and security_storage when not present.
 * Also sets `ads_data_redaction` and `url_passthrough` helper flags.
 */
export function getGoogleGTMConsent(consent: ConsentValue): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of GCM_KEYS) {
    const raw = consent[key]
    if (raw === 'granted') {
      result[key] = 'granted'
    } else if (raw === 'denied' || raw === 'objected') {
      result[key] = 'denied'
    } else {
      result[key] = (key === 'functionality_storage' || key === 'security_storage') ? 'granted' : 'denied'
    }
  }
  result['ads_data_redaction'] = result['ad_storage'] === 'denied' ? 'true' : 'false'
  result['url_passthrough'] = 'false'
  return result
}

// ─── Category ─────────────────────────────────────────────────────────────────

/**
 * Returns consent grouped by CookiePurpose category.
 * 'necessary' is always 'granted'.
 */
export function getCategoryConsent(
  consent: ConsentValue,
  cookies: CookieMap,
): Record<CookiePurpose, ConsentStatus> {
  return {
    necessary: 'granted',
    functional: getConsentForPurpose(consent, cookies, 'functional'),
    preferences: getConsentForPurpose(consent, cookies, 'preferences'),
    analytics: getConsentForPurpose(consent, cookies, 'analytics'),
    marketing: getConsentForPurpose(consent, cookies, 'marketing'),
  }
}

// ─── Adobe ────────────────────────────────────────────────────────────────────

export function getAdobeConsent(
  consent: ConsentValue,
  cookies: CookieMap,
): { analytics: ConsentStatus; target: ConsentStatus; manager: ConsentStatus; optimizer: ConsentStatus } {
  return {
    analytics: getConsentForPurpose(consent, cookies, 'analytics'),
    target: getConsentForPurpose(consent, cookies, 'preferences'),
    manager: getConsentForPurpose(consent, cookies, 'marketing'),
    optimizer: getConsentForPurpose(consent, cookies, 'marketing'),
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export function getMetaConsent(
  consent: ConsentValue,
  cookies: CookieMap,
): { pixel: ConsentStatus; api: ConsentStatus; plugins: ConsentStatus; facebookLogin: ConsentStatus } {
  return {
    pixel: getConsentForPurpose(consent, cookies, 'marketing'),
    api: getConsentForPurpose(consent, cookies, 'marketing'),
    plugins: getConsentForPurpose(consent, cookies, 'functional'),
    facebookLogin: getConsentForPurpose(consent, cookies, 'functional'),
  }
}

// ─── Microsoft Clarity ────────────────────────────────────────────────────────

export function getMicrosoftClarityConsent(
  consent: ConsentValue,
  cookies: CookieMap,
): { session: ConsentStatus; heatmaps: ConsentStatus; performance: ConsentStatus } {
  return {
    session: getConsentForPurpose(consent, cookies, 'analytics'),
    heatmaps: getConsentForPurpose(consent, cookies, 'analytics'),
    performance: getConsentForPurpose(consent, cookies, 'analytics'),
  }
}

// ─── Twilio Segment ───────────────────────────────────────────────────────────

export function getTwilioSegmentConsent(
  consent: ConsentValue,
  cookies: CookieMap,
): { identify: ConsentStatus; page: ConsentStatus; track: ConsentStatus; group: ConsentStatus; alias: ConsentStatus } {
  return {
    identify: getConsentForPurpose(consent, cookies, 'preferences'),
    page: getConsentForPurpose(consent, cookies, 'analytics'),
    track: getConsentForPurpose(consent, cookies, 'analytics'),
    group: getConsentForPurpose(consent, cookies, 'analytics'),
    alias: getConsentForPurpose(consent, cookies, 'analytics'),
  }
}
