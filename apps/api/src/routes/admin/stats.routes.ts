import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, getQueryInt } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminStatsRoutes(
  storage: StorageAdapter,
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
        const stats = await storage.getOverviewStats('default')
        return json(200, stats)
      }),

    'GET /stats/categories': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const stats = await storage.getCategoryStats('default')
        return json(200, stats)
      }),

    'GET /stats/timeline': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const url = new URL(req.url)
        const days = getQueryInt(url, 'days', 30)
        const timeline = await storage.getTimeline('default', days)
        return json(200, timeline)
      }),

    'GET /stats/countries': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const countries = await storage.getCountries('default')
        return json(200, countries)
      }),

    'GET /stats/gpc': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const gpc = await storage.getGpcStats('default')
        return json(200, gpc)
      }),

    'GET /stats/aggregate': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const tenants = await storage.getTenants()
        const rows = await Promise.all(
          tenants.map(async t => {
            const s = await storage.getOverviewStats(t.id)
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
