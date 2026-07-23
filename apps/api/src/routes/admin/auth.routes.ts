import { randomBytes } from 'node:crypto'
import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { json, parseJsonBody } from '../../utils/http'
import { errorResponse, withErrorHandler } from '../../middleware/error.middleware'
import { authenticate } from '../../middleware/auth.middleware'
import type { RateLimiter } from '../../middleware/rate-limit.middleware'
import type { LocalAuth } from '../../auth/local.auth'
import {
  generatePkce, discoverOidcEndpoints, buildAuthorizationUrl,
  exchangeOidcCode, verifyOidcIdToken, extractEmailFromClaims,
  extractRolesFromClaims, storePkceState, consumePkceState,
} from '../../auth/oidc.auth'
import { buildSamlMetadataXml, validateSamlResponse } from '../../auth/saml.auth'
import { generateTotpSecret, verifyTotp, totpQrUrl } from '../../auth/totp'

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function buildAdminAuthRoutes(
  localAuth: LocalAuth,
  storage: StorageAdapter,
  authConfig: AuthConfig,
  secret: string,
  authLimiter?: RateLimiter | null,
) {
  function checkAuthLimit(req: Request): Response | null {
    if (!authLimiter) return null
    const ip = req.headers.get('x-real-ip') ?? ''
    if (!authLimiter.checkRequest(ip)) return errorResponse(429, 'Too Many Requests')
    return null
  }

  return {
    'POST /auth/login': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const limited = checkAuthLimit(req)
        if (limited) return limited
        if (authConfig.mode !== 'local') return errorResponse(400, 'Login not available in this auth mode')
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['email'] !== 'string' || typeof b['password'] !== 'string') {
          return errorResponse(400, 'email and password are required')
        }
        const token = await localAuth.login(b['email'], b['password'])
        if (!token) return errorResponse(401, 'Invalid credentials')
        return json(200, { token })
      }),

    'GET /auth/me': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const user = await authenticate(req, storage, authConfig, secret)
        if (!user) return errorResponse(401, 'Unauthorized')
        const dbUser = await storage.getUserById(user.sub)
        if (!dbUser) return errorResponse(401, 'User not found')
        const roles = await storage.getUserRoles(dbUser.id)
        return json(200, {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          isActive: dbUser.isActive,
          totpEnabled: dbUser.totpEnabled ?? false,
          roles: roles.map(r => r.name),
          permissions: user.permissions,
        })
      }),

    'POST /auth/logout': async (_req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => json(200, { success: true })),

    /** Reissues a fresh token from the current (still-valid) one, extending the session another
     * `SESSION_TTL_SECONDS` — called by the dashboard on user activity to implement a sliding
     * inactivity timeout rather than a flat expiry from login. 401s the same as any other
     * authenticated route if the current token is already invalid/expired — by design, since the
     * dashboard only ever calls this proactively, before expiry. */
    'POST /auth/refresh': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const user = await authenticate(req, storage, authConfig, secret)
        if (!user) return errorResponse(401, 'Unauthorized')
        const token = localAuth.signToken({
          sub: user.sub,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
          allowedTenants: user.allowedTenants,
        })
        return json(200, { token })
      }),

    // ── OIDC ────────────────────────────────────────────────────────────────────

    'GET /auth/oidc/authorize': async (_req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (authConfig.mode !== 'oidc' || !authConfig.oidc) return errorResponse(400, 'OIDC not configured')
        const endpoints = await discoverOidcEndpoints(authConfig.oidc.issuer)
        const state = base64url(randomBytes(16))
        const nonce = base64url(randomBytes(16))
        const { verifier, challenge } = generatePkce()
        storePkceState(state, verifier, nonce)
        const url = buildAuthorizationUrl(authConfig.oidc, endpoints.authorization_endpoint, state, nonce, challenge)
        return new Response(null, { status: 302, headers: { Location: url } })
      }),

    'GET /auth/oidc/callback': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (authConfig.mode !== 'oidc' || !authConfig.oidc) return errorResponse(400, 'OIDC not configured')
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        if (!code || !state) return errorResponse(400, 'Missing code or state')
        const pkce = consumePkceState(state)
        if (!pkce) return errorResponse(400, 'Invalid or expired state')
        const endpoints = await discoverOidcEndpoints(authConfig.oidc.issuer)
        const tokens = await exchangeOidcCode(authConfig.oidc, endpoints.token_endpoint, code, pkce.verifier)
        const claims = await verifyOidcIdToken(tokens.id_token, endpoints.jwks_uri)
        const email = extractEmailFromClaims(claims, authConfig.oidc.claimsMapping)
        const roles = extractRolesFromClaims(claims, authConfig.oidc.claimsMapping)
        // Upsert admin user from OIDC claims
        let user = await storage.getUserByEmail(email)
        if (!user) {
          user = await storage.createUser({ tenantId: 'default', name: email, email, passwordHash: '' })
        }
        if (roles.length > 0) {
          const allRoles = await storage.getRoles('default')
          for (const roleName of roles) {
            const role = allRoles.find(r => r.name === roleName)
            if (role) await storage.assignRole(user.id, role.id).catch(() => {})
          }
        }
        const userRoles = await storage.getUserRoles(user.id)
        const permissions: string[] = []
        for (const role of userRoles) {
          const perms = await storage.getPermissionsForRole(role.id)
          permissions.push(...perms.map(p => p.name))
        }
        const token = localAuth.signToken({
          sub: user.id, email: user.email,
          roles: userRoles.map(r => r.name),
          permissions: [...new Set(permissions)],
        })
        return json(200, { token })
      }),

    // ── SAML ────────────────────────────────────────────────────────────────────

    'GET /auth/saml/metadata': async (_req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        if (authConfig.mode !== 'saml' || !authConfig.saml) return errorResponse(400, 'SAML not configured')
        const xml = buildSamlMetadataXml(authConfig.saml)
        return new Response(xml, { status: 200, headers: { 'Content-Type': 'application/xml' } })
      }),

    'POST /auth/saml/acs': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const limited = checkAuthLimit(req)
        if (limited) return limited
        if (authConfig.mode !== 'saml' || !authConfig.saml) return errorResponse(400, 'SAML not configured')
        const params = new URLSearchParams(await req.text())
        const samlResponse = params.get('SAMLResponse')
        if (typeof samlResponse !== 'string') return errorResponse(400, 'Missing SAMLResponse')
        const info = await validateSamlResponse(samlResponse, authConfig.saml)
        if (!info) return errorResponse(401, 'SAML validation failed')
        let user = await storage.getUserByEmail(info.email)
        if (!user) {
          user = await storage.createUser({ tenantId: 'default', name: info.email, email: info.email, passwordHash: '' })
        }
        const userRoles = await storage.getUserRoles(user.id)
        const permissions: string[] = []
        for (const role of userRoles) {
          const perms = await storage.getPermissionsForRole(role.id)
          permissions.push(...perms.map(p => p.name))
        }
        const token = localAuth.signToken({
          sub: user.id, email: user.email,
          roles: userRoles.map(r => r.name),
          permissions: [...new Set(permissions)],
        })
        return json(200, { token })
      }),

    // ── TOTP ────────────────────────────────────────────────────────────────────

    'POST /auth/totp/setup': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const user = await authenticate(req, storage, authConfig, secret)
        if (!user) return errorResponse(401, 'Unauthorized')
        const dbUser = await storage.getUserById(user.sub)
        if (!dbUser) return errorResponse(401, 'User not found')
        const totpSecret = generateTotpSecret()
        const qrUrl = totpQrUrl(totpSecret, dbUser.email)
        await storage.updateUser(dbUser.id, { totpSecret, totpEnabled: false })
        return json(200, { qrUrl, message: 'Scan QR code, then verify with POST /auth/totp/verify' })
      }),

    'POST /auth/totp/verify': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const limited = checkAuthLimit(req)
        if (limited) return limited
        const user = await authenticate(req, storage, authConfig, secret)
        if (!user) return errorResponse(401, 'Unauthorized')
        const dbUser = await storage.getUserById(user.sub)
        if (!dbUser) return errorResponse(401, 'User not found')
        if (!dbUser.totpSecret) return errorResponse(400, 'TOTP not set up — call POST /auth/totp/setup first')
        const body = await parseJsonBody(req)
        if (!body || typeof body !== 'object') return errorResponse(400, 'Invalid body')
        const b = body as Record<string, unknown>
        if (typeof b['token'] !== 'string') return errorResponse(400, 'token is required')
        if (!verifyTotp(dbUser.totpSecret, b['token'])) return errorResponse(400, 'Invalid TOTP token')
        await storage.updateUser(dbUser.id, { totpEnabled: true })
        return json(200, { success: true, message: 'TOTP enabled successfully' })
      }),

    'POST /auth/totp/disable': async (req: Request, _p: Record<string, string>): Promise<Response> =>
      withErrorHandler(async () => {
        const user = await authenticate(req, storage, authConfig, secret)
        if (!user) return errorResponse(401, 'Unauthorized')
        const dbUser = await storage.getUserById(user.sub)
        if (!dbUser) return errorResponse(401, 'User not found')
        await storage.updateUser(dbUser.id, { totpSecret: null, totpEnabled: false })
        return json(200, { success: true, message: 'TOTP disabled' })
      }),
  }
}
