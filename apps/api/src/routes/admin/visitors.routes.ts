import type { StorageAdapter, AuthConfig, VisitorFilters } from '@consenti/types'
import { json, getQueryParam, getPagination } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

/** See NOTICE_SHOWN_ENABLED in routes/public/notice.routes.ts — same dormant feature, kept for future reference. */
const NOTICE_SHOWN_ENABLED: boolean = false

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
        const q = getQueryParam(url, 'q')
        const pagination = getPagination(url)
        if ('error' in pagination) return errorResponse(400, pagination.error)
        const { page, limit } = pagination
        const filters: VisitorFilters = {
          tenantId: 'default',
          page,
          limit,
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
          ...(q !== undefined ? { q } : {}),
        }
        const visitors = await storage.getVisitors(filters)
        return json(200, visitors)
      }),

    'GET /visitors/:visitorId/notice-shown': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!NOTICE_SHOWN_ENABLED) return errorResponse(404, 'Not found')

        const { denied } = await auth(req, 'visitor:view')
        if (denied) return denied
        const records = await storage.getNoticeShownForVisitor(p['visitorId'] ?? '')
        return json(200, records)
      }),
  }
}
