import type {
  ConsentDbRecord,
  ConsentValue,
  ConsentVerifyResult,
  CreateConsentInput,
  Profile,
  CookieMap,
  Category,
} from '@consenti/types'
import { buildCookieCategoryIndex, getCookieLegalBasis, isMandatoryCookie } from '@consenti/utils'
import { signHmac } from '../utils/crypto'

export interface ConsentValidationResult {
  valid: boolean
  errors: string[]
}

export function validateConsentInput(
  data: Pick<CreateConsentInput, 'consentJson'>,
  cookies: CookieMap,
  categoryIndex: Map<string, Category>,
): ConsentValidationResult {
  const errors: string[] = []
  for (const [cookieId, status] of Object.entries(data.consentJson)) {
    if (!cookies[cookieId]) continue
    const legalBasis = getCookieLegalBasis(cookieId, categoryIndex)
    if (legalBasis === 'mandatory' && status !== 'granted') {
      errors.push(`Cookie "${cookieId}" is mandatory and cannot be "${status}"`)
    }
    if (status === 'objected' && legalBasis !== 'legitimate_interest') {
      errors.push(`Cookie "${cookieId}" has legal basis "${legalBasis}" — 'objected' is only valid for 'legitimate_interest'`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function buildConsentValue(
  cookies: CookieMap,
  categoryIndex: Map<string, Category>,
  submitted: ConsentValue,
  gpcDetected: boolean,
  regulation?: string,
): ConsentValue {
  const result: ConsentValue = {}
  for (const [id, cookie] of Object.entries(cookies)) {
    if (isMandatoryCookie(id, categoryIndex)) {
      result[id] = 'granted'
      continue
    }
    // CPRA: GPC triggers Do Not Sell + Do Not Share; sensitive data requires explicit opt-in
    if (regulation === 'cpra') {
      if (cookie.cpraCategory === 'sensitive') {
        // Sensitive data is opt-in even under CPRA — treat like GDPR (deny by default)
        const status = submitted[id]
        result[id] = (status === 'granted' || status === 'denied' || status === 'objected') ? status : 'denied'
        continue
      }
      if (gpcDetected && (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing')) {
        result[id] = 'denied'
        continue
      }
    }
    // GDPR/CCPA/DPDPA: honor listenGpc flag
    if (gpcDetected && cookie.listenGpc && regulation !== 'dpdpa') {
      result[id] = 'denied'
      continue
    }
    const status = submitted[id]
    if (status === 'granted' || status === 'denied' || status === 'objected') {
      result[id] = status
    } else {
      result[id] = 'denied'
    }
  }
  return result
}

/**
 * Canonical string signed/verified for a consent record's tamper-evidence signature. Built only
 * from fields known before the record is persisted (excludes DB-generated `id`/`createdAt`/
 * `updatedAt`), so the same payload can be computed both when signing at create/update time and
 * when re-verifying a stored record later. `consentJson` keys are sorted so the payload is
 * stable regardless of key insertion order across different storage backends.
 */
export function buildConsentSignaturePayload(record: {
  tenantId: string
  visitorId: string
  profileId: string
  locale: string
  consentJson: ConsentValue
}): string {
  const sortedConsent = Object.keys(record.consentJson)
    .sort()
    .map(k => `${k}=${record.consentJson[k]}`)
    .join(',')
  return `${record.tenantId}|${record.visitorId}|${record.profileId}|${record.locale}|${sortedConsent}`
}

/**
 * `recordProfile` is the exact (immutable, possibly archived) profile snapshot the consent was
 * collected against — looked up by `record.profileId`, which never changes after the fact.
 * `activeProfile` is whatever is currently live for that snapshot's compliance group — if its id
 * no longer matches `recordProfile.id`, a newer edit has superseded it and the consent is stale.
 * `signingKey` is only checked when both it and `record.signature` are present — opt-in, and a
 * record signed before `consentSigningKey` was configured (or never signed) never fails this
 * check for its absence.
 */
export function verifyConsent(
  record: ConsentDbRecord,
  recordProfile: Profile,
  activeProfile: Profile | null,
  signingKey?: string,
): ConsentVerifyResult {
  const reasons: ConsentVerifyResult['reasons'] = []

  if (!activeProfile || activeProfile.id !== recordProfile.id) {
    reasons.push('profile_changed')
  }

  if (isExpired(record, recordProfile)) {
    reasons.push('consent_expired')
  }

  if (signingKey && record.signature) {
    const expected = signHmac(buildConsentSignaturePayload(record), signingKey)
    if (expected !== record.signature) reasons.push('hmac_invalid')
  }

  return {
    valid: reasons.length === 0,
    reasons,
    ...(activeProfile ? { currentProfileId: activeProfile.id } : {}),
    consentProfileId: recordProfile.id,
  }
}

export function buildTcfPayload(
  cookies: CookieMap,
  consentValue: ConsentValue,
): { vendorConsents: number[]; purposeConsents: number[] } {
  const vendorSet = new Set<number>()
  const purposeSet = new Set<number>()
  for (const [id, cookie] of Object.entries(cookies)) {
    if (consentValue[id] !== 'granted') continue
    if (cookie.tcfVendorId) vendorSet.add(cookie.tcfVendorId)
    for (const p of cookie.tcfPurposes ?? []) purposeSet.add(p)
  }
  return {
    vendorConsents: [...vendorSet].sort((a, b) => a - b),
    purposeConsents: [...purposeSet].sort((a, b) => a - b),
  }
}

function isExpired(record: ConsentDbRecord, profile: Profile): boolean {
  const expiryDays = profile.profileJson.expiryDays
  if (!expiryDays) return false
  const createdMs = new Date(record.createdAt).getTime()
  const expiryMs = createdMs + expiryDays * 24 * 60 * 60 * 1000
  return Date.now() > expiryMs
}
