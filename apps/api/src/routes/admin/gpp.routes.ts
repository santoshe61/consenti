import type { StorageAdapter, AuthConfig, GppConfig } from '@consenti/types'
import { hashRegistrationFields, isRegistrationConfirmed } from '../../tcf/registration-confirmation'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

/**
 * GPP registration confirmation — same hash-based governance shape as TCF's
 * `tcf.routes.ts`, but self-attestation only: IAB doesn't publish a CMP-List equivalent for GPP,
 * so there's no external registry to validate `cmpId` against (unlike TCF's confirm-registration,
 * which hard-fails on deregistration). Confirming here just means "we attest this cmpId/cmpVersion
 * is registered" — the checkbox and hash-drift detection are the whole mechanism.
 */
export function buildAdminGppRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
  gppConfig?: GppConfig,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, 'settings:update') }
  }

  return {
    'GET /gpp/registration-status': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        if (!gppConfig) return json(200, { enabled: false, confirmed: true })

        const settings = await storage.getSettings('default')
        const confirmed = isRegistrationConfirmed(
          gppConfig.enabled,
          { cmpId: gppConfig.cmpId, cmpVersion: gppConfig.cmpVersion },
          settings.gppConfirmation,
        )
        return json(200, {
          enabled: gppConfig.enabled,
          cmpId: gppConfig.cmpId,
          cmpVersion: gppConfig.cmpVersion,
          confirmed,
          ...(settings.gppConfirmation ? { confirmedAt: settings.gppConfirmation.confirmedAt, confirmedBy: settings.gppConfirmation.confirmedBy } : {}),
        })
      }),

    'POST /gpp/confirm-registration': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { user, denied } = await auth(req)
        if (denied) return denied
        if (!gppConfig?.enabled) return errorResponse(400, 'GPP is not enabled in the server config — nothing to confirm.')

        const body = await parseJsonBody(req)
        if (!(body as { acknowledge?: unknown } | null)?.acknowledge) {
          return errorResponse(400, 'acknowledge: true is required to confirm GPP registration.')
        }

        const configHash = hashRegistrationFields({ cmpId: gppConfig.cmpId, cmpVersion: gppConfig.cmpVersion })
        const settings = await storage.updateSettings('default', {
          gppConfirmation: { configHash, confirmedAt: new Date().toISOString(), confirmedBy: user!.sub },
        })
        return json(200, { confirmed: true, gppConfirmation: settings.gppConfirmation })
      }),
  }
}
