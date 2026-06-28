/**
 * Global Privacy Control (GPC) detection and consent application.
 *
 * GPC is a browser-level privacy signal defined at https://globalprivacycontrol.org/.
 * When `navigator.globalPrivacyControl === true`, the user has indicated they do
 * not want their personal data sold or shared. CCPA and GDPR both recognise GPC
 * as a legally meaningful signal.
 *
 * Consenti supports three modes via `core.autoHonorGPC`:
 *  - `false`    → GPC signal ignored entirely (default)
 *  - `true`     → GPC-flagged cookies pre-denied; GPC banner shown (or main banner)
 *  - `'strict'` → GPC-flagged cookies pre-denied; consent written silently; no banner
 *
 * Only cookies with `listenGpc: true` on their `Cookie` config are affected.
 * Mandatory cookies are never denied regardless of GPC.
 */

import type { Cookie, ConsentValue } from '../types'
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
 * @param cookies        - The full cookie list from the resolved profile.
 * @param currentConsent - Existing partial consent to use as a base (typically `{}`).
 * @param mode           - The `autoHonorGPC` mode (`true` or `'strict'`). If falsy,
 *                         returns `currentConsent` unchanged.
 * @returns A new `ConsentValue` with GPC denials applied.
 */
export function applyGPCToConsent(
  cookies: Cookie[],
  currentConsent: Partial<ConsentValue>,
  mode: boolean | 'strict',
): ConsentValue {
  if (!mode || !detectGPC()) return { ...currentConsent } as ConsentValue

  const result: ConsentValue = { ...currentConsent } as ConsentValue

  for (const cookie of cookies) {
    if (cookie.mandatory) continue
    if (cookie.listenGpc) {
      // LI cookies use 'objected' as the refusal status per the GDPR Art. 21 framework
      result[cookie.id] = cookie.type === 'legitimate_interest' ? 'objected' : 'denied'
    }
  }

  // Mandatory cookies always win, regardless of GPC
  for (const cookie of cookies) {
    if (cookie.mandatory) result[cookie.id] = 'granted'
  }

  return result
}
