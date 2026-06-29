/**
 * Preference modal DOM builder and state manager.
 *
 * The modal renders a list of consent category toggles (`role="switch"`) in an
 * accessible dialog (`role="dialog"`, `aria-modal="true"`). Each toggle reflects
 * the user's current consent for that category and can be flipped before saving.
 *
 * Legitimate-interest (LI) categories use `'objected'` as their off-state rather than
 * `'denied'`, per the GDPR Art. 21 framework for LI objection.
 *
 * A consent receipt checkbox is optionally rendered when `core.allowReceipt: true`.
 * It resets to unchecked each time the modal is opened so the user must opt in per submission.
 */

import type { PreferenceModal, Category, ConsentValue, Button } from '../types'
import type { ButtonClickHandler } from './buttons'
import { buildButton } from './buttons'
import { createOverlay } from './overlay'
import { trapFocus } from './focus-trap'

/**
 * Builds and manages the preference modal DOM.
 * One `Modal` instance is created per `ConsentiSetup` and reused across openings.
 */
export class Modal {
  private el: HTMLElement | null = null
  private triggerEl: HTMLElement | null = null
  private trapCleanup: (() => void) | null = null
  /** Map of category ID → toggle button element, used to read state on submit. */
  private toggleMap = new Map<string, HTMLButtonElement>()
  private receiptCheckbox: HTMLInputElement | null = null
  /** Live toggle state — updated on each click so `getToggleConsent()` reads the latest. */
  private toggleState = new Map<string, boolean>()
  /** When `true`, the modal wrapper is passthrough (overlayOpacity === 0). */
  private passthrough = false
  /** Screen width (px) below which the modal goes full-screen. 0 = disabled. */
  private mobileBreakpoint = 576

