/**
 * Preference modal DOM builder and state manager.
 *
 * The modal renders each category as a 3-state master toggle (`role="checkbox"`,
 * `aria-checked` one of `"true"`/`"false"`/`"mixed"`) followed by one binary
 * `role="switch"` per parameter it contains (with purpose/CPRA category/TCF vendor
 * shown where set). The master toggle's state is always *derived* from its
 * parameters' states, never stored independently: `'allowed'` when every parameter
 * is granted, `'denied'` when none are, `'mixed'` otherwise. Clicking the master
 * toggle while `'mixed'` or `'denied'` grants every parameter first; clicking again
 * from `'allowed'` denies every parameter.
 *
 * Legitimate-interest (LI) categories use `'objected'` as their off-state rather than
 * `'denied'`, per the GDPR Art. 21 framework for LI objection.
 *
 * A consent receipt checkbox is optionally rendered when `core.allowReceipt: true`.
 * It resets to unchecked each time the modal is opened so the user must opt in per submission.
 */

import type { PreferenceModal, Category, CategoryMap, CookieMap, ConsentValue, ConsentStatus, Button } from '../types'
import type { ButtonClickHandler } from './buttons'
import { buildButton } from './buttons'
import { createOverlay } from './overlay'
import { trapFocus } from './focus-trap'

type CategoryRollup = 'allowed' | 'denied' | 'mixed'

export class Modal {
  private el: HTMLElement | null = null
  private triggerEl: HTMLElement | null = null
  private trapCleanup: (() => void) | null = null
  /** Live per-parameter (cookie id) toggle state — same shape as `ConsentValue`. Source of truth for `getToggleConsent()`. */
  private toggleState = new Map<string, ConsentStatus>()
  /** Per-parameter toggle elements, keyed by cookie id — used to cascade visual updates when the category master toggle is clicked. */
  private paramToggles = new Map<string, HTMLButtonElement>()
  /** Category master toggle elements + their member cookie ids and legal basis, keyed by category id — used to recompute/update the master's rollup state when a member parameter changes. */
  private categoryToggles = new Map<string, { el: HTMLButtonElement; cookieIds: string[]; isLI: boolean }>()
  /** Each category's text-clamp + parameter-list disclosure, keyed by category id — a single "Show more" toggle drives both together. `params` is `null` when the category has 0-1 parameters (nothing to disclose there). */
  private categoryDisclosures = new Map<string, { text: HTMLElement; toggle: HTMLButtonElement; params: HTMLElement | null }>()
  private receiptCheckbox: HTMLInputElement | null = null
  /** When `true`, the modal wrapper is passthrough (overlayOpacity === 0). */
  private passthrough = false
  /** Screen width (px) below which the modal goes full-screen. 0 = disabled. */
  private mobileBreakpoint = 576
  /** Saved body overflow value — restored when modal closes. */
  private savedBodyOverflow: string | undefined = undefined

