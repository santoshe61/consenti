import type { StorageAdapter, AuthConfig, AuditFilters } from '@consenti/types'
import { json, getQueryParam, getPagination } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminAuditRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /audit': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'audit:view')
        if (denied) return denied
        if (user?.allowedTenants.length && !user.allowedTenants.includes('default')) return json(200, { items: [], total: 0, page: 1, limit: 50 })
        const url = new URL(req.url)
        const action = getQueryParam(url, 'action')
        const resourceType = getQueryParam(url, 'resourceType')
        const from = getQueryParam(url, 'from')
        const to = getQueryParam(url, 'to')
        const q = getQueryParam(url, 'q')
        const pagination = getPagination(url)
        if ('error' in pagination) return errorResponse(400, pagination.error)
        const { page, limit } = pagination
        const filters: AuditFilters = {
          tenantId: 'default',
          page,
          limit,
          ...(action !== undefined ? { action } : {}),
          ...(resourceType !== undefined ? { resourceType } : {}),
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
          ...(q !== undefined ? { q } : {}),
        }
        const logs = await storage.getLogs(filters)
        return json(200, logs)
      }),

    'GET /audit/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'audit:view')
        if (denied) return denied
        if (user?.allowedTenants.length && !user.allowedTenants.includes('default')) return errorResponse(403, 'Forbidden')
        const log = await storage.getAuditLogById(p['id'] ?? '')
        if (!log || log.tenantId !== 'default') return errorResponse(404, 'Audit log entry not found')
        return json(200, log)
      }),
  }
}
