import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { getGvl } from '../../tcf/gvl-cache'
import { json } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminTcfRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { denied: authError(user, 'consent:view') }
  }

  return {
    'GET /tcf/vendors': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const gvl = await getGvl()
        if (!gvl) return json(503, { error: 'GVL not available. Enable tcf.enabled in config.' })
        const url = new URL(req.url)
        const search = url.searchParams.get('q')?.toLowerCase()
        const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
        const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? '100', 10)))
        const vendors = Object.values(gvl.vendors)
        const filtered = search
          ? vendors.filter(v => v.name.toLowerCase().includes(search))
          : vendors
        const total = filtered.length
        const totalPages = Math.max(1, Math.ceil(total / limit))
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * limit
        return json(200, {
          vendorListVersion: gvl.vendorListVersion,
          total,
          page: safePage,
          totalPages,
          vendors: filtered.slice(start, start + limit),
        })
      }),

    'GET /tcf/purposes': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const gvl = await getGvl()
        if (!gvl) return json(503, { error: 'GVL not available. Enable tcf.enabled in config.' })
        return json(200, { purposes: Object.values(gvl.purposes) })
      }),
  }
}
