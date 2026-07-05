import type { StorageAdapter, AuthConfig, Cookie } from '@consenti/types'
import { COMPLIANCE_GROUPS } from '@consenti/utils'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import { validateCreateProfile, validateUpdateProfile, castCreateProfile, castUpdateProfile } from '../../validators/profile.validator'
import type { ProfileService } from '../../services/profile.service'
import { validateProfileCompliance } from '../../services/compliance-validator.service'

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
        const body = await parseJsonBody(req) as { complianceGroup?: string; cookies?: Cookie[] }
        if (!body.complianceGroup || !Array.isArray(body.cookies)) {
          return errorResponse(400, 'complianceGroup and cookies are required')
        }
        return json(200, validateProfileCompliance(body.cookies, body.complianceGroup))
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

        // Compliance validation (defence in depth — dashboard already validates client-side)
        const complianceGroup = (input.profileJson as { complianceGroup?: string }).complianceGroup
        const choice = typeof body['choice'] === 'string' ? body['choice'] : undefined

        if (complianceGroup) {
          const cookies = (input.profileJson as { cookies?: Cookie[] }).cookies ?? []
          const complianceValidation = validateProfileCompliance(cookies, complianceGroup)
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

        // Compliance validation
        const complianceGroup = (input.profileJson as { complianceGroup?: string } | undefined)?.complianceGroup
        const choice = typeof body['choice'] === 'string' ? body['choice'] : undefined

        if (complianceGroup) {
          const cookies = (input.profileJson as { cookies?: Cookie[] } | undefined)?.cookies ?? []
          const complianceValidation = validateProfileCompliance(cookies, complianceGroup)
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

    'POST /profiles/:id/activate': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const id = p['id'] ?? ''
        const body = await parseJsonBody(req) as Record<string, unknown> | null
        const choice = typeof body?.['choice'] === 'string' ? body['choice'] : undefined

        const profile = await service.get(id)
        if (!profile) return errorResponse(404, 'Profile not found')

        const complianceGroup = (profile.profileJson as { complianceGroup?: string }).complianceGroup
        if (complianceGroup) {
          const existing = await service.findActiveByComplianceGroup(complianceGroup)
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
        return json(200, service.listVersions(p['id'] ?? ''))
      }),

    'GET /profiles/:id/versions/:version': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const url = new URL(req.url)
        const locale = url.searchParams.get('locale') ?? 'default'
        const ver = parseInt(p['version'] ?? '0', 10)
        if (isNaN(ver) || ver < 1) return errorResponse(400, 'Invalid version number')
        const content = service.getVersionFile(p['id'] ?? '', ver, locale)
        if (!content) return errorResponse(404, 'Version file not found')
        return new Response(content, { headers: { 'Content-Type': 'application/json' } })
      }),
  }
}
