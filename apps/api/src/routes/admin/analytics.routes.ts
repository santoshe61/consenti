import type { StorageAdapter, AuthConfig, OptInFilters } from '@consenti/types'
import { json } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminAnalyticsRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
  defaultTenantId = 'default',
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /analytics/opt-in': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'stats:view')
        if (denied) return denied

        const url = new URL(req.url)
        const tenantId = url.searchParams.get('tenantId') ?? defaultTenantId

        const filters: OptInFilters = {}
        const profileId = url.searchParams.get('profileId')
        const complianceGroup = url.searchParams.get('complianceGroup')
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const locale = url.searchParams.get('locale')

        if (profileId) filters.profileId = profileId
        if (complianceGroup) filters.complianceGroup = complianceGroup
        if (from) filters.from = from
        if (to) filters.to = to
        if (locale) filters.locale = locale

        const stats = await storage.getOptInStats(tenantId, filters)
        return json(200, stats)
      }),
  }
}
