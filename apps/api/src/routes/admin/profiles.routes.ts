import type { StorageAdapter, AuthConfig, CookieMap, CategoryMap, MainBanner, GpcBanner, PreferenceModal } from '@consenti/types'
import { COMPLIANCE_GROUPS } from '@consenti/utils'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import { validateCreateProfile, validateUpdateProfile, castCreateProfile, castUpdateProfile } from '../../validators/profile.validator'
import type { ProfileService } from '../../services/profile.service'
import { validateProfileCompliance } from '../../services/compliance-validator.service'
import { validateProfileContent } from '../../services/profile-content-validator.service'

/** Builds the `{locale: {mainBanner, gpcBanner?, preferenceModal}}` map `validateProfileContent`
 * needs — default locale's content lives directly on `profileJson`, every other locale in the
 * sibling `localeContent` field (see `StoredProfileJson`/`LocaleContentInput`). */
function collectLocaleContents(
  profileJson: { defaultLocale?: string; mainBanner?: MainBanner; gpcBanner?: GpcBanner; preferenceModal?: PreferenceModal } | undefined,
  localeContent: Record<string, { mainBanner: MainBanner; gpcBanner?: GpcBanner; preferenceModal: PreferenceModal }> | undefined,
): Record<string, { mainBanner: MainBanner; gpcBanner?: GpcBanner; preferenceModal: PreferenceModal }> {
  const result: Record<string, { mainBanner: MainBanner; gpcBanner?: GpcBanner; preferenceModal: PreferenceModal }> = { ...localeContent }
  if (profileJson?.defaultLocale && profileJson.mainBanner && profileJson.preferenceModal) {
    result[profileJson.defaultLocale] = {
      mainBanner: profileJson.mainBanner,
      ...(profileJson.gpcBanner ? { gpcBanner: profileJson.gpcBanner } : {}),
      preferenceModal: profileJson.preferenceModal,
    }
  }
  return result
}

