import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate, authError } from '../../middleware/auth.middleware'
import { validateCreateProfile, validateUpdateProfile, castCreateProfile, castUpdateProfile } from '../../validators/profile.validator'
import type { ProfileService } from '../../services/profile.service'

export function buildAdminProfileRoutes(
  service: ProfileService,
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
) {
  async function auth(req: Request, perm?: string) {
    const user = await authenticate(req, storage, authConfig, secret)
    return { user, denied: authError(user, perm) }
  }

  return {
    'GET /profiles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        return json(200, await service.list())
      }),

    'GET /profiles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:view')
        if (denied) return denied
        const profile = await service.get(p['id'] ?? '')
        if (!profile) return errorResponse(404, 'Profile not found')
        return json(200, profile)
      }),

    'POST /profiles': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:create')
        if (denied) return denied
        const body = await parseJsonBody(req)
        const validation = validateCreateProfile(body)
        if (!validation.valid) return errorResponse(400, validation.error ?? 'Invalid body')
        const profile = await service.create(castCreateProfile(body as Record<string, unknown>, 'default'))
        return json(201, profile)
      }),

    'PUT /profiles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:update')
        if (denied) return denied
        const id = p['id'] ?? ''
        const body = await parseJsonBody(req)
        const validation = validateUpdateProfile(body)
        if (!validation.valid) return errorResponse(400, validation.error ?? 'Invalid body')
        const profile = await service.update(id, castUpdateProfile(body as Record<string, unknown>))
        return json(200, profile)
      }),

    'DELETE /profiles/:id': async (req: Request, p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const { denied } = await auth(req, 'profile:delete')
        if (denied) return denied
        await service.delete(p['id'] ?? '')
        return json(200, { success: true })
      }),
  }
}
