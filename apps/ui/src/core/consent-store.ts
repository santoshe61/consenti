/**
 * Consent cookie read/write operations.
 *
 * Cookie name : `consenti_data` (fixed single name)
 * Cookie value: compact JSON with single-letter keys — see `ConsentCookieData` in `@consenti/types`.
 *
 * Signing: when a `cookieSigningKey` is configured, the encoded JSON is signed with
 * HMAC-SHA256 and the hex signature is appended as `::sig:{hex}`. On read the signature
 * is stripped before JSON-parsing and verified independently.
 *
 * Migration: on first read after upgrading from v0.x, any legacy `consenti_{userId}_{profileId}`
 * cookie is detected, parsed, and transparently migrated to the new format. The old cookie is
 * then deleted. No consent data is lost.
 *
 * Visitor identity: the `i` field (per-submission UUID) in `ConsentCookieData` identifies a
 * specific consent record. No tracking identifier is written before the user gives consent
 * (TTDSG §25 / ePrivacy compliance).
 */

import type { ConsentValue, ParsedConsent, CookieOptions, ConsentCookieData } from '../types'
import { ConsentStorage } from '../utils/storage'
import { encodeConsent, decodeConsent, expandConsent, compressConsent } from '../utils/cookie'
import { logger } from '../utils/console'
import { generatePrefixedId } from '../utils/uuid'

/** Converts the profile-wide `expiryDays` into a cookie `maxAge` in seconds. */
export function resolveConsentMaxAge(expiryDays: number): number {
  return expiryDays * 24 * 60 * 60
}

/** Fixed cookie name for the compact consent format. */
export const CONSENT_COOKIE_NAME = 'consenti_data'

/**
 * Peeks at the locale recorded with an existing consent record, without needing a profile ID
 * (the cookie/localStorage key is fixed regardless of profile). Used to resolve a returning,
 * already-consented visitor's locale before the profile — and hence a full `ConsentStore`
 * instance — is known. Returns `null` if no consent exists or no locale was recorded.
 */
export function peekConsentLocale(storageMode: 'cookie' | 'localStorage' = 'cookie'): string | null {
  const storage = new ConsentStorage(storageMode)
  const raw = storage.read(CONSENT_COOKIE_NAME)
  if (!raw) return null
  return decodeConsent(raw)?.l || null
}

const LEGACY_PREFIX = 'consenti'

// ─── Legacy parser (migration only) ──────────────────────────────────────────

/** Parses the old `t:{epoch}::{pairs}` cookie value format. Used only during migration. */
function parseLegacyCookieValue(value: string): ParsedConsent | null {
  const parts = value.split('::')
  if (parts.length < 2) return null

  const tsPart = parts[0] ?? ''
  let timestamp: string

  if (tsPart.startsWith('t:')) {
    const epochStr = tsPart.slice(2)
    const epoch = parseInt(epochStr, 10)
    if (!epochStr || isNaN(epoch)) return null
    timestamp = new Date(epoch * 1000).toISOString()
  } else if (tsPart.startsWith('ConsentTimestamp:')) {
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
    if (!id || (status !== 'granted' && status !== 'denied' && status !== 'objected')) return null
    consent[id] = status
  }

  const result: ParsedConsent = { timestamp, consent }
  if (sigPart?.startsWith('sig:')) result.signature = sigPart.slice(4)
  return result
}

// ─── ConsentStore ─────────────────────────────────────────────────────────────

type WriteMeta = { source?: number; gpcDetected?: boolean; consentId?: string; locale?: string }

/**
 * Manages reading and writing the `consenti_data` consent cookie for a single visitor.
 *
 * One `ConsentStore` instance is created per `ConsentiSetup` and lives for the
 * lifetime of the widget. An in-memory cache (`cachedData`) prevents repeat cookie
 * reads on the hot path (e.g. `hasConsent()` called in render loops).
 */
export class ConsentStore {
  private storage: ConsentStorage
  private cachedData: ConsentCookieData | null = null
  private expiryDays = 365
  /** 0 = unknown (embedded/local profile with no server-side version counter). */
  private profileVersion = 0

  /**
   * @param profileId      - profile ID.
   * @param storageMode    - `'cookie'` (default) or `'localStorage'`.
   * @param cookieDomains  - Comma-separated domain list; first entry is used as `Domain` attribute.
   * @param appUserId      - Logged-in application user ID; empty string / undefined for anonymous.
   */
  constructor(
    private profileId: string,
    private storageMode: 'cookie' | 'localStorage',
    private cookieDomains?: string,
    private appUserId?: string,
  ) {
    this.storage = new ConsentStorage(storageMode)
  }

  /** Updates the profile-wide expiry (days) used to derive the consent cookie's max-age. */
  setProfileExpiry(expiryDays: number): void {
    this.expiryDays = expiryDays
  }

