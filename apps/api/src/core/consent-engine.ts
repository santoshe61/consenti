import type {
  ConsentDbRecord,
  ConsentValue,
  ConsentVerifyResult,
  CreateConsentInput,
  Profile,
  Cookie,
} from '@consenti/types'

export interface ConsentValidationResult {
  valid: boolean
  errors: string[]
}

export function validateConsentInput(
  data: Pick<CreateConsentInput, 'consentJson'>,
  profile: Profile,
): ConsentValidationResult {
  const errors: string[] = []
  for (const [cookieId, status] of Object.entries(data.consentJson)) {
    const cookie = (profile.profileJson.cookies ?? []).find(c => c.id === cookieId)
    if (!cookie) continue
    if (cookie.mandatory && status !== 'granted') {
      errors.push(`Cookie "${cookieId}" is mandatory and cannot be "${status}"`)
    }
    if (status === 'objected' && cookie.type !== 'legitimate_interest') {
      errors.push(`Cookie "${cookieId}" is type "${cookie.type ?? 'consent'}" — 'objected' is only valid for 'legitimate_interest'`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function buildConsentValue(
  cookies: Profile['profileJson']['cookies'],
  submitted: ConsentValue,
  gpcDetected: boolean,
  regulation?: string,
): ConsentValue {
  const result: ConsentValue = {}
  for (const cookie of (cookies ?? [])) {
    const id = cookie.id
    if (cookie.mandatory) {
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

export function verifyConsent(
  record: ConsentDbRecord,
  profile: Profile,
): ConsentVerifyResult {
  const reasons: ConsentVerifyResult['reasons'] = []

  if (record.profileVersion < profile.version) {
    reasons.push('profile_version_mismatch')
  }

  if (isExpired(record, profile)) {
    reasons.push('consent_expired')
  }

  return {
    valid: reasons.length === 0,
    reasons,
    currentProfileVersion: profile.version,
    consentProfileVersion: record.profileVersion,
  }
}

export function buildTcfPayload(
  cookies: Cookie[],
  consentValue: ConsentValue,
): { vendorConsents: number[]; purposeConsents: number[] } {
  const vendorSet = new Set<number>()
  const purposeSet = new Set<number>()
  for (const cookie of cookies) {
    if (consentValue[cookie.id] !== 'granted') continue
    if (cookie.tcfVendorId) vendorSet.add(cookie.tcfVendorId)
    for (const p of cookie.tcfPurposes ?? []) purposeSet.add(p)
  }
  return {
    vendorConsents: [...vendorSet].sort((a, b) => a - b),
    purposeConsents: [...purposeSet].sort((a, b) => a - b),
  }
}

function isExpired(record: ConsentDbRecord, profile: Profile): boolean {
  const cookies = profile.profileJson.cookies ?? []
  const createdMs = new Date(record.createdAt).getTime()
  const now = Date.now()

  for (const cookie of cookies) {
    if (!cookie.expiry) continue
    const expiryMs = createdMs + cookie.expiry * 24 * 60 * 60 * 1000
    if (now > expiryMs) return true
  }
  return false
}
