import type { StorageAdapter, AuthConfig, ConsentFilters } from '@consenti/types'
import { json, getQueryParam, getQueryInt } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminConsentRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /consents': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'consent:view')
        if (denied) return denied
        if (user?.allowedTenants.length && !user.allowedTenants.includes('default')) return json(200, { items: [], total: 0, page: 1, limit: 50 })
        const url = new URL(req.url)
        const profileId = getQueryParam(url, 'profileId')
        const from = getQueryParam(url, 'from')
        const to = getQueryParam(url, 'to')
        const limit = getQueryInt(url, 'limit', 50)
        if (limit > 500) return errorResponse(400, 'limit must not exceed 500')
        const filters: ConsentFilters = {
          tenantId: 'default',
          page: getQueryInt(url, 'page', 1),
          limit,
          ...(profileId !== undefined ? { profileId } : {}),
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
        }
        const records = await storage.getConsents(filters)
        return json(200, records)
      }),

    'GET /consents/:visitorId': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'consent:view')
        if (denied) return denied
        if (user?.allowedTenants.length && !user.allowedTenants.includes('default')) return errorResponse(403, 'Forbidden')
        const record = await storage.getConsent(p['visitorId'] ?? '')
        if (!record) return errorResponse(404, 'Consent not found')
        return json(200, record)
      }),

    'GET /consents/:visitorId/history': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req, 'consent:view')
        if (denied) return denied
        if (user?.allowedTenants.length && !user.allowedTenants.includes('default')) return errorResponse(403, 'Forbidden')
        const history = await storage.getConsentHistory(p['visitorId'] ?? '')
        return json(200, history)
      }),
  }
}
