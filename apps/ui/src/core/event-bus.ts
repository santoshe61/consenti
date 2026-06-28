/**
 * Custom DOM event dispatcher with optional Google Tag Manager integration.
 *
 * Every user-visible action in the widget (banner shown, consent saved, modal opened)
 * dispatches a `CustomEvent` on `window` so host applications can react without
 * coupling to Consenti internals.
 *
 * When `config.utils.gtm` is configured, the same events are also pushed to
 * `window.dataLayer` (or a custom variable name) so GTM triggers can fire.
 *
 * Event names all use the `consenti:` namespace prefix to avoid collisions.
 */

import type { ConsentValue, GtmConfig, ConsentEvent } from '../types'
import { isClient, safeWindow } from '../utils/ssr'

/** All event names dispatched by the widget. */
export type EventName =
  | 'consenti:bannerInitialized'
  | 'consenti:bannerVisibility'
  | 'consenti:modalVisibility'
  | 'consenti:consentBeingSubmitted'
  | 'consenti:consentSubmitted'
  | 'consenti:closeRequest'

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
    private profileId: number,
    private gtmConfig?: GtmConfig,
  ) {}

  /**
   * Dispatches a `consenti:*` custom event on `window` and, if GTM is configured,
   * pushes the event to `window.dataLayer`.
   *
   * Silently no-ops in SSR contexts.
   *
   * @param name   - The event name.
   * @param detail - Event payload attached to `event.detail` and included in the GTM push.
   */
  dispatch(name: EventName, detail: ConsentEvent = {}): void {
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

    const shouldPush = !gtm.events || gtm.events.length === 0 || gtm.events.includes(name)
    if (!shouldPush) return

    layer.push({
      event: name,
      consenti: {
        profileId: this.profileId,
        consent: detail.consent,
        consentId: detail.consentId,
        consentAction: detail.consentAction,
      },
    })

    // Push Google Consent Mode v2 cookieless-ping flags alongside consent submissions.
    // Only emitted when gtag.js or google_tag_manager is detected on the page to
    // prevent no-op pushes that pollute the dataLayer on non-Google sites.
    if (name === 'consenti:consentSubmitted' && this.hasGtag(win)) {
      if (gtm.urlPassthrough) {
        layer.push({ url_passthrough: true })
      }
      if (gtm.adsDataRedaction) {
        // ads_data_redaction: true tells Google to strip identifying data from ad pings
        // when the user has denied ad_storage.
        const adConsentDenied = detail.consent?.['ad_storage'] !== 'granted'
        layer.push({ ads_data_redaction: adConsentDenied })
      }
    }
  }

  /**
   * Returns `true` when gtag.js or Google Tag Manager is detected on the page.
   * Used to gate GCM v2 cookieless-ping pushes so they are not emitted when
   * Google services are absent.
   */
  private hasGtag(win: Window & { [key: string]: unknown }): boolean {
    return typeof win['gtag'] === 'function' || typeof win['google_tag_manager'] !== 'undefined'
  }
}

// Re-export so callers do not need a separate import from types
export type { ConsentValue }
