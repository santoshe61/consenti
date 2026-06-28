/**
 * React integration for `@consenti/ui`.
 *
 * Import from the `@consenti/ui/react` subpath to keep this module
 * tree-shaken out of vanilla JS or Vue bundles.
 *
 * Intended for **Next.js** (App Router and Pages Router) and any other React 18+
 * project where you manage the `ConsentiSetup` instance yourself and want the
 * `useConsent()` hook to re-render when consent changes.
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
 *     const widget = new ConsentiSetup({ core: { profileId: 0 } })
 *     setConsentiWidget(widget)
 *   }, [])
 *   return <>{children}</>
 * }
 *
 * // Any component
 * import { useConsent } from '@consenti/ui/react'
 *
 * function CookieBanner() {
 *   const { hasConsent, submitConsent } = useConsent()
 *   if (hasConsent()) return null
 *   return <button onClick={() => submitConsent({ analytics: 'granted' })}>Accept</button>
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
 * React hook that exposes consent state and lets components react to consent changes.
 *
 * Subscribes to `consenti:consentSubmitted` on `window` and triggers a re-render
 * each time consent is updated. Returns SSR-safe fallback values during server render.
 *
 * @returns An object with `hasConsent`, `getConsent`, `submitConsent`, and `getConsentDate`.
 */
export function useConsent() {
  const isServer = typeof window === 'undefined'

  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!_widget) return
    const handler = () => forceUpdate((n) => n + 1)
    window.addEventListener('consenti:consentSubmitted', handler)
    return () => window.removeEventListener('consenti:consentSubmitted', handler)
  }, [])

  if (isServer) {
    return {
      hasConsent: () => false as boolean,
      getConsent: () => null as ConsentValue | null,
      submitConsent: async (_consent: Partial<ConsentValue>) => {},
      getConsentDate: () => false as Date | false,
    }
  }

  return {
    /** Returns `true` if the visitor has saved consent. */
    hasConsent: () => _widget?.hasConsent() ?? false,
    /** Returns the stored consent map, or `null`. */
    getConsent: () => _widget?.getConsent() ?? null,
    /** Saves the given partial consent map. Missing keys default to `'denied'`. */
    submitConsent: (consent: Partial<ConsentValue>) =>
      _widget?.submitConsent(consent) ?? Promise.resolve(),
    /** Returns the `Date` of last consent submission, or `false`. */
    getConsentDate: () => _widget?.getConsentDate() ?? false,
  }
}
