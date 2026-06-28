import { verifyJwt } from '../utils/crypto'

export interface JwtUser {
  id: string
  email: string
  roles: string[]
  tenantId: string
}

export function validateExternalJwt(token: string, secret: string): JwtUser | null {
  const payload = verifyJwt(token, secret)
  if (!payload) return null
  const sub = payload['sub']
  const email = payload['email']
  if (typeof sub !== 'string' || typeof email !== 'string') return null
  return {
    id: sub,
    email,
    roles: Array.isArray(payload['roles']) ? (payload['roles'] as string[]) : [],
    tenantId: typeof payload['tenantId'] === 'string' ? payload['tenantId'] : 'default',
  }
}
