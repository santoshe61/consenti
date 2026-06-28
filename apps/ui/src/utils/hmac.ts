/**
 * HMAC-SHA256 signing utilities using the native Web Crypto API.
 *
 * Used to sign consent cookies so that tampering (e.g. a user manually editing
 * their cookie to fake a broader consent) is detectable on the next page load.
 * The signing key is sourced from the API profile response or from
 * `core.cookieSigningKey` in the widget config.
 *
 * All operations are async because `crypto.subtle` is Promise-based.
 * This module is tree-shaken out of bundles that do not use `core.signCookies`.
 */

/**
 * Imports a raw UTF-8 string key as a non-extractable `CryptoKey` for HMAC-SHA256.
 * The key is not extractable — it can only be used for sign/verify operations.
 */
async function importHmacKey(rawKey: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(rawKey)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/**
 * Signs a string value with HMAC-SHA256 and returns the lowercase hex-encoded signature.
 *
 * @param value - The plaintext string to sign (the raw cookie value without `::sig:` segment).
 * @param key   - The signing key as a UTF-8 string.
 * @returns     Lowercase hex string, e.g. `"a3f9c2e1b8d0..."`
 */
export async function signValue(value: string, key: string): Promise<string> {
  const cryptoKey = await importHmacKey(key)
  const data = new TextEncoder().encode(value)
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verifies a HMAC-SHA256 signature by re-computing the expected signature and comparing.
 *
 * Note: comparison is not constant-time, but this runs entirely client-side against
 * data the user already controls, so timing attacks offer no practical advantage.
 *
 * @param value     - The original plaintext string that was signed.
 * @param signature - The hex-encoded signature to verify.
 * @param key       - The signing key as a UTF-8 string.
 * @returns `true` if the signature matches, `false` otherwise.
 */
export async function verifyValue(value: string, signature: string, key: string): Promise<boolean> {
  const expected = await signValue(value, key)
  return expected === signature
}
