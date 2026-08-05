import type { Locator, Page } from 'playwright'
import {
  ACCEPT_ALL_LABELS,
  BANNER_CONTAINER_SELECTORS,
  BANNER_KEYWORDS,
  MANAGE_PREFERENCES_LABELS,
  REJECT_ALL_LABELS,
  SAVE_PREFERENCES_LABELS,
} from './button-labels.js'
import type { BannerDetectionMethod, PreferenceCategory } from './types.js'

/** Attribute stamped by `findGenericBannerFallback` onto whichever element it identifies as the
 * likely banner — lets every other function here (`clickButtonByLabel`, `listPreferenceCategories`,
 * etc.) address that element via a plain CSS selector, the same way they'd address any of the
 * known `BANNER_CONTAINER_SELECTORS`, without needing a separate code path for the fallback case. */
const FALLBACK_MARKER_ATTR = 'data-consenti-scanner-candidate'
const FALLBACK_MARKER_SELECTOR = `[${FALLBACK_MARKER_ATTR}]`

/** Real-world CMP banners (OneTrust, Cookiebot, etc.) commonly inject and fade in
 * asynchronously — after a geo-IP consent-rule lookup, a script chunk load, or a CSS transition —
 * so a banner that isn't visible the instant navigation settles can still appear a second or two
 * later. `Locator.isVisible({ timeout })` looks like a wait but isn't one: Playwright deprecated
 * that option because `isVisible()` is a same-tick check that returns immediately regardless of
 * `timeout` (see its own docs) — every call here was a false negative for any banner that hadn't
 * already rendered by the time this ran. `waitFor({ state: 'visible' })` actually polls. */
const BANNER_WAIT_TIMEOUT_MS = 3_000

/** True when any known selector or the generic fallback heuristic finds a banner within
 * {@link BANNER_WAIT_TIMEOUT_MS}. Used to decide whether "reject-all"/"accept-all" states are
 * meaningful for this page at all — per the v1 plan, if no CMP banner is detected, those states
 * collapse to the no-consent result and the report says so explicitly (`cmpDetected: false`)
 * instead of guessing. */
export async function detectBanner(page: Page): Promise<boolean> {
  return (await firstVisibleContainer(page, BANNER_WAIT_TIMEOUT_MS)) !== null
}

/** Same as {@link detectBanner}, but also reports *which* tier found it — `known-selector` (one
 * of the ~20 named CMP containers) or `heuristic-fallback` (the generic scored heuristic below) —
 * so a report reader can weight the two differently: a known-selector match is essentially
 * certain, a heuristic-fallback match is a best-effort inference. */
export async function detectBannerWithMethod(
  page: Page
): Promise<{ detected: boolean; method: BannerDetectionMethod | null }> {
  const known = await raceKnownContainer(page, BANNER_WAIT_TIMEOUT_MS)
  if (known) return { detected: true, method: 'known-selector' }
  const fallback = await findGenericBannerFallback(page)
  return fallback ? { detected: true, method: 'heuristic-fallback' } : { detected: false, method: null }
}

/** Resolves to a container selector — from the known list first, the generic heuristic fallback
 * second — or `null` if neither finds anything. Every other function in this module goes through
 * this one function to find "the banner/panel container," so the fallback applies uniformly
 * everywhere (clicking accept/reject/manage, listing preference categories, …) without those call
 * sites needing their own separate fallback logic. */
async function firstVisibleContainer(page: Page, timeout: number): Promise<string | null> {
  const known = await raceKnownContainer(page, timeout)
  if (known) return known
  return findGenericBannerFallback(page)
}

/** Resolves to whichever known selector becomes visible first, or `null` once every selector has
 * timed out. A plain `Promise.race` doesn't work here: a selector with no matching element still
 * only rejects once its own timeout elapses (Playwright can't distinguish "not there yet" from
 * "never showing up"), so with every candidate starting at the same instant, whichever one *fails*
 * first would settle the race and abandon the rest even though one of them might resolve true a
 * moment later. This resolves early on the first success but only resolves `null` once every
 * candidate has actually failed. Every selector is raced concurrently rather than tried one at a
 * time, so the total wait is bounded by one timeout regardless of how many selectors exist —
 * waiting the full timeout on each of ~20 selectors in sequence (most of which will never match)
 * would make a "no CMP present" page take ages to conclude. */
