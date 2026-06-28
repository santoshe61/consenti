/**
 * Test utilities for `@consenti/ui`.
 *
 * Import via the `/testing` subpath export so these helpers are never bundled
 * into production code:
 *
 * ```ts
 * import {
 *   createMockConsenti,
 *   mockConsent,
 *   simulateConsentSubmitted,
 * } from '@consenti/ui/testing'
 * ```
 *
 * The helpers work in any JavaScript environment that provides a DOM
 * (browsers, jsdom, happy-dom). They carry no runtime dependencies and
 * do not import any Consenti internals — safe to use in unit tests without
 * initialising the full widget.
 */

import type { ConsentValue } from './types'

// ─── Consent builders ─────────────────────────────────────────────────────────

/**
 * Builds a `ConsentValue` map from explicit grant/deny lists.
 *
 * @example
 * ```ts
 * const consent = mockConsent(
 *   ['analytics_storage'],            // granted
 *   ['ad_storage', 'ad_user_data'],   // denied
 * )
 * // → { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied' }
 * ```
 */
export function mockConsent(granted: string[] = [], denied: string[] = []): ConsentValue {
  const result: ConsentValue = {}
  for (const id of granted) result[id] = 'granted'
  for (const id of denied) result[id] = 'denied'
  return result
}

/**
 * Returns a `ConsentValue` with every listed cookie set to `'granted'`.
 * Shorthand for the common "user accepted everything" test scenario.
 */
export function mockAllGranted(cookieIds: string[]): ConsentValue {
  return mockConsent(cookieIds, [])
}

/**
 * Returns a `ConsentValue` with every listed cookie set to `'denied'`.
 * Shorthand for the common "user rejected everything" test scenario.
 */
export function mockAllDenied(cookieIds: string[]): ConsentValue {
  return mockConsent([], cookieIds)
}

// ─── Event simulators ─────────────────────────────────────────────────────────

/**
 * Dispatches `consenti:consentSubmitted` on `window` with the supplied consent
 * map. Use this to trigger code paths that listen to consent changes without
 * going through the full widget initialisation flow.
 */
export function simulateConsentSubmitted(consent: ConsentValue): void {
  window.dispatchEvent(
    new CustomEvent('consenti:consentSubmitted', { detail: { consent }, bubbles: true }),
  )
}

/**
 * Dispatches `consenti:bannerInitialized` on `window`.
 * Use this to simulate widget initialisation in tests that gate on the event.
 */
export function simulateBannerInitialized(hasExistingConsent = false): void {
  window.dispatchEvent(
    new CustomEvent('consenti:bannerInitialized', {
      detail: { hasExistingConsent },
      bubbles: true,
    }),
  )
}

/**
 * Dispatches `consenti:consentBeingSubmitted` on `window` before a simulated
 * consent submission. Use in tests that capture both events.
 */
export function simulateConsentBeingSubmitted(consent: ConsentValue): void {
  window.dispatchEvent(
    new CustomEvent('consenti:consentBeingSubmitted', { detail: { consent }, bubbles: true }),
  )
}

// ─── Mock widget ──────────────────────────────────────────────────────────────

/**
 * Shape returned by {@link createMockConsenti}.
 * Mirrors the public API of `ConsentiSetup` for use in unit tests.
 */
export interface MockConsentiSetup {
  hasConsent: () => boolean
  getConsent: () => ConsentValue | null
  getConsentDate: () => Date | false
  getGTMConsent: () => Record<string, string> | null
  submitConsent: (consent: Partial<ConsentValue>) => Promise<void>
  deleteConsent: () => Promise<void>
  showBanner: (useGpcVariant?: boolean) => void
  hideBanner: () => void
  showModal: () => void
  hideModal: () => void
  bannerVisibility: () => 'main' | 'gpc' | false
  modalVisibility: () => 'preference' | false
  onReady: (cb: () => void) => void
  readonly ready: Promise<void>
  destroy: () => void
  reConsent: () => Promise<void>
}

/**
 * Creates a minimal in-memory mock of `ConsentiSetup` for use in unit tests.
 *
 * All methods are no-ops or return sensible defaults. Pass an initial `consent`
 * map to simulate a returning visitor who has already given consent.
 *
 * The mock's `submitConsent` updates internal state and fires
 * `simulateConsentSubmitted` so event listeners in the component under test
 * are triggered exactly as in production.
 *
 * @example
 * ```ts
 * const widget = createMockConsenti(
 *   mockConsent(['analytics_storage'], ['ad_storage'])
 * )
 * expect(widget.hasConsent()).toBe(true)
 * expect(widget.getConsent()?.analytics_storage).toBe('granted')
 *
 * await widget.submitConsent({ ad_storage: 'granted' })
 * expect(widget.getConsent()?.ad_storage).toBe('granted')
 * ```
 */
export function createMockConsenti(consent: ConsentValue | null = null): MockConsentiSetup {
  let currentConsent = consent

  return {
    hasConsent: () => currentConsent !== null,
    getConsent: () => currentConsent,
    getConsentDate: () => (currentConsent !== null ? new Date() : false),
    getGTMConsent: () => null,

    submitConsent: async (partial: Partial<ConsentValue>) => {
      currentConsent = { ...(currentConsent ?? {}), ...partial } as ConsentValue
      simulateConsentSubmitted(currentConsent)
    },

    deleteConsent: async () => {
      currentConsent = null
    },

    showBanner: () => {},
    hideBanner: () => {},
    showModal: () => {},
    hideModal: () => {},
    bannerVisibility: () => false as const,
    modalVisibility: () => false as const,

    onReady: (cb: () => void) => cb(),
    ready: Promise.resolve(),

    destroy: () => {},

    reConsent: async () => {
      currentConsent = null
    },
  }
}
