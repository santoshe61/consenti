import type { StorageAdapter, AuthConfig, VisitorFilters } from '@consenti/types'
import { json, getQueryInt, getQueryParam } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminVisitorRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /visitors': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'visitor:view')
        if (denied) return denied
        if (user?.allowedTenants.length && !user.allowedTenants.includes('default')) return json(200, { items: [], total: 0, page: 1, limit: 50 })
        const url = new URL(req.url)
        const from = getQueryParam(url, 'from')
        const to = getQueryParam(url, 'to')
        const limit = getQueryInt(url, 'limit', 50)
        if (limit > 500) return errorResponse(400, 'limit must not exceed 500')
        const filters: VisitorFilters = {
          tenantId: 'default',
          page: getQueryInt(url, 'page', 1),
          limit,
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        }
        const visitors = await storage.getVisitors(filters)
        return json(200, visitors)
      }),
  }
}
