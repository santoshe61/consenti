import type { ProfileService } from '../../services/profile.service'
import { json } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'

export function buildProfileRoutes(profiles: ProfileService) {
  return {
    'GET /profiles/:id': async (_request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const id = params['id']
        if (!id) return errorResponse(400, 'Missing profile id')
        const result = await profiles.getResolved(id)
        if (!result) return errorResponse(404, 'Profile not found')
        return json(200, result)
      }),

    'GET /profiles/:id/:locale': async (_request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const id = params['id']
        const locale = params['locale']
        if (!id) return errorResponse(400, 'Missing profile id')
        if (!locale) return errorResponse(400, 'Missing locale')
        const result = await profiles.getResolved(id, locale)
        if (!result) return errorResponse(404, 'Profile not found')
        return json(200, result)
      }),
  }
}
