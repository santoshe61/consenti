/**
 * Single localStorage-backed store for widget-managed, non-consent client state — one JSON
 * key (`consenti_config`) instead of a separate key per field, so future additions don't
 * mean yet another top-level localStorage key.
 *
 * Currently holds:
 * - `visitorId` — stable per-browser identifier, written only once a consent decision has
 *                 actually happened; see `getOrCreateVisitorId()` below for details
 *
 * Locale is deliberately NOT stored here — it lives in widget memory for the current page
 * session only (resets to the configured default on refresh) until a consent decision exists,
 * at which point it's persisted as the `l` field of the consent record itself. See
 * `peekConsentLocale()` / `getConsentLocale()` in `consent-store.ts`.
 */

import { isClient } from './ssr'
import { generatePrefixedId } from './uuid'

const STORAGE_KEY = 'consenti_config'

interface LocalConfig {
  visitorId?: string
}

function readConfig(): LocalConfig {
  if (!isClient()) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LocalConfig) : {}
  } catch {
    return {}
  }
}

function writeConfig(config: LocalConfig): void {
  if (!isClient()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage unavailable (privacy mode, quota, disabled) — best effort only.
  }
}

/**
 * Persistent visitor identity, scoped to when it's actually created.
 *
 * Callers only invoke this from the consent-decision path (submit, GPC auto-response, or
 * relaying a decision made in another tab) — never eagerly on page load. So while the ID
 * itself is a stable random UUID that survives page loads/tabs/sessions once it exists,
 * nothing is generated or written to storage for a visitor who hasn't decided yet.
 *
 * Returns the stored visitor ID for this browser, creating and persisting one if absent.
 */
export function getOrCreateVisitorId(): string {
  const config = readConfig()
  if (config.visitorId) return config.visitorId
  const visitorId = generatePrefixedId('visi')
  writeConfig({ ...config, visitorId })
  return visitorId
}