  /**
   * Constructs the modal DOM from the given config.
   * The modal is not inserted into the document until `open()` is called.
   *
   * @param config         - Modal layout and content config from the resolved profile.
   * @param cookies        - The resolved profile's parameter map — supplies purpose/CPRA category/TCF vendor/preGrant per parameter rendered inside each category.
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
    cookies: CookieMap,
    initialConsent: ConsentValue,
    handlers: ButtonClickHandler,
    allowReceipt: boolean,
    dpdpaConfig?: { dataFiduciary: string; grievanceEmail: string; purposeDescription?: string },
    locales?: string[],
    activeLocale?: string,
    onLocaleSwitch?: (locale: string) => void,
    hidePoweredBy = true,
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

    const body = document.createElement('div')
    body.className = 'consenti-modal__body'

    if (config.heading) {
      const headingTag = config.headingTag ?? 'div'
      const heading = document.createElement(headingTag)
      heading.id = 'consenti-modal-heading'
      heading.className = 'consenti-modal__heading'
      heading.textContent = config.heading
      header.appendChild(heading)
      wrapper.setAttribute('aria-labelledby', 'consenti-modal-heading')
    }

    if (config.subheading) {
      const sub = document.createElement('p')
      sub.className = 'consenti-modal__subheading'
      sub.textContent = config.subheading
      header.appendChild(sub)
    }

    // Header controls: locale switcher + close
    const hasClose = config.showClose !== false
    const hasLocaleSwitcher = config.showLocaleSwitcher && locales && locales.length > 0

    if (hasLocaleSwitcher || hasClose) {
      const headerControls = document.createElement('div')
      headerControls.className = 'consenti-modal__header-controls'

      if (hasLocaleSwitcher && locales && onLocaleSwitch) {
        headerControls.appendChild(buildModalLocaleSwitcher(locales, activeLocale, onLocaleSwitch))
      }

      if (hasClose) {
        const close = document.createElement('button')
        close.type = 'button'
        close.className = 'consenti-modal__close consenti-transition-1_2x consenti-btn consenti-btn--action'
        close.setAttribute('aria-label', 'Close preference modal')
        close.textContent = '×'
        close.addEventListener('click', handlers.onClose)
        headerControls.appendChild(close)
      }

      header.appendChild(headerControls)
    }
    container.appendChild(header)

    if (config.htmlText) {
      const desc = document.createElement('div')
      desc.className = 'consenti-modal__text'
      desc.innerHTML = config.htmlText
      body.appendChild(desc)
    }

    // Render link-action buttons as styled anchors below the intro text
    const buttonEntries = Object.entries(config.buttons)
    const linkButtons = buttonEntries.filter((e): e is [string, Button & { action: 'link' }] => e[1].action === 'link')
    if (linkButtons.length > 0) {
      const linksContainer = document.createElement('div')
      linksContainer.className = 'consenti-modal__links'
      for (const [, btn] of linkButtons) {
        if (!btn.url) continue
        const anchor = document.createElement('a')
        anchor.href = btn.url
        anchor.className = `consenti-modal__link consenti-btn consenti-btn--${btn.style ?? 'text'}`
        anchor.textContent = btn.text
        anchor.setAttribute('target', '_blank')
        anchor.setAttribute('rel', 'noopener noreferrer')
        linksContainer.appendChild(anchor)
      }
      header.appendChild(linksContainer)
    }

    const categories = document.createElement('div')
    categories.className = 'consenti-modal__categories'

    for (const [categoryId, cat] of Object.entries(config.categories)) {
      const catEl = this.buildCategory(categoryId, cat, cookies, initialConsent)
      categories.appendChild(catEl)
    }
    body.appendChild(categories)
    container.appendChild(body)
    if (allowReceipt) {
      body.appendChild(this.buildReceiptOption(config.receiptLabel, config.receiptDescription))
    }

    if (dpdpaConfig) {
      const notice = document.createElement('div')
      notice.className = 'consenti-modal__dpdpa-notice'
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
      const safeEmail = dpdpaConfig.grievanceEmail.includes('@') && !dpdpaConfig.grievanceEmail.toLowerCase().startsWith('javascript:')
        ? dpdpaConfig.grievanceEmail : ''
      notice.innerHTML = [
        `<strong>Data Fiduciary:</strong> ${esc(dpdpaConfig.dataFiduciary)}.`,
        dpdpaConfig.purposeDescription ? ` <strong>Purpose:</strong> ${esc(dpdpaConfig.purposeDescription)}.` : '',
        ` You may withdraw consent at any time or contact our Grievance Officer at`,
        safeEmail ? ` <a href="mailto:${esc(safeEmail)}">${esc(safeEmail)}</a>.` : '.',
      ].join('')
      container.appendChild(notice)
    }

    const btns = document.createElement('div')
    btns.className = 'consenti-modal__buttons'
    for (const [id, btn] of buttonEntries.filter(([, b]) => b.action !== 'link')) {
      btns.appendChild(buildButton(id, btn, handlers))
    }
    container.appendChild(btns)

    const pb = document.createElement('a')
    pb.href = 'https://consenti.dev/?utm_source=widget&utm_medium=powered-by&utm_campaign=consenti-ui'
    pb.className = 'consenti__powered-by'
    pb.textContent = 'Powered by Consenti ↗'
    pb.setAttribute('target', '_blank')
    pb.setAttribute('rel', 'noopener noreferrer')
    if (hidePoweredBy) {
      pb.classList.add('consenti-d-none')
    }
    body.appendChild(pb)

    wrapper.appendChild(container)

    wrapper.addEventListener('consenti:closeRequest', () => handlers.onClose())

    this.el = wrapper
  }

  /**
   * Appends the shared check/cross/objected/knob icon markup to a toggle button (used by both
   * the category master toggle and per-parameter switches). `isLI` renders the off-state as an
   * "objected" (circle-slash) icon instead of the plain cross, and marks the toggle with
   * `consenti-toggle--li` so CSS swaps between them — legitimate-interest categories are on by
   * default and the visitor *objects* rather than plainly denying, per GDPR Art. 21.
   */
  private static appendToggleIcons(toggle: HTMLButtonElement, isLI: boolean): void {
    if (isLI) toggle.classList.add('consenti-toggle--li')

    const checkIcon = document.createElement('span')
    checkIcon.className = 'consenti-category__toggle-icon consenti-category__toggle-icon--check'
    checkIcon.setAttribute('aria-hidden', 'true')
    checkIcon.innerHTML = '<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    toggle.appendChild(checkIcon)

    const crossIcon = document.createElement('span')
    crossIcon.className = 'consenti-category__toggle-icon consenti-category__toggle-icon--cross'
    crossIcon.setAttribute('aria-hidden', 'true')
    crossIcon.innerHTML = '<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    toggle.appendChild(crossIcon)

    if (isLI) {
      const objectedIcon = document.createElement('span')
      objectedIcon.className = 'consenti-category__toggle-icon consenti-category__toggle-icon--objected'
      objectedIcon.setAttribute('aria-hidden', 'true')
      objectedIcon.innerHTML = '<svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 2.5L7.5 7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
      toggle.appendChild(objectedIcon)
    }

    const knob = document.createElement('span')
    knob.className = 'consenti-category__toggle-knob'
    knob.setAttribute('aria-hidden', 'true')
    toggle.appendChild(knob)
  }