function raceKnownContainer(page: Page, timeout: number): Promise<string | null> {
  return new Promise(resolve => {
    let settled = false
    let remaining = BANNER_CONTAINER_SELECTORS.length
    for (const selector of BANNER_CONTAINER_SELECTORS) {
      page.locator(selector).first().waitFor({ state: 'visible', timeout }).then(
        () => {
          if (!settled) {
            settled = true
            resolve(selector)
          }
        },
        () => {
          remaining--
          if (remaining === 0 && !settled) {
            settled = true
            resolve(null)
          }
        }
      )
    }
  })
}

/**
 * Last-resort banner detection for CMPs not on the known-selector list — different tools render
 * wildly different DOM structures, so instead of recognizing a specific CMP, this recognizes the
 * *shape* a cookie banner almost always has: a fixed/sticky-positioned overlay, touching an edge
 * or corner of the viewport, that actually talks about cookies/consent/privacy.
 *
 * Two hard gates, deliberately AND'd rather than scored, because either alone lets through a
 * common false positive: `position: fixed` alone matches chat widgets, promo bars, and newsletter
 * popups just as easily as a cookie banner; the keyword requirement alone matches a footer
 * privacy-policy paragraph or an in-flow blog post that happens to mention cookies. Passing both
 * gates only happens for something that's both a floating overlay *and* actually about
 * cookies/consent — no combination of unrelated fixed-position UI plus unrelated cookie-adjacent
 * text should satisfy both at once. Elements passing both gates are then scored (edge/corner
 * position, presence of buttons, a dialog-ish ARIA role, an explicit z-index) purely to pick the
 * best candidate when more than one qualifies; a candidate only needs to clear a low bar there
 * since the two hard gates already did the real filtering.
 *
 * Deliberately doesn't attempt the "recurs identically across pages" signal discussed alongside
 * this — that needs cross-page state this per-page function doesn't have. Worth adding later if
 * false positives/negatives in practice call for it.
 */
async function findGenericBannerFallback(page: Page): Promise<string | null> {
  try {
    const found = await page.evaluate(({ keywords, marker }) => {
      document.querySelectorAll(`[${marker}]`).forEach(el => el.removeAttribute(marker))

      let best: { el: Element; score: number } | null = null

      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const style = getComputedStyle(el)
        if (style.position !== 'fixed' && style.position !== 'sticky') continue

        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        // Skip near-fullscreen wrappers (a page-level layout container that happens to be
        // position:fixed for unrelated reasons) — a real banner is an overlay, not the page itself.
        if (rect.width > window.innerWidth * 0.95 && rect.height > window.innerHeight * 0.9) continue

        const text = (el.textContent ?? '').toLowerCase()
        if (!keywords.some(k => text.includes(k))) continue

        let score = 0
        const edgeMargin = 24
        const touchesEdge =
          rect.top <= edgeMargin ||
          window.innerHeight - rect.bottom <= edgeMargin ||
          rect.left <= edgeMargin ||
          window.innerWidth - rect.right <= edgeMargin
        if (touchesEdge) score += 2
        if (el.querySelector('button, [role="button"], a, [class*="btn" i], [onclick]')) score += 1
        const role = el.getAttribute('role')
        if (role === 'dialog' || role === 'alertdialog' || el.getAttribute('aria-modal') === 'true') score += 1
        const zIndex = Number(style.zIndex)
        if (style.zIndex !== 'auto' && !Number.isNaN(zIndex) && zIndex > 0) score += 1

        if (score >= 2 && (!best || score > best.score)) best = { el, score }
      }

      if (!best) return false
      best.el.setAttribute(marker, 'true')
      return true
    }, { keywords: BANNER_KEYWORDS, marker: FALLBACK_MARKER_ATTR })

    return found ? FALLBACK_MARKER_SELECTOR : null
  } catch {
    return null
  }
}

/** Best-effort click of a banner button matching one of `labels` (case-insensitive substring).
 * Reuses the same race used by `detectBanner` to find whichever container is actually visible on
 * this (freshly navigated) page, then searches within it; falls back to a whole-page search if
 * that container has no matching label (e.g. an icon-only control this heuristic can't read).
 * Returns whether a click happened — callers use this to decide whether the resulting captured
 * signals represent a real "rejected"/"accepted" state or just a no-op. */
export async function clickButtonByLabel(page: Page, labels: string[]): Promise<boolean> {
  const containerSelector = await firstVisibleContainer(page, BANNER_WAIT_TIMEOUT_MS)
  if (containerSelector) {
    const clicked = await clickWithinKnownVisible(page, containerSelector, labels)
    if (clicked) return true
  }
  return clickWithinKnownVisible(page, 'body', labels)
}

