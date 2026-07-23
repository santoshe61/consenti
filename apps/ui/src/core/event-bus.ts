/**
 * Custom DOM event dispatcher with optional Google Tag Manager / Google Consent Mode v2
 * integration.
 *
 * Every user-visible action in the widget (banner shown, consent saved, modal opened)
 * dispatches a `CustomEvent` on `window` so host applications can react without
 * coupling to Consenti internals.
 *
 * When `config.utils.gtm` is configured, this also drives real Google Consent Mode v2
 * signalling: a `gtag('consent', 'default', …)` call as soon as the widget initializes
 * (before any tag can fire), and `gtag('consent', 'update', …)` on every consent
 * submission — using the standard `gtag` stub-queue pattern, so it works whether the
 * site's own gtag.js/GTM snippet loads before or after Consenti. Set `gtm.verbose: true`
 * to additionally mirror every `consenti:*` event onto the dataLayer as a generic
 * `{ event, content }` push (for custom, non-Consent-Mode GTM triggers).
 *
 * Event names all use the `consenti:` namespace prefix to avoid collisions.
 */

import type { ConsentValue, GtmConfig, ConsentEvent, ConsentBeingSubmitted } from '../types'
import { isClient, safeWindow } from '../utils/ssr'
import { injectScript } from '../utils/script-injector'
import { getGoogleGTMConsent } from '../utils/consent-mapper'

type Gtag = (...args: unknown[]) => void

/** All event names dispatched by the widget. */
export type EventName =
  | 'consenti:bannerInitialized'
  | 'consenti:bannerVisibility'
  | 'consenti:modalVisibility'
  | 'consenti:consentBeingSubmitted'
  | 'consenti:consentSubmitted'
  | 'consenti:closeRequest'
  | 'consenti:parentalConsentRequired'

/**
 * Dispatches `CustomEvent` on `window` and optionally pushes to the GTM dataLayer.
 *
 * One `EventBus` instance is created per `ConsentiSetup` and shared across the
 * banner, modal, and consent submission flows.
 */
export class EventBus {
  /**
   * @param profileId - Profile ID included in all GTM pushes.
   * @param gtmConfig - Optional GTM integration settings.
   */
  constructor(
    private profileId: string,
    private gtmConfig?: GtmConfig,
  ) {
    if (this.gtmConfig) this.initConsentMode()
  }

  /**
   * Sets up Google Consent Mode v2 as soon as the widget initializes — before any tag can
   * fire — following Google's documented pattern: ensure `dataLayer` + a `gtag` stub exist
   * (queuing calls even if the real gtag.js/GTM library hasn't loaded yet), then push the
   * default (denied-by-default) consent state immediately. If `containerId` is set, also
   * injects the GTM library itself so callers don't need a separate GTM snippet.
   */
  private initConsentMode(): void {
    if (!isClient()) return
    const win = safeWindow() as (Window & { [key: string]: unknown }) | null
    if (!win) return
    const gtm = this.gtmConfig!
    const layerName = gtm.dataLayer ?? 'dataLayer'

    if (!Array.isArray(win[layerName])) win[layerName] = []
    if (typeof win['gtag'] !== 'function') {
      // Standard Google gtag stub: pushes its arguments onto the dataLayer array so
      // consent commands queue correctly regardless of when gtag.js/GTM actually loads.
      win['gtag'] = ((...args: unknown[]) => { (win[layerName] as unknown[]).push(args) }) satisfies Gtag
    }
    const gtag = win['gtag'] as Gtag

    // Consent must be set to a default state before any tag fires. getGoogleGTMConsent({})
    // resolves the library's own safe defaults (denied except functionality/security storage).
    gtag('consent', 'default', getGoogleGTMConsent({}))

    if (gtm.containerId) {
      const params = layerName !== 'dataLayer' ? `&l=${encodeURIComponent(layerName)}` : ''
      injectScript({
        src: `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtm.containerId)}${params}`,
        warnPrefix: 'GTM',
      })
    }
  }

  /**
   * Dispatches a `consenti:*` custom event on `window` and, if GTM is configured,
   * pushes the event to `window.dataLayer`.
   *
   * Silently no-ops in SSR contexts.
   *
   * @param name   - The event name.
   * @param detail - Event payload attached to `event.detail` and included in the GTM push.
   */
  dispatch(name: EventName, detail: ConsentEvent): void {
    if (!isClient()) return
    const event = new CustomEvent(name, { detail, bubbles: true })
    window.dispatchEvent(event)
    this.pushToGTM(name, detail)
  }

  private pushToGTM(name: string, detail: ConsentEvent): void {
    const gtm = this.gtmConfig
    if (!gtm) return

    const win = safeWindow() as (Window & { [key: string]: unknown }) | null
    if (!win) return

    const layerName = gtm.dataLayer ?? 'dataLayer'
    const layer = win[layerName]
    if (!Array.isArray(layer)) return

    // Generic per-event mirroring is opt-in (`verbose: true`) — the primary purpose of `gtm`
    // config is real Consent Mode signalling below, which always runs regardless of verbose.
    // `events`, when set, narrows which named events get mirrored under verbose mode.
    if (gtm.verbose && (!gtm.events || gtm.events.length === 0 || gtm.events.includes(name))) {
      layer.push({ event: name, content: detail })
    }

    if (name === 'consenti:consentSubmitted') {
      const consentJson = (detail as ConsentBeingSubmitted).consentJson ?? {}
      const gtag = (typeof win['gtag'] === 'function' ? win['gtag'] : (...args: unknown[]) => layer.push(args)) as Gtag

      gtag('consent', 'update', getGoogleGTMConsent(consentJson))

      if (gtm.urlPassthrough) gtag('set', 'url_passthrough', true)
      if (gtm.adsDataRedaction) {
        // ads_data_redaction tells Google to strip identifying data from ad pings when the
        // user has denied ad_storage.
        gtag('set', 'ads_data_redaction', consentJson['ad_storage'] !== 'granted')
      }
    }
  }

}

// Re-export so callers do not need a separate import from types
export type { ConsentValue }
