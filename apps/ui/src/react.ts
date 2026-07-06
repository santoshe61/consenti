/**
 * React integration for `@consenti/ui`.
 *
 * Import from the `@consenti/ui/react` subpath to keep this module
 * tree-shaken out of vanilla JS or Vue bundles.
 *
 * Intended for **Next.js** (App Router and Pages Router) and any other React 18+
 * project where you manage the `ConsentiSetup` instance yourself and want the
 * `useConsent()` hook to re-render when consent or UI state changes.
 *
 * @example
 * ```tsx
 * // app/providers.tsx (Next.js App Router)
 * 'use client'
 * import { useEffect } from 'react'
 * import { ConsentiSetup } from '@consenti/ui'
 * import { setConsentiWidget } from '@consenti/ui/react'
 *
 * export function ConsentiProvider({ children }: { children: React.ReactNode }) {
 *   useEffect(() => {
 *     const widget = new ConsentiSetup({
 *       api: { enabled: true, baseUrl: process.env.NEXT_PUBLIC_API_URL },
 *     })
 *     setConsentiWidget(widget)
 *   }, [])
 *   return <>{children}</>
 * }
 *
 * // Any component
 * import { useConsent } from '@consenti/ui/react'
 *
 * function CookieStatus() {
 *   const { hasConsent, consent, showModal } = useConsent()
 *   if (!hasConsent) return <button onClick={showModal}>Manage Cookies</button>
 *   return <span>{consent?.analytics === 'granted' ? 'Analytics on' : 'Analytics off'}</span>
 * }
 * ```
 */

import { useState, useEffect } from 'react'
import type { ConsentValue } from './types'
import type { ConsentiSetup } from './core/consenti-setup'

/**
 * Module-level singleton — the active `ConsentiSetup` instance.
 * Using a module-level variable (rather than React context) keeps the integration
 * zero-configuration: no `<ConsentiProvider>` wrapper is required.
 */
let _widget: ConsentiSetup | null = null

/**
 * Registers the active `ConsentiSetup` instance so `useConsent()` can read from it.
 * Call this once after creating your widget, typically inside a `useEffect`.
 *
 * @param widget - The `ConsentiSetup` instance to register.
 */
export function setConsentiWidget(widget: ConsentiSetup): void {
  _widget = widget
}

/**
 * React hook that exposes consent state, banner/modal visibility, and widget actions.
 *
 * Subscribes to `consenti:consentSubmitted`, `consenti:bannerVisibility`, and
 * `consenti:modalVisibility` on `window` and triggers re-renders on each event.
 * Returns SSR-safe initial values during server render.
 *
 * Destructure only what you need — unused values do not cause extra renders.
 *
 * @returns Consent state values and widget action functions.
 */
export function useConsent() {
  const isServer = typeof window === 'undefined'

  const [hasConsent, setHasConsent] = useState<boolean>(() =>
    !isServer ? (_widget?.hasConsent() ?? false) : false,
  )
  const [consent, setConsent] = useState<ConsentValue | null>(() =>
    !isServer ? (_widget?.getConsent() ?? null) : null,
  )
  const [consentDate, setConsentDate] = useState<Date | false>(() =>
    !isServer ? (_widget?.getConsentDate() ?? false) : false,
  )
  const [bannerVisible, setBannerVisible] = useState<'main' | 'gpc' | false>(false)
  const [modalVisible, setModalVisible] = useState<'preference' | false>(false)

  useEffect(() => {
    if (!_widget) return

    const onConsent = () => {
      setHasConsent(_widget?.hasConsent() ?? false)
      setConsent(_widget?.getConsent() ?? null)
      setConsentDate(_widget?.getConsentDate() ?? false)
    }
    const onBanner = () => setBannerVisible(_widget?.bannerVisibility() ?? false)
    const onModal  = () => setModalVisible(_widget?.modalVisibility() ?? false)

    window.addEventListener('consenti:consentSubmitted', onConsent)
    window.addEventListener('consenti:bannerVisibility',  onBanner)
    window.addEventListener('consenti:modalVisibility',   onModal)

    return () => {
      window.removeEventListener('consenti:consentSubmitted', onConsent)
      window.removeEventListener('consenti:bannerVisibility',  onBanner)
      window.removeEventListener('consenti:modalVisibility',   onModal)
    }
  }, [])

  // ── SSR-safe fallback ──────────────────────────────────────────────────────
  if (isServer) {
    return {
      hasConsent:   false as boolean,
      consent:      null  as ConsentValue | null,
      consentDate:  false as Date | false,
      bannerVisible: false as 'main' | 'gpc' | false,
      modalVisible:  false as 'preference' | false,
      showBanner:   (_gpc?: boolean) => {},
      hideBanner:   () => {},
      showModal:    () => {},
      hideModal:    () => {},
      grantAll:     (_onlyMandatory?: boolean) => Promise.resolve(),
      denyAll:      (_includingMandatory?: boolean) => Promise.resolve(),
      submitConsent: (_c: Partial<ConsentValue>) => Promise.resolve(),
      reConsent:    () => Promise.resolve(),
      isCookieGranted:   (_id: string) => false as boolean,
      isCategoryGranted: (_id: string) => false as boolean,
      switchLocale: (_locale: string) => {},
    }
  }

  // ── Client ────────────────────────────────────────────────────────────────
  return {
    /** `true` if the visitor has saved a valid consent record. */
    hasConsent,
    /** The stored consent map (`Record<cookieId, status>`), or `null` before first submission. */
    consent,
    /** `Date` of the last consent submission, or `false` if no consent exists. */
    consentDate,
    /** Current banner state: `'main'`, `'gpc'`, or `false` (hidden). */
    bannerVisible,
    /** Current modal state: `'preference'` or `false` (hidden). */
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
