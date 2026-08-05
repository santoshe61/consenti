import { signHmac, verifyHmac } from './crypto'

/**
 * Stateless, signed (when a key is configured) parental-consent token — carries
 * `visitorId`/`profileId`/`issuedAt` so `POST /consent/parental-consent-resolve` can recover them
 * without a URL param or any server-side persistence. Mirrors the `consenti_{visitorId}`
 * ownership-cookie pattern in `cookie.ts` (HMAC over the payload with a server-only secret), but
 * as a portable bearer token rather than a cookie, since this one is meant to be emailed to a
 * parent on a different device/browser with no cookie jar in common with the child's session.
 *
 * Signed with `compliance.dataSigningHash` — the same key that signs stored consent records —
 * not the admin JWT secret: this token ends up distributed through a third-party channel (email)
 * to someone outside the admin surface entirely, so it shouldn't share a key with admin session
 * auth. `dataSigningHash` is auto-generated when unset (see `index.ts`), so in practice a token is
 * always signed — but with an ephemeral, unpersisted key unless `dataSigningHash` is set
 * explicitly, meaning a server restart between issuing and resolving a token invalidates it. The
 * unsigned code path below only fires if this function is ever called directly with no key.
 */

const TOKEN_PREFIX = 'pcon_'

interface TokenPayload {
  visitorId: string
  profileId: string
  issuedAt: number
}

function encodePayload(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodePayload(encoded: string): TokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<TokenPayload>
    if (typeof parsed.visitorId !== 'string' || typeof parsed.profileId !== 'string' || typeof parsed.issuedAt !== 'number') return null
    return { visitorId: parsed.visitorId, profileId: parsed.profileId, issuedAt: parsed.issuedAt }
  } catch {
    return null
  }
}

/** Issues a token. Unsigned (no trailing `.signature`) when `signingKey` is unset. */
export function buildParentalConsentToken(visitorId: string, profileId: string, signingKey?: string): string {
  const payload: TokenPayload = { visitorId, profileId, issuedAt: Math.round(Date.now() / 1000) }
  const encoded = encodePayload(payload)
  if (!signingKey) return `${TOKEN_PREFIX}${encoded}`
  const sig = signHmac(encoded, signingKey)
  return `${TOKEN_PREFIX}${encoded}.${sig}`
}

export type ParentalConsentTokenResult =
  | { valid: true; visitorId: string; profileId: string }
  | { valid: false; reason: 'malformed' | 'invalid_signature' | 'expired' }

/**
 * Verifies a token and recovers its payload. If `signingKey` is unset, accepts the token at face
 * value (decode only, no signature check possible) — consistent with issuing it unsigned in the
 * first place. `ttlDays` is only enforced when the token carries the format this module issues
 * (always does); a 0/negative `ttlDays` disables expiry checking.
 */
export function verifyParentalConsentToken(
  token: string,
  signingKey: string | undefined,
  ttlDays: number,
): ParentalConsentTokenResult {
  if (!token.startsWith(TOKEN_PREFIX)) return { valid: false, reason: 'malformed' }
  const rest = token.slice(TOKEN_PREFIX.length)
  const dotIdx = rest.indexOf('.')
  const encoded = dotIdx === -1 ? rest : rest.slice(0, dotIdx)
  const sig = dotIdx === -1 ? undefined : rest.slice(dotIdx + 1)

  if (signingKey) {
    if (!sig || !verifyHmac(encoded, sig, signingKey)) return { valid: false, reason: 'invalid_signature' }
  }

  const payload = decodePayload(encoded)
  if (!payload) return { valid: false, reason: 'malformed' }

  if (ttlDays > 0) {
    const ageSeconds = Math.round(Date.now() / 1000) - payload.issuedAt
    if (ageSeconds > ttlDays * 24 * 60 * 60) return { valid: false, reason: 'expired' }
  }

  return { valid: true, visitorId: payload.visitorId, profileId: payload.profileId }
}
