import { createHash, createHmac, randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

export { randomUUID }

export function randomProfileId(): string {
  return `prof_${randomBytes(20).toString('hex')}`
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export function hashUserAgent(ua: string): string {
  return createHash('sha256').update(ua).digest('hex')
}

export function signHmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(signHmac(payload, secret), 'hex')
  const actual = Buffer.from(signature, 'hex')
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = scryptSync(password, salt, 64).toString('hex')
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'))
}

export function signJwt(payload: Record<string, unknown>, secret: string, expiresInSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const body = btoa(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds })).replace(/=/g, '')
  const sig = signHmac(`${header}.${body}`, secret)
    .match(/.{2}/g)!
    .map(h => String.fromCharCode(parseInt(h, 16)))
    .join('')
  const sigEncoded = btoa(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sigEncoded}`
}

export function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sigEncoded] = parts
  if (!header || !body || !sigEncoded) return null
  const expected = signHmac(`${header}.${body}`, secret)
  const sigBytes = atob(sigEncoded.replace(/-/g, '+').replace(/_/g, '/'))
  const actualHex = Array.from(sigBytes).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(actualHex, 'hex')
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) return null
  try {
    const payload = JSON.parse(atob(body)) as Record<string, unknown>
    const exp = payload['exp']
    if (typeof exp === 'number' && Date.now() / 1000 > exp) return null
    return payload
  } catch {
    return null
  }
}