  /**
   * Constructs the modal DOM from the given config.
   * The modal is not inserted into the document until `open()` is called.
   *
   * @param config         - Modal layout and content config from the resolved profile.
   * @param initialConsent - Current stored consent, used to pre-set toggle states.
   * @param handlers       - Click handlers wired to each button.
   * @param allowReceipt   - When `true`, renders the consent receipt download checkbox.
   * @param dpdpaConfig    - DPDPA grievance notice config.
   * @param locales        - All available locale codes (for locale switcher).
   * @param activeLocale   - The currently active locale code.
   * @param onLocaleSwitch - Callback invoked when the user selects a different locale.
   */
  build(
    config: PreferenceModal,
    initialConsent: ConsentValue,
    handlers: ButtonClickHandler,
    allowReceipt: boolean,
    dpdpaConfig?: { dataFiduciary: string; grievanceEmail: string; purposeDescription?: string },
    locales?: string[],
    activeLocale?: string,
    onLocaleSwitch?: (locale: string) => void,
  ): void {
    this.mobileBreakpoint = config.mobileFullScreenBreakpoint ?? 576
    const position = config.position ?? 'center'
    const wrapper = document.createElement('div')
    wrapper.id = 'consenti-modal'
    wrapper.className = `consenti-modal consenti-modal--${position}`
    wrapper.setAttribute('role', 'dialog')
    wrapper.setAttribute('aria-modal', 'true')

    const overlayOpacity = config.overlayOpacity ?? 50
    this.passthrough = overlayOpacity === 0
    if (overlayOpacity > 0) {
      // When `persistent: true`, clicking the overlay does not close the modal —
      // the user must use one of the footer buttons.
      const overlayClickHandler = config.persistent ? undefined : () => handlers.onClose()
      const overlay = createOverlay(overlayOpacity, overlayClickHandler)
      overlay.className = 'consenti-modal__overlay'
      wrapper.appendChild(overlay)
    } else {
      // No overlay — let pointer events pass through the wrapper to the page beneath.
      wrapper.classList.add('consenti-modal--passthrough')
    }

    const container = document.createElement('div')
    container.className = 'consenti-modal__container'

    const header = document.createElement('div')
    header.className = 'consenti-modal__header'

    if (config.heading) {
      const headingTag = config.headingTag ?? 'h2'
      const heading = document.createElement(headingTag)
      heading.id = 'consenti-modal-heading'
      heading.className = 'consenti-modal__heading'
      heading.textContent = config.heading
      header.appendChild(heading)
      wrapper.setAttribute('aria-labelledby', 'consenti-modal-heading')
    }

    // Header controls: locale switcher + close
    const hasClose = config.showClose !== false
    const hasLocaleSwitcher = config.showLocaleSwitcher && locales && locales.length > 1

    if (hasLocaleSwitcher || hasClose) {
      const headerControls = document.createElement('div')
      headerControls.className = 'consenti-modal__header-controls'

      if (hasLocaleSwitcher && locales && onLocaleSwitch) {
        headerControls.appendChild(buildModalLocaleSwitcher(locales, activeLocale, onLocaleSwitch))
      }

      if (hasClose) {
        const close = document.createElement('button')
        close.type = 'button'
        close.className = 'consenti-modal__close consenti-btn consenti-btn--close'
        close.setAttribute('aria-label', 'Close preference modal')
        close.textContent = '×'
        close.addEventListener('click', handlers.onClose)
        headerControls.appendChild(close)
      }

      header.appendChild(headerControls)
    }
    container.appendChild(header)

    if (config.subheading) {
      const sub = document.createElement('p')
      sub.className = 'consenti-modal__subheading'
      sub.textContent = config.subheading
      container.appendChild(sub)
    }

    if (config.htmlText) {
      const desc = document.createElement('div')
      desc.className = 'consenti-modal__text'
      desc.innerHTML = config.htmlText
      container.appendChild(desc)
    }

    // Render link-action buttons as styled anchors below the intro text
    const linkButtons = config.buttons.filter((b): b is Button & { action: 'link' } => b.action === 'link')
    if (linkButtons.length > 0) {
      const linksContainer = document.createElement('div')
      linksContainer.className = 'consenti-modal__links'
      for (const btn of linkButtons) {
        if (!btn.url) continue
        const anchor = document.createElement('a')
        anchor.href = btn.url
        anchor.className = `consenti-modal__link consenti-btn consenti-btn--${btn.style ?? 'text'}`
        anchor.textContent = btn.text
        anchor.setAttribute('target', '_blank')
        anchor.setAttribute('rel', 'noopener noreferrer')
        linksContainer.appendChild(anchor)
      }
      container.appendChild(linksContainer)
    }

    const body = document.createElement('div')
    body.className = 'consenti-modal__body'

    const categories = document.createElement('div')
    categories.className = 'consenti-modal__categories'

    for (const cat of config.categories) {
      const catEl = this.buildCategory(cat, initialConsent)
      categories.appendChild(catEl)
    }
    body.appendChild(categories)
    container.appendChild(body)

    if (allowReceipt) {
      container.appendChild(this.buildReceiptOption())
    }

    if (dpdpaConfig) {
      const notice = document.createElement('div')
      notice.className = 'consenti-modal__dpdpa-notice'
      notice.innerHTML = [
        `<strong>Data Fiduciary:</strong> ${dpdpaConfig.dataFiduciary}.`,
        dpdpaConfig.purposeDescription ? ` <strong>Purpose:</strong> ${dpdpaConfig.purposeDescription}.` : '',
        ` You may withdraw consent at any time or contact our Grievance Officer at`,
        ` <a href="mailto:${dpdpaConfig.grievanceEmail}">${dpdpaConfig.grievanceEmail}</a>.`,
      ].join('')
      container.appendChild(notice)
    }

    const btns = document.createElement('div')
    btns.className = 'consenti-modal__buttons'
    for (const btn of config.buttons.filter(b => b.action !== 'link')) {
      btns.appendChild(buildButton(btn, handlers))
    }
    container.appendChild(btns)

    wrapper.appendChild(container)

    wrapper.addEventListener('consenti:closeRequest', () => handlers.onClose())

    this.el = wrapper
  }

