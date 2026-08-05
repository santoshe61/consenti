/**
 * Standalone resolver for the parental-consent hook (see `AgeGate`/`ConsentiSetup.resolveAgeGate`).
 * Not a `ConsentiSetup` instance method — the parent typically opens the token link (emailed by
 * the host's own eventBus listener, see `consenti:parentalConsentRequired`) on a fresh page or
 * even a different device, with no live widget instance around at all.
 */

import type { ParentalConsentGrantedDetail } from '../types'
import { httpRequest } from './http'
import { isClient } from './ssr'

export interface ParentalConsentApiConfig {
  baseUrl?: string
  authToken?: string
}

/**
 * POSTs a parental-consent token to `POST /consent/parental-consent-resolve`. On success,
 * dispatches `consenti:parentalConsentResolved` on `window` (same mechanism `EventBus.dispatch`
 * uses) so any page with a live widget instance can react — what "resolved" should actually do to
 * consent state is left to that listener, matching the "we provide the hook, not the behavior"
 * scope of this whole feature. Throws on an invalid/expired token or network failure.
 */
export async function resolveParentalConsent(
  token: string,
  apiConfig: ParentalConsentApiConfig = {},
): Promise<ParentalConsentGrantedDetail> {
  const base = apiConfig.baseUrl ?? (isClient() ? window.location.origin : '')
  const result = await httpRequest<ParentalConsentGrantedDetail>(
    `${base}/consenti/api/v1/consent/parental-consent-resolve`,
    { method: 'POST', body: JSON.stringify({ token }) },
    apiConfig.authToken,
  )

  if (isClient()) {
    window.dispatchEvent(new CustomEvent('consenti:parentalConsentResolved', { detail: result, bubbles: true }))
  }

  return result
}
