/**
 * ConsentScript — conditionally loads/unloads a third-party `<script>` tag
 * based on a specific consent cookie's status.
 *
 * Instantiate after the widget is ready. The script is injected into `<head>`
 * when the target cookie's consent is `'granted'` and removed when it is
 * revoked. Ideal for lazy-loading analytics, ad pixels, or chat widgets without
 * manual `consenti:consentSubmitted` listeners.
 *
 * @example
 * ```ts
 * import { ConsentiSetup, ConsentScript } from '@consenti/ui'
 *
 * const widget = new ConsentiSetup({ core: { profileId: 0 } })
 * await widget.ready
 *
 * const cs = new ConsentScript({
 *   cookieId: 'analytics_storage',
 *   widget,
 *   src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX',
 *   attributes: { async: '' },
 *   onLoad: () => console.log('Analytics loaded'),
 *   onRevoke: () => console.log('Analytics removed'),
 * })
 * ```
 */

import type { ConsentiSetup } from '../core/consenti-setup'
import { isClient } from './ssr'
import { injectScript, revokeScript } from './script-injector'

/** Options for constructing a {@link ConsentScript} instance. */
export interface ConsentScriptOptions {
  /** The consent cookie ID to watch (e.g. `'analytics_storage'`). */
  cookieId: string
  /** The `ConsentiSetup` widget instance to read consent from. */
  widget: ConsentiSetup
  /** Remote script `src` URL to inject when consent is granted. */
  src?: string
  /**
   * Inline JavaScript to inject when consent is granted (e.g. a GTM snippet).
   * WARNING: this string is assigned directly to `script.innerHTML` — only
   * pass a static, trusted literal. Never pass user-supplied or remote content.
   */
  unsafeInnerHTML?: string
  /**
   * Additional HTML attributes applied to the injected `<script>` element.
   * Set a key to an empty string for boolean attributes (e.g. `{ async: '', defer: '' }`).
   */
  attributes?: Record<string, string>
  /** Called after the `<script>` element has been appended to `<head>`. */
  onLoad?: () => void
  /** Called after the `<script>` element has been removed from the DOM. */
  onRevoke?: () => void
  /**
   * When `true` (default), the script is automatically removed when consent is revoked and
   * re-injected when consent is re-granted. Set to `false` to evaluate consent only once at
   * construction time — no event listener is attached and the script is never auto-removed.
   */
  bind?: boolean
}

/**
 * Conditionally injects and removes a `<script>` element based on a specific
 * cookie's consent status.
 *
 * The check runs immediately on construction so existing consent is honoured
 * without waiting for the next `consenti:consentSubmitted` event. It then
 * re-evaluates on every future consent change.
 *
 * Call {@link ConsentScript.destroy} when the trigger is no longer needed
 * (e.g. on SPA route unmount) to remove the event listener and the injected
 * element.
 */
export class ConsentScript {
  private scriptEl: HTMLScriptElement | null = null
  private readonly handler: () => void

  constructor(private readonly options: ConsentScriptOptions) {
    // Assign handler unconditionally to satisfy TypeScript strict property initialisation.
    this.handler = () => this.evaluate()

    if (!isClient()) return

    if (options.bind !== false) {
      window.addEventListener('consenti:consentSubmitted', this.handler)
    }

    // Evaluate immediately so any existing consent is reflected at construction time.
    this.evaluate()
  }

  private evaluate(): void {
    const consent = this.options.widget.getConsent()
    const granted = consent?.[this.options.cookieId] === 'granted'

    if (granted && !this.scriptEl) {
      this.inject()
    } else if (!granted && this.scriptEl) {
      this.revoke()
    }
  }

  private inject(): void {
    const script = injectScript({
      ...(this.options.src !== undefined ? { src: this.options.src } : {}),
      ...(this.options.unsafeInnerHTML !== undefined ? { unsafeInnerHTML: this.options.unsafeInnerHTML } : {}),
      ...(this.options.attributes !== undefined ? { attributes: this.options.attributes } : {}),
      warnPrefix: 'ConsentScript',
    })
    if (!script) return
    this.scriptEl = script
    this.options.onLoad?.()
  }

  private revoke(): void {
    revokeScript(this.scriptEl)
    this.scriptEl = null
    this.options.onRevoke?.()
  }

  /**
   * Removes the event listener and the injected `<script>` element (if present).
   * Call this when the widget is destroyed or the script is no longer needed.
   */
  destroy(): void {
    if (!isClient()) return
    if (this.options.bind !== false) {
      window.removeEventListener('consenti:consentSubmitted', this.handler)
    }
    this.revoke()
  }
}