  private buildCategory(cat: Category, initialConsent: ConsentValue): HTMLElement {
    const isLI = cat.type === 'legitimate_interest'
    const isMandatory = cat.mandatory === true

    let defaultOn: boolean
    if (isMandatory) {
      defaultOn = true
    } else if (isLI) {
      // LI categories are "on" unless the user has actively objected
      defaultOn = initialConsent[cat.cookies[0] ?? ''] !== 'objected'
    } else {
      defaultOn = initialConsent[cat.cookies[0] ?? ''] === 'granted'
    }
    this.toggleState.set(cat.id, defaultOn)

    const wrapper = document.createElement('div')
    wrapper.className = `consenti-category${isMandatory ? ' consenti-category--mandatory' : ''}`

    const header = document.createElement('div')
    header.className = 'consenti-category__header'

    const headingTag = cat.headingTag ?? 'h3'
    const heading = document.createElement(headingTag)
    heading.id = `consenti-cat-${cat.id}-heading`
    heading.className = 'consenti-category__heading'
    heading.textContent = cat.heading
    header.appendChild(heading)

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = `consenti-category__toggle${isMandatory ? ' consenti-category__toggle--mandatory' : ''}`
    toggle.setAttribute('role', 'switch')
    toggle.setAttribute('aria-checked', String(defaultOn))
    toggle.setAttribute('aria-labelledby', `consenti-cat-${cat.id}-heading`)
    if (isMandatory) toggle.setAttribute('aria-disabled', 'true')

    const knob = document.createElement('span')
    knob.className = 'consenti-category__toggle-knob'
    knob.setAttribute('aria-hidden', 'true')
    toggle.appendChild(knob)

    if (!isMandatory) {
      toggle.addEventListener('click', () => {
        const current = this.toggleState.get(cat.id) ?? false
        const next = !current
        this.toggleState.set(cat.id, next)
        toggle.setAttribute('aria-checked', String(next))
      })
    }

    this.toggleMap.set(cat.id, toggle)
    header.appendChild(toggle)
    wrapper.appendChild(header)

    const text = document.createElement('div')
    text.className = 'consenti-category__text'
    text.innerHTML = cat.htmlText
    wrapper.appendChild(text)

    if (isLI && cat.legitimateInterest?.description) {
      const li = document.createElement('p')
      li.className = 'consenti-category__li-desc'
      li.textContent = cat.legitimateInterest.description
      wrapper.appendChild(li)
    }

    return wrapper
  }

  private buildReceiptOption(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'consenti-modal__receipt-option'

    const label = document.createElement('label')
    label.className = 'consenti-modal__receipt-label'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'consenti-modal__receipt-checkbox'
    checkbox.id = 'consenti-receipt-checkbox'
    checkbox.setAttribute('aria-describedby', 'consenti-receipt-desc')
    this.receiptCheckbox = checkbox

    label.appendChild(checkbox)
    label.append(' Get a copy of my consent choices (JSON)')
    wrapper.appendChild(label)

    const desc = document.createElement('p')
    desc.id = 'consenti-receipt-desc'
    desc.className = 'consenti-modal__receipt-desc'
    desc.textContent = 'A JSON file will be downloaded to your device when you save your preferences.'
    wrapper.appendChild(desc)

    return wrapper
  }

