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
 *   const widget = new ConsentiSetup({
 *     api: { enabled: true, baseUrl: useRuntimeConfig().public.apiUrl },
 *   })
 *   setConsentiWidget(widget)
 * })
 *
 * // Any component
 * import { useConsent } from '@consenti/ui/vue'
 *
 * const { hasConsent, consent, showModal } = useConsent()
 * // hasConsent, consent, bannerVisible, modalVisible are Refs — reactive in templates
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
 * Vue 3 composable that exposes consent state, banner/modal visibility, and widget actions.
 *
 * State values (`hasConsent`, `consent`, `consentDate`, `bannerVisible`, `modalVisible`) are
 * Vue `Ref`s — they are reactive in templates and `watch`/`computed` without calling `.value`
 * in the template (Vue auto-unwraps top-level refs).
 *
 * Event listeners are registered in `onMounted` and removed in `onUnmounted`, so this
 * composable is safe to call in components that render on the server (Nuxt SSR): the refs
 * simply hold their initial values (`false` / `null`) during SSR and hydrate correctly.
 *
 * @returns Reactive refs for consent state and plain functions for widget actions.
 */
export function useConsent() {
  const hasConsent   = ref<boolean>(_widget?.hasConsent() ?? false)
  const consent      = ref<ConsentValue | null>(_widget?.getConsent() ?? null)
  const consentDate  = ref<Date | false>(_widget?.getConsentDate() ?? false)
  const bannerVisible = ref<'main' | 'gpc' | false>(false)
  const modalVisible  = ref<'preference' | false>(false)

  const onConsent = () => {
    hasConsent.value  = _widget?.hasConsent() ?? false
    consent.value     = _widget?.getConsent() ?? null
    consentDate.value = _widget?.getConsentDate() ?? false
  }
  const onBanner = () => { bannerVisible.value = _widget?.bannerVisibility() ?? false }
  const onModal  = () => { modalVisible.value  = _widget?.modalVisibility() ?? false }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('consenti:consentSubmitted', onConsent)
    window.addEventListener('consenti:bannerVisibility',  onBanner)
    window.addEventListener('consenti:modalVisibility',   onModal)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('consenti:consentSubmitted', onConsent)
    window.removeEventListener('consenti:bannerVisibility',  onBanner)
    window.removeEventListener('consenti:modalVisibility',   onModal)
  })

  return {
    /** Reactive — `true` once the visitor has saved a valid consent record. */
    hasConsent,
    /** Reactive — the stored consent map (`Record<cookieId, status>`), or `null`. */
    consent,
    /** Reactive — `Date` of the last consent submission, or `false`. */
    consentDate,
    /** Reactive — `'main'`, `'gpc'`, or `false` (banner hidden). */
    bannerVisible,
    /** Reactive — `'preference'` or `false` (modal hidden). */
    modalVisible,

    /** Shows the consent banner. Pass `true` to force the GPC variant. */
    showBanner: (gpc?: boolean) => _widget?.showBanner(gpc),
    /** Hides the consent banner. */
    hideBanner: () => _widget?.hideBanner(),
    /** Opens the preference modal. */
    showModal: () => _widget?.showModal(),
    /** Closes the preference modal. */
    hideModal: () => _widget?.hideModal(),

    /** Grants all non-mandatory cookies. Pass `true` to grant only mandatory ones and deny the rest. */
    grantAll: (onlyMandatory?: boolean) => _widget?.grantAll(onlyMandatory) ?? Promise.resolve(),
    /** Denies all non-mandatory cookies. Pass `true` to deny mandatory ones too (use with care). */
    denyAll: (includingMandatory?: boolean) => _widget?.denyAll(includingMandatory) ?? Promise.resolve(),
    /** Saves the given partial consent map. */
    submitConsent: (c: Partial<ConsentValue>) => _widget?.submitConsent(c) ?? Promise.resolve(),
    /** Deletes the current consent record and re-shows the banner. */
    reConsent: () => _widget?.reConsent() ?? Promise.resolve(),

    /** Returns `true` if the given cookie ID is `'granted'`. */
    isCookieGranted: (id: string) => (_widget?.isCookieGranted(id) ?? false) as boolean,
    /** Returns `true` if every cookie in the given category is `'granted'`. */
    isCategoryGranted: (id: string) => (_widget?.isCategoryGranted(id) ?? false) as boolean,
    /** Switches the active locale and re-renders the banner and modal. */
    switchLocale: (locale: string) => _widget?.switchLocale(locale),
  }
}
