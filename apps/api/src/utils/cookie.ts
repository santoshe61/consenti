import { signHmac, verifyHmac } from './crypto'

// The widget's page origin is almost never the API's own origin (self-hosted CMP backend on
// a different domain), so this cookie has to survive a cross-site fetch. `SameSite=None`
// requires `Secure` per spec — browsers drop the cookie entirely otherwise — so it's only
// safe to use once we know the response is actually served over HTTPS (production). In dev,
// same-site-but-cross-port setups (e.g. a demo app + local API) still work fine under `Lax`,
// since `SameSite` scopes to the registrable domain, not the port.
function sameSiteAttrs(): string {
  return process.env['NODE_ENV'] === 'production' ? 'SameSite=None; Secure' : 'SameSite=Lax'
}

/**
 * Ownership cookie — proves the caller's browser is the same one that submitted a given
 * consent record, so cross-origin PUT/GET-verify/DELETE calls can be authorized without the
 * API ever seeing the widget's own `consenti_data` cookie (which is scoped to the site's
 * domain, not the API's — the browser never sends it cross-site).
 *
 * Deliberately carries no consent content, and the visitor ID appears only in the cookie
 * *name* (`consenti_{visitorId}`) — not repeated in the value. The value is just
 * `consentId.signature`, where the signature is computed over `visitorId.consentId` using a
 * server-only secret. The visitor ID is still cryptographically bound into that signature
 * (derived from the requested `:visitorId`, the same value the cookie name must match) —
 * only its plaintext echo inside the value is removed, so an attacker still can't rename one
 * visitor's cookie to another visitor's name and have it pass: the signature was computed
 * over the *original* visitorId and won't match the renamed one.
 */
function ownershipToken(visitorId: string, consentId: string, secret: string): string {
  const sig = signHmac(`${visitorId}.${consentId}`, secret)
  return `${consentId}.${sig}`
}

export function buildOwnershipSetCookie(visitorId: string, consentId: string, secret: string): string {
  const name = `consenti_${visitorId}`
  const value = ownershipToken(visitorId, consentId, secret)
  return `${name}=${value}; ${sameSiteAttrs()}; Path=/; Max-Age=31536000`
}

export function buildExpireOwnershipCookie(visitorId: string): string {
  const name = `consenti_${visitorId}`
  return `${name}=; ${sameSiteAttrs()}; Path=/; Max-Age=0`
}

/** Verifies a `consenti_{visitorId}` cookie value against the expected visitor and secret. */
export function verifyOwnershipToken(token: string, visitorId: string, secret: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [consentId, sig] = parts
  if (!consentId || !sig) return false
  return verifyHmac(`${visitorId}.${consentId}`, sig, secret)
}
