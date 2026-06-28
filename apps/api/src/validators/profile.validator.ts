import type { CreateProfileInput, UpdateProfileInput, ProfileConfig } from '@consenti/types'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateCreateProfile(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be a JSON object' }
  const b = body as Record<string, unknown>
  if (typeof b['name'] !== 'string' || !b['name']) return { valid: false, error: 'name is required' }
  if (typeof b['defaultLocale'] !== 'string' || !b['defaultLocale']) return { valid: false, error: 'defaultLocale is required' }
  if (!b['profileJson'] || typeof b['profileJson'] !== 'object') return { valid: false, error: 'profileJson is required' }
  const pj = b['profileJson'] as Record<string, unknown>
  if (typeof pj['cookieTemplateId'] !== 'string' || !pj['cookieTemplateId']) {
    return { valid: false, error: 'profileJson.cookieTemplateId is required' }
  }
  if (typeof pj['uiTemplateId'] !== 'string' || !pj['uiTemplateId']) {
    return { valid: false, error: 'profileJson.uiTemplateId is required' }
  }
  return { valid: true }
}

export function validateUpdateProfile(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be a JSON object' }
  return { valid: true }
}

export function castCreateProfile(body: Record<string, unknown>, tenantId: string): CreateProfileInput {
  return {
    tenantId,
    name: body['name'] as string,
    defaultLocale: body['defaultLocale'] as string,
    profileJson: body['profileJson'] as CreateProfileInput['profileJson'],
  }
}

export function castUpdateProfile(body: Record<string, unknown>): UpdateProfileInput {
  const result: UpdateProfileInput = {}
  if (typeof body['name'] === 'string') result.name = body['name']
  if (typeof body['defaultLocale'] === 'string') result.defaultLocale = body['defaultLocale']
  if (body['profileJson'] != null) result.profileJson = body['profileJson'] as ProfileConfig
  return result
}
