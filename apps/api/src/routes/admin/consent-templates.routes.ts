import type { StorageAdapter, AuthConfig, CookieMap, CategoryMap } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import { validateProfileCompliance } from '../../services/compliance-validator.service'
import { validateConsentTemplate } from '../../validators/consent-template.validator'

export function buildAdminConsentTemplateRoutes(storage: StorageAdapter, authConfig: AuthConfig, secret: string, tenantId = 'default') {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /consent-templates': async (req: Request): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        return json(200, await storage.getConsentTemplates(tenantId))
      }),

    'GET /consent-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const t = await storage.getConsentTemplate(params['id']!)
        return t ? json(200, t) : errorResponse(404, 'Consent template not found')
      }),

    'POST /consent-templates': async (req: Request): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody<{ name?: unknown; cookies?: unknown; categories?: unknown }>(req)
        if (!body?.name || typeof body.name !== 'string') return errorResponse(400, 'name is required')
        const templateResult = validateConsentTemplate(body.cookies, body.categories)
        if (!templateResult.valid) return errorResponse(400, templateResult.error!)
        const t = await storage.createConsentTemplate({
          tenantId,
          name: body.name,
          cookies: body.cookies as CookieMap,
          categories: body.categories as CategoryMap,
        })
        return json(201, t)
      }),

    'PUT /consent-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const id = params['id']!
        const body = await parseJsonBody<{ name?: unknown; cookies?: unknown; categories?: unknown }>(req)

        const oldTemplate = await storage.getConsentTemplate(id)
        if (!oldTemplate) return errorResponse(404, 'Consent template not found')

        const update: { name?: string; cookies?: CookieMap; categories?: CategoryMap } = {}
        if (body?.name !== undefined && typeof body.name === 'string') update.name = body.name

        const cookiesChanged = body?.cookies !== undefined
        const categoriesChanged = body?.categories !== undefined
        const nextCookies = cookiesChanged ? body!.cookies : oldTemplate.cookies
        const nextCategories = categoriesChanged ? body!.categories : oldTemplate.categories

        if (cookiesChanged || categoriesChanged) {
          const templateResult = validateConsentTemplate(nextCookies, nextCategories)
          if (!templateResult.valid) return errorResponse(400, templateResult.error!)
          if (cookiesChanged) update.cookies = nextCookies as CookieMap
          if (categoriesChanged) update.categories = nextCategories as CategoryMap

          // Check whether this change breaks compliance for profiles currently using the template
          const profiles = await storage.findProfilesUsingConsentTemplate(id)
          const blockingProfiles: { id: string; name: string; complianceGroup: string }[] = []
          for (const p of profiles) {
            if (!p.complianceGroup) continue
            const result = validateProfileCompliance(nextCookies as CookieMap, nextCategories as CategoryMap, p.complianceGroup)
            if (!result.valid) blockingProfiles.push({ id: p.id, name: p.name, complianceGroup: p.complianceGroup })
          }
          if (blockingProfiles.length > 0) {
            return errorResponse(422, 'This change would break compliance for affected profiles', { blockingProfiles })
          }
        }

        const t = await storage.updateConsentTemplate(id, update)
        return json(200, t)
      }),

    'DELETE /consent-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:delete')
        if (denied) return denied
        const id = params['id']!
        const profiles = await storage.findProfilesUsingConsentTemplate(id)
        if (profiles.length > 0) {
          return errorResponse(422, 'Cannot delete: template is used by profiles', {
            profiles: profiles.map(p => ({ id: p.id, name: p.name, isActive: p.isActive })),
          })
        }
        await storage.deleteConsentTemplate(id)
        return json(200, { ok: true })
      }),

    'POST /consent-templates/:id/copy': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody<{ name?: unknown }>(req)
        const src = await storage.getConsentTemplate(params['id']!)
        if (!src) return errorResponse(404, 'Consent template not found')
        const newName = (typeof body?.name === 'string' && body.name.trim()) ? body.name.trim() : `${src.name} (Copy)`
        const t = await storage.copyConsentTemplate(params['id']!, newName)
        return json(201, t)
      }),

    'GET /consent-templates/:id/profile-usage': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const usage = await storage.findProfilesUsingConsentTemplate(params['id']!)
        return json(200, usage)
      }),
  }
}
