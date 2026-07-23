/**
 * CategoryScript — conditionally loads/unloads a third-party `<script>` tag
 * based on a whole category's rollup consent state, instead of one parameter.
 *
 * A category is considered "granted" only when *every* parameter it contains is
 * `'granted'` — matching the preference modal's tri-state rollup rule and
 * `CategoryAction`'s behavior. Injection mechanics (src validation, inline-script
 * escape hatch, attribute filtering) are identical to `ConsentScript` — both share
 * the same underlying `injectScript`/`revokeScript` helpers.
 *
 * @example
 * ```ts
 * import { ConsentiSetup, CategoryScript } from '@consenti/ui'
 *
 * const widget = new ConsentiSetup({ core: { profileId: 0 } })
 * await widget.ready
 *
 * new CategoryScript({
 *   categoryId: 'marketing',
 *   widget,
 *   src: 'https://example.com/ad-pixel.js',
 * })
 * ```
 */

import type { ConsentiSetup } from '../core/consenti-setup'
import { isClient } from './ssr'
import { injectScript, revokeScript } from './script-injector'

/** Options for constructing a {@link CategoryScript} instance. */
export interface CategoryScriptOptions {
  /** The category ID to watch (e.g. `'marketing'`). */
  categoryId: string
  /** The `ConsentiSetup` widget instance to read consent from. */
  widget: ConsentiSetup
  /** Remote script `src` URL to inject when every parameter in the category is granted. */
  src?: string
  /**
   * Inline JavaScript to inject when granted (e.g. a GTM snippet).
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
   * When `true` (default), the script is automatically removed when the category is no
   * longer fully granted and re-injected when it becomes fully granted again. Set to
   * `false` to evaluate consent only once at construction time — no event listener is
   * attached and the script is never auto-removed.
   */
  bind?: boolean
}

/**
 * Conditionally injects and removes a `<script>` element based on a category's
 * rollup consent status (every member parameter granted).
 *
 * Call {@link CategoryScript.destroy} when the trigger is no longer needed
 * (e.g. on SPA route unmount) to remove the event listener and the injected element.
 */
export class CategoryScript {
  private scriptEl: HTMLScriptElement | null = null
  private readonly handler: () => void

  constructor(private readonly options: CategoryScriptOptions) {
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
    const category = this.options.widget.getProfile()?.preferenceModal.categories[this.options.categoryId]
    const cookieIds = category?.cookies ?? []
    const consent = this.options.widget.getConsent()
    const granted = cookieIds.length > 0 && cookieIds.every(id => consent?.[id] === 'granted')

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
      warnPrefix: 'CategoryScript',
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
