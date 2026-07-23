/**
 * Cookie consent banner DOM builder.
 *
 * Constructs the banner element from a `MainBanner` config and wires up button handlers.
 * The banner is accessible: it carries `role="region"`, `aria-label`, and `aria-live`
 * so screen reader users are informed when it appears.
 *
 * Position variants (bottom, top, middle, left-bottom, right-bottom) are applied via
 * BEM modifier classes and handled entirely in CSS.
 *
 * Buttons with `action === 'link'` are rendered as `<a>` elements in
 * `.consenti-banner__links` inside the text container, separate from action buttons.
 */

import type { MainBanner, Button } from '../types'
import type { ButtonClickHandler } from './buttons'
import { buildButton } from './buttons'
import { createOverlay } from './overlay'

/**
 * Builds and manages the consent banner DOM element.
 *
 * One `Banner` instance is created per `ConsentiSetup`. Call `build()` to construct
 * the DOM, then `show()` / `hide()` to toggle visibility without rebuilding.
 */
export class Banner {
  private el: HTMLElement | null = null
  private overlayEl: HTMLElement | null = null

  /**
   * Constructs the banner DOM from the given config and returns the root element.
   * The element is not yet inserted into the document — the caller appends it to
   * the mount root via `Renderer.mount()`.
   *
   * @param config           - Banner layout and content config from the resolved profile.
   * @param handlers         - Click handlers wired to each button.
   * @param privacyPolicyUrl - Optional URL appended as a "Privacy Policy" link after the body text.
   * @param locales          - All locale codes available on the profile (for the locale switcher).
   * @param activeLocale     - The currently active locale code.
   * @param onLocaleSwitch   - Callback invoked when the user selects a different locale.
   * @param variant          - The variant of the banner 'main' | 'gpc.
   * @returns The constructed banner `<div>` element.
   */
  build(
    config: MainBanner,
    handlers: ButtonClickHandler,
    privacyPolicyUrl?: string,
    locales?: string[],
    activeLocale?: string,
    onLocaleSwitch?: (locale: string) => void,
    hidePoweredBy = true,
    variant: 'main' | 'gpc' = 'main'
  ): HTMLElement {
    const banner = document.createElement('div')
    banner.id = 'consenti-banner'
    banner.className = `consenti-banner consenti-banner--${variant} consenti-banner--${config.position}`
    banner.setAttribute('role', 'region')
    banner.setAttribute('aria-label', 'Cookie consent')
    banner.setAttribute('aria-live', 'polite')

    const textContainer = document.createElement('div')
    textContainer.className = `consenti-banner__text-container`
    const linksContainer = document.createElement('div')
    linksContainer.className = 'consenti-banner__links'

    if (config.heading) {
      const headingTag = config.headingTag ?? 'div'
      const heading = document.createElement(headingTag)
      heading.id = 'consenti-banner-heading'
      heading.className = 'consenti-banner__heading'
      heading.textContent = config.heading
      textContainer.appendChild(heading)
    }

    const text = document.createElement('div')
    text.className = 'consenti-banner__text'
    text.innerHTML = config.htmlText

    if (privacyPolicyUrl) {
      const link = document.createElement('a')
      link.href = privacyPolicyUrl
      link.className = 'consenti-banner__link consenti-banner__link--privacy consenti-btn consenti-btn--text'
      link.textContent = 'Privacy Policy'
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
      linksContainer.appendChild(link)
    }

    textContainer.appendChild(text)

    // Render link-action buttons as styled anchors below the body text
    const buttonEntries = Object.entries(config.buttons)
    const linkButtons = buttonEntries.filter((e): e is [string, Button & { action: 'link' }] => e[1].action === 'link')
    if (linkButtons.length > 0) {
      for (const [, btn] of linkButtons) {
        if (!btn.url) continue
        const anchor = document.createElement('a')
        anchor.href = btn.url
        anchor.className = `consenti-banner__link consenti-btn consenti-btn--${btn.style ?? 'text'}`
        anchor.textContent = btn.text
        anchor.setAttribute('target', '_blank')
        anchor.setAttribute('rel', 'noopener noreferrer')
        linksContainer.appendChild(anchor)
      }
    }
    if (linkButtons.length > 0 || privacyPolicyUrl) {
      textContainer.appendChild(linksContainer)
    }

    banner.appendChild(textContainer)

    const actionButtons = buttonEntries.filter(([, b]) => b.action !== 'link')
    if (actionButtons.length > 0) {
      const btns = document.createElement('div')
      btns.className = 'consenti-banner__buttons'
      for (const [id, btn] of actionButtons) {
        btns.appendChild(buildButton(id, btn, handlers))
      }
      banner.appendChild(btns)
    }

    // Controls group: locale switcher + close button (both positioned absolute top-right)
    const hasClose = config.showClose
    const hasLocaleSwitcher = config.showLocaleSwitcher && locales && locales.length > 0

    if (hasClose || hasLocaleSwitcher) {
      const controls = document.createElement('div')
      controls.className = 'consenti-banner__controls'

      if (hasLocaleSwitcher && locales && onLocaleSwitch) {
        controls.appendChild(buildLocaleSwitcher(locales, activeLocale, onLocaleSwitch))
      }

      if (hasClose) {
        const close = document.createElement('button')
        close.type = 'button'
        close.className = 'consenti-banner__close consenti-btn consenti-transition-1_2x consenti-btn--action'
        close.setAttribute('aria-label', 'Close cookie banner')
        close.textContent = '×'
        close.addEventListener('click', handlers.onClose)
        controls.appendChild(close)
      }

      banner.appendChild(controls)
    }

    if (config.overlayOpacity && config.overlayOpacity > 0) {
      this.overlayEl = createOverlay(config.overlayOpacity)
    }

    const pb = document.createElement('a')
    pb.href = 'https://consenti.dev/?utm_source=widget&utm_medium=powered-by&utm_campaign=consenti-ui'
    pb.className = 'consenti__powered-by'
    pb.textContent = 'Powered by Consenti ↗'
    pb.setAttribute('target', '_blank')
    pb.setAttribute('rel', 'noopener noreferrer')
    if (hidePoweredBy) {
      pb.classList.add('consenti-d-none')
    }
    banner.appendChild(pb)

    this.el = banner
    return banner
  }

