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
 *     this.widget = new ConsentiSetup({ core: { profileId: 0 } })
 *     setConsentiWidget(this.widget)
 *   }
 *
 *   ngOnDestroy() {
 *     this.widget.destroy()
 *   }
 * }
 *
 * // any-component.ts
 * import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core'
 * import { injectConsent } from '@consenti/ui/angular'
 *
 * @Component({ selector: 'app-cookie-status', template: `
 *   <p *ngIf="consent.hasConsent()">Consent given on {{ consent.getConsentDate() | date }}</p>
 *   <button *ngIf="!consent.hasConsent()" (click)="consent.submitConsent({ analytics_storage: 'granted' })">
 *     Accept Analytics
 *   </button>
 * ` })
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
 *   ngOnDestroy() {
 *     this.unsub()
 *   }
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
 * trigger UI updates rather than a reactive primitive. Call `onConsentChange()` in
 * `ngOnInit` to subscribe to consent changes and `cdr.markForCheck()` inside the
 * callback to schedule re-renders in `OnPush` components.
 *
 * Returns SSR-safe fallback values when `window` is not defined (Angular Universal).
 *
 * @returns An object with `hasConsent`, `getConsent`, `submitConsent`, `getConsentDate`,
 *          and `onConsentChange` (subscription helper).
 */
export function injectConsent() {
  const isServer = typeof window === 'undefined'

  if (isServer) {
    return {
      hasConsent: () => false as boolean,
      getConsent: () => null as ConsentValue | null,
      submitConsent: async (_consent: Partial<ConsentValue>) => {},
      getConsentDate: () => false as Date | false,
      onConsentChange: (_cb: () => void) => () => {},
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

    /**
     * Subscribes to consent change events and calls `callback` each time consent is
     * saved. Returns an unsubscribe function — call it in `ngOnDestroy` to avoid leaks.
     *
     * @param callback - Function to call when `consenti:consentSubmitted` fires.
     * @returns A no-arg teardown function.
     *
     * @example
     * ```ts
     * ngOnInit() {
     *   this.unsub = this.consent.onConsentChange(() => this.cdr.markForCheck())
     * }
     * ngOnDestroy() { this.unsub() }
     * ```
     */
    onConsentChange: (callback: () => void): (() => void) => {
      window.addEventListener('consenti:consentSubmitted', callback)
      return () => window.removeEventListener('consenti:consentSubmitted', callback)
    },
  }
}
