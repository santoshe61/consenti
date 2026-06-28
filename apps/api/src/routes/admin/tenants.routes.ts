import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminTenantRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /tenants': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'settings:update')
        if (denied) return denied
        const tenants = await storage.getTenants()
        return json(200, tenants)
      }),

    'POST /tenants': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'settings:update')
        if (denied) return denied
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['name'] !== 'string' || typeof b['slug'] !== 'string') {
          return errorResponse(400, 'name and slug are required')
        }
        const tenant = await storage.createTenant({ name: b['name'], slug: b['slug'] })
        return json(201, tenant)
      }),

    'PUT /tenants/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'settings:update')
        if (denied) return denied
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        const tenant = await storage.updateTenant(p['id'] ?? '', {
          ...(typeof b['name'] === 'string' ? { name: b['name'] } : {}),
          ...(typeof b['slug'] === 'string' ? { slug: b['slug'] } : {}),
        })
        return json(200, tenant)
      }),

    'DELETE /tenants/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'settings:update')
        if (denied) return denied
        const id = p['id'] ?? ''
        if (id === 'default') return errorResponse(400, 'Cannot delete the default tenant')
        await storage.deleteTenant(id)
        return json(200, { success: true })
      }),
  }
}
