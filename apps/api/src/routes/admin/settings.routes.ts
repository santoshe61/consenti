import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'

/** Tenant-wide dashboard settings — the public and admin API origin allowlists shown on the
 * API Config page. Single-tenant deployments always use `'default'`. */
export function buildAdminSettingsRoutes(
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, 'settings:update') }
  }

  return {
    'GET /settings': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const settings = await storage.getSettings('default')
        return json(200, settings)
      }),

    'PATCH /settings': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req)
        if (denied) return denied
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (b['allowedOrigins'] !== undefined && !Array.isArray(b['allowedOrigins'])) {
          return errorResponse(400, 'allowedOrigins must be an array of strings')
        }
        if (b['adminAllowedOrigins'] !== undefined && !Array.isArray(b['adminAllowedOrigins'])) {
          return errorResponse(400, 'adminAllowedOrigins must be an array of strings')
        }
        const settings = await storage.updateSettings('default', {
          ...(b['allowedOrigins'] !== undefined ? { allowedOrigins: b['allowedOrigins'] as string[] } : {}),
          ...(b['adminAllowedOrigins'] !== undefined ? { adminAllowedOrigins: b['adminAllowedOrigins'] as string[] } : {}),
        })
        return json(200, settings)
      }),
  }
}
