/**
 * WCAG 2.1 focus trap for modal dialogs.
 *
 * When a modal is open, keyboard focus must remain within it (WCAG 2.1 SC 2.1.2
 * "No Keyboard Trap" requires that keyboard focus can be moved *to* and *from* a
 * component — trapping focus inside a modal while it is open is the correct pattern).
 *
 * Additionally, pressing Escape dispatches a `consenti:closeRequest` CustomEvent on the
 * container so the modal's close handler can react without a direct reference back here.
 */

/** Selector covering all standard interactive focusable elements. */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Traps keyboard focus within `container`.
 *
 * - Tab cycles from last focusable element back to first.
 * - Shift+Tab cycles from first focusable element to last.
 * - Escape dispatches `consenti:closeRequest` on the container.
 * - Focus is moved to the first focusable element immediately on call.
 *
 * @param container - The modal root element to trap focus inside.
 * @returns A cleanup function — call it when the modal closes to remove event listeners.
 */
export function trapFocus(container: HTMLElement): () => void {
  const getFocusable = () =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
      (el) => !el.closest('[aria-hidden="true"]'),
    )

  const handleKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'Tab') return
    const els = getFocusable()
    if (els.length === 0) return
    const first = els[0]!
    const last = els[els.length - 1]!

    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === container) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      container.dispatchEvent(new CustomEvent('consenti:closeRequest', { bubbles: true }))
    }
  }

  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('keydown', handleEscape)

  getFocusable()[0]?.focus()

  return () => {
    document.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('keydown', handleEscape)
  }
}
