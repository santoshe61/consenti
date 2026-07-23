import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, getQueryInt } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import type { StatsService } from '../../services/stats.service'

export function buildAdminStatsRoutes(
  storage: StorageAdapter,
  stats: StatsService,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { denied: authError(user, 'consent:view') }
  }

  return {
    'GET /stats/overview': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const overview = await stats.getOverview('default')
        return json(200, overview)
      }),

    'GET /stats/categories': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const categories = await stats.getCategories('default')
        return json(200, categories)
      }),

    'GET /stats/timeline': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const url = new URL(req.url)
        const days = getQueryInt(url, 'days', 30)
        const timeline = await stats.getTimeline('default', days)
        return json(200, timeline)
      }),

    'GET /stats/countries': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const countries = await stats.getCountries('default')
        return json(200, countries)
      }),

    'GET /stats/gpc': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const gpc = await stats.getGpc('default')
        return json(200, gpc)
      }),

    'GET /stats/aggregate': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const tenants = await stats.getTenants()
        const rows = await Promise.all(
          tenants.map(async t => {
            const s = await stats.getOverview(t.id)
            return { tenantId: t.id, tenantName: t.name, ...s }
          }),
        )
        const aggregate = rows.reduce(
          (acc, r) => ({
            totalConsents: acc.totalConsents + r.totalConsents,
            totalVisitors: acc.totalVisitors + r.totalVisitors,
            gpcDetectedCount: acc.gpcDetectedCount + r.gpcDetectedCount,
          }),
          { totalConsents: 0, totalVisitors: 0, gpcDetectedCount: 0 },
        )
        return json(200, { aggregate, perTenant: rows })
      }),
  }
}
