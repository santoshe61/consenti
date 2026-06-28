import type { ConsentValue, ConsentiWidgetAPI } from '../types'

/**
 * Abstract base class for Consenti UI plugins.
 *
 * Extend this class to hook into the widget lifecycle. Each plugin receives the
 * full `ConsentiWidgetAPI` in `initialize()` — call any public method, inspect
 * the resolved profile, or manipulate the widget DOM.
 *
 * Errors thrown in `initialize()` or `destroy()` are caught by `ConsentiSetup`
 * and logged as warnings — a broken plugin never blocks the consent flow.
 *
 * @example
 * ```ts
 * import { ConsentiPlugin } from '@consenti/ui'
 * import type { ConsentiWidgetAPI } from '@consenti/ui'
 *
 * class AnalyticsPlugin extends ConsentiPlugin {
 *   initialize(widget: ConsentiWidgetAPI) {
 *     window.addEventListener('consenti:consentSubmitted', () => {
 *       const consent = widget.getConsent()
 *       myAnalytics.track('consent_saved', consent)
 *     })
 *   }
 *
 *   destroy() {
 *     // remove listeners, clear timers, etc.
 *   }
 * }
 *
 * class BannerStylePlugin extends ConsentiPlugin {
 *   initialize(widget: ConsentiWidgetAPI) {
 *     widget.onReady(() => {
 *       const banner = widget.getBannerElement()
 *       if (banner) banner.style.setProperty('--my-custom-prop', 'red')
 *     })
 *   }
 *   destroy() {}
 * }
 *
 * const widget = new ConsentiSetup({
 *   core: { profileId: 1 },
 *   plugins: [new AnalyticsPlugin(), new BannerStylePlugin()],
 * })
 * ```
 */
export abstract class ConsentiPlugin {
  /**
   * Called once after `ConsentiSetup` has finished its async `init()`.
   * May be async — the widget awaits the result before continuing.
   *
   * @param widget - The full public API of the initialised widget.
   */
  abstract initialize(widget: ConsentiWidgetAPI): void | Promise<void>

  /**
   * Called when `widget.destroy()` is invoked.
   * Use this to remove event listeners, cancel timers, and release resources.
   */
  abstract destroy(): void

  /**
   * Called after consent has been saved to storage and dispatched to the API.
   * Receives the full, normalised consent map (mandatory cookies always `'granted'`).
   *
   * @param consent - The complete consent record that was saved.
   */
  onConsentSubmit?(consent: ConsentValue): void | Promise<void>

  /** Called after the consent banner has been mounted and made visible. */
  onBannerShow?(): void | Promise<void>

  /** Called after the consent banner has been hidden. */
  onBannerHide?(): void | Promise<void>

  /** Called after the preference modal has been opened. */
  onModalShow?(): void | Promise<void>

  /** Called after the preference modal has been closed. */
  onModalHide?(): void | Promise<void>
}