  /** `'allowed'` when every parameter is granted, `'denied'` when none are, `'mixed'` otherwise. LI categories treat 'objected' as the off-state. */
  private computeRollup(cookieIds: string[], isLI: boolean): CategoryRollup {
    const offStatus: ConsentStatus = isLI ? 'objected' : 'denied'
    const statuses = cookieIds.map(id => this.toggleState.get(id))
    if (statuses.every(s => s === 'granted')) return 'allowed'
    if (statuses.every(s => s === offStatus || s === undefined)) return 'denied'
    return 'mixed'
  }

  /** Recomputes and re-renders a category's master toggle from its current member states. */
  private updateCategoryToggleVisual(categoryId: string): void {
    const entry = this.categoryToggles.get(categoryId)
    if (!entry) return
    const rollup = this.computeRollup(entry.cookieIds, entry.isLI)
    const ariaChecked = rollup === 'allowed' ? 'true' : rollup === 'denied' ? 'false' : 'mixed'
    entry.el.setAttribute('aria-checked', ariaChecked)
    entry.el.classList.toggle('consenti-category__toggle--partial', rollup === 'mixed')
  }

  /** Builds one parameter row (purpose/CPRA/TCF info + its own switch) inside a category. */
  private buildParamRow(categoryId: string, cookieId: string, cookie: CookieMap[string] | undefined, isMandatory: boolean, isLI: boolean): HTMLElement {
    const row = document.createElement('div')
    row.className = 'consenti-category__param'

    const info = document.createElement('div')
    info.className = 'consenti-category__param-info'

    const label = document.createElement('span')
    label.className = 'consenti-category__param-label'
    label.textContent = cookieId
    info.appendChild(label)

    const meta = document.createElement('span')
    meta.className = 'consenti-category__param-meta'
    const badges: string[] = []
    if (cookie?.purpose) badges.push(cookie.purpose)
    if (cookie?.cpraCategory) badges.push(`CPRA: ${cookie.cpraCategory}`)
    if (cookie?.tcfVendorId != null) badges.push(`TCF Vendor #${cookie.tcfVendorId}`)
    meta.textContent = badges.join(' · ')
    if (badges.length) info.appendChild(meta)

    row.appendChild(info)

    const offStatus: ConsentStatus = isLI ? 'objected' : 'denied'
    const status = this.toggleState.get(cookieId) ?? offStatus
    const on = status === 'granted'

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = `consenti-category__param-toggle${isMandatory ? ' consenti-category__param-toggle--mandatory' : ''}`
    toggle.setAttribute('role', 'switch')
    toggle.setAttribute('aria-checked', String(on))
    toggle.setAttribute('aria-label', cookieId)
    if (isMandatory) {
      toggle.setAttribute('aria-disabled', 'true')
      toggle.disabled = true
    }
    Modal.appendToggleIcons(toggle, isLI)

    if (!isMandatory) {
      toggle.addEventListener('click', () => {
        const next: ConsentStatus = this.toggleState.get(cookieId) === 'granted' ? offStatus : 'granted'
        this.toggleState.set(cookieId, next)
        toggle.setAttribute('aria-checked', String(next === 'granted'))
        this.updateCategoryToggleVisual(categoryId)
      })
    }

    this.paramToggles.set(cookieId, toggle)
    row.appendChild(toggle)
    return row
  }