/** Real-world "buttons" are frequently not a `<button>`/`<a>` at all — a bare `<div>`/`<span>`
 * with a click handler and a "btn"/"button"-ish class name, or an inline `onclick`, is extremely
 * common on sites that weren't built with accessibility in mind. Matched together with actual
 * label text (never on structure alone), so the false-positive risk of this broader net is low —
 * an unrelated "btn"-classed element only matches if its own text also happens to contain one of
 * the specific labels being searched for. */
const CLICKABLE_SELECTOR =
  'button, [role="button"], [role="tab"], a, [class*="btn" i], [class*="button" i], [onclick]'

/** Searches for a matching button within `containerSelector`, which the caller has already
 * confirmed is visible (or is `'body'`, always applicable) — no visibility check here, since
 * `Locator.isVisible()` can't wait (see {@link detectBanner}'s doc comment) and there is nothing
 * left to wait for once the container is already known to be up. */
async function clickWithinKnownVisible(page: Page, containerSelector: string, labels: string[]): Promise<boolean> {
  try {
    const container = page.locator(containerSelector).first()
    const candidates = container.locator(CLICKABLE_SELECTOR)
    const count = await candidates.count()
    for (let i = 0; i < count; i++) {
      const el = candidates.nth(i)
      const text = ((await el.textContent().catch(() => '')) ?? '').trim().toLowerCase()
      if (!text) continue
      if (labels.some(label => text.includes(label))) {
        await el.click({ timeout: 2_000 }).catch(() => {})
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

export async function clickAcceptAll(page: Page): Promise<boolean> {
  return clickButtonByLabel(page, ACCEPT_ALL_LABELS)
}

export async function clickRejectAll(page: Page): Promise<boolean> {
  return clickButtonByLabel(page, REJECT_ALL_LABELS)
}

/** Every button label found on the detected banner (e.g. `["Accept All Cookies", "Reject All",
 * "Cookie Settings"]`) — documents what a real visitor could choose, beyond just the two this
 * scanner actually exercises as baseline states. Empty array when no banner is detected. */
export async function listBannerButtons(page: Page): Promise<string[]> {
  const containerSelector = await firstVisibleContainer(page, BANNER_WAIT_TIMEOUT_MS)
  if (!containerSelector) return []
  return collectButtonLabels(page.locator(containerSelector).first())
}

async function collectButtonLabels(container: Locator): Promise<string[]> {
  try {
    const candidates = container.locator(CLICKABLE_SELECTOR)
    const count = await candidates.count()
    const labels: string[] = []
    for (let i = 0; i < count; i++) {
      const text = ((await candidates.nth(i).textContent().catch(() => '')) ?? '').trim()
      if (text && !labels.includes(text)) labels.push(text)
    }
    return labels
  } catch {
    return []
  }
}

/** Best-effort click of whatever opens a CMP's granular preference/customize panel — the same
 * label-matching heuristic as accept/reject, just a different label list. Returns whether a click
 * happened; callers should still wait for the panel to actually render before querying it. */
export async function openPreferencePanel(page: Page): Promise<boolean> {
  return clickButtonByLabel(page, MANAGE_PREFERENCES_LABELS)
}

const TOGGLE_SELECTOR = 'input[type="checkbox"], [role="switch"], [role="checkbox"]'

/** Best-effort reveal of category toggles a CMP renders inside a collapsed accordion section or
 * an inactive tab panel — both are common preference-panel layouts, and a toggle that isn't
 * rendered/visible yet won't be found by the enumeration below. `[aria-expanded="false"]` is the
 * standard ARIA disclosure-widget pattern (used by accordions generally, not any one CMP), and
 * clicking through every `[role="tab"]` once renders each tab panel's content in turn. Run before
 * every search of the page for toggles, whole-page rather than scoped to a single container,
 * since at this point the boundaries of "the panel" aren't yet established — that's exactly what
 * {@link findToggleScope} figures out next. Bounded iteration counts guard against an unrelated
 * accordion/tab widget elsewhere on the page (e.g. an FAQ section) costing unbounded time; clicking
 * one is low-risk (expands UI, doesn't navigate or submit anything) even when unrelated. */
async function revealHiddenSections(page: Page): Promise<void> {
  const collapsedTriggers = page.locator('[aria-expanded="false"]')
  const collapsedCount = await collapsedTriggers.count().catch(() => 0)
  for (let i = 0; i < Math.min(collapsedCount, 20); i++) {
    await collapsedTriggers.nth(i).click({ timeout: 1_000 }).catch(() => {})
  }

  const tabs = page.locator('[role="tab"]')
  const tabCount = await tabs.count().catch(() => 0)
  for (let i = 0; i < Math.min(tabCount, 10); i++) {
    await tabs.nth(i).click({ timeout: 1_000 }).catch(() => {})
  }
}

/** Finds whichever known banner/panel container currently contains at least one toggle — not
 * necessarily "the" visible container in general. Once a preference panel opens, the original
 * banner is often still present (and still visible) in the DOM alongside it; racing for "any
 * visible known container" (as `detectBanner`/`clickButtonByLabel` do, correctly, for finding
 * accept/reject/manage buttons) would frequently re-resolve to the banner instead of the panel,
 * since the banner has no reason to stop matching just because something else opened. Toggles are
 * a much more specific signal for "this is the panel," so every known container is checked (no
 * race needed — by this point the panel should already be rendered) and whichever one actually
 * has toggles wins. Falls back to the whole page when none of the known selectors qualify, so a
 * CMP this scanner doesn't recognize by container still gets a chance rather than reporting
 * nothing found. */
/** `Locator.count()` counts every matching element regardless of visibility — a toggle sitting in
 * a `display:none` panel the page hasn't revealed yet still counts, which would make "does this
 * container have a toggle" true for every page load regardless of what (if anything) was clicked.
 * Visibility is exactly the signal that distinguishes "a category panel is actually showing" from
 * "there happens to be a hidden toggle somewhere in the DOM." */
async function countVisibleToggles(scope: Locator): Promise<number> {
  const toggles = scope.locator(TOGGLE_SELECTOR)
  const count = await toggles.count().catch(() => 0)
  let visible = 0
  for (let i = 0; i < count; i++) {
    if (await toggles.nth(i).isVisible().catch(() => false)) visible++
  }
  return visible
}

async function findToggleScope(page: Page): Promise<Locator> {
  for (const selector of BANNER_CONTAINER_SELECTORS) {
    const container = page.locator(selector).first()
    if (!(await container.isVisible().catch(() => false))) continue
    if ((await countVisibleToggles(container)) > 0) return container
  }
  return page.locator('body')
}

/** Every category toggle found in the now-open preference panel, with its accessible label and
 * whether it's locked (disabled/non-interactive — the "Strictly Necessary, Always Active" case).
 * Best-effort: there is no universal markup convention for a CMP's preference panel across
 * vendors, so this only recognizes standard native checkboxes and ARIA switch/checkbox roles,
 * labeled via `aria-label`, an associated `<label for>`, or `aria-labelledby` — a toggle a CMP
 * renders with none of those (an unlabeled icon-only control) is simply not represented here
 * rather than guessed at, same policy as the rest of this module. */
export async function listPreferenceCategories(page: Page): Promise<PreferenceCategory[]> {
  await revealHiddenSections(page)
  const scope = await findToggleScope(page)
  const toggles = scope.locator(TOGGLE_SELECTOR)
  const count = await toggles.count().catch(() => 0)

  const categories: PreferenceCategory[] = []
  for (let i = 0; i < count; i++) {
    const toggle = toggles.nth(i)
    if (!(await toggle.isVisible().catch(() => false))) continue
    const label = await labelFor(toggle)
    if (!label) continue
    categories.push({ label, locked: await isLocked(toggle) })
  }
  return categories
}

/** `Locator.textContent()` isn't a query like `.count()`/`.getAttribute()`/`.isVisible()` — it's
 * an actionability-waiting call that, for a selector matching nothing, waits the ambient default
 * timeout (30s) before giving up. Every lookup below is speculative ("maybe this exists"), and
 * the common case for at least one of them is that it doesn't — so every call here needs its own
 * short, explicit timeout, or a fixture/CMP that uses `aria-labelledby` instead of `<label for>`
 * (or vice versa) turns each toggle's label lookup into a 30-second stall. */
const LABEL_LOOKUP_TIMEOUT_MS = 500

async function labelFor(toggle: Locator): Promise<string | null> {
  try {
    const ariaLabel = await toggle.getAttribute('aria-label')
    if (ariaLabel?.trim()) return ariaLabel.trim()

    const id = await toggle.getAttribute('id')
    if (id) {
      const text = await toggle
        .page()
        .locator(`label[for="${id}"]`)
        .first()
        .textContent({ timeout: LABEL_LOOKUP_TIMEOUT_MS })
        .catch(() => null)
      if (text?.trim()) return text.trim()
    }

    const labelledBy = await toggle.getAttribute('aria-labelledby')
    const labelledById = labelledBy?.split(' ')[0]
    if (labelledById) {
      const text = await toggle
        .page()
        .locator(`#${labelledById}`)
        .first()
        .textContent({ timeout: LABEL_LOOKUP_TIMEOUT_MS })
        .catch(() => null)
      if (text?.trim()) return text.trim()
    }

    return null
  } catch {
    return null
  }
}

async function isLocked(toggle: Locator): Promise<boolean> {
  const disabled = await toggle.isDisabled().catch(() => false)
  if (disabled) return true
  const ariaDisabled = await toggle.getAttribute('aria-disabled').catch(() => null)
  return ariaDisabled === 'true'
}

async function toggleIsOn(toggle: Locator): Promise<boolean> {
  const role = await toggle.getAttribute('role').catch(() => null)
  if (role === 'switch' || role === 'checkbox') {
    const ariaChecked = await toggle.getAttribute('aria-checked').catch(() => null)
    return ariaChecked === 'true'
  }
  return toggle.isChecked().catch(() => false)
}

/** Sets every non-locked category in the now-open preference panel to match `desired` (label →
 * on/off), clicking a toggle only when its current state doesn't already match — used to isolate
 * one category at a time (`target` on, every other non-locked category off) before Save is
 * clicked, so the resulting captured signals can be attributed to that one category. Locked
 * toggles are left untouched (there's nothing to set). */
export async function applyCategorySelection(page: Page, desired: Map<string, boolean>): Promise<void> {
  await revealHiddenSections(page)
  const scope = await findToggleScope(page)
  const toggles = scope.locator(TOGGLE_SELECTOR)
  const count = await toggles.count().catch(() => 0)

  for (let i = 0; i < count; i++) {
    const toggle = toggles.nth(i)
    if (!(await toggle.isVisible().catch(() => false))) continue
    const label = await labelFor(toggle)
    if (!label || !desired.has(label)) continue
    if (await isLocked(toggle)) continue

    const wantOn = desired.get(label) === true
    const isOn = await toggleIsOn(toggle)
    if (isOn !== wantOn) {
      await toggle.click({ timeout: 2_000 }).catch(() => {})
    }
  }
}

/** Best-effort click of whatever submits/confirms the preference panel's current toggle state. */
export async function savePreferences(page: Page): Promise<boolean> {
  return clickButtonByLabel(page, SAVE_PREFERENCES_LABELS)
}

const ALL_KNOWN_LABELS = [
  ...ACCEPT_ALL_LABELS,
  ...REJECT_ALL_LABELS,
  ...MANAGE_PREFERENCES_LABELS,
  ...SAVE_PREFERENCES_LABELS,
]

/** True when `text` matches one of the accept/reject/manage/save label lists — used to decide
 * which of a banner's buttons still need the click-and-observe behavioral fallback (below)
 * because label-matching couldn't already classify them. */
export function isKnownBannerLabel(text: string): boolean {
  const lower = text.trim().toLowerCase()
  return ALL_KNOWN_LABELS.some(label => lower.includes(label))
}

/** Clicks the first clickable element within the detected banner whose text *exactly* matches
 * `text` (after trimming) — deliberately exact rather than the substring/label-list matching
 * `clickButtonByLabel` uses, since the caller already has this button's precise text from
 * `listBannerButtons` and wants that specific button, not whichever one happens to contain a
 * known phrase. Scoped strictly to the detected banner container and never falls back to a
 * whole-page search (unlike `clickButtonByLabel`) — clicking an arbitrary same-text element
 * elsewhere on the page would defeat the point of behaviorally testing *this* button. Returns
 * whether a click happened. */
export async function clickBannerButtonByExactText(page: Page, text: string): Promise<boolean> {
  const containerSelector = await firstVisibleContainer(page, BANNER_WAIT_TIMEOUT_MS)
  if (!containerSelector) return false
  try {
    const container = page.locator(containerSelector).first()
    const candidates = container.locator(CLICKABLE_SELECTOR)
    const count = await candidates.count()
    for (let i = 0; i < count; i++) {
      const el = candidates.nth(i)
      const elText = ((await el.textContent().catch(() => '')) ?? '').trim()
      if (elText === text) {
        await el.click({ timeout: 2_000 }).catch(() => {})
        return true
      }
    }
    return false
  } catch {
    return false
  }
}
