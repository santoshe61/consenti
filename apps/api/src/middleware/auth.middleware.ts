import { createHash } from 'node:crypto'
import type { StorageAdapter, AuthConfig } from '@consenti/types'
import { verifyJwt } from '../utils/crypto'
import { errorResponse } from './error.middleware'

export interface AuthenticatedUser {
  sub: string
  email: string
  roles: string[]
  permissions: string[]
  allowedTenants: string[]  // empty = all tenants
}

export async function authenticate(
  req: Request,
  storage: StorageAdapter,
  config: AuthConfig,
  secret: string,
): Promise<AuthenticatedUser | null> {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null

  // `ck_` tokens are the server-side/CI API keys minted from the dashboard's API Config page —
  // per its own copy, a valid one "grants full admin access" regardless of the configured
  // AuthConfig.mode, scoped to the tenant it was created for.
  if (token.startsWith('ck_')) {
    const keyHash = createHash('sha256').update(token).digest('hex')
    const apiKey = await storage.getApiKeyByHash(keyHash)
    if (!apiKey || !apiKey.isActive) return null
    if (apiKey.expireBy && new Date(apiKey.expireBy) <= new Date()) {
      await storage.revokeApiKey(apiKey.id).catch(() => { })
      return null
    }
    const permissions = (await storage.getAllPermissions()).map(p => p.name)
    return {
      sub: `apikey:${apiKey.id}`,
      email: apiKey.name,
      roles: ['api_key'],
      permissions,
      allowedTenants: [apiKey.tenantId],
    }
  }

  if (config.mode === 'local' || config.mode === 'jwt') {
    const payload = verifyJwt(token, secret)
    if (!payload) return null
    const sub = payload['sub']
    const email = payload['email']
    const roles = payload['roles']
    const permissions = payload['permissions']
    const allowedTenants = payload['allowedTenants']
    if (typeof sub !== 'string' || typeof email !== 'string') return null
    return {
      sub,
      email,
      roles: Array.isArray(roles) ? (roles as string[]) : [],
      permissions: Array.isArray(permissions) ? (permissions as string[]) : [],
      allowedTenants: Array.isArray(allowedTenants) ? (allowedTenants as string[]) : [],
    }
  }

  if (config.mode === 'custom' && config.validateUser) {
    const user = await config.validateUser(req)
    if (!user) return null
    const roles = await storage.getUserRoles(user.id)
    const permSets = await Promise.all(roles.map(r => storage.getPermissionsForRole(r.id)))
    const permissions = [...new Set(permSets.flat().map(p => p.name))]
    return {
      sub: user.id,
      email: user.email,
      roles: roles.map(r => r.name),
      permissions,
      allowedTenants: [],
    }
  }

  return null
}

export function authError(
  user: AuthenticatedUser | null,
  permission?: string,
): Response | null {
  if (!user) return errorResponse(401, 'Unauthorized')
  if (permission && !user.permissions.includes(permission)) return errorResponse(403, 'Forbidden')
  return null
}
