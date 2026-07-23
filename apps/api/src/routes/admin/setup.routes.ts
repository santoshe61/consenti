import type { StorageAdapter, AuthConfig, ConsentiServerConfig } from '@consenti/types'
import { COMPLIANCE_GROUP_IDS, COMPLIANCE_GROUPS } from '@consenti/utils'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import { sanitizeConfigForDisplay } from '../../utils/sanitize-config'
import type { ProfileService } from '../../services/profile.service'

/** First-run setup wizard — one time per tenant, gated by `tenant_settings.setup_completed`.
 * Never reset from the dashboard once true (see plans/DONE-api-setup-wizard.md). */
export function buildAdminSetupRoutes(
  profileService: ProfileService,
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
  config: ConsentiServerConfig,
  readiness: { usingJsonStorage: boolean; usingDefaultCredentials: boolean },
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { denied: authError(user, 'settings:update') }
  }

  /** Blocks the two mutating setup routes once setup is already complete — the wizard is a
   * one-time installer, not something callable again via a direct API request either. */
  async function rejectIfCompleted(): Promise<Response | null> {
    const settings = await storage.getSettings('default')
    if (settings.setupCompleted === true) return errorResponse(409, 'Setup has already been completed')
    return null
  }

  return {
    'GET /setup/status': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const settings = await storage.getSettings('default')
        return json(200, { completed: settings.setupCompleted === true })
      }),

    'GET /setup/config': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        return json(200, { config: sanitizeConfigForDisplay(config), ...readiness })
      }),

    'GET /setup/compliance-groups': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const groups = COMPLIANCE_GROUP_IDS.map(id => ({ id, ...COMPLIANCE_GROUPS[id] }))
        return json(200, groups)
      }),

    'POST /setup/seed-profiles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const completed = await rejectIfCompleted()
        if (completed) return completed
        const body = await parseJsonBody(req)
        const groups = (body as { groups?: unknown } | null)?.groups
        if (!Array.isArray(groups) || groups.some(g => typeof g !== 'string')) {
          return errorResponse(400, 'groups must be an array of compliance group ids')
        }
        const unknown = groups.filter(g => !(COMPLIANCE_GROUP_IDS as readonly string[]).includes(g))
        if (unknown.length > 0) {
          return errorResponse(400, `Unknown compliance group id(s): ${unknown.join(', ')}`)
        }
        await Promise.all((groups as string[]).map(g => profileService.seedDefaultProfile(g)))
        return json(200, { seeded: groups })
      }),

    'POST /setup/complete': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const completed = await rejectIfCompleted()
        if (completed) return completed
        const settings = await storage.updateSettings('default', { setupCompleted: true })
        return json(200, settings)
      }),
  }
}
