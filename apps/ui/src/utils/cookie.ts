/**
 * Low-level `document.cookie` read/write helpers.
 *
 * All functions are SSR-safe — they return early or return `null` when `isClient()`
 * is `false`. Consumers should prefer the `ConsentStorage` class which abstracts
 * over both cookies and `localStorage`.
 */

import type { CookieOptions, ConsentCookieData, ConsentShortValue, ConsentValue } from '../types'
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

// ─── Consent codec ─────────────────────────────────────────────────────────────

function isConsentCookieData(obj: unknown): obj is ConsentCookieData {
  if (typeof obj !== 'object' || obj === null) return false
  const d = obj as Record<string, unknown>
  return (
    typeof d['s'] === 'string' &&
    typeof d['v'] === 'number' &&
    typeof d['i'] === 'string' &&
    typeof d['u'] === 'string' &&
    typeof d['t'] === 'number' &&
    (d['g'] === 0 || d['g'] === 1) &&
    typeof d['p'] === 'number' &&
    typeof d['c'] === 'object' && d['c'] !== null &&
    typeof d['l'] === 'string'
  )
}

/** Serialises a `ConsentCookieData` object to the cookie value string (JSON, no signature). */
export function encodeConsent(data: ConsentCookieData): string {
  return JSON.stringify(data)
}

/**
 * Parses a raw cookie string back into `ConsentCookieData`.
 *
 * Strips a `::sig:{hmac}` suffix if present before parsing. Returns `null` when the
 * JSON is missing required fields or the string is not valid JSON.
 */
export function decodeConsent(raw: string): ConsentCookieData | null {
  const sigIdx = raw.lastIndexOf('::sig:')
  const jsonStr = sigIdx !== -1 ? raw.slice(0, sigIdx) : raw
  try {
    const obj = JSON.parse(jsonStr) as unknown
    return isConsentCookieData(obj) ? obj : null
  } catch {
    return null
  }
}

/** Expands the compact short-key consent map to the full-word `ConsentValue` used by the public API. */
export function expandConsent(data: ConsentCookieData): ConsentValue {
  const result: ConsentValue = {}
  for (const [id, short] of Object.entries(data.c)) {
    if (short === 'g') result[id] = 'granted'
    else if (short === 'o') result[id] = 'objected'
    else result[id] = 'denied'
  }
  return result
}

/** Compresses a full-word `ConsentValue` map into the compact single-letter form for cookie storage. */
export function compressConsent(value: ConsentValue): Record<string, ConsentShortValue> {
  const result: Record<string, ConsentShortValue> = {}
  for (const [id, status] of Object.entries(value)) {
    if (status === 'granted') result[id] = 'g'
    else if (status === 'objected') result[id] = 'o'
    else result[id] = 'd'
  }
  return result
}
