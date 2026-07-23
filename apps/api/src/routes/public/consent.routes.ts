import type { ConsentService } from '../../services/consent.service'
import type { VisitorService } from '../../services/visitor.service'
import type { ProfileService } from '../../services/profile.service'
import type { StorageAdapter } from '@consenti/types'
import { parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { buildOwnershipSetCookie, buildExpireOwnershipCookie, verifyOwnershipToken } from '../../utils/cookie'
import { checkOriginAllowed } from '../../middleware/cors.middleware'
import {
  validateCreateConsent, validateUpdateConsent,
  castCreateConsent, castUpdateConsent,
} from '../../validators/consent.validator'
import { randomVisitorId } from '../../utils/crypto'

// Verify that the request's cookie contains a valid consenti_<visitorId> token,
// proving the caller is the actual visitor who originally submitted consent.
function assertVisitorOwnership(request: Request, visitorId: string, secret: string): Response | null {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const name = `consenti_${visitorId}`
  const owned = cookieHeader.split(';').some(c => {
    const trimmed = c.trim()
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1 || trimmed.slice(0, eqIdx) !== name) return false
    return verifyOwnershipToken(trimmed.slice(eqIdx + 1), visitorId, secret)
  })
  if (!owned) return errorResponse(403, 'Forbidden')
  return null
}

export function buildConsentRoutes(
  consents: ConsentService,
  visitors: VisitorService,
  profiles: ProfileService,
  resolveTenantId: (req: Request) => Promise<string> = async () => 'default',
  storage?: StorageAdapter,
  ownershipSecret = '',
) {
  return {
    'POST /consent': async (request: Request, _params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const body = await parseJsonBody(request)
        const validation = validateCreateConsent(body)
        if (!validation.valid) return errorResponse(400, validation.error ?? 'Invalid request')

        const b = body as Record<string, unknown>
        const profileId = typeof b['profileId'] === 'string' ? b['profileId'] : null
        if (!profileId) return errorResponse(400, 'profileId is required')

        // Layer 1: verify the profileId is real — blocks all requests with unknown profiles
        const profile = await profiles.get(profileId)
        if (!profile) return errorResponse(404, 'Profile not found')

        const tenantId = await resolveTenantId(request)

        // Layer 3: enforce the profile's allowed-domains list, falling back to the tenant-wide
        // default (dashboard's API Config → Allowed Origins) when the profile doesn't set its own.
        const pjConfig = profile.profileJson as { allowedOrigins?: string[] }
        let allowedOrigins = pjConfig.allowedOrigins ?? []
        if (allowedOrigins.length === 0 && storage) {
          allowedOrigins = (await storage.getSettings(tenantId)).allowedOrigins ?? []
        }
        if (!checkOriginAllowed(request, allowedOrigins)) {
          return errorResponse(403, 'Origin not allowed for this profile')
        }

        const visitorId = typeof b['visitorId'] === 'string' ? b['visitorId'] : randomVisitorId()
        const ip = request.headers.get('x-real-ip') ?? ''
        const ua = request.headers.get('user-agent') ?? ''

        await visitors.upsert({ visitorId, ip, userAgent: ua })
        const input = castCreateConsent(b, visitorId, tenantId)
        const record = await consents.create(input)

        const setCookie = buildOwnershipSetCookie(visitorId, record.id, ownershipSecret)
        return new Response(JSON.stringify(record), {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': setCookie,
          },
        })
      }),

    'PUT /consent/:visitorId': async (request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const visitorId = params['visitorId']
        if (!visitorId) return errorResponse(400, 'Missing visitorId')

        // Layer 2: only the visitor's own browser may update their consent
        const ownershipError = assertVisitorOwnership(request, visitorId, ownershipSecret)
        if (ownershipError) return ownershipError

        const body = await parseJsonBody(request)
        const validation = validateUpdateConsent(body)
        if (!validation.valid) return errorResponse(400, validation.error ?? 'Invalid request')

        const input = castUpdateConsent(body as Record<string, unknown>)
        const record = await consents.update(visitorId, input)

        const setCookie = buildOwnershipSetCookie(visitorId, record.id, ownershipSecret)
        return new Response(JSON.stringify(record), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': setCookie,
          },
        })
      }),

    'GET /consent/:visitorId': async (request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const visitorId = params['visitorId']
        if (!visitorId) return errorResponse(400, 'Missing visitorId')

        // Layer 2: only the visitor's own browser may read their consent
        const ownershipError = assertVisitorOwnership(request, visitorId, ownershipSecret)
        if (ownershipError) return ownershipError

        const record = await consents.get(visitorId)
        if (!record) return errorResponse(404, 'Consent not found')
        return new Response(JSON.stringify(record), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),

    'GET /consent/:visitorId/verify': async (request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const visitorId = params['visitorId']
        if (!visitorId) return errorResponse(400, 'Missing visitorId')

        // Layer 2: cookie ownership (browser calls); server-side callers use admin auth upstream
        const ownershipError = assertVisitorOwnership(request, visitorId, ownershipSecret)
        if (ownershipError) return ownershipError

        const result = await consents.verify(visitorId)
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),

    'DELETE /consent/:visitorId': async (request: Request, params: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const visitorId = params['visitorId']
        if (!visitorId) return errorResponse(400, 'Missing visitorId')

        // Layer 2: only the visitor's own browser may erase their consent
        const ownershipError = assertVisitorOwnership(request, visitorId, ownershipSecret)
        if (ownershipError) return ownershipError

        const existing = await consents.get(visitorId)
        await consents.erase(visitorId)
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (existing) {
          headers['Set-Cookie'] = buildExpireOwnershipCookie(visitorId)
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers })
      }),
  }
}
