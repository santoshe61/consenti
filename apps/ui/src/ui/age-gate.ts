/**
 * Age-gate prompt shown before any other consent UI when `compliance.ageGate.enabled`.
 *
 * Two screens, built on demand (never both mounted at once):
 * - `buildPrompt()` — "Are you {minimumAge} or older?" Yes/No.
 * - `buildParentalConsentMessage()` — shown after a "No" answer when
 *   `requireParentalConsent` is true; static message, no further input collected here
 *   (see `AGE_GATE.md` in docs — verification itself is left to the site owner).
 *
 * Text is hardcoded English, matching the rest of the widget's own UI chrome (banner close
 * button, locale switcher) — profile-authored/localized content is for consent copy, not
 * widget-internal controls.
 */

import { createOverlay } from './overlay'

export class AgeGate {
  private el: HTMLElement | null = null
  private overlayEl: HTMLElement | null = null

  /** Builds the "are you old enough" prompt. Not yet inserted into the document. */
  buildPrompt(minimumAge: number, onYes: () => void, onNo: () => void): HTMLElement {
    const root = document.createElement('div')
    root.id = 'consenti-age-gate'
    root.className = 'consenti-age-gate'
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')
    root.setAttribute('aria-label', 'Age verification')

    const heading = document.createElement('div')
    heading.className = 'consenti-age-gate__heading'
    heading.textContent = `Are you ${minimumAge} or older?`
    root.appendChild(heading)

    const text = document.createElement('div')
    text.className = 'consenti-age-gate__text'
    text.textContent = 'Please confirm your age before we show you cookie preferences.'
    root.appendChild(text)

    const buttons = document.createElement('div')
    buttons.className = 'consenti-age-gate__buttons'

    const yes = document.createElement('button')
    yes.type = 'button'
    yes.className = 'consenti-btn consenti-btn--primary'
    yes.textContent = 'Yes'
    yes.addEventListener('click', onYes)
    buttons.appendChild(yes)

    const no = document.createElement('button')
    no.type = 'button'
    no.className = 'consenti-btn consenti-btn--secondary'
    no.textContent = 'No'
    no.addEventListener('click', onNo)
    buttons.appendChild(no)

    root.appendChild(buttons)

    this.overlayEl = createOverlay(60)
    this.el = root
    return root
  }

  /** Builds the static "parental consent required" message (no overlay change needed — reuses the existing one). */
  buildParentalConsentMessage(onAcknowledge: () => void): HTMLElement {
    const root = document.createElement('div')
    root.id = 'consenti-age-gate'
    root.className = 'consenti-age-gate'
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')
    root.setAttribute('aria-label', 'Parental consent required')

    const heading = document.createElement('div')
    heading.className = 'consenti-age-gate__heading'
    heading.textContent = 'Parental consent required'
    root.appendChild(heading)

    const text = document.createElement('div')
    text.className = 'consenti-age-gate__text'
    text.textContent = 'Only strictly necessary cookies will be used until a parent or guardian verifies consent on your behalf.'
    root.appendChild(text)

    const buttons = document.createElement('div')
    buttons.className = 'consenti-age-gate__buttons'

    const ok = document.createElement('button')
    ok.type = 'button'
    ok.className = 'consenti-btn consenti-btn--primary'
    ok.textContent = 'OK'
    ok.addEventListener('click', onAcknowledge)
    buttons.appendChild(ok)

    root.appendChild(buttons)

    this.el = root
    return root
  }

  getOverlay(): HTMLElement | null {
    return this.overlayEl
  }

  remove(): void {
    this.el?.remove()
    this.overlayEl?.remove()
    this.el = null
    this.overlayEl = null
  }
}
