import { createHash, createHmac, randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

export { randomUUID }

// Prefixed resource IDs — the prefix identifies the resource type at a glance (in audit log
// resourceId values, error messages, support tickets), the same idea as Stripe/GitHub-style IDs.
//
// 16 base62 characters is ~95 bits of randomness — collisions only become a realistic risk
// (birthday bound) around 2^47 ≈ 140 trillion IDs of the *same type*, far beyond anything this
// project will ever generate, while staying shorter than a bare UUID (36 chars) once the 5-char
// prefix is added (21 chars total) — short enough to read out or paste into a support ticket.
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const ID_SUFFIX_LEN = 16

function randomBase62(length: number): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += BASE62[bytes[i]! % BASE62.length]
  return out
}

function prefixedId(prefix: string): string {
  return `${prefix}_${randomBase62(ID_SUFFIX_LEN)}`
}

export function randomProfileId(): string { return prefixedId('prof') }
export function randomVisitorId(): string { return prefixedId('visi') }
export function randomConsentId(): string { return prefixedId('cons') }
export function randomConsentTemplateId(): string { return prefixedId('ctem') }
export function randomUITemplateId(): string { return prefixedId('utem') }

// Zeroes the last octet of an IPv4 address or the last 80 bits of an IPv6 address (keeping only
// the first 48 bits / 3 hextets) before hashing — the same truncation GA4/Google Analytics use
// for "IP anonymization". Without this, hashing the raw IP is reversible by brute force: IPv4
// is only 4.2B addresses, cheap to enumerate against a known salt.
function maskIp(ip: string): string {
  if (ip.includes(':')) {
    const hextets = ip.split(':')
    while (hextets.length < 8) hextets.push('0')
    return hextets.slice(0, 3).concat(['0', '0', '0', '0', '0']).join(':')
  }
  const octets = ip.split('.')
  if (octets.length === 4) {
    octets[3] = '0'
    return octets.join('.')
  }
  return ip
}

// `salt` should be a per-deployment secret (`ComplianceConfig.dataSigningHash`) — masking alone still
// leaves a small, enumerable space (2^24 IPv4 addresses per masked value), so an unsalted hash
// is a rainbow-table lookup away from reversal. Empty salt (unset) still masks, which is strictly
// better than the previous raw-IP hash, but salting is what makes the hash actually irreversible.
export function hashIp(ip: string, salt = ''): string {
  return createHash('sha256').update(salt + maskIp(ip)).digest('hex')
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
