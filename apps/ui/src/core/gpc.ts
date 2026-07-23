/**
 * Global Privacy Control (GPC) detection and consent application.
 *
 * GPC is a browser-level privacy signal defined at https://globalprivacycontrol.org/.
 * When `navigator.globalPrivacyControl === true`, the user has indicated they do
 * not want their personal data sold or shared. CCPA and GDPR both recognise GPC
 * as a legally meaningful signal.
 *
 * Consenti supports three modes via `profile.gpcMode`:
 *  - `'ignore'` → GPC signal ignored entirely (default)
 *  - `'honor'` → GPC-flagged cookies pre-denied; GPC banner shown (or main banner)
 *  - `'strict'` → GPC-flagged cookies pre-denied; consent written silently; no banner
 *
 * Only cookies with `listenGpc: true` on their `Cookie` config are affected.
 * Mandatory cookies are never denied regardless of GPC.
 */

import type { CookieMap, CategoryMap, ConsentValue, GpcMode } from '../types'
import { buildCookieCategoryIndex, isMandatoryCookie, getCookieLegalBasis } from '@consenti/utils'
import { safeNavigator } from '../utils/ssr'

/**
 * Detects whether the Global Privacy Control signal is active in the current browser.
 *
 * Supported natively in Brave and via extensions in Firefox. The property is
 * intentionally not on the standard `Navigator` type yet, so we cast to check it.
 *
 * @returns `true` if `navigator.globalPrivacyControl === true`, `false` in all other cases
 *          including SSR environments where `navigator` is unavailable.
 */
export function detectGPC(): boolean {
  const nav = safeNavigator()
  if (!nav) return false
  return (
    'globalPrivacyControl' in nav &&
    (nav as Navigator & { globalPrivacyControl: boolean }).globalPrivacyControl === true
  )
}

/**
 * Applies the GPC signal to a partial consent object.
 *
 * For every cookie with `listenGpc: true` that is not mandatory:
 * - Consent-basis cookies → `'denied'`
 * - Legitimate-interest cookies (`type: 'legitimate_interest'`) → `'objected'`
 *
 * Mandatory cookies are always forced to `'granted'`.
 *
 * @param cookies        - The full cookie map from the resolved profile.
 * @param categories     - The category map from the resolved profile (`preferenceModal.categories`) — legal basis is derived from here.
 * @param currentConsent - Existing partial consent to use as a base (typically `{}`).
 * @param mode           - The `gpcMode` mode (`'honor'` or `'strict'`). If 'ignore',
 *                         returns `currentConsent` unchanged.
 * @returns A new `ConsentValue` with GPC denials applied.
 */
export function applyGPCToConsent(
  cookies: CookieMap,
  categories: CategoryMap,
  currentConsent: Partial<ConsentValue>,
  mode: GpcMode,
): ConsentValue {
  if (mode === 'ignore' || !detectGPC()) return { ...currentConsent } as ConsentValue

  const result: ConsentValue = { ...currentConsent } as ConsentValue
  const categoryIndex = buildCookieCategoryIndex(categories)

  for (const [cookieId, cookie] of Object.entries(cookies)) {
    if (isMandatoryCookie(cookieId, categoryIndex)) continue
    if (cookie.listenGpc) {
      // LI cookies use 'objected' as the refusal status per the GDPR Art. 21 framework
      result[cookieId] = getCookieLegalBasis(cookieId, categoryIndex) === 'legitimate_interest' ? 'objected' : 'denied'
    }
  }

  // Mandatory cookies always win, regardless of GPC
  for (const cookieId of Object.keys(cookies)) {
    if (isMandatoryCookie(cookieId, categoryIndex)) result[cookieId] = 'granted'
  }

  return result
}
