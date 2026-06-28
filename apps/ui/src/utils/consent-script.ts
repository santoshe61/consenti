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

/** Options for constructing a {@link ConsentScript} instance. */
export interface ConsentScriptOptions {
  /** The consent cookie ID to watch (e.g. `'analytics_storage'`). */
  cookieId: string
  /** The `ConsentiSetup` widget instance to read consent from. */
  widget: ConsentiSetup
  /** Remote script `src` URL to inject when consent is granted. */
  src?: string
  /** Inline JavaScript content to execute when consent is granted. */
  innerHTML?: string
  /**
   * Additional HTML attributes applied to the injected `<script>` element.
   * Set a key to an empty string for boolean attributes (e.g. `{ async: '', defer: '' }`).
   */
  attributes?: Record<string, string>
  /** Called after the `<script>` element has been appended to `<head>`. */
  onLoad?: () => void
  /** Called after the `<script>` element has been removed from the DOM. */
  onRevoke?: () => void
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

    window.addEventListener('consenti:consentSubmitted', this.handler)

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
    const script = document.createElement('script')
    if (this.options.src) script.src = this.options.src
    if (this.options.innerHTML) script.innerHTML = this.options.innerHTML
    for (const [key, value] of Object.entries(this.options.attributes ?? {})) {
      script.setAttribute(key, value)
    }
    document.head.appendChild(script)
    this.scriptEl = script
    this.options.onLoad?.()
  }

  private revoke(): void {
    this.scriptEl?.remove()
    this.scriptEl = null
    this.options.onRevoke?.()
  }

  /**
   * Removes the event listener and the injected `<script>` element (if present).
   * Call this when the widget is destroyed or the script is no longer needed.
   */
  destroy(): void {
    if (!isClient()) return
    window.removeEventListener('consenti:consentSubmitted', this.handler)
    this.revoke()
  }
}