  private buildCategory(categoryId: string, cat: Category, cookies: CookieMap, initialConsent: ConsentValue): HTMLElement {
    const isLI = cat.legalBasis === 'legitimate_interest'
    const isMandatory = cat.legalBasis === 'mandatory'
    const offStatus: ConsentStatus = isLI ? 'objected' : 'denied'

    // Seed per-parameter state: stored consent wins; otherwise mandatory→granted,
    // LI→granted (on unless objected), consent-basis→preGrant ? granted : denied.
    for (const cookieId of cat.cookies) {
      const stored = initialConsent[cookieId]
      let status: ConsentStatus
      if (stored !== undefined) {
        status = stored
      } else if (isMandatory) {
        status = 'granted'
      } else if (isLI) {
        status = 'granted'
      } else {
        status = cookies[cookieId]?.preGrant ? 'granted' : 'denied'
      }
      this.toggleState.set(cookieId, status)
    }

    const wrapper = document.createElement('div')
    wrapper.className = `consenti-category${isMandatory ? ' consenti-category--mandatory' : ''}`

    const header = document.createElement('div')
    header.className = 'consenti-category__header'

    const headingTag = cat.headingTag ?? 'div'
    const heading = document.createElement(headingTag)
    heading.id = `consenti-cat-${categoryId}-heading`
    heading.className = 'consenti-category__heading'
    heading.textContent = cat.heading
    header.appendChild(heading)

    const rollup = this.computeRollup(cat.cookies, isLI)
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = `consenti-category__toggle${isMandatory ? ' consenti-category__toggle--mandatory' : ''}${rollup === 'mixed' ? ' consenti-category__toggle--partial' : ''}`
    // A 3-state master toggle needs `aria-checked="mixed"`, which is only valid ARIA
    // for role="checkbox" — role="switch" is strictly binary per the ARIA spec.
    // Per-parameter toggles below stay role="switch" since they're always binary.
    toggle.setAttribute('role', 'checkbox')
    toggle.setAttribute('aria-checked', rollup === 'allowed' ? 'true' : rollup === 'denied' ? 'false' : 'mixed')
    toggle.setAttribute('aria-labelledby', `consenti-cat-${categoryId}-heading`)
    if (isMandatory) {
      toggle.setAttribute('aria-disabled', 'true')
      toggle.disabled = true
    }
    Modal.appendToggleIcons(toggle, isLI)

    this.categoryToggles.set(categoryId, { el: toggle, cookieIds: cat.cookies, isLI })

    if (!isMandatory) {
      toggle.addEventListener('click', () => {
        const current = this.computeRollup(cat.cookies, isLI)
        // Matches native tri-state "select all" checkbox convention: mixed/denied → grant
        // everything first; a second click from fully-allowed denies everything.
        const next: ConsentStatus = current === 'allowed' ? offStatus : 'granted'
        for (const cookieId of cat.cookies) {
          this.toggleState.set(cookieId, next)
          const paramToggle = this.paramToggles.get(cookieId)
          if (paramToggle && !paramToggle.disabled) paramToggle.setAttribute('aria-checked', String(next === 'granted'))
        }
        this.updateCategoryToggleVisual(categoryId)
      })
    }

    header.appendChild(toggle)
    wrapper.appendChild(header)

    if (isLI && cat.legitimateInterestDescription) {
      const li = document.createElement('p')
      li.className = 'consenti-category__li-desc'
      li.textContent = cat.legitimateInterestDescription
      wrapper.appendChild(li)
    }

    const textWrap = document.createElement('div')
    textWrap.className = 'consenti-category__text-wrap'

    const text = document.createElement('div')
    text.className = 'consenti-category__text consenti-category__text--clamped'
    text.innerHTML = cat.htmlText
    textWrap.appendChild(text)

    const showMore = document.createElement('button')
    showMore.type = 'button'
    showMore.className = 'consenti-category__show-more consenti-d-none'
    showMore.setAttribute('aria-expanded', 'false')
    showMore.textContent = 'Show more'
    textWrap.appendChild(showMore)

    wrapper.appendChild(textWrap)

    const params = document.createElement('div')
    params.className = 'consenti-category__params'
    for (const cookieId of cat.cookies) {
      params.appendChild(this.buildParamRow(categoryId, cookieId, cookies[cookieId], isMandatory, isLI))
    }
    const hasMultipleParams = cat.cookies.length > 1
    params.classList.add('consenti-d-none')
    wrapper.appendChild(params)

    // One toggle drives both disclosures together: unclamping the text and revealing the
    // parameter list happen as a single "Show more" action, not two independent controls.
    showMore.addEventListener('click', () => {
      const expanded = !text.classList.toggle('consenti-category__text--clamped')
      if (hasMultipleParams) params.classList.toggle('consenti-d-none', !expanded)
      showMore.setAttribute('aria-expanded', String(expanded))
      showMore.textContent = expanded ? 'Show less' : 'Show more'
    })
    this.categoryDisclosures.set(categoryId, { text, toggle: showMore, params: hasMultipleParams ? params : null })

    return wrapper
  }