  /** Records which profile version this store is writing consent for (0 = unknown). */
  setProfileVersion(version: number): void {
    this.profileVersion = version
  }

  /** Returns `consenti_data` (the fixed cookie name used for all consent records). */
  get cookieName(): string {
    return CONSENT_COOKIE_NAME
  }

  /**
   * Reads and parses the stored consent record.
   *
   * If `consenti_data` is absent but a legacy `consenti_{userId}_{profileId}` cookie
   * exists for this profile, it is automatically migrated to the new format.
   *
   * Updates the in-memory cache on success.
   */
  read(): ParsedConsent | null {
    const raw = this.storage.read(CONSENT_COOKIE_NAME)
    if (raw) {
      const data = decodeConsent(raw)
      if (data) {
        this.cachedData = data
        return this.toParseConsent(data)
      }
    }

    const migrated = this.migrateLegacyCookie()
    if (migrated) {
      this.cachedData = migrated
      return this.toParseConsent(migrated)
    }

    return null
  }

  /**
   * Reads, parses, and cryptographically verifies the stored consent record.
   *
   * If the cookie value has a `::sig:{hmac}` suffix, the HMAC-SHA256 signature is verified
   * against the JSON body. A mismatch means tampering — the cookie is deleted and `null`
   * is returned so the widget re-prompts. Cookies without a signature are accepted as-is
   * (backwards compatible with cookies written before signing was enabled).
   *
   * @param signingKey - HMAC key (from profile API response or `core.cookieSigningKey`).
   */
  async readAndVerify(signingKey: string): Promise<ParsedConsent | null> {
    const raw = this.storage.read(CONSENT_COOKIE_NAME)
    if (!raw) {
      const migrated = this.migrateLegacyCookie()
      if (migrated) {
        this.cachedData = migrated
        return this.toParseConsent(migrated)
      }
      return null
    }

    const sigIdx = raw.lastIndexOf('::sig:')
    const jsonStr = sigIdx !== -1 ? raw.slice(0, sigIdx) : raw
    const sigStr = sigIdx !== -1 ? raw.slice(sigIdx + 6) : undefined

    const data = decodeConsent(raw)
    if (!data) return null

    if (sigStr) {
      const { verifyValue } = await import('../utils/hmac')
      const valid = await verifyValue(jsonStr, sigStr, signingKey)
      if (!valid) {
        logger.warn('Cookie signature mismatch — consent cleared and banner will re-appear')
        this.delete()
        return null
      }
    }

    this.cachedData = data
    const parsed = this.toParseConsent(data)
    return sigStr ? { ...parsed, signature: sigStr } : parsed
  }

  /**
   * Writes a consent record to storage.
   *
   * @param consent   - The consent map to persist.
   * @param meta      - Optional metadata: `source` (0=click, 1=widget method), `gpcDetected`, `consentId`.
   * @param signature - Optional pre-computed HMAC hex. Use `writeAndSign()` to sign atomically.
   */
  write(consent: ConsentValue, meta: WriteMeta = {}, signature?: string): void {
    const data = this.buildCookieData(consent, meta)
    let encoded = encodeConsent(data)
    if (signature) encoded = `${encoded}::sig:${signature}`
    this.storage.write(CONSENT_COOKIE_NAME, encoded, this.buildCookieOpts())
    this.cachedData = data
  }

  /**
   * Builds the cookie value, signs it with HMAC-SHA256, and writes it atomically.
   *
   * Using this instead of `write(consent, meta, signature)` ensures the signature covers
   * exactly the value that is written (no timestamp drift between building and signing).
   *
   * @param consent    - The consent map to persist.
   * @param signingKey - HMAC key string.
   * @param meta       - Optional metadata (same as `write()`).
   * @returns The hex-encoded signature.
   */
  async writeAndSign(consent: ConsentValue, signingKey: string, meta: WriteMeta = {}): Promise<string> {
    const { signValue } = await import('../utils/hmac')
    const data = this.buildCookieData(consent, meta)
    const encoded = encodeConsent(data)
    const sig = await signValue(encoded, signingKey)
    this.storage.write(CONSENT_COOKIE_NAME, `${encoded}::sig:${sig}`, this.buildCookieOpts())
    this.cachedData = data
    return sig
  }

  /** Removes the consent record from storage and clears the in-memory cache. */
  delete(): void {
    const opts = this.buildCookieOpts()
    this.storage.remove(CONSENT_COOKIE_NAME, opts)
    this.deleteLegacyCookies()
    this.cachedData = null
  }

  /** Returns `true` if a valid consent record exists (uses cache when available). */
  hasConsent(): boolean {
    if (this.cachedData) return true
    return this.read() !== null
  }

