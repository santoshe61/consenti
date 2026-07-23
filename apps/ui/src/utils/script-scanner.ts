/**
 * Declarative DOM-scan bindings — a zero-JS integration path for gating
 * third-party scripts via `data-*` attributes instead of hand-written
 * `ConsentScript`/`CategoryScript` calls.
 *
 * ```html
 * <script type="text/plain" data-consenti-category-script="marketing" src="https://example.com/pixel.js"></script>
 * <script type="text/plain" data-consenti-consent-script="analytics_storage">/* inline snippet *\/</script>
 * <script type="text/plain" data-consenti-consent-script="ad_storage" data-consenti-bind="false" src="..."></script>
 * ```
 *
 * Scanned automatically once per `ConsentiSetup.init()` cycle (after `init()`
 * completes — so it respects `autoInit: false`, only running once the widget is
 * actually initialized, however `init()` was triggered). The scanned tags are
 * read-only config sources and stay inert (`type="text/plain"`) in the DOM
 * permanently — `ConsentScript`/`CategoryScript` inject their own separate
 * `<script>` element exactly as they do when constructed by hand.
 */

import type { ConsentiSetup } from '../core/consenti-setup'
import { isClient } from './ssr'
import { ConsentScript } from './consent-script'
import { CategoryScript } from './category-script'

const CONSENT_ATTR = 'data-consenti-consent-script'
const CATEGORY_ATTR = 'data-consenti-category-script'
const BIND_ATTR = 'data-consenti-bind'
/** Marks an element as already scanned so a later manual re-scan doesn't instantiate a second, duplicate watcher (and duplicate-inject) for the same tag. */
const SCANNED_ATTR = 'data-consenti-scanned'

/** `bind: false` only when the attribute is present and equals the literal string `"false"` — every other case (absent, empty, any other value) defaults to `true`. */
function readBind(el: Element): boolean {
  return el.getAttribute(BIND_ATTR) !== 'false'
}

/**
 * Scans the document for `<script type="text/plain">` tags carrying
 * `data-consenti-consent-script` or `data-consenti-category-script`, and
 * instantiates `ConsentScript`/`CategoryScript` for each. Called automatically
 * by `ConsentiSetup` at the end of every `init()` cycle.
 *
 * v1 scans once automatically; scripts injected into the DOM after that point
 * (e.g. by a late-loading CMS widget) are not picked up automatically — call this
 * function again manually after adding more tags dynamically if needed. Each element
 * is only ever scanned once (marked with `data-consenti-scanned`), so calling this
 * again is safe — it only processes newly-added tags, never re-instantiates a watcher
 * for one already scanned.
 *
 * Returns the created watchers — `ConsentiSetup` holds onto these and calls
 * `.destroy()` on each when the widget itself is destroyed, since a scanner-created
 * watcher has no other owner to release its `consenti:consentSubmitted` listener.
 */
export function scanConsentScripts(widget: ConsentiSetup): Array<ConsentScript | CategoryScript> {
  if (!isClient()) return []

  const elements = document.querySelectorAll<HTMLScriptElement>(
    `script[type="text/plain"][${CONSENT_ATTR}]:not([${SCANNED_ATTR}]), script[type="text/plain"][${CATEGORY_ATTR}]:not([${SCANNED_ATTR}])`,
  )

  const created: Array<ConsentScript | CategoryScript> = []

  for (const el of elements) {
    el.setAttribute(SCANNED_ATTR, '')

    const src = el.getAttribute('src') ?? undefined
    const unsafeInnerHTML = src ? undefined : (el.textContent?.trim() || undefined)
    const bind = readBind(el)

    const consentId = el.getAttribute(CONSENT_ATTR)
    const categoryId = el.getAttribute(CATEGORY_ATTR)

    if (consentId) {
      created.push(new ConsentScript({
        cookieId: consentId,
        widget,
        ...(src !== undefined ? { src } : {}),
        ...(unsafeInnerHTML !== undefined ? { unsafeInnerHTML } : {}),
        bind,
      }))
    } else if (categoryId) {
      created.push(new CategoryScript({
        categoryId,
        widget,
        ...(src !== undefined ? { src } : {}),
        ...(unsafeInnerHTML !== undefined ? { unsafeInnerHTML } : {}),
        bind,
      }))
    }
  }

  return created
}
