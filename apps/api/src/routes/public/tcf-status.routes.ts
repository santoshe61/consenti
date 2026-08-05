import type { StorageAdapter, TcfConfig } from '@consenti/types'
import { json } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { isRegistrationConfirmed } from '../../tcf/registration-confirmation'

/** Tiny, unauthenticated, always-live check the widget calls once at init — only when it's been
 * configured with a client-side `compliance.tcf` — to decide whether to install `window.__tcfapi`
 * at all. Deliberately kept separate from the (cacheable, static-file-servable) per-profile JSON
 * response: TCF confirmation state can change independently of any profile edit/publish, so
 * folding it into cached profile content would go stale until the next publish. Exposes only
 * `blocked` — never cmpId/cmpVersion/confirmation metadata, which stay behind admin auth. */
export function buildTcfStatusRoutes(storage: StorageAdapter, tcfConfig?: TcfConfig) {
  return {
    'GET /tcf/status': async (_req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!tcfConfig?.enabled) return json(200, { blocked: false })
        const settings = await storage.getSettings('default')
        const confirmed = isRegistrationConfirmed(
          true,
          { cmpId: tcfConfig.cmpId, cmpVersion: tcfConfig.cmpVersion, publisherCC: tcfConfig.publisherCC },
          settings.tcfConfirmation,
        )
        return json(200, { blocked: !confirmed })
      }),
  }
}
