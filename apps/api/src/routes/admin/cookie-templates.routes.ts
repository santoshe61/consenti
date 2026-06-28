import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminCookieTemplateRoutes(storage: StorageAdapter, authConfig: AuthConfig, secret: string, tenantId = 'default') {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /cookie-templates': async (req: Request): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        return json(200, await storage.getCookieTemplates(tenantId))
      }),

    'GET /cookie-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const t = await storage.getCookieTemplate(params['id']!)
        return t ? json(200, t) : errorResponse(404, 'Cookie template not found')
      }),

    'POST /cookie-templates': async (req: Request): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody<{ name?: unknown; cookies?: unknown }>(req)
        if (!body?.name || typeof body.name !== 'string') return errorResponse(400, 'name is required')
        if (!Array.isArray(body.cookies)) return errorResponse(400, 'cookies must be an array')
        const t = await storage.createCookieTemplate({ tenantId, name: body.name, cookies: body.cookies as never })
        return json(201, t)
      }),

    'PUT /cookie-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const body = await parseJsonBody<{ name?: unknown; cookies?: unknown }>(req)
        const update: { name?: string; cookies?: never } = {}
        if (body?.name !== undefined && typeof body.name === 'string') update.name = body.name
        if (body?.cookies !== undefined && Array.isArray(body.cookies)) update.cookies = body.cookies as never
        const t = await storage.updateCookieTemplate(params['id']!, update)
        return json(200, t)
      }),

    'DELETE /cookie-templates/:id': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:delete')
        if (denied) return denied
        await storage.deleteCookieTemplate(params['id']!)
        return json(200, { ok: true })
      }),

    'POST /cookie-templates/:id/copy': async (req: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody<{ name?: unknown }>(req)
        const src = await storage.getCookieTemplate(params['id']!)
        if (!src) return errorResponse(404, 'Cookie template not found')
        const newName = (typeof body?.name === 'string' && body.name.trim()) ? body.name.trim() : `${src.name} (Copy)`
        const t = await storage.copyCookieTemplate(params['id']!, newName)
        return json(201, t)
      }),
  }
}
