/**
 * Full-page semi-transparent overlay shown behind the banner or modal.
 * Rendered as a sibling element inside `#consenti-root` so it does not interfere
 * with the host page's stacking context.
 *
 * Opacity is driven by an inline style (the only inline style in the widget) because
 * the value is dynamic per-profile config and cannot be expressed as a CSS custom
 * property without JavaScript.
 */

/**
 * Creates a `<div class="consenti-overlay">` element.
 *
 * @param opacity - Overlay opacity as a percentage (0–100). Converted to a 0–1 CSS value.
 * @param onClick - Optional click handler (used by modal to close on backdrop click).
 * @returns The constructed overlay element. Not yet inserted into the DOM.
 */
export function createOverlay(opacity: number, onClick?: () => void): HTMLElement {
  const el = document.createElement('div')
  el.className = 'consenti-overlay'
  el.style.opacity = String(opacity / 100)
  el.setAttribute('aria-hidden', 'true')
  if (onClick) {
    el.addEventListener('click', onClick)
  }
  return el
}
