import type { StorageAdapter, AuthConfig, TcfConfig } from '@consenti/types'
import { getGvl } from '../../tcf/gvl-cache'
import { getCmpList } from '../../tcf/cmp-list-cache'
import { hashRegistrationFields, isRegistrationConfirmed } from '../../tcf/registration-confirmation'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

export function buildAdminTcfRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
  tcfConfig?: TcfConfig,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, 'consent:view') }
  }

  /** Same `settings:update` permission the API Config / origin-allowlist settings use — there's
   * no separate `settings:view`, so read and write share it (see settings.routes.ts). */
  async function settingsAuth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, 'settings:update') }
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

    // Draft/confirmed diff + a live CMP-List lookup for the dashboard's TCF Registration panel.
    // `?refresh=true` bypasses the 7-day CMP-List cache — the "Refresh Status" button, for when
    // a just-registered cmpId hasn't propagated to IAB's list yet.
    'GET /tcf/registration-status': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await settingsAuth(req)
        if (denied) return denied
        if (!tcfConfig) return json(200, { enabled: false, confirmed: true })

        const settings = await storage.getSettings('default')
        const confirmed = isRegistrationConfirmed(
          tcfConfig.enabled,
          { cmpId: tcfConfig.cmpId, cmpVersion: tcfConfig.cmpVersion, publisherCC: tcfConfig.publisherCC },
          settings.tcfConfirmation,
        )

        const url = new URL(req.url)
        const forceRefresh = url.searchParams.get('refresh') === 'true'
        const cmpList = tcfConfig.enabled ? await getCmpList(forceRefresh) : null
        const entry = cmpList?.cmps[String(tcfConfig.cmpId)]

        return json(200, {
          enabled: tcfConfig.enabled,
          cmpId: tcfConfig.cmpId,
          cmpVersion: tcfConfig.cmpVersion,
          ...(tcfConfig.publisherCC ? { publisherCC: tcfConfig.publisherCC } : {}),
          confirmed,
          ...(settings.tcfConfirmation ? { confirmedAt: settings.tcfConfirmation.confirmedAt, confirmedBy: settings.tcfConfirmation.confirmedBy } : {}),
          ...(cmpList ? { cmpListVersion: cmpList.cmpListVersion } : {}),
          ...(tcfConfig.enabled
            ? { cmpListEntry: { found: !!entry, deregistered: !!entry?.deletedDate, ...(entry?.deletedDate ? { deletedDate: entry.deletedDate } : {}) } }
            : {}),
        })
      }),

    // Required confirmation checkbox action — validates the live cmpId/cmpVersion against the
    // cached CMP List (deregistered → hard error; not found yet → soft block) and, on success,
    // writes only a hash of the confirmed fields to TenantSettings (never the raw values — see
    // registration-confirmation.ts). Re-arms automatically whenever cmpId/cmpVersion changes.
    'POST /tcf/confirm-registration': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await settingsAuth(req)
        if (denied) return denied
        if (!tcfConfig?.enabled) return errorResponse(400, 'TCF is not enabled in the server config — nothing to confirm.')

        const body = await parseJsonBody(req)
        if (!(body as { acknowledge?: unknown } | null)?.acknowledge) {
          return errorResponse(400, 'acknowledge: true is required to confirm TCF registration.')
        }

        const cmpList = await getCmpList()
        const entry = cmpList?.cmps[String(tcfConfig.cmpId)]
        if (entry?.deletedDate) {
          return errorResponse(409, `cmpId ${tcfConfig.cmpId} was deregistered on ${entry.deletedDate} per IAB's CMP List. Registration confirmation blocked.`)
        }
        if (!entry) {
          return errorResponse(404, `cmpId ${tcfConfig.cmpId} was not found in the cached CMP List. Registration can take time to propagate after signing up with IAB Europe — try "Refresh Status" and confirm again shortly.`)
        }

        const configHash = hashRegistrationFields({ cmpId: tcfConfig.cmpId, cmpVersion: tcfConfig.cmpVersion, publisherCC: tcfConfig.publisherCC })
        const settings = await storage.updateSettings('default', {
          tcfConfirmation: { configHash, confirmedAt: new Date().toISOString(), confirmedBy: user!.sub },
        })
        return json(200, { confirmed: true, tcfConfirmation: settings.tcfConfirmation })
      }),
  }
}
