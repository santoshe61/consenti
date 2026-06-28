import type { StorageAdapter, AuthConfig, AuditFilters } from '@consenti/types'
import { json, getQueryParam, getQueryInt } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminAuditRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { denied: authError(user, perm) }
  }

  return {
    'GET /audit': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'audit:view')
        if (denied) return denied
        const url = new URL(req.url)
        const action = getQueryParam(url, 'action')
        const resourceType = getQueryParam(url, 'resourceType')
        const from = getQueryParam(url, 'from')
        const to = getQueryParam(url, 'to')
        const limit = getQueryInt(url, 'limit', 50)
        if (limit > 500) return errorResponse(400, 'limit must not exceed 500')
        const filters: AuditFilters = {
          tenantId: 'default',
          page: getQueryInt(url, 'page', 1),
          limit,
          ...(action !== undefined ? { action } : {}),
          ...(resourceType !== undefined ? { resourceType } : {}),
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        }
        const logs = await storage.getLogs(filters)
        return json(200, logs)
      }),
  }
}
