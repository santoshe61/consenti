/**
 * Consent cookie read/write operations.
 *
 * Cookie name format : `consenti_{userId}_{profileId}`
 * Cookie value format: `t:{epochSeconds}::{cookieId}:{status}|...`
 * Signed value format: `t:{epochSeconds}::{pairs}::sig:{hmac-hex}`
 *
 * The compact `t:{seconds}` timestamp replaces the previous ISO-8601 format to reduce
 * cookie size. Old `ConsentTimestamp:{ISO}` cookies are parsed transparently for
 * backwards compatibility.
 *
 * Visitor identity is derived from the consent cookie name (no separate `consenti_uid`
 * cookie is written). This avoids dropping identifiers before the user has given consent,
 * which is required by TTDSG §25 (Germany) and similar ePrivacy laws.
 *
 * The store supports both `document.cookie` and `localStorage` via `ConsentStorage`.
 * An in-memory cache avoids repeated cookie reads on the hot path (e.g. `hasConsent()`
 * called in render loops by the React/Vue hooks).
 */

import type { ConsentValue, ParsedConsent, CookieOptions, Cookie } from '../types'
import { ConsentStorage } from '../utils/storage'
import { logger } from '../utils/console'

export function resolveConsentMaxAge(cookies: Cookie[]): number {
  const minDays = cookies
    .map(c => c.expiry ?? 365)
    .reduce((min, d) => Math.min(min, d), 365)
  return minDays * 24 * 60 * 60
}

const COOKIE_NAME_PREFIX = 'consenti'

/**
 * Builds the full cookie name for a visitor + profile combination.
 *
 * @param userId    - UUID assigned to this visitor.
 * @param profileId - Numeric profile ID from `core.profileId`.
 */
export function buildConsentCookieName(userId: string, profileId: number): string {
  return `${COOKIE_NAME_PREFIX}_${userId}_${profileId}`
}

/**
 * Serialises a `ConsentValue` map into the compact cookie value string (without signature).
 *
 * @param consent - The consent map to serialise.
 * @returns A string in the form `t:{epochSeconds}::{id}:{status}|...`
 */
export function buildCookieValue(consent: ConsentValue): string {
  const epochSeconds = Math.floor(Date.now() / 1000)
  const pairs = Object.entries(consent)
    .map(([id, status]) => `${id}:${status}`)
    .join('|')
  return `t:${epochSeconds}::${pairs}`
}

/**
 * Parses a raw cookie string back into a `ParsedConsent` object.
 *
 * Handles both the current compact format (`t:{epochSeconds}`) and the legacy
 * ISO-8601 format (`ConsentTimestamp:{ISO}`) for backwards compatibility.
 *
 * Returns `null` if the value is malformed, missing required segments, or contains
 * an unrecognised consent status. Callers should treat `null` as "no valid consent".
 *
 * @param value - Raw string read from the cookie / localStorage.
 */
export function parseConsentCookie(value: string): ParsedConsent | null {
  const parts = value.split('::')
  if (parts.length < 2) return null

  const tsPart = parts[0] ?? ''
  let timestamp: string

  if (tsPart.startsWith('t:')) {
    // Compact format: t:{epochSeconds}
    const epochStr = tsPart.slice(2)
    const epoch = parseInt(epochStr, 10)
    if (!epochStr || isNaN(epoch)) return null
    timestamp = new Date(epoch * 1000).toISOString()
  } else if (tsPart.startsWith('ConsentTimestamp:')) {
    // Legacy ISO-8601 format
    timestamp = tsPart.replace('ConsentTimestamp:', '')
    if (!timestamp) return null
  } else {
    return null
  }

  const consentPart = parts[1] ?? ''
  const sigPart = parts[2]

  const consent: ConsentValue = {}
  for (const pair of consentPart.split('|')) {
    const colonIdx = pair.indexOf(':')
    if (colonIdx === -1) return null
    const id = pair.slice(0, colonIdx)
    const status = pair.slice(colonIdx + 1)
    if (!id || (status !== 'granted' && status !== 'denied' && status !== 'objected')) {
      return null
    }
    consent[id] = status
  }

  const result: ParsedConsent = { timestamp, consent }
  if (sigPart?.startsWith('sig:')) {
    result.signature = sigPart.slice(4)
  }

  return result
}