  /**
   * Appends the modal to `document.body` and activates the focus trap.
   * The receipt checkbox (if present) is reset to unchecked.
   *
   * @param triggerEl - The element that opened the modal. Focus returns here on `close()`.
   */
  open(triggerEl?: HTMLElement): void {
    if (!this.el) return
    this.triggerEl = triggerEl ?? (document.activeElement as HTMLElement)
    if (this.receiptCheckbox) this.receiptCheckbox.checked = false
    if (this.mobileBreakpoint > 0 && window.innerWidth <= this.mobileBreakpoint) {
      this.el.classList.add('consenti-modal--fullscreen')
    } else {
      this.el.classList.remove('consenti-modal--fullscreen')
    }
    document.body.appendChild(this.el)
    // Skip focus trap when overlay is transparent — the user can interact with the
    // page behind the modal panel so trapping keyboard focus would be counterproductive.
    if (!this.passthrough) {
      this.trapCleanup = trapFocus(this.el)
    }
  }

  /**
   * Removes the modal from `document.body`, deactivates the focus trap,
   * and returns focus to `triggerEl`.
   */
  close(): void {
    this.trapCleanup?.()
    this.trapCleanup = null
    this.el?.remove()
    this.triggerEl?.focus()
    this.triggerEl = null
  }

  /** Returns `true` if the modal is currently mounted in the document. */
  isOpen(): boolean {
    return this.el?.isConnected === true
  }

  /** Returns `true` if the receipt download checkbox is checked at the time of calling. */
  isReceiptRequested(): boolean {
    return this.receiptCheckbox?.checked ?? false
  }

  /**
   * Reads the current toggle state map and converts it to a `ConsentValue`.
   *
   * Called by the submit handler to build the consent object before writing to storage.
   *
   * @param categories - The category list from the resolved profile (provides cookie IDs and type).
   */
  getToggleConsent(categories: Category[]): ConsentValue {
    const consent: ConsentValue = {}
    for (const cat of categories) {
      const isLI = cat.type === 'legitimate_interest'
      const isMandatory = cat.mandatory === true
      const on = this.toggleState.get(cat.id) ?? false

      for (const cookieId of cat.cookies) {
        if (isMandatory) {
          consent[cookieId] = 'granted'
        } else if (isLI) {
          // LI refusal is 'objected' not 'denied' — distinct status for Art. 21 records
          consent[cookieId] = on ? 'granted' : 'objected'
        } else {
          consent[cookieId] = on ? 'granted' : 'denied'
        }
      }
    }
    return consent
  }

  /** Removes the modal element from the DOM and clears all internal state. */
  destroy(): void {
    this.trapCleanup?.()
    this.el?.remove()
    this.el = null
    this.toggleMap.clear()
    this.toggleState.clear()
    this.receiptCheckbox = null
  }
}

/** Builds a compact locale switcher for the modal header. */
function buildModalLocaleSwitcher(
  locales: string[],
  activeLocale: string | undefined,
  onSwitch: (locale: string) => void,
): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'consenti-locale-switcher consenti-locale-switcher--modal'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'consenti-locale-switcher__btn consenti-btn consenti-btn--close'
  btn.setAttribute('aria-label', 'Switch language')
  btn.setAttribute('aria-haspopup', 'listbox')
  btn.textContent = '🌐'

  const list = document.createElement('ul')
  list.className = 'consenti-locale-switcher__list'
  list.setAttribute('role', 'listbox')
  list.setAttribute('aria-label', 'Select language')
  list.hidden = true

  for (const locale of locales) {
    const item = document.createElement('li')
    item.setAttribute('role', 'option')
    item.setAttribute('aria-selected', String(locale === activeLocale))

    const localeBtn = document.createElement('button')
    localeBtn.type = 'button'
    localeBtn.className = `consenti-locale-switcher__option${locale === activeLocale ? ' consenti-locale-switcher__option--active' : ''}`
    localeBtn.textContent = locale
    localeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      list.hidden = true
      if (locale !== activeLocale) onSwitch(locale)
    })

    item.appendChild(localeBtn)
    list.appendChild(item)
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    list.hidden = !list.hidden
  })

  document.addEventListener('click', () => { list.hidden = true }, { capture: true, once: false })

  wrapper.appendChild(btn)
  wrapper.appendChild(list)
  return wrapper
}
