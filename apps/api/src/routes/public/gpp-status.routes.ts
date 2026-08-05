import type { StorageAdapter, GppConfig } from '@consenti/types'
import { json } from '../../utils/http'
import { withErrorHandler } from '../../middleware/error.middleware'
import { isRegistrationConfirmed } from '../../tcf/registration-confirmation'

/** Mirrors tcf-status.routes.ts — see there for the caching/staleness rationale. */
export function buildGppStatusRoutes(storage: StorageAdapter, gppConfig?: GppConfig) {
  return {
    'GET /gpp/status': async (_req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (!gppConfig?.enabled) return json(200, { blocked: false })
        const settings = await storage.getSettings('default')
        const confirmed = isRegistrationConfirmed(
          true,
          { cmpId: gppConfig.cmpId, cmpVersion: gppConfig.cmpVersion },
          settings.gppConfirmation,
        )
        return json(200, { blocked: !confirmed })
      }),
  }
}
