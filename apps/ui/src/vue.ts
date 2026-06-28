/**
 * Vue 3 composable integration for `@consenti/ui`.
 *
 * Import from the `@consenti/ui/vue` subpath to keep this module
 * tree-shaken out of vanilla JS or React bundles.
 *
 * Intended for **Nuxt 3** and any Vue 3 project where you manage the `ConsentiSetup`
 * instance yourself (typically in a `.client.ts` plugin) and want `useConsent()`
 * to be reactive in components.
 *
 * @example
 * ```ts
 * // plugins/consenti.client.ts (Nuxt 3)
 * import { ConsentiSetup } from '@consenti/ui'
 * import { setConsentiWidget } from '@consenti/ui/vue'
 *
 * export default defineNuxtPlugin(() => {
 *   const widget = new ConsentiSetup({ core: { profileId: 0 } })
 *   setConsentiWidget(widget)
 * })
 *
 * // Any component
 * import { useConsent } from '@consenti/ui/vue'
 *
 * const { hasConsent, submitConsent } = useConsent()
 * ```
 */

import { ref, onMounted, onUnmounted } from 'vue'
import type { ConsentValue } from './types'
import type { ConsentiSetup } from './core/consenti-setup'

/**
 * Module-level singleton — the active `ConsentiSetup` instance.
 * Using a module-level variable (rather than `provide`/`inject`) keeps the integration
 * zero-configuration: no wrapper component is required.
 */
let _widget: ConsentiSetup | null = null

/**
 * Registers the active `ConsentiSetup` instance so `useConsent()` can read from it.
 * Call this once after creating your widget, typically in a `.client.ts` Nuxt plugin.
 *
 * @param widget - The `ConsentiSetup` instance to register.
 */
export function setConsentiWidget(widget: ConsentiSetup): void {
  _widget = widget
}

/**
 * Vue 3 composable that exposes consent state and triggers reactivity on consent changes.
 *
 * Listens to `consenti:consentSubmitted` on `window` via `onMounted` / `onUnmounted`
 * and increments a `ref(tick)` counter. Reactive getters read `tick.value` to register
 * a Vue dependency so components re-render when consent changes.
 *
 * Returns SSR-safe fallback values during Nuxt server render.
 *
 * @returns An object with `hasConsent`, `getConsent`, `submitConsent`, and `getConsentDate`.
 */
export function useConsent() {
  const isServer = typeof window === 'undefined'

  const tick = ref(0)
  const handler = () => { tick.value++ }

  onMounted(() => {
    window.addEventListener('consenti:consentSubmitted', handler)
  })

  onUnmounted(() => {
    window.removeEventListener('consenti:consentSubmitted', handler)
  })

  if (isServer) {
    return {
      hasConsent: () => false as boolean,
      getConsent: () => null as ConsentValue | null,
      submitConsent: async (_consent: Partial<ConsentValue>) => {},
      getConsentDate: () => false as Date | false,
    }
  }

  return {
    /** Returns `true` if the visitor has saved consent. Reactive — re-evaluated on consent change. */
    hasConsent: () => {
      void tick.value // registers Vue dependency
      return _widget?.hasConsent() ?? false
    },
    /** Returns the stored consent map, or `null`. Reactive. */
    getConsent: () => {
      void tick.value
      return _widget?.getConsent() ?? null
    },
    /** Saves the given partial consent map. Missing keys default to `'denied'`. */
    submitConsent: (consent: Partial<ConsentValue>) =>
      _widget?.submitConsent(consent) ?? Promise.resolve(),
    /** Returns the `Date` of last consent submission, or `false`. Reactive. */
    getConsentDate: () => {
      void tick.value
      return _widget?.getConsentDate() ?? false
    },
  }
}