/**
 * Manages reading and writing the per-profile consent cookie for a single visitor.
 *
 * One `ConsentStore` instance is created per `ConsentiSetup` and lives for the
 * lifetime of the widget. An in-memory cache (`cachedConsent`, `cachedTimestamp`)
 * prevents repeat cookie reads on every call to `hasConsent()` / `getConsent()`.
 */
export class ConsentStore {
  private storage: ConsentStorage
  private cachedConsent: ConsentValue | null = null
  private cachedTimestamp: string | null = null
  private cookies: Cookie[] = []

  /**
   * @param userId        - Visitor UUID (from `consenti_uid` cookie).
   * @param profileId     - Numeric profile ID.
   * @param storageMode   - `'cookie'` (default, cross-subdomain) or `'localStorage'` (origin-scoped).
   * @param cookieDomains - Comma-separated domain list. First entry used as `Domain` attribute.
   */
  constructor(
    private userId: string,
    private profileId: number,
    storageMode: 'cookie' | 'localStorage',
    private cookieDomains?: string,
  ) {
    this.storage = new ConsentStorage(storageMode)
  }

  /** Set profile cookies so max-age can be derived from the shortest expiry. */
  setProfileCookies(cookies: Cookie[]): void {
    this.cookies = cookies
  }

  /** The full cookie / localStorage key for this visitor + profile combination. */
  get cookieName(): string {
    return buildConsentCookieName(this.userId, this.profileId)
  }

  /**
   * Reads and parses the stored consent record.
   * Updates the in-memory cache on success.
   *
   * @returns The parsed consent or `null` if absent / malformed.
   */
  read(): ParsedConsent | null {
    const raw = this.storage.read(this.cookieName)
    if (!raw) return null
    const parsed = parseConsentCookie(raw)
    if (parsed) {
      this.cachedConsent = parsed.consent
      this.cachedTimestamp = parsed.timestamp
    }
    return parsed
  }

  /**
   * Reads, parses, and cryptographically verifies the stored consent record.
   *
   * If the cookie has a `::sig:{hmac}` segment, the signature is verified against
   * the raw value using HMAC-SHA256. A mismatch means the cookie was tampered with —
   * the cookie is deleted and `null` is returned so the widget re-prompts for consent.
   *
   * If the cookie has no signature segment, it is treated as valid (backwards compatible
   * with cookies written before `signCookies` was enabled).
   *
   * @param signingKey - The HMAC key (from profile API response or `core.cookieSigningKey`).
   * @returns The parsed consent, or `null` if absent / malformed / signature invalid.
   */
  async readAndVerify(signingKey: string): Promise<ParsedConsent | null> {
    const raw = this.storage.read(this.cookieName)
    if (!raw) return null

    const parts = raw.split('::')
    if (parts.length < 2) return null

    const parsed = parseConsentCookie(raw)
    if (!parsed) return null

    const hasSig = parts.length === 3 && (parts[2] ?? '').startsWith('sig:')
    if (hasSig) {
      const { verifyValue } = await import('../utils/hmac')
      const valueToVerify = (parts[0] ?? '') + '::' + (parts[1] ?? '')
      const sig = (parts[2] ?? '').slice(4)
      const valid = await verifyValue(valueToVerify, sig, signingKey)
      if (!valid) {
        logger.warn('Cookie signature mismatch — consent cleared and banner will re-appear')
        this.delete()
        return null
      }
    }

    this.cachedConsent = parsed.consent
    this.cachedTimestamp = parsed.timestamp
    return parsed
  }

  /**
   * Writes a consent record to storage.
   *
   * @param consent   - The consent map to persist.
   * @param signature - Optional pre-computed HMAC hex string. Use `writeAndSign()` instead
   *                    if you need signing — it guarantees the signature covers the exact
   *                    value that gets written (timestamps match).
   */
  write(consent: ConsentValue, signature?: string): void {
    let value = buildCookieValue(consent)
    if (signature) {
      value = `${value}::sig:${signature}`
    }
    const opts = this.buildCookieOpts()
    this.storage.write(this.cookieName, value, opts)
    this.cachedConsent = consent
    this.cachedTimestamp = new Date().toISOString()
  }

