/**
 * Button construction and click routing.
 *
 * `style` maps directly to the BEM modifier class (visual only).
 * `action` determines the click handler:
 *
 * | `action`   | Effect                                                       |
 * |---|---|
 * | `'custom'` | Grant/deny via `cookies`: `'*'` all, `'!'` deny, `string[]` specific |
 * | `'submit'` | Save the current modal toggle state                          |
 * | `'manage'` | Open the preference modal                                    |
 * | `'close'`  | Dismiss the current surface without saving                   |
 */

import type { Button } from '../types'

/**
 * Callbacks wired to every interactive button rendered by the widget.
 * Implemented by `ConsentiSetup.buildHandlers()` for each rendering context
 * (`'banner'` or `'modal'`).
 */
export interface ButtonClickHandler {
  /** Grant all cookies (non-mandatory and mandatory). */
  onGrantAll: () => void
  /** Deny all non-mandatory cookies; grant mandatory ones. */
  onDenyAll: () => void
  /** Save the current toggle state (modal context) or grant mandatory only (banner context). */
  onSubmit: () => void
  /** Open the preference modal. */
  onManage: () => void
  /** Close the current UI surface without saving. */
  onClose: () => void
  /** Grant only the specified cookie IDs plus all mandatory cookies. */
  onGrantSpecific: (cookieIds: string[]) => void
}

/**
 * Constructs a `<button>` element from a `Button` config and registers a click handler.
 *
 * @param id       - The button's key in the profile's `ButtonMap`, rendered as the DOM `id`.
 * @param btn      - Button configuration from the resolved profile.
 * @param handlers - Click handler implementations.
 * @returns A fully wired `HTMLButtonElement`.
 */
export function buildButton(id: string, btn: Button, handlers: ButtonClickHandler): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  if (id) el.id = id
  el.className = `consenti-btn consenti-btn--${btn.style}`
  el.textContent = btn.text

  el.addEventListener('click', () => {
    switch (btn.action) {
      case 'custom': {
        const cookies = btn.cookies
        if (cookies === '*') {
          handlers.onGrantAll()
        } else if (cookies === '!') {
          handlers.onDenyAll()
        } else if (Array.isArray(cookies) && cookies.length > 0) {
          handlers.onGrantSpecific(cookies)
        }
        break
      }
      case 'submit':
        handlers.onSubmit()
        break
      case 'manage':
        handlers.onManage()
        break
      case 'close':
        handlers.onClose()
        break
    }
  })

  return el
}
