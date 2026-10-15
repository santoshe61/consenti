import type { CreateProfileInput, UpdateProfileInput } from '@consenti/types'
import { findUnsafePathSegment } from '../utils/path-segment'

export interface ValidationResult {
  valid: boolean
  error?: string
}

/** These fields become directory and file names on disk — see utils/path-segment.ts. */
function pathSegmentProblem(b: Record<string, unknown>): string | null {
  const pj = b['profileJson'] && typeof b['profileJson'] === 'object' ? b['profileJson'] as Record<string, unknown> : {}
  const localeContent = b['localeContent'] && typeof b['localeContent'] === 'object' ? Object.keys(b['localeContent']) : []
  return findUnsafePathSegment({
    defaultLocale: b['defaultLocale'],
    complianceGroup: pj['complianceGroup'],
    customComplianceGroup: pj['customComplianceGroup'],
    locales: pj['locales'],
    localeContentKeys: localeContent,
  })
}

export function validateCreateProfile(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be a JSON object' }
  const b = body as Record<string, unknown>
  if (typeof b['name'] !== 'string' || !b['name']) return { valid: false, error: 'name is required' }
  if (typeof b['defaultLocale'] !== 'string' || !b['defaultLocale']) return { valid: false, error: 'defaultLocale is required' }
  if (!b['profileJson'] || typeof b['profileJson'] !== 'object') return { valid: false, error: 'profileJson is required' }
  const pj = b['profileJson'] as Record<string, unknown>
  if (typeof pj['consentTemplateId'] !== 'string' || !pj['consentTemplateId']) {
    return { valid: false, error: 'profileJson.consentTemplateId is required' }
  }
  if (typeof pj['uiTemplateId'] !== 'string' || !pj['uiTemplateId']) {
    return { valid: false, error: 'profileJson.uiTemplateId is required' }
  }
  const unsafe = pathSegmentProblem(b)
  if (unsafe) return { valid: false, error: unsafe }
  return { valid: true }
}

export function validateUpdateProfile(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Request body must be a JSON object' }
  const unsafe = pathSegmentProblem(body as Record<string, unknown>)
  if (unsafe) return { valid: false, error: unsafe }
  return { valid: true }
}

export function castCreateProfile(body: Record<string, unknown>, tenantId: string): CreateProfileInput {
  return {
    tenantId,
    name: body['name'] as string,
    defaultLocale: body['defaultLocale'] as string,
    profileJson: body['profileJson'] as CreateProfileInput['profileJson'],
    ...(body['localeContent'] != null ? { localeContent: body['localeContent'] as NonNullable<CreateProfileInput['localeContent']> } : {}),
  }
}

export function castUpdateProfile(body: Record<string, unknown>): UpdateProfileInput {
  const result: UpdateProfileInput = {}
  if (typeof body['name'] === 'string') result.name = body['name']
  if (typeof body['defaultLocale'] === 'string') result.defaultLocale = body['defaultLocale']
  if (body['profileJson'] != null) result.profileJson = body['profileJson'] as NonNullable<UpdateProfileInput['profileJson']>
  if (body['localeContent'] != null) result.localeContent = body['localeContent'] as NonNullable<UpdateProfileInput['localeContent']>
  return result
}
