/**
 * CookieTrigger — a pre-built accessible UI element that reopens the Consenti
 * preference panel when clicked.
 *
 * Use this to add a "Cookie Settings" link in your site footer or cookie policy
 * page without wiring up the click handler manually or importing the widget module
 * into your layout component.
 *
 * @example
 * ```ts
 * import { ConsentiSetup, CookieTrigger } from '@consenti/ui'
 *
 * const widget = new ConsentiSetup({ core: { profileId: 0 } })
 *
 * // Attach to an existing element
 * new CookieTrigger({ widget, el: '#footer-cookie-settings' })
 *
 * // — or — create a new button and place it yourself
 * const trigger = new CookieTrigger({ widget, label: 'Cookie Settings' })
 * document.querySelector('.site-footer')?.appendChild(trigger.getElement())
 * ```
 */

import type { ConsentiSetup } from '../core/consenti-setup'
import { isClient } from './ssr'

/** Options for constructing a {@link CookieTrigger} instance. */
export interface CookieTriggerOptions {
  /** The widget instance to control when the trigger is clicked. */
  widget: ConsentiSetup
  /**
   * Element to attach the click handler to.
   * - `HTMLElement` — used directly.
   * - `string` — treated as a CSS selector; the first matching element is used.
   * - Omitted — a new `<button>` is created. Retrieve it with {@link CookieTrigger.getElement}
   *   and append it to the DOM at the desired location.
   */
  el?: HTMLElement | string
  /**
   * Which panel opens on click.
   * - `'modal'` (default) — preference modal.
   * - `'banner'` — main consent banner.
   */
  action?: 'modal' | 'banner'
  /**
   * Label for the auto-created button element.
   * Ignored when `el` points to an existing element. Defaults to `'Cookie Settings'`.
   */
  label?: string
}

/**
 * Attaches a click handler that opens the Consenti preference panel to a DOM
 * element, or creates an accessible `<button>` when no existing element is provided.
 *
 * The created button uses the `.consenti-btn` and `.consenti-btn--text` classes so
 * it inherits the widget's theme automatically.
 */
export class CookieTrigger {
  private readonly el: HTMLElement
  private readonly clickHandler: () => void
  /** Whether this instance created the element (used to decide if `destroy()` removes it). */
  private readonly created: boolean

  constructor(options: CookieTriggerOptions) {
    const action = options.action ?? 'modal'

    this.clickHandler = () => {
      if (action === 'modal') options.widget.showModal()
      else options.widget.showBanner()
    }

    if (!options.el) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'consenti-btn consenti-btn--text consenti-cookie-trigger'
      btn.textContent = options.label ?? 'Cookie Settings'
      btn.setAttribute('aria-label', options.label ?? 'Open cookie settings')
      this.el = btn
      this.created = true
    } else if (typeof options.el === 'string') {
      if (!isClient()) {
        // SSR — create a placeholder that is never appended.
        this.el = document.createElement('span')
        this.created = false
        return
      }
      const found = document.querySelector<HTMLElement>(options.el)
      if (!found) {
        throw new Error(
          `[Consenti] CookieTrigger: element not found for selector "${options.el}"`,
        )
      }
      this.el = found
      this.created = false
    } else {
      this.el = options.el
      this.created = false
    }

    this.el.addEventListener('click', this.clickHandler)
  }

  /**
   * Returns the trigger element.
   * When no `el` was provided, append the returned element to the desired location
   * in the DOM after construction.
   */
  getElement(): HTMLElement {
    return this.el
  }

  /**
   * Removes the click handler and, if this instance auto-created the button,
   * removes it from the DOM.
   */
  destroy(): void {
    this.el.removeEventListener('click', this.clickHandler)
    if (this.created) this.el.remove()
  }
}