  /** Returns the stored consent map, or `null` if no consent has been given. */
  getConsent(): ConsentValue | null {
    if (this.cachedData) return expandConsent(this.cachedData)
    return this.read()?.consent ?? null
  }

  /** Returns the `Date` of the last consent submission, or `false` if no consent exists. */
  getConsentDate(): Date | false {
    if (this.cachedData) return new Date(this.cachedData.t * 1000)
    const parsed = this.read()
    if (!parsed) return false
    return new Date(parsed.timestamp)
  }

  /** Returns the per-submission consent UUID (`i` field), or `null` if no consent exists. */
  getConsentId(): string | null {
    if (this.cachedData) return this.cachedData.i
    const raw = this.storage.read(CONSENT_COOKIE_NAME)
    if (!raw) return null
    return decodeConsent(raw)?.i ?? null
  }

  /** Returns the locale recorded with the stored consent (`l` field), or `null` if unset/no consent exists. */
  getConsentLocale(): string | null {
    if (this.cachedData) return this.cachedData.l || null
    const raw = this.storage.read(CONSENT_COOKIE_NAME)
    if (!raw) return null
    return decodeConsent(raw)?.l || null
  }

  /**
   * Updates the in-memory cache without writing to storage.
   * Used by the cross-tab BroadcastChannel handler to keep other tabs in sync.
   */
  setInMemory(consent: ConsentValue): void {
    this.cachedData = {
      s: this.profileId,
      v: this.profileVersion,
      i: this.cachedData?.i ?? generatePrefixedId('cons'),
      t: Math.round(Date.now() / 1000),
      u: this.appUserId ?? '',
      g: 0,
      p: 0,
      c: compressConsent(consent),
      l: this.cachedData?.l ?? '',
    }
  }

  /** Clears the in-memory cache. Used when consent is deleted from another tab. */
  clearInMemory(): void {
    this.cachedData = null
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private toParseConsent(data: ConsentCookieData): ParsedConsent {
    return {
      timestamp: new Date(data.t * 1000).toISOString(),
      consent: expandConsent(data),
    }
  }

  private buildCookieData(consent: ConsentValue, meta: WriteMeta = {}): ConsentCookieData {
    return {
      s: this.profileId,
      v: this.profileVersion,
      i: meta.consentId ?? generatePrefixedId('cons'),
      t: Math.round(Date.now() / 1000),
      u: this.appUserId ?? '',
      g: meta.gpcDetected ? 1 : 0,
      p: meta.source ?? 0,
      c: compressConsent(consent),
      l: meta.locale ?? '',
    }
  }

  private migrateLegacyCookie(): ConsentCookieData | null {
    if (typeof document === 'undefined') return null

    const suffix = `_${this.profileId}`
    const allNames: string[] = this.storageMode === 'localStorage'
      ? (typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [])
      : document.cookie.split(';').map(c => c.split('=')[0]?.trim() ?? '')

    for (const name of allNames) {
      if (!name.startsWith(`${LEGACY_PREFIX}_`) || !name.endsWith(suffix)) continue

      const raw = this.storage.read(name)
      if (!raw) continue
      const parsed = parseLegacyCookieValue(raw)
      if (!parsed) continue

      const inner = name.slice(LEGACY_PREFIX.length + 1, name.length - suffix.length)
      const legacyUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inner)
        ? inner : ''

      const data: ConsentCookieData = {
        s: this.profileId,
        v: 0, // legacy cookie predates the version counter — genuinely unknown
        i: generatePrefixedId('cons'),
        t: Math.round(new Date(parsed.timestamp).getTime() / 1000),
        u: legacyUserId,
        g: 0,
        p: 0,
        c: compressConsent(parsed.consent),
        l: '', // legacy format predates locale tracking — genuinely unknown
      }

      this.storage.write(CONSENT_COOKIE_NAME, encodeConsent(data), this.buildCookieOpts())
      this.storage.remove(name, this.buildCookieOpts())
      logger.info(`Migrated consent cookie from "${name}" to "${CONSENT_COOKIE_NAME}"`)
      return data
    }
    return null
  }

  private deleteLegacyCookies(): void {
    if (typeof document === 'undefined' || this.storageMode === 'localStorage') return
    const suffix = `_${this.profileId}`
    const opts = this.buildCookieOpts()
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0]?.trim() ?? ''
      if (name.startsWith(`${LEGACY_PREFIX}_`) && name.endsWith(suffix)) {
        this.storage.remove(name, opts)
      }
    }
  }

  private buildCookieOpts(): CookieOptions {
    const opts: CookieOptions = {
      path: '/',
      sameSite: 'Lax',
      maxAge: resolveConsentMaxAge(this.expiryDays),
    }
    if (this.cookieDomains) {
      const domain = this.cookieDomains.split(',')[0]?.trim()
      if (domain) opts.domain = domain
    }
    return opts
  }
}
