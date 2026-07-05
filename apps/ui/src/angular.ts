/**
 * Angular integration for `@consenti/ui`.
 *
 * Import from the `@consenti/ui/angular` subpath to keep this module
 * tree-shaken out of vanilla JS, React, and Vue bundles.
 *
 * Designed for **Angular 15+** with standalone components or NgModule-based projects.
 * Initialise `ConsentiSetup` once (typically in `app.component.ts` or a root service)
 * and call `setConsentiWidget()` so that `injectConsent()` can read from it in any
 * component or service.
 *
 * @example
 * ```ts
 * // app.component.ts
 * import { Component, OnInit, OnDestroy } from '@angular/core'
 * import { ConsentiSetup } from '@consenti/ui'
 * import { setConsentiWidget } from '@consenti/ui/angular'
 *
 * @Component({ selector: 'app-root', template: '<router-outlet />' })
 * export class AppComponent implements OnInit, OnDestroy {
 *   private widget!: ConsentiSetup
 *
 *   ngOnInit() {
 *     this.widget = new ConsentiSetup({
 *       api: { enabled: true, baseUrl: environment.apiUrl },
 *     })
 *     setConsentiWidget(this.widget)
 *   }
 *
 *   ngOnDestroy() { this.widget.destroy() }
 * }
 *
 * // any-component.ts
 * import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core'
 * import { injectConsent } from '@consenti/ui/angular'
 *
 * @Component({
 *   selector: 'app-cookie-status',
 *   template: `
 *     <p *ngIf="consent.hasConsent()">Consent given on {{ consent.getConsentDate() | date }}</p>
 *     <button *ngIf="!consent.hasConsent()" (click)="consent.showModal()">Manage Cookies</button>
 *   `,
 * })
 * export class CookieStatusComponent implements OnInit, OnDestroy {
 *   consent = injectConsent()
 *   private unsub!: () => void
 *
 *   constructor(private cdr: ChangeDetectorRef) {}
 *
 *   ngOnInit() {
 *     this.unsub = this.consent.onConsentChange(() => this.cdr.markForCheck())
 *   }
 *
 *   ngOnDestroy() { this.unsub() }
 * }
 * ```
 */

import type { ConsentValue } from './types'
import type { ConsentiSetup } from './core/consenti-setup'

/**
 * Module-level singleton — the active `ConsentiSetup` instance.
 * Using a module-level variable keeps the integration zero-configuration:
 * no Angular injection token or `forRoot()` call is required.
 */
let _widget: ConsentiSetup | null = null

/**
 * Registers the active `ConsentiSetup` instance so `injectConsent()` can read from it.
 * Call this once after creating your widget, typically in `AppComponent.ngOnInit()` or
 * a root-level Angular service.
 *
 * @param widget - The `ConsentiSetup` instance to register.
 */
export function setConsentiWidget(widget: ConsentiSetup): void {
  _widget = widget
}

/**
 * Returns a consent accessor object for use in Angular components and services.
 *
 * Unlike the React and Vue integrations, Angular uses its `ChangeDetectorRef` to
 * trigger UI updates rather than a reactive primitive. Use the `onConsentChange`,
 * `onBannerChange`, and `onModalChange` helpers in `ngOnInit` to subscribe and
 * call `cdr.markForCheck()` inside the callback.
 *
 * Returns SSR-safe fallback values when `window` is not defined (Angular Universal).
 *
 * @returns An object with state accessors, widget actions, and change-subscription helpers.
 */
export function injectConsent() {
  const isServer = typeof window === 'undefined'

  // ── SSR-safe fallback ──────────────────────────────────────────────────────
  if (isServer) {
    return {
      hasConsent:   () => false as boolean,
      getConsent:   () => null  as ConsentValue | null,
      getConsentDate: () => false as Date | false,
      bannerVisibility: () => false as 'main' | 'gpc' | false,
      modalVisibility:  () => false as 'preference' | false,
      showBanner:   (_gpc?: boolean) => {},
      hideBanner:   () => {},
      showModal:    () => {},
      hideModal:    () => {},
      grantAll:     (_onlyMandatory?: boolean) => Promise.resolve(),
      denyAll:      (_includingMandatory?: boolean) => Promise.resolve(),
      submitConsent: (_consent: Partial<ConsentValue>) => Promise.resolve(),
      reConsent:    () => Promise.resolve(),
      isCookieGranted:   (_id: string) => false as boolean,
      isCategoryGranted: (_id: string) => false as boolean,
      switchLocale: (_locale: string) => {},
      onConsentChange: (_cb: () => void) => () => {},
      onBannerChange:  (_cb: () => void) => () => {},
      onModalChange:   (_cb: () => void) => () => {},
    }
  }

  // ── Client ────────────────────────────────────────────────────────────────
  return {
    /** Returns `true` if the visitor has saved a valid consent record. */
    hasConsent: () => _widget?.hasConsent() ?? false,

    /** Returns the stored consent map, or `null`. */
    getConsent: () => _widget?.getConsent() ?? null,

    /** Returns the `Date` of the last consent submission, or `false`. */
    getConsentDate: () => _widget?.getConsentDate() ?? false,

    /** Returns the current banner state: `'main'`, `'gpc'`, or `false` (hidden). */
    bannerVisibility: () => _widget?.bannerVisibility() ?? (false as 'main' | 'gpc' | false),

    /** Returns the current modal state: `'preference'` or `false` (hidden). */
    modalVisibility: () => _widget?.modalVisibility() ?? (false as 'preference' | false),

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

    /** Saves the given partial consent map. Missing cookie IDs default to their current stored value. */
    submitConsent: (consent: Partial<ConsentValue>) =>
      _widget?.submitConsent(consent) ?? Promise.resolve(),

    /** Deletes the current consent record and re-shows the banner. */
    reConsent: () => _widget?.reConsent() ?? Promise.resolve(),

    /** Returns `true` if the given cookie ID is `'granted'`. */
    isCookieGranted: (id: string) => (_widget?.isCookieGranted(id) ?? false) as boolean,

    /** Returns `true` if every cookie in the given category is `'granted'`. */
    isCategoryGranted: (id: string) => (_widget?.isCategoryGranted(id) ?? false) as boolean,

    /** Switches the active locale and re-renders the banner and modal. */
    switchLocale: (locale: string) => _widget?.switchLocale(locale),

    /**
     * Subscribes to consent change events. Call in `ngOnInit`; return value unsubscribes
     * in `ngOnDestroy`.
     *
     * @example
     * ```ts
     * ngOnInit() { this.unsub = this.consent.onConsentChange(() => this.cdr.markForCheck()) }
     * ngOnDestroy() { this.unsub() }
     * ```
     */
    onConsentChange: (callback: () => void): (() => void) => {
      window.addEventListener('consenti:consentSubmitted', callback)
      return () => window.removeEventListener('consenti:consentSubmitted', callback)
    },

    /**
     * Subscribes to banner visibility changes. Call in `ngOnInit`; return value unsubscribes
     * in `ngOnDestroy`.
     */
    onBannerChange: (callback: () => void): (() => void) => {
      window.addEventListener('consenti:bannerVisibility', callback)
      return () => window.removeEventListener('consenti:bannerVisibility', callback)
    },

    /**
     * Subscribes to modal visibility changes. Call in `ngOnInit`; return value unsubscribes
     * in `ngOnDestroy`.
     */
    onModalChange: (callback: () => void): (() => void) => {
      window.addEventListener('consenti:modalVisibility', callback)
      return () => window.removeEventListener('consenti:modalVisibility', callback)
    },
  }
}
