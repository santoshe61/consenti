import type { CreateConsentInput, UpdateConsentInput, ConsentValue } from '@consenti/types'

export interface ValidationResult {
  valid: boolean
  error?: string
}

const VALID_STATUSES = new Set(['granted', 'denied', 'objected'])

function validateConsentJsonValues(consentJson: unknown): ValidationResult {
  const entries = Object.entries(consentJson as Record<string, unknown>)
  for (const [key, val] of entries) {
    if (!key) return { valid: false, error: 'consentJson keys must be non-empty strings' }
    if (!VALID_STATUSES.has(val as string)) {
      return { valid: false, error: `consentJson value "${String(val)}" is invalid; must be granted, denied, or objected` }
    }
  }
  return { valid: true }
}

export function validateCreateConsent(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be a JSON object' }
  const b = body as Record<string, unknown>
  if (typeof b['profileId'] !== 'string' || !b['profileId']) return { valid: false, error: 'profileId is required' }
  if (!b['consentJson'] || typeof b['consentJson'] !== 'object' || Array.isArray(b['consentJson'])) {
    return { valid: false, error: 'consentJson must be an object' }
  }
  return validateConsentJsonValues(b['consentJson'])
}

export function validateUpdateConsent(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be a JSON object' }
  const b = body as Record<string, unknown>
  if (!b['consentJson'] || typeof b['consentJson'] !== 'object' || Array.isArray(b['consentJson'])) {
    return { valid: false, error: 'consentJson must be an object' }
  }
  return validateConsentJsonValues(b['consentJson'])
}

export function castCreateConsent(body: Record<string, unknown>, visitorId: string, tenantId: string): CreateConsentInput {
  return {
    tenantId,
    visitorId,
    profileId: body['profileId'] as string,
    profileVersion: typeof body['profileVersion'] === 'number' ? body['profileVersion'] : 1,
    locale: typeof body['locale'] === 'string' ? body['locale'] : 'en',
    consentJson: body['consentJson'] as ConsentValue,
    gpcDetected: Boolean(body['gpcDetected']),
    source: (body['source'] as CreateConsentInput['source']) ?? 'banner',
  }
}

export function castUpdateConsent(body: Record<string, unknown>): UpdateConsentInput {
  const result: UpdateConsentInput = {
    consentJson: body['consentJson'] as ConsentValue,
  }
  if (typeof body['locale'] === 'string') result.locale = body['locale']
  if (body['gpcDetected'] != null) result.gpcDetected = Boolean(body['gpcDetected'])
  return result
}