  /**
   * Builds the cookie value, signs it with HMAC-SHA256 in a single atomic step,
   * and writes the signed value to storage.
   *
   * Using this instead of `write(consent, signature)` ensures the signature
   * covers exactly the value that is written — there is no timestamp drift
   * between building, signing, and writing.
   *
   * @param consent    - The consent map to persist.
   * @param signingKey - The HMAC key string.
   * @returns The hex-encoded signature, stored in `this.lastSignature` by the caller.
   */
  async writeAndSign(consent: ConsentValue, signingKey: string): Promise<string> {
    const { signValue } = await import('../utils/hmac')
    const rawValue = buildCookieValue(consent)
    const sig = await signValue(rawValue, signingKey)
    const finalValue = `${rawValue}::sig:${sig}`
    const opts = this.buildCookieOpts()
    this.storage.write(this.cookieName, finalValue, opts)
    this.cachedConsent = consent
    this.cachedTimestamp = new Date().toISOString()
    return sig
  }

  /** Removes the consent record from storage and clears the in-memory cache. */
  delete(): void {
    const opts = this.buildCookieOpts()
    this.storage.remove(this.cookieName, opts)
    this.cachedConsent = null
    this.cachedTimestamp = null
  }

  /** Returns `true` if a valid consent record exists (uses cache when available). */
  hasConsent(): boolean {
    if (this.cachedConsent) return true
    return this.read() !== null
  }

  /** Returns the stored consent map, or `null` if no consent has been given. */
  getConsent(): ConsentValue | null {
    if (this.cachedConsent) return this.cachedConsent
    return this.read()?.consent ?? null
  }

  /** Returns the `Date` of the last consent submission, or `false` if no consent exists. */
  getConsentDate(): Date | false {
    if (this.cachedTimestamp) return new Date(this.cachedTimestamp)
    const parsed = this.read()
    if (!parsed) return false
    return new Date(parsed.timestamp)
  }

  /**
   * Updates the in-memory cache without writing to storage.
   * Used by the cross-tab BroadcastChannel handler to keep other tabs in sync.
   */
  setInMemory(consent: ConsentValue): void {
    this.cachedConsent = consent
    this.cachedTimestamp = new Date().toISOString()
  }

  /** Clears the in-memory cache. Used when consent is deleted from another tab. */
  clearInMemory(): void {
    this.cachedConsent = null
    this.cachedTimestamp = null
  }

  /**
   * Derives the visitor UUID from an existing consent cookie, or generates a new one
   * in memory.
   *
   * No separate identifier cookie is written before consent. Storing a tracking
   * identifier before the user has given consent violates TTDSG §25 (Germany) and
   * equivalent ePrivacy laws in the EU. The UUID is embedded in the consent cookie
   * name and only persisted when consent is first saved (via `write()` / `writeAndSign()`).
   *
   * @param profileId   - The active profile ID, used to locate an existing consent cookie.
   * @param storageMode - The configured storage mode (`'cookie'` or `'localStorage'`).
   */
  static getOrCreateUserId(profileId: number, storageMode: 'cookie' | 'localStorage'): string {
    if (typeof document === 'undefined') return crypto.randomUUID()

    // Look for an existing consent cookie matching `consenti_*_{profileId}`.
    const prefix = `${COOKIE_NAME_PREFIX}_`
    const suffix = `_${profileId}`
    const all = storageMode === 'localStorage'
      ? ConsentStore._localStorageKeys()
      : ConsentStore._cookieNames()

    for (const name of all) {
      if (name.startsWith(prefix) && name.endsWith(suffix)) {
        const inner = name.slice(prefix.length, name.length - suffix.length)
        // Validate it looks like a UUID (8-4-4-4-12 hex groups).
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inner)) {
          return inner
        }
      }
    }

    return crypto.randomUUID()
  }

  /** Returns all document.cookie names. */
  private static _cookieNames(): string[] {
    return document.cookie.split(';').map((c) => c.split('=')[0]?.trim() ?? '')
  }

  /** Returns all localStorage keys (empty array when unavailable). */
  private static _localStorageKeys(): string[] {
    if (typeof localStorage === 'undefined') return []
    return Object.keys(localStorage)
  }

  private buildCookieOpts(): CookieOptions {
    const opts: CookieOptions = {
      path: '/',
      sameSite: 'Lax',
      maxAge: this.cookies.length > 0 ? resolveConsentMaxAge(this.cookies) : 365 * 24 * 60 * 60,
    }
    if (this.cookieDomains) {
      const domain = this.cookieDomains.split(',')[0]?.trim()
      if (domain) opts.domain = domain
    }
    return opts
  }
}