  /** Returns the overlay element (if `overlayOpacity > 0`), or `null`. */
  getOverlay(): HTMLElement | null {
    return this.overlayEl
  }

  /** Makes the banner and its overlay visible after a `hide()` call. */
  show(): void {
    if (this.el) this.el.style.display = ''
    if (this.overlayEl) this.overlayEl.style.display = ''
  }

  /** Hides the banner and its overlay without removing them from the DOM. */
  hide(): void {
    if (this.el) this.el.style.display = 'none'
    if (this.overlayEl) this.overlayEl.style.display = 'none'
  }

  /** Removes the banner and overlay from the DOM entirely. */
  remove(): void {
    this.el?.remove()
    this.overlayEl?.remove()
    this.el = null
    this.overlayEl = null
  }
}

/**
 * Builds a locale switcher button + dropdown list element.
 * Clicking the globe button toggles the dropdown; selecting a locale calls `onSwitch`.
 */
function buildLocaleSwitcher(
  locales: string[],
  activeLocale: string | undefined,
  onSwitch: (locale: string) => void,
): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.className = 'consenti-locale-switcher'

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'consenti-locale-switcher__btn consenti-btn consenti-transition-1_2x consenti-btn--action'
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

  // Close dropdown when clicking outside
  document.addEventListener('click', () => { list.hidden = true }, { capture: true, once: false })

  wrapper.appendChild(btn)
  wrapper.appendChild(list)
  return wrapper
}
