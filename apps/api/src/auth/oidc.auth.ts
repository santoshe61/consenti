import { randomBytes, createHash } from 'node:crypto'
import type { OidcConfig } from '@consenti/types'

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(s: string): string {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
}

export interface PkceChallenge {
  verifier: string
  challenge: string
}

export function generatePkce(): PkceChallenge {
  const verifier = base64url(randomBytes(32))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

interface OidcEndpoints {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint?: string
  jwks_uri: string
}

export async function discoverOidcEndpoints(issuer: string): Promise<OidcEndpoints> {
  const res = await fetch(`${issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`OIDC discovery failed for ${issuer}: ${res.status}`)
  return res.json() as Promise<OidcEndpoints>
}

export function buildAuthorizationUrl(
  config: OidcConfig,
  authorizationEndpoint: string,
  state: string,
  nonce: string,
  codeChallenge: string,
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${authorizationEndpoint}?${params.toString()}`
}

interface TokenResponse {
  id_token: string
  access_token: string
  token_type: string
  expires_in?: number
}

export async function exchangeOidcCode(
  config: OidcConfig,
  tokenEndpoint: string,
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
    code_verifier: codeVerifier,
  })
  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OIDC token exchange failed: ${err}`)
  }
  return res.json() as Promise<TokenResponse>
}

export interface OidcClaims {
  sub: string
  email?: string
  name?: string
  [key: string]: unknown
}

export async function verifyOidcIdToken(idToken: string, jwksUri: string): Promise<OidcClaims> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid ID token format')

  const header = JSON.parse(base64urlDecode(parts[0]!)) as { kid?: string; alg?: string }
  const alg = header.alg ?? 'RS256'

  const res = await fetch(jwksUri, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`)
  type JwkEntry = JsonWebKey & { kid?: string; use?: string }
  const jwks = await res.json() as { keys: JwkEntry[] }

  const jwk: JwkEntry | undefined = header.kid
    ? jwks.keys.find(k => k.kid === header.kid)
    : (jwks.keys.find(k => k.use === 'sig') ?? jwks.keys[0])
  if (!jwk) throw new Error('No matching key in JWKS')

  let cryptoKey: CryptoKey
  if (alg === 'RS256' || alg === 'RS384' || alg === 'RS512') {
    const hashName = alg === 'RS256' ? 'SHA-256' : alg === 'RS384' ? 'SHA-384' : 'SHA-512'
    cryptoKey = await globalThis.crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: { name: hashName } }, false, ['verify'],
    )
  } else if (alg === 'ES256' || alg === 'ES384' || alg === 'ES512') {
    const namedCurve = alg === 'ES256' ? 'P-256' : alg === 'ES384' ? 'P-384' : 'P-521'
    cryptoKey = await globalThis.crypto.subtle.importKey(
      'jwk', jwk, { name: 'ECDSA', namedCurve }, false, ['verify'],
    )
  } else {
    throw new Error(`Unsupported OIDC token algorithm: ${alg}`)
  }

  const sigInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  const padding = (4 - (parts[2]!.length % 4)) % 4
  const sigB64 = parts[2]!.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding)
  const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))

  const verifyAlg = alg.startsWith('ES')
    ? { name: 'ECDSA', hash: { name: `SHA-${alg.slice(2)}` } }
    : { name: 'RSASSA-PKCS1-v1_5' }

  const valid = await globalThis.crypto.subtle.verify(verifyAlg, cryptoKey, sigBytes, sigInput)
  if (!valid) throw new Error('ID token signature verification failed')

  const payload = JSON.parse(base64urlDecode(parts[1]!)) as OidcClaims
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload['exp'] === 'number' && payload['exp'] < now) {
    throw new Error('ID token has expired')
  }

  return payload
}

export function extractEmailFromClaims(claims: OidcClaims, mapping?: { email?: string }): string {
  const key = mapping?.email ?? 'email'
  const value = claims[key]
  if (typeof value !== 'string') throw new Error('OIDC token missing email claim')
  return value
}

export function extractRolesFromClaims(
  claims: OidcClaims,
  mapping?: { roles?: string },
): string[] {
  const key = mapping?.roles ?? 'consenti_roles'
  const value = claims[key]
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

// In-memory PKCE/state store. Replace with Redis or DB for multi-instance deployments.
const pendingStates = new Map<string, { verifier: string; nonce: string; expiresAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of pendingStates) {
    if (val.expiresAt < now) pendingStates.delete(key)
  }
}, 5 * 60_000).unref()

export function storePkceState(state: string, verifier: string, nonce: string): void {
  pendingStates.set(state, { verifier, nonce, expiresAt: Date.now() + 10 * 60_000 })
}

export function consumePkceState(
  state: string,
): { verifier: string; nonce: string } | null {
  const entry = pendingStates.get(state)
  pendingStates.delete(state)
  if (!entry || entry.expiresAt < Date.now()) return null
  return { verifier: entry.verifier, nonce: entry.nonce }
}
