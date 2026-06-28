/**
 * Low-level `document.cookie` read/write helpers.
 *
 * All functions are SSR-safe — they return early or return `null` when `isClient()`
 * is `false`. Consumers should prefer the `ConsentStorage` class which abstracts
 * over both cookies and `localStorage`.
 */

import type { CookieOptions } from '../types'
import { isClient } from './ssr'

/**
 * Reads a single cookie value by name.
 *
 * @param name - Cookie name (unencoded).
 * @returns The decoded cookie value, or `null` if the cookie is absent or SSR context.
 */
export function getCookie(name: string): string | null {
  if (!isClient()) return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`))
  return match ? decodeURIComponent(match[1] ?? '') : null
}

/**
 * Writes a cookie to `document.cookie`.
 *
 * The `Secure` flag is auto-detected from `window.location.protocol` when `opts.secure`
 * is not explicitly provided — cookies are set without `Secure` on `http://` to allow
 * local development without HTTPS.
 *
 * @param name  - Cookie name (unencoded).
 * @param value - Cookie value (unencoded — will be URI-encoded).
 * @param opts  - Optional cookie attributes.
 */
export function setCookie(name: string, value: string, opts: CookieOptions = {}): void {
  if (!isClient()) return
  const secure =
    opts.secure ??
    (typeof window !== 'undefined' &&
      typeof window.location !== 'undefined' &&
      window.location.protocol === 'https:')
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${opts.path ?? '/'}`,
    `SameSite=${opts.sameSite ?? 'Lax'}`,
    opts.maxAge != null ? `Max-Age=${opts.maxAge}` : '',
    secure ? 'Secure' : '',
    opts.domain ? `Domain=${opts.domain}` : '',
  ]
  document.cookie = parts.filter(Boolean).join('; ')
}

/**
 * Deletes a cookie by setting `Max-Age=0`.
 *
 * @param name - Cookie name (unencoded).
 * @param opts - Optional `path` and `domain` attributes — must match the original `setCookie` call.
 */
export function deleteCookie(name: string, opts: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  setCookie(name, '', { ...opts, maxAge: 0 })
}

/** Escapes special regex characters in a cookie name so it can be used in a `RegExp`. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