export function buildAdminProfileRoutes(
  service: ProfileService,
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  function tenantAllowed(user: { allowedTenants: string[] } | null, tenantId: string): boolean {
    if (!user) return false
    return user.allowedTenants.length === 0 || user.allowedTenants.includes(tenantId)
  }

  return {
    'GET /profiles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'profile:view')
        if (denied) return denied
        if (!tenantAllowed(user, 'default')) return json(200, [])
        const url = new URL(req.url)
        if (url.searchParams.get('summary') === '1') {
          return json(200, await service.listSummary())
        }
        return json(200, await service.list())
      }),

    // Profile-id directories on disk with no matching DB row (deleted profiles whose version
    // snapshots weren't). Must be registered before GET /profiles/:id — routes are matched in
    // registration order and :id's pattern would otherwise swallow this literal path first.
    'GET /profiles/archived': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        return json(200, await service.listArchivedProfiles())
      }),

    'GET /profiles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const profile = await service.get(p['id'] ?? '')
        if (!profile) return errorResponse(404, 'Profile not found')
        return json(200, profile)
      }),

    // Standalone compliance validation — used by dashboard wizard at step 2
    'POST /profiles/validate': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const body = await parseJsonBody(req) as { complianceGroup?: string; cookies?: CookieMap; categories?: CategoryMap }
        if (!body.complianceGroup || !body.cookies || typeof body.cookies !== 'object' || !body.categories || typeof body.categories !== 'object') {
          return errorResponse(400, 'complianceGroup, cookies, and categories are required')
        }
        return json(200, validateProfileCompliance(body.cookies, body.categories, body.complianceGroup))
      }),

    // Returns active profile per compliance group for the coverage panel
    'GET /compliance-coverage': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const groups: Record<string, {
          label: string
          compliances: readonly string[]
          activeProfile: { id: string; name: string } | null
        }> = {}
        for (const [groupId, groupDef] of Object.entries(COMPLIANCE_GROUPS)) {
          const profile = await service.findActiveByComplianceGroup(groupId)
          groups[groupId] = {
            label: groupDef.label,
            compliances: groupDef.compliances,
            activeProfile: profile ? { id: profile.id, name: profile.name } : null,
          }
        }
        return json(200, { groups })
      }),

    'POST /profiles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody(req) as Record<string, unknown>
        const validation = validateCreateProfile(body)
        if (!validation.valid) return errorResponse(400, validation.error ?? 'Invalid body')
        const input = castCreateProfile(body, 'default')

        // Mandatory-content validation (defence in depth — the dashboard wizard already gates on
        // this client-side, but bulk CSV/JSON import bypasses that entirely)
        const contentValidation = validateProfileContent(collectLocaleContents(input.profileJson, input.localeContent))
        if (!contentValidation.valid) {
          return errorResponse(422, 'Profile content is missing required fields', { errors: contentValidation.errors })
        }

        // Compliance validation (defence in depth — dashboard already validates client-side)
        const complianceGroup = (input.profileJson as { complianceGroup?: string }).complianceGroup
        const customComplianceGroup = (input.profileJson as { customComplianceGroup?: string }).customComplianceGroup
        const choice = typeof body['choice'] === 'string' ? body['choice'] : undefined

        if (complianceGroup) {
          const cookies = (input.profileJson as { cookies?: CookieMap }).cookies ?? {}
          const categories = (input.profileJson as { preferenceModal?: { categories?: CategoryMap } }).preferenceModal?.categories ?? {}
          const complianceValidation = validateProfileCompliance(cookies, categories, complianceGroup)
          if (!complianceValidation.valid) {
            return errorResponse(422, 'Profile does not meet compliance requirements', {
              errors: complianceValidation.errors,
              warnings: complianceValidation.warnings,
            })
          }

          // Conflict detection: only one active profile per compliance group
          const existing = await service.findActiveByComplianceGroup(complianceGroup)
          if (existing) {
            if (!choice) {
              return json(200, { conflict: { id: existing.id, name: existing.name }, requiresChoice: true })
            }
            if (choice === 'deactivate') {
              await service.deactivate(existing.id)
            }
            // choice === 'inactive' → fall through; new profile saves without isActive
          }

          const profile = await service.create(input)
          return json(201, { profile, warnings: complianceValidation.warnings })
        }

        // No built-in compliance group — a custom group has no COMPLIANCE_GROUPS rules to
        // validate against, but "only one active profile per group" still applies so the
        // widget's compliance.type lookup for it resolves unambiguously.
        if (customComplianceGroup) {
          const existing = await service.findActiveByComplianceGroup(customComplianceGroup)
          if (existing) {
            if (!choice) {
              return json(200, { conflict: { id: existing.id, name: existing.name }, requiresChoice: true })
            }
            if (choice === 'deactivate') {
              await service.deactivate(existing.id)
            }
          }
        }

        const profile = await service.create(input)
        return json(201, profile)
      }),

    'PUT /profiles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const id = p['id'] ?? ''
        const body = await parseJsonBody(req) as Record<string, unknown>
        const validation = validateUpdateProfile(body)
        if (!validation.valid) return errorResponse(400, validation.error ?? 'Invalid body')
        const input = castUpdateProfile(body)

        // Mandatory-content validation — only when this save actually touches content; a
        // partial update (e.g. toggling darkMode) with no profileJson/localeContent has nothing
        // to validate.
        const localeContents = collectLocaleContents(input.profileJson, input.localeContent)
        if (Object.keys(localeContents).length > 0) {
          const contentValidation = validateProfileContent(localeContents)
          if (!contentValidation.valid) {
            return errorResponse(422, 'Profile content is missing required fields', { errors: contentValidation.errors })
          }
        }

        // Compliance validation
        const complianceGroup = (input.profileJson as { complianceGroup?: string } | undefined)?.complianceGroup
        const customComplianceGroup = (input.profileJson as { customComplianceGroup?: string } | undefined)?.customComplianceGroup
        const choice = typeof body['choice'] === 'string' ? body['choice'] : undefined

        if (complianceGroup) {
          const cookies = (input.profileJson as { cookies?: CookieMap } | undefined)?.cookies ?? {}
          const categories = (input.profileJson as { preferenceModal?: { categories?: CategoryMap } } | undefined)?.preferenceModal?.categories ?? {}
          const complianceValidation = validateProfileCompliance(cookies, categories, complianceGroup)
          if (!complianceValidation.valid) {
            return errorResponse(422, 'Profile does not meet compliance requirements', {
              errors: complianceValidation.errors,
              warnings: complianceValidation.warnings,
            })
          }

          // Conflict detection: another active profile for same complianceGroup
          const existing = await service.findActiveByComplianceGroup(complianceGroup)
          if (existing && existing.id !== id) {
            if (!choice) {
              return json(200, { conflict: { id: existing.id, name: existing.name }, requiresChoice: true })
            }
            if (choice === 'deactivate') {
              await service.deactivate(existing.id)
            }
          }

          const profile = await service.update(id, input)
          return json(200, { profile, warnings: complianceValidation.warnings })
        }

        // Custom group: no COMPLIANCE_GROUPS rules apply, but conflict detection still does.
        if (customComplianceGroup) {
          const existing = await service.findActiveByComplianceGroup(customComplianceGroup)
          if (existing && existing.id !== id) {
            if (!choice) {
              return json(200, { conflict: { id: existing.id, name: existing.name }, requiresChoice: true })
            }
            if (choice === 'deactivate') {
              await service.deactivate(existing.id)
            }
          }
        }

        const profile = await service.update(id, input)
        return json(200, profile)
      }),

    'DELETE /profiles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:delete')
        if (denied) return denied
        await service.delete(p['id'] ?? '')
        return json(200, { success: true })
      }),

    'POST /profiles/:id/copy': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const id = p['id'] ?? ''
        const existing = await service.get(id)
        if (!existing) return errorResponse(404, 'Profile not found')
        const body = await parseJsonBody(req) as Record<string, unknown> | null
        const name = typeof body?.['name'] === 'string' ? body['name'] : undefined
        const copy = await service.copy(id, name)
        return json(201, copy)
      }),

    'POST /profiles/:id/activate': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const id = p['id'] ?? ''
        const body = await parseJsonBody(req) as Record<string, unknown> | null
        const choice = typeof body?.['choice'] === 'string' ? body['choice'] : undefined

        const profile = await service.get(id)
        if (!profile) return errorResponse(404, 'Profile not found')

        const pj = profile.profileJson as { complianceGroup?: string; customComplianceGroup?: string }
        const groupKey = pj.complianceGroup || pj.customComplianceGroup
        if (groupKey) {
          const existing = await service.findActiveByComplianceGroup(groupKey)
          if (existing && existing.id !== id) {
            if (!choice) {
              return json(200, { conflict: { id: existing.id, name: existing.name }, requiresChoice: true })
            }
            if (choice === 'deactivate') {
              await service.deactivate(existing.id)
            }
          }
        }

        const activated = await service.activate(id)
        return json(200, activated)
      }),

    'POST /profiles/:id/deactivate': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const profile = await service.deactivate(p['id'] ?? '')
        return json(200, profile)
      }),

    'GET /profiles/:id/versions': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        return json(200, await service.listVersions(p['id'] ?? ''))
      }),

    'GET /profiles/:id/versions/:entryId': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const url = new URL(req.url)
        const locale = url.searchParams.get('locale') ?? 'default'
        const entryId = p['entryId'] ?? ''
        if (!entryId) return errorResponse(400, 'Invalid version id')
        const content = await service.getVersionFile(p['id'] ?? '', entryId, locale)
        if (!content) return errorResponse(404, 'Version file not found')
        return new Response(content, { headers: { 'Content-Type': 'application/json' } })
      }),
  }
}