  private buildReceiptOption(label_?: string, description?: string): HTMLElement {
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
    label.append(' ' + (label_ ?? 'Get a copy of my consent choices (JSON)'))
    wrapper.appendChild(label)

    const desc = document.createElement('p')
    desc.id = 'consenti-receipt-desc'
    desc.className = 'consenti-modal__receipt-desc'
    desc.textContent = description ?? 'A JSON file will be downloaded to your device when you save your preferences.'
    wrapper.appendChild(desc)

    return wrapper
  }

  /**
   * Appends the modal to `mountEl` (falling back to `document.body` if omitted) and activates
   * the focus trap. The receipt checkbox (if present) is reset to unchecked.
   *
   * @param triggerEl - The element that opened the modal. Focus returns here on `close()`.
   * @param mountEl   - Element to append the modal into — normally `#consenti-root`, so the
   *                    whole widget lives under one root and inherits its theme/a11y classes
   *                    via normal CSS descendant inheritance instead of needing them mirrored.
   */
  open(triggerEl?: HTMLElement, mountEl?: HTMLElement): void {
    if (!this.el) return
    this.triggerEl = triggerEl ?? (document.activeElement as HTMLElement)
    if (this.receiptCheckbox) this.receiptCheckbox.checked = false
    const isFullscreen = this.mobileBreakpoint > 0 && window.innerWidth <= this.mobileBreakpoint
    if (isFullscreen) {
      this.el.classList.add('consenti-modal--fullscreen')
    } else {
      this.el.classList.remove('consenti-modal--fullscreen')
    }
    ;(mountEl ?? document.body).appendChild(this.el)
    // Lock page scroll when the modal has an overlay or is in mobile full-screen mode.
    // Skip when passthrough and not full-screen — the user can still scroll the page.
    if (!this.passthrough || isFullscreen) {
      this.savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    // Skip focus trap when overlay is transparent — the user can interact with the
    // page behind the modal panel so trapping keyboard focus would be counterproductive.
    if (!this.passthrough) {
      this.trapCleanup = trapFocus(this.el)
    }
    this.resetCategoryDisclosures()
  }

  /**
   * Re-evaluates whether each category's text overflows its 3-line clamp and/or it has more
   * than one parameter, and shows/hides the single "Show more" toggle accordingly. Resets
   * every category back to clamped-text + hidden-params first, so re-opening the modal
   * always starts collapsed.
   */
  private resetCategoryDisclosures(): void {
    for (const { text, toggle, params } of this.categoryDisclosures.values()) {
      text.classList.add('consenti-category__text--clamped')
      params?.classList.add('consenti-d-none')
      toggle.setAttribute('aria-expanded', 'false')
      toggle.textContent = 'Show more'
      const isTextOverflowing = text.scrollHeight > text.clientHeight + 1
      toggle.classList.toggle('consenti-d-none', !(isTextOverflowing || params !== null))
    }
  }

  /**
   * Removes the modal from `document.body`, deactivates the focus trap,
   * and returns focus to `triggerEl`.
   */
  close(): void {
    this.trapCleanup?.()
    this.trapCleanup = null
    if (this.savedBodyOverflow !== undefined) {
      document.body.style.overflow = this.savedBodyOverflow
      this.savedBodyOverflow = undefined
    }
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
   * Reads the current per-parameter toggle state and converts it to a `ConsentValue`.
   * The internal state is already keyed by cookie id (built up in `buildCategory`/
   * `buildParamRow` at construction time), so this is close to a direct read —
   * the fallback branch only matters if `categories` lists a parameter that was
   * never rendered (shouldn't happen in practice).
   *
   * Called by the submit handler to build the consent object before writing to storage.
   *
   * @param categories - The category map from the resolved profile (provides cookie IDs and legal basis for the fallback).
   */
  getToggleConsent(categories: CategoryMap): ConsentValue {
    const consent: ConsentValue = {}
    for (const cat of Object.values(categories)) {
      const isLI = cat.legalBasis === 'legitimate_interest'
      const isMandatory = cat.legalBasis === 'mandatory'
      const fallback: ConsentStatus = isMandatory ? 'granted' : isLI ? 'objected' : 'denied'
      for (const cookieId of cat.cookies) {
        consent[cookieId] = isMandatory ? 'granted' : (this.toggleState.get(cookieId) ?? fallback)
      }
    }
    return consent
  }

  /** Removes the modal element from the DOM and clears all internal state. */
  destroy(): void {
    this.trapCleanup?.()
    if (this.savedBodyOverflow !== undefined) {
      document.body.style.overflow = this.savedBodyOverflow
      this.savedBodyOverflow = undefined
    }
    this.el?.remove()
    this.el = null
    this.paramToggles.clear()
    this.categoryToggles.clear()
    this.categoryDisclosures.clear()
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
  btn.className = 'consenti-locale-switcher__btn consenti-btn consenti-btn--action consenti-transition-1_2x'
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
