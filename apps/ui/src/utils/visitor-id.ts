/**
 * Dedicated visitor-id storage — a cookie/localStorage item, not a generic config blob.
 *
 * Consenti ever persists exactly two client-side items: the `consenti_data` consent record
 * (see `consent-store.ts`) and this one. There is no `consenti_config`/JSON-blob store — the
 * random suffix minted by `generatePrefixedId('visi')` (e.g. `visi_ab12...`) becomes the key
 * itself (`consenti_visi_ab12...`), so the id's own value never needs to be duplicated into a
 * stored value; presence of a `consenti_visi_*` key/cookie *is* the identity. Reading it back
 * means scanning for that prefix, the same idiom `migrateLegacyCookie()` already uses in
 * `consent-store.ts` for its own prefix-matched legacy-cookie lookup.
 *
 * Written only once a consent decision has actually happened (submit, GPC auto-response, or
 * relaying a decision made in another tab) — never eagerly on page load. Nothing is generated
 * or persisted for a visitor who hasn't decided yet.
 */

import type { CookieOptions } from '../types'
import { isClient } from './ssr'
import { generatePrefixedId } from './uuid'
import { ConsentStorage, type StorageMode } from './storage'

const KEY_PREFIX = 'consenti_'
const ID_PREFIX = 'visi_'

/** Two years, matching the durability visitor-id cookies conventionally get elsewhere (e.g. GA's `_ga`). */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2

function allStorageKeys(mode: StorageMode): string[] {
  if (!isClient()) return []
  if (mode === 'localStorage') {
    return typeof localStorage !== 'undefined' ? Object.keys(localStorage) : []
  }
  return document.cookie.split(';').map((c) => c.split('=')[0]?.trim() ?? '')
}

function findStoredVisitorId(mode: StorageMode): string | null {
  for (const key of allStorageKeys(mode)) {
    if (key.startsWith(KEY_PREFIX + ID_PREFIX)) return key.slice(KEY_PREFIX.length)
  }
  return null
}

/**
 * Returns the stored visitor ID for this browser, creating and persisting one if absent.
 *
 * @param mode          - `'cookie'` (default) or `'localStorage'` — should match `core.storage`.
 * @param cookieDomains  - Comma-separated domain list; first entry used as `Domain` (cookie mode only).
 */
export function getOrCreateVisitorId(mode: StorageMode = 'cookie', cookieDomains?: string): string {
  const existing = findStoredVisitorId(mode)
  if (existing) return existing

  const visitorId = generatePrefixedId('visi')
  const opts: CookieOptions = { path: '/', sameSite: 'Lax', maxAge: MAX_AGE_SECONDS }
  if (cookieDomains) {
    const domain = cookieDomains.split(',')[0]?.trim()
    if (domain) opts.domain = domain
  }
  new ConsentStorage(mode).write(`${KEY_PREFIX}${visitorId}`, '1', opts)
  return visitorId
}

/** Reads the stored visitor ID without creating one — `null` if no consent decision has
 * happened yet. For callers (like `getVisitor()`) that must never mint an identifier as a
 * side effect of merely being asked about it. */
export function peekVisitorId(mode: StorageMode = 'cookie'): string | null {
  return findStoredVisitorId(mode)
}
