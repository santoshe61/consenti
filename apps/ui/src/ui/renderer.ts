/**
 * DOM mount point and screen reader utilities.
 *
 * All Consenti UI elements (banner, modal, overlay) are inserted into a single
 * `<div id="consenti-root">` appended to `document.body`. This keeps the DOM
 * footprint predictable and makes cleanup trivial — `unmount()` removes the root
 * and any injected `<style>` tag in one call.
 *
 * The `announceToScreenReader()` method manages a visually-hidden ARIA live region
 * (`#consenti-announcer`) used to announce non-visual state changes (e.g.
 * "Your cookie preferences have been saved.").
 */

import { isClient } from '../utils/ssr'

const ROOT_ID = 'consenti-root'

/**
 * Manages the `#consenti-root` mount point and related DOM infrastructure.
 * One `Renderer` instance is created per `ConsentiSetup`.
 */
export class Renderer {
  private root: HTMLElement | null = null
  private styleEl: HTMLElement | null = null

  /**
   * Returns the mount-point element, creating `#consenti-root` if needed.
   *
   * When `rootEl` is supplied:
   * - `string` → resolved via `document.querySelector`. Throws if no match.
   * - `HTMLElement` → used directly. Throws if not attached to the document.
   * On subsequent calls the previously stored root is returned immediately.
   *
   * @throws `Error` if called in SSR or if a supplied `rootEl` cannot be resolved.
   */
  mount(rootEl?: string | HTMLElement): HTMLElement {
    if (!isClient()) throw new Error('[Consenti] Renderer.mount() called in SSR context')

    if (this.root) return this.root

    if (rootEl !== undefined) {
      if (typeof rootEl === 'string') {
        const found = document.querySelector<HTMLElement>(rootEl)
        if (!found) throw new Error(`[Consenti] rootEl selector "${rootEl}" did not match any element.`)
        this.root = found
      } else {
        if (!document.contains(rootEl)) throw new Error('[Consenti] rootEl element is not attached to the document.')
        this.root = rootEl
      }
      this.root.classList.add('consenti-root')
      return this.root
    }

    let root = document.getElementById(ROOT_ID)
    if (!root) {
      root = document.createElement('div')
      root.id = ROOT_ID
      document.body.appendChild(root)
    }
    root.classList.add('consenti-root')
    this.root = root
    return root
  }

  /**
   * Injects a `<style id="consenti-styles">` tag into `<head>` with the given CSS string.
   * No-ops if the style element already exists (idempotent).
   *
   * @param css - The CSS content to inject.
   */
  injectStyles(css: string): void {
    if (!isClient()) return
    if (this.styleEl) return

    const style = document.createElement('style')
    style.id = 'consenti-styles'
    style.textContent = css
    document.head.appendChild(style)
    this.styleEl = style
  }

  /** Removes `#consenti-root` and the injected `<style>` tag from the document. */
  unmount(): void {
    this.root?.remove()
    this.styleEl?.remove()
    this.root = null
    this.styleEl = null
  }

  /**
   * Announces a message to screen readers via a visually-hidden `aria-live="polite"` region.
   *
   * The region is created on first call and reused. The message is cleared then
   * re-set via `requestAnimationFrame` to guarantee the change is detected by
   * AT even if the same string is announced twice in a row.
   *
   * @param message - The message to announce (plain text, not HTML).
   */
  announceToScreenReader(message: string): void {
    if (!isClient()) return
    let announcer = document.getElementById('consenti-announcer')
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'consenti-announcer'
      announcer.setAttribute('role', 'status')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      // Visually hidden but still in the accessibility tree
      announcer.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;'
      document.body.appendChild(announcer)
    }
    announcer.textContent = ''
    requestAnimationFrame(() => {
      if (announcer) announcer.textContent = message
    })
  }
}
