import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminUITemplateRoutes(storage: StorageAdapter, authConfig: AuthConfig, secret: string, tenantId = 'default') {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /ui-templates': async (req: Request): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        return json(200, await storage.getUITemplates(tenantId))
      }),

    'GET /ui-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const t = await storage.getUITemplate(params['id']!)
        return t ? json(200, t) : errorResponse(404, 'UI template not found')
      }),

    'POST /ui-templates': async (req: Request): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody<Record<string, unknown>>(req)
        if (!body?.name || typeof body.name !== 'string') return errorResponse(400, 'name is required')
        if (!body.mainBanner || !body.gpcBanner || !body.preferenceModal) return errorResponse(400, 'mainBanner, gpcBanner, and preferenceModal are required')
        const t = await storage.createUITemplate({
          tenantId,
          name: body.name,
          mainBanner: body.mainBanner as never,
          gpcBanner: body.gpcBanner as never,
          preferenceModal: body.preferenceModal as never,
        })
        return json(201, t)
      }),

    'PUT /ui-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const body = await parseJsonBody<Record<string, unknown>>(req)
        const update: Record<string, unknown> = {}
        if (typeof body?.name === 'string') update['name'] = body.name
        if (body?.mainBanner) update['mainBanner'] = body.mainBanner
        if (body?.gpcBanner) update['gpcBanner'] = body.gpcBanner
        if (body?.preferenceModal) update['preferenceModal'] = body.preferenceModal
        const t = await storage.updateUITemplate(params['id']!, update as never)
        return json(200, t)
      }),

    'DELETE /ui-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:delete')
        if (denied) return denied
        await storage.deleteUITemplate(params['id']!)
        return json(200, { ok: true })
      }),

    'POST /ui-templates/:id/copy': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody<{ name?: unknown }>(req)
        const src = await storage.getUITemplate(params['id']!)
        if (!src) return errorResponse(404, 'UI template not found')
        const newName = (typeof body?.name === 'string' && body.name.trim()) ? body.name.trim() : `${src.name} (Copy)`
        const t = await storage.copyUITemplate(params['id']!, newName)
        return json(201, t)
      }),
  }
}
