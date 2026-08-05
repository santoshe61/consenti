import type { ConsentiConfig, DeepPartial } from '@consenti/types'
import {
  describeFixture,
  getConsent,
  getScriptPresenceMap,
  getStateSnapshot,
  STATE_SURFACE_SELECTOR,
  withFreshSession,
  type TestRunnerWindow,
} from './session-helpers.js'
import type { DescribedButton, DescribedCookie, FunctionalCheck, WidgetState } from './types.js'

export interface FunctionalOptions {
  fixtureBaseUrl: string
  locale: string
  configOptions?: DeepPartial<ConsentiConfig>
  /** Invoked the instant each individual check completes, so a caller can stream progress
   * live instead of waiting for the whole (potentially multi-minute) run to finish. */
  onCheck?: (check: FunctionalCheck) => void
}

/** Pushes a check into the running list and streams it out immediately. */
function emit(checks: FunctionalCheck[], check: FunctionalCheck, options: FunctionalOptions): void {
  checks.push(check)
  options.onCheck?.(check)
}

/** Same as `emit`, but for the early-return "here's the whole result set" call sites. */
function emitAll(list: FunctionalCheck[], options: FunctionalOptions): FunctionalCheck[] {
  for (const check of list) options.onCheck?.(check)
  return list
}

/** Every click/attribute-read must be scoped to the current state's own surface — see the
 * `STATE_SURFACE_SELECTOR` doc comment in session-helpers.ts: the banner stays in the DOM
 * (hidden) while the modal is open, and button ids are commonly reused across both. */
function within(state: WidgetState, selector: string): string {
  return `${STATE_SURFACE_SELECTOR[state]} ${selector}`
}

function infraCheck(
  jurisdiction: string,
  state: WidgetState | null,
  kind: FunctionalCheck['kind'],
  target: string,
  description: string,
  outcome: { error: string | null; notApplicable: string | null },
): FunctionalCheck {
  const message = outcome.error ?? outcome.notApplicable ?? undefined
  return {
    jurisdiction, state, kind, target, description,
    expected: null, actual: null,
    status: outcome.error ? 'error' : 'not-applicable',
    ...(message !== undefined ? { message } : {}),
  }
}

// ─── Buttons ────────────────────────────────────────────────────────────────────
//
// Only `action: 'custom'` buttons (accept-all `'*'`, reject-all `'!'`, explicit cookie list)
// have a precisely predictable expected outcome from their config alone — `action: 'submit'`
// in a banner/gpcBanner context additionally depends on preGrant/complianceGroup fallback
// rules (see `submitConsent()` in consenti-setup.ts), which this deliberately does not
// re-implement. Those get a weaker existence/no-crash check instead of a full assertion.

type ExpectedStatus = 'granted' | 'denied' | 'objected'

// `'objected'` (vs. plain `'denied'`) is specific to the preference modal's per-parameter
// toggle off-state (see `modal.ts`'s `offStatus` — legitimate-interest categories render an
// "objected" icon there). Banner-level custom-action buttons don't have that distinction:
// `onDenyAll()`/`onGrantSpecific()` in `consenti-setup.ts` always write plain `'denied'` for
// every non-granted, non-mandatory cookie regardless of legal basis — verified directly
// against `_buildDenyAllConsent()`/`onGrantSpecific()`, not assumed.
function expectedConsentForButton(
  button: DescribedButton,
  cookies: DescribedCookie[],
): Record<string, ExpectedStatus> | null {
  if (button.action !== 'custom') return null
  const result: Record<string, ExpectedStatus> = {}
  for (const cookie of cookies) {
    if (cookie.mandatory) { result[cookie.id] = 'granted'; continue }
    if (button.cookies === '*') result[cookie.id] = 'granted'
    else if (button.cookies === '!') result[cookie.id] = 'denied'
    else if (Array.isArray(button.cookies)) result[cookie.id] = button.cookies.includes(cookie.id) ? 'granted' : 'denied'
    else result[cookie.id] = 'denied'
  }
  return result
}

export async function runButtonChecks(jurisdiction: string, state: WidgetState, options: FunctionalOptions): Promise<FunctionalCheck[]> {
  if (state !== 'mainBanner' && state !== 'gpcBanner' && state !== 'prefModal') return []

  const described = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, describeFixture)
  if (described.error || described.notApplicable || !described.result) {
    return emitAll([infraCheck(jurisdiction, state, 'button', '(describe)', `Describing buttons for ${state}`, described)], options)
  }

  const { buttons, cookies } = described.result
  const checks: FunctionalCheck[] = []

  for (const button of buttons) {
    if (button.action !== 'custom') {
      // Weak check: click it and confirm the widget didn't throw / left a sane surface state.
      // action==='manage' should open the modal; action==='close' should hide the banner
      // without writing consent; action==='submit' in this context isn't precisely predictable
      // here (see module doc) so only "didn't error" is asserted.
      const outcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, async session => {
        await session.page.click(within(state, `#${button.id}`))
        await session.page.waitForTimeout(150)
        return {
          modal: await session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.modalVisibility() ?? false),
          banner: await session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.bannerVisibility() ?? false),
        }
      })
      if (outcome.error) {
        emit(checks, infraCheck(jurisdiction, state, 'button', button.id, `Click "${button.id}" (action=${button.action})`, outcome), options)
        continue
      }
      if (outcome.notApplicable || !outcome.result) {
        emit(checks, infraCheck(jurisdiction, state, 'button', button.id, `Click "${button.id}" (action=${button.action})`, outcome), options)
        continue
      }
      const pass = button.action === 'manage' ? outcome.result.modal === 'preference' : true
      emit(checks, {
        jurisdiction, state, kind: 'button', target: button.id,
        description: `Click "${button.id}" (action=${button.action}) — smoke check only, see module doc`,
        expected: button.action === 'manage' ? 'preference' : 'no crash',
        actual: button.action === 'manage' ? outcome.result.modal : 'no crash',
        status: pass ? 'pass' : 'fail',
        ...(pass ? {} : { message: 'Expected the preference modal to open after clicking a manage-action button' }),
      }, options)
      continue
    }

    const expected = expectedConsentForButton(button, cookies)
    const outcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, async session => {
      await session.page.click(within(state, `#${button.id}`))
      await session.page.waitForTimeout(150)
      return getConsent(session)
    })

    if (outcome.error || outcome.notApplicable) {
      emit(checks, infraCheck(jurisdiction, state, 'button', button.id, `Click "${button.id}" (cookies=${JSON.stringify(button.cookies)})`, outcome), options)
      continue
    }

    const actual = outcome.result
    const pass = actual !== null && expected !== null && Object.keys(expected).every(id => actual[id] === expected[id])
    emit(checks, {
      jurisdiction, state, kind: 'button', target: button.id,
      description: `Click "${button.id}" (action=custom, cookies=${JSON.stringify(button.cookies)})`,
      expected, actual, status: pass ? 'pass' : 'fail',
      ...(pass ? {} : { message: 'Consent after click did not match the grant this button\'s config implies' }),
    }, options)

    // Human mistake: double-clicking a button. A fresh session, clicked twice back-to-back
    // with no settle time in between, must land on exactly the same consent a single click
    // would produce — not a duplicated/half-applied write from a non-idempotent handler.
    // The second "click" is a dispatched DOM click event rather than a real Playwright mouse
    // click: `hide()` sets `display: none` synchronously inside the first click's own handler
    // (see `onGrantAll`/`onDenyAll` in consenti-setup.ts), and Playwright's `.click()` can't
    // compute mouse coordinates for a `display: none` element — even with `force`. A real
    // double-click's second event targets whatever node the OS captured at mousedown
    // regardless of what the page did in between, which `dispatchEvent` reproduces here — but
    // only if that node is still attached: `onSubmit`'s modal path calls `hideModal()`, which
    // removes the modal (and its button) from the DOM outright, and a real second click can no
    // more land on a detached node than this fixture can dispatch one to it.
    const doubleClickOutcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, async session => {
      const selector = within(state, `#${button.id}`)
      await session.page.click(selector)
      const stillAttached = (await session.page.locator(selector).count()) > 0
      if (stillAttached) await session.page.dispatchEvent(selector, 'click')
      await session.page.waitForTimeout(150)
      return { stillAttached, consent: await getConsent(session) }
    })

    if (doubleClickOutcome.error || doubleClickOutcome.notApplicable || !doubleClickOutcome.result) {
      emit(checks, infraCheck(jurisdiction, state, 'button', `${button.id}(double-click)`, `Double-click "${button.id}" in quick succession`, doubleClickOutcome), options)
      continue
    }

    const { stillAttached, consent: doubleActual } = doubleClickOutcome.result
    if (!stillAttached) {
      emit(checks, {
        jurisdiction, state, kind: 'button', target: `${button.id}(double-click)`,
        description: `Double-click "${button.id}" in quick succession (action=custom, cookies=${JSON.stringify(button.cookies)})`,
        expected: 'button removed from DOM after first click — no second click possible', actual: 'button removed from DOM',
        status: 'not-applicable', message: `"${button.id}" and its surface are removed from the DOM by the first click, so a real second click has nothing to land on`,
      }, options)
      continue
    }

    const doublePass = doubleActual !== null && expected !== null && Object.keys(expected).every(id => doubleActual[id] === expected[id])
    emit(checks, {
      jurisdiction, state, kind: 'button', target: `${button.id}(double-click)`,
      description: `Double-click "${button.id}" in quick succession (action=custom, cookies=${JSON.stringify(button.cookies)}) — must be idempotent`,
      expected, actual: doubleActual, status: doublePass ? 'pass' : 'fail',
      ...(doublePass ? {} : { message: 'Rapid double-click produced a different consent result than a single click — the handler is not idempotent' }),
    }, options)
  }

  return checks
}

// ─── Category toggles ──────────────────────────────────────────────────────────
//
// The master toggle's click behavior is documented in modal.ts: from `'mixed'`/`'denied'` it
// grants every member cookie; from `'allowed'` it denies them all. Reading the toggle's
// `aria-checked` immediately before clicking, rather than trying to predict the *initial*
// state (which depends on preGrant/legalBasis defaults this deliberately doesn't
// re-implement), makes the expected outcome exact without hardcoding any profile's defaults.

function categoryToggleSelector(state: WidgetState, categoryId: string): string {
  return within(state, `[aria-labelledby="consenti-cat-${categoryId}-heading"]`)
}

export async function runCategoryChecks(jurisdiction: string, options: FunctionalOptions): Promise<FunctionalCheck[]> {
  const state: WidgetState = 'prefModal'

  const described = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, describeFixture)
  if (described.error || described.notApplicable || !described.result) {
    return emitAll([infraCheck(jurisdiction, state, 'category', '(describe)', 'Describing categories for prefModal', described)], options)
  }

  const { categories, buttons } = described.result
  const saveButton = buttons.find(b => b.action === 'submit')
  if (!saveButton) {
    return emitAll([{
      jurisdiction, state, kind: 'category', target: '(save button)',
      description: 'Locate the preference modal\'s save/submit button',
      expected: 'a button with action=submit', actual: buttons.map(b => b.action),
      status: 'not-applicable', message: 'No submit-action button found in preferenceModal.buttons',
    }], options)
  }

  const checks: FunctionalCheck[] = []

  for (const category of categories) {
    if (category.legalBasis === 'mandatory') continue // toggle is non-interactive by design

    const toggleSelector = categoryToggleSelector(state, category.id)
    const offStatus: ExpectedStatus = category.legalBasis === 'legitimate_interest' ? 'objected' : 'denied'

    const outcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, async session => {
      const preChecked = await session.page.getAttribute(toggleSelector, 'aria-checked')
      await session.page.click(toggleSelector)
      await session.page.click(within(state, `#${saveButton.id}`))
      await session.page.waitForTimeout(150)
      const consent = await getConsent(session)
      return { preChecked, consent }
    })

    if (outcome.error || outcome.notApplicable || !outcome.result) {
      emit(checks, infraCheck(jurisdiction, state, 'category', category.id, `Toggle category "${category.id}"`, outcome), options)
      continue
    }

    const { preChecked, consent } = outcome.result
    const expectedMemberStatus: ExpectedStatus = preChecked === 'true' ? offStatus : 'granted'
    const expected: Record<string, ExpectedStatus> = {}
    for (const cookieId of category.cookieIds) expected[cookieId] = expectedMemberStatus

    const pass = consent !== null && category.cookieIds.every(id => consent[id] === expectedMemberStatus)
    emit(checks, {
      jurisdiction, state, kind: 'category', target: category.id,
      description: `Toggle category "${category.id}" (was aria-checked="${preChecked}") and save`,
      expected, actual: consent, status: pass ? 'pass' : 'fail',
      ...(pass ? {} : { message: `Expected every member cookie at "${expectedMemberStatus}" after toggle+save` }),
    }, options)

    // Human mistake: clicking a toggle twice before saving (on-then-off, or off-then-on).
    // Net effect should be a no-op — the widget must not net-apply the transient middle click.
    const doubleOutcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, async session => {
      const preChecked2 = await session.page.getAttribute(toggleSelector, 'aria-checked')
      await session.page.click(toggleSelector)
      await session.page.click(toggleSelector)
      await session.page.click(within(state, `#${saveButton.id}`))
      await session.page.waitForTimeout(150)
      const consent2 = await getConsent(session)
      return { preChecked: preChecked2, consent: consent2 }
    })

    if (doubleOutcome.error || doubleOutcome.notApplicable || !doubleOutcome.result) {
      emit(checks, infraCheck(jurisdiction, state, 'category', `${category.id}(double-toggle)`, `Toggle category "${category.id}" twice (net no-op) then save`, doubleOutcome), options)
      continue
    }

    const doublePreChecked = doubleOutcome.result.preChecked
    const doubleConsent = doubleOutcome.result.consent
    const unchangedStatus: ExpectedStatus = doublePreChecked === 'true' ? 'granted' : offStatus
    const doubleExpected: Record<string, ExpectedStatus> = {}
    for (const cookieId of category.cookieIds) doubleExpected[cookieId] = unchangedStatus

    const doublePass = doubleConsent !== null && category.cookieIds.every(id => doubleConsent[id] === unchangedStatus)
    emit(checks, {
      jurisdiction, state, kind: 'category', target: `${category.id}(double-toggle)`,
      description: `Toggle category "${category.id}" twice (was aria-checked="${doublePreChecked}") — net no-op — then save`,
      expected: doubleExpected, actual: doubleConsent, status: doublePass ? 'pass' : 'fail',
      ...(doublePass ? {} : { message: `Toggling twice should leave "${category.id}" exactly where it started ("${unchangedStatus}") — the widget net-applied a transient click` }),
    }, options)
  }

  return checks
}

// ─── Combined multi-category toggle ─────────────────────────────────────────────
//
// `runCategoryChecks` above only ever toggles one category per fresh session — a
// simplification for a precise per-category assertion, but not how real visitors behave:
// they open the modal, flip several categories, then save once. That flow is untested
// (and never exercises a genuinely *mixed* consent state, since script-gating checks
// elsewhere only ever assert the all-granted / all-denied extremes). This toggles every
// other non-mandatory category — leaving the rest untouched — in one session and a single
// save, then asserts every category (touched or not) landed correctly, plus that the
// resulting mixed grant gates each cookie's script independently and correctly.

export async function runCombinedCategoryChecks(jurisdiction: string, options: FunctionalOptions): Promise<FunctionalCheck[]> {
  const state: WidgetState = 'prefModal'

  const described = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, describeFixture)
  if (described.error || described.notApplicable || !described.result) {
    return emitAll([infraCheck(jurisdiction, state, 'category', '(combined-describe)', 'Describing categories ahead of the combined multi-toggle check', described)], options)
  }

  const { categories, buttons } = described.result
  const saveButton = buttons.find(b => b.action === 'submit')
  const toggleable = categories.filter(c => c.legalBasis !== 'mandatory')

  if (!saveButton || toggleable.length < 2) {
    return emitAll([{
      jurisdiction, state, kind: 'category', target: '(combined)',
      description: 'Toggle a subset of categories (leaving the rest untouched) in one session, then save once',
      expected: 'a submit button and 2+ non-mandatory categories',
      actual: { hasSaveButton: !!saveButton, toggleableCount: toggleable.length },
      status: 'not-applicable', message: 'This profile does not have enough independent categories to exercise a combined multi-category save',
    }], options)
  }

  const toClick = new Set(toggleable.filter((_, i) => i % 2 === 0).map(c => c.id))

  const outcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, state, options.locale, options.configOptions, async session => {
    const preChecked: Record<string, string | null> = {}
    for (const category of toggleable) {
      const selector = categoryToggleSelector(state, category.id)
      preChecked[category.id] = await session.page.getAttribute(selector, 'aria-checked')
      if (toClick.has(category.id)) await session.page.click(selector)
    }
    await session.page.click(within(state, `#${saveButton.id}`))
    await session.page.waitForTimeout(150)
    const consent = await getConsent(session)
    const scriptsPresent = await getScriptPresenceMap(session)
    return { preChecked, consent, scriptsPresent }
  })

  if (outcome.error || outcome.notApplicable || !outcome.result) {
    return emitAll([infraCheck(jurisdiction, state, 'category', '(combined)', 'Toggle a subset of categories (leaving the rest untouched) in one session, then save once', outcome)], options)
  }

  const { preChecked, consent, scriptsPresent } = outcome.result
  const checks: FunctionalCheck[] = []

  for (const category of toggleable) {
    const offStatus: ExpectedStatus = category.legalBasis === 'legitimate_interest' ? 'objected' : 'denied'
    const wasChecked = preChecked[category.id] === 'true'
    const clicked = toClick.has(category.id)
    // Clicked categories flip; untouched ones must land exactly where they started —
    // toggling one category must never bleed into another's saved consent.
    const expectedMemberStatus: ExpectedStatus = clicked
      ? (wasChecked ? offStatus : 'granted')
      : (wasChecked ? 'granted' : offStatus)
    const expected: Record<string, ExpectedStatus> = {}
    for (const cookieId of category.cookieIds) expected[cookieId] = expectedMemberStatus

    const pass = consent !== null && category.cookieIds.every(id => consent[id] === expectedMemberStatus)
    emit(checks, {
      jurisdiction, state, kind: 'category', target: `${category.id}(combined${clicked ? '' : '/untouched'})`,
      description: clicked
        ? `Toggle "${category.id}" alongside other categories in the same session (was aria-checked="${preChecked[category.id]}"), save once`
        : `Leave "${category.id}" untouched while toggling other categories in the same session, save once`,
      expected, actual: consent, status: pass ? 'pass' : 'fail',
      ...(pass ? {} : {
        message: clicked
          ? `Combined save: expected every member cookie of "${category.id}" at "${expectedMemberStatus}"`
          : `Combined save: toggling other categories must not change "${category.id}" — expected it to stay at "${expectedMemberStatus}"`,
      }),
    }, options)

    for (const cookieId of category.cookieIds) {
      const expectedGranted = expected[cookieId] === 'granted'
      const isPresent = scriptsPresent[cookieId] === true
      const gatingPass = expectedGranted === isPresent
      emit(checks, {
        jurisdiction, state, kind: 'script-gating', target: `${cookieId}(combined)`,
        description: `Gated script presence after a combined multi-category save (category "${category.id}")`,
        expected: expectedGranted, actual: isPresent, status: gatingPass ? 'pass' : 'fail',
        ...(gatingPass ? {} : { message: `Cookie "${cookieId}" consent is "${consent?.[cookieId] ?? 'unknown'}" after a combined save but its gated script presence is ${isPresent}` }),
      }, options)
    }
  }

  return checks
}

// ─── Script gating ──────────────────────────────────────────────────────────────
//
// The invariant tested — "a gated script is present iff its cookie's consent is currently
// 'granted'" — holds regardless of a jurisdiction's opt-in/opt-out defaults, so this doesn't
// need to hardcode "must be absent initially": for an opt-out jurisdiction where some cookies
// are silently pre-granted, the correct expectation is that their scripts are already present
// at the baseline checkpoint, and this asserts exactly that rather than assuming opt-in-only
// behavior.

const SCRIPT_GATING_BOOT_STATE: WidgetState = 'mainBanner'

function gatingCheck(
  jurisdiction: string,
  cookieId: string,
  checkpoint: string,
  consent: Record<string, string> | null,
  present: Record<string, boolean>,
): FunctionalCheck {
  const granted = consent?.[cookieId] === 'granted'
  const isPresent = present[cookieId] === true
  const pass = granted === isPresent
  return {
    jurisdiction, state: null, kind: 'script-gating', target: cookieId,
    description: `Gated script presence ${checkpoint}`,
    expected: granted, actual: isPresent, status: pass ? 'pass' : 'fail',
    ...(pass ? {} : { message: `Cookie "${cookieId}" consent is "${consent?.[cookieId] ?? 'unknown'}" but its gated script presence is ${isPresent}` }),
  }
}

export async function runScriptGatingChecks(jurisdiction: string, options: FunctionalOptions): Promise<FunctionalCheck[]> {
  const checks: FunctionalCheck[] = []

  const acceptOutcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, SCRIPT_GATING_BOOT_STATE, options.locale, options.configOptions, async session => {
    const describe = await describeFixture(session)
    const beforeConsent = await getConsent(session)
    const before = await getScriptPresenceMap(session)

    const acceptButton = describe.buttons.find(b => b.action === 'custom' && b.cookies === '*')
    let afterConsent: Record<string, string> | null = null
    let after: Record<string, boolean> | null = null
    if (acceptButton) {
      await session.page.click(within(SCRIPT_GATING_BOOT_STATE, `#${acceptButton.id}`))
      await session.page.waitForTimeout(150)
      afterConsent = await getConsent(session)
      after = await getScriptPresenceMap(session)
    }
    return { cookies: describe.cookies, beforeConsent, before, acceptButtonId: acceptButton?.id ?? null, afterConsent, after }
  })

  if (acceptOutcome.error || acceptOutcome.notApplicable || !acceptOutcome.result) {
    emit(checks, infraCheck(jurisdiction, null, 'script-gating', '(accept-path)', 'Script gating: baseline + accept-all path', acceptOutcome), options)
  } else {
    const { cookies, beforeConsent, before, acceptButtonId, afterConsent, after } = acceptOutcome.result
    for (const cookie of cookies) emit(checks, gatingCheck(jurisdiction, cookie.id, 'at baseline (before any click)', beforeConsent, before), options)
    if (acceptButtonId && after && afterConsent) {
      for (const cookie of cookies) emit(checks, gatingCheck(jurisdiction, cookie.id, `after clicking "${acceptButtonId}"`, afterConsent, after), options)
    } else {
      emit(checks, {
        jurisdiction, state: null, kind: 'script-gating', target: '(accept button)',
        description: 'Locate an accept-all (cookies="*") button', expected: 'a button with cookies="*"', actual: null,
        status: 'not-applicable', message: 'No accept-all button found for this jurisdiction',
      }, options)
    }
  }

  const rejectOutcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, SCRIPT_GATING_BOOT_STATE, options.locale, options.configOptions, async session => {
    const describe = await describeFixture(session)
    const rejectButton = describe.buttons.find(b => b.action === 'custom' && b.cookies === '!')
    let afterConsent: Record<string, string> | null = null
    let after: Record<string, boolean> | null = null
    if (rejectButton) {
      await session.page.click(within(SCRIPT_GATING_BOOT_STATE, `#${rejectButton.id}`))
      await session.page.waitForTimeout(150)
      afterConsent = await getConsent(session)
      after = await getScriptPresenceMap(session)
    }
    return { cookies: describe.cookies, rejectButtonId: rejectButton?.id ?? null, afterConsent, after }
  })

  if (rejectOutcome.error || rejectOutcome.notApplicable || !rejectOutcome.result) {
    emit(checks, infraCheck(jurisdiction, null, 'script-gating', '(reject-path)', 'Script gating: reject-all path', rejectOutcome), options)
  } else {
    const { cookies, rejectButtonId, afterConsent, after } = rejectOutcome.result
    if (rejectButtonId && after && afterConsent) {
      for (const cookie of cookies) emit(checks, gatingCheck(jurisdiction, cookie.id, `after clicking "${rejectButtonId}"`, afterConsent, after), options)
    } else {
      emit(checks, {
        jurisdiction, state: null, kind: 'script-gating', target: '(reject button)',
        description: 'Locate a reject-all (cookies="!") button', expected: 'a button with cookies="!"', actual: null,
        status: 'not-applicable', message: 'No reject-all button found for this jurisdiction',
      }, options)
    }
  }

  return checks
}

// ─── Lifecycle: reConsent / forgetMe / deleteConsent ────────────────────────────

const LIFECYCLE_BOOT_STATE: WidgetState = 'mainBanner'

function lifecycleCheck(jurisdiction: string, target: string, pass: boolean, expected: unknown, actual: unknown, description: string): FunctionalCheck {
  return {
    jurisdiction, state: null, kind: 'lifecycle', target, description,
    expected, actual, status: pass ? 'pass' : 'fail',
    ...(pass ? {} : { message: description }),
  }
}

export async function runLifecycleChecks(jurisdiction: string, options: FunctionalOptions): Promise<FunctionalCheck[]> {
  const outcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, LIFECYCLE_BOOT_STATE, options.locale, options.configOptions, async session => {
    const describe = await describeFixture(session)
    const acceptButton = describe.buttons.find(b => b.action === 'custom' && b.cookies === '*')
    if (!acceptButton) return { skipped: true as const }

    const click = async () => { await session.page.click(within(LIFECYCLE_BOOT_STATE, `#${acceptButton.id}`)); await session.page.waitForTimeout(150) }
    const hasConsent = () => session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.hasConsent() ?? false)
    const bannerVisibility = () => session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.bannerVisibility() ?? false)
    const reConsent = () => session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.reConsent())
    const forgetMe = () => session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.forgetMe())
    const deleteConsent = () => session.page.evaluate(() => (window as unknown as TestRunnerWindow).__widget?.deleteConsent())

    await click()
    const hasConsentAfterAccept = await hasConsent()

    await reConsent()
    await session.page.waitForTimeout(150)
    const hasConsentAfterReConsent = await hasConsent()
    const bannerAfterReConsent = await bannerVisibility()

    await click()
    await forgetMe()
    await session.page.waitForTimeout(150)
    const hasConsentAfterForgetMe = await hasConsent()

    await click()
    await deleteConsent()
    await session.page.waitForTimeout(150)
    const hasConsentAfterDelete = await hasConsent()

    return {
      skipped: false as const,
      hasConsentAfterAccept, hasConsentAfterReConsent, bannerAfterReConsent,
      hasConsentAfterForgetMe, hasConsentAfterDelete,
    }
  })

  if (outcome.error || outcome.notApplicable || !outcome.result) {
    return emitAll([infraCheck(jurisdiction, null, 'lifecycle', '(lifecycle)', 'Consent lifecycle: accept → reConsent → forgetMe → deleteConsent', outcome)], options)
  }

  if (outcome.result.skipped) {
    return emitAll([{
      jurisdiction, state: null, kind: 'lifecycle', target: '(accept button)',
      description: 'Locate an accept-all button to seed consent for lifecycle testing',
      expected: 'a button with cookies="*"', actual: null,
      status: 'not-applicable', message: 'No accept-all button found for this jurisdiction',
    }], options)
  }

  const r = outcome.result
  return emitAll([
    lifecycleCheck(jurisdiction, 'accept', r.hasConsentAfterAccept === true, true, r.hasConsentAfterAccept, 'hasConsent() should be true immediately after accepting'),
    lifecycleCheck(jurisdiction, 'reConsent-clears', r.hasConsentAfterReConsent === false, false, r.hasConsentAfterReConsent, 'reConsent() should clear stored consent'),
    lifecycleCheck(jurisdiction, 'reConsent-reshows-banner', r.bannerAfterReConsent === 'main' || r.bannerAfterReConsent === 'gpc', 'main or gpc', r.bannerAfterReConsent, 'reConsent() should re-show the banner'),
    lifecycleCheck(jurisdiction, 'forgetMe-clears', r.hasConsentAfterForgetMe === false, false, r.hasConsentAfterForgetMe, 'forgetMe() should clear stored consent'),
    lifecycleCheck(jurisdiction, 'deleteConsent-clears', r.hasConsentAfterDelete === false, false, r.hasConsentAfterDelete, 'deleteConsent() should clear stored consent'),
  ], options)
}

// ─── Age gate ───────────────────────────────────────────────────────────────────
//
// `runFunctionalChecks` used to drop `ageGateModal` entirely — it only existed so visual
// capture could screenshot the prompt. That left the age gate's actual branching logic (see
// `resolveAgeGate()` in consenti-setup.ts) with zero functional coverage: confirming must
// hand off to the normal flow, and declining — with no `requireParentalConsent` configured
// (the fixture only forces `{ enabled: true, minimumAge: 16 }`, see fixture.js) — must
// silently submit a deny-all consent (mandatory cookies still granted) and never show the
// banner.

const AGE_GATE_STATE: WidgetState = 'ageGateModal'
const AGE_GATE_CONFIRM_SELECTOR = '#consenti-age-gate .consenti-btn--primary'
const AGE_GATE_DECLINE_SELECTOR = '#consenti-age-gate .consenti-btn--secondary'

export async function runAgeGateChecks(jurisdiction: string, options: FunctionalOptions): Promise<FunctionalCheck[]> {
  const described = await withFreshSession(options.fixtureBaseUrl, jurisdiction, AGE_GATE_STATE, options.locale, options.configOptions, describeFixture)
  if (described.error || described.notApplicable || !described.result) {
    return emitAll([infraCheck(jurisdiction, AGE_GATE_STATE, 'age-gate', '(describe)', 'Describing cookies ahead of age-gate checks', described)], options)
  }
  const { cookies } = described.result
  const checks: FunctionalCheck[] = []

  const confirmOutcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, AGE_GATE_STATE, options.locale, options.configOptions, async session => {
    await session.page.click(AGE_GATE_CONFIRM_SELECTOR)
    await session.page.waitForTimeout(150)
    return getStateSnapshot(session)
  })
  if (confirmOutcome.error || confirmOutcome.notApplicable || !confirmOutcome.result) {
    emit(checks, infraCheck(jurisdiction, AGE_GATE_STATE, 'age-gate', 'confirm', 'Confirm the age gate ("Yes") and resume the normal consent flow', confirmOutcome), options)
  } else {
    const pass = confirmOutcome.result.ageGateVisible === false
    emit(checks, {
      jurisdiction, state: AGE_GATE_STATE, kind: 'age-gate', target: 'confirm',
      description: 'Click "Yes" on the age gate',
      expected: 'age gate dismissed, normal consent flow resumes',
      actual: `ageGateVisible=${confirmOutcome.result.ageGateVisible}, banner=${confirmOutcome.result.banner}, modal=${confirmOutcome.result.modal}`,
      status: pass ? 'pass' : 'fail',
      ...(pass ? {} : { message: 'The age gate should be removed from the DOM immediately after confirming' }),
    }, options)
  }

  const declineOutcome = await withFreshSession(options.fixtureBaseUrl, jurisdiction, AGE_GATE_STATE, options.locale, options.configOptions, async session => {
    await session.page.click(AGE_GATE_DECLINE_SELECTOR)
    await session.page.waitForTimeout(150)
    const snapshot = await getStateSnapshot(session)
    const consent = await getConsent(session)
    return { snapshot, consent }
  })
  if (declineOutcome.error || declineOutcome.notApplicable || !declineOutcome.result) {
    emit(checks, infraCheck(jurisdiction, AGE_GATE_STATE, 'age-gate', 'decline', 'Decline the age gate ("No") with no parental-consent requirement configured', declineOutcome), options)
  } else {
    const { snapshot, consent } = declineOutcome.result
    const expected: Record<string, ExpectedStatus> = {}
    for (const cookie of cookies) expected[cookie.id] = cookie.mandatory ? 'granted' : 'denied'
    const consentPass = consent !== null && cookies.every(c => consent[c.id] === expected[c.id])
    const silentPass = snapshot.ageGateVisible === false && snapshot.banner === false
    const pass = consentPass && silentPass
    emit(checks, {
      jurisdiction, state: AGE_GATE_STATE, kind: 'age-gate', target: 'decline',
      description: 'Click "No" on the age gate (no requireParentalConsent configured)',
      expected: { consent: expected, banner: false, ageGateVisible: false },
      actual: { consent, banner: snapshot.banner, ageGateVisible: snapshot.ageGateVisible },
      status: pass ? 'pass' : 'fail',
      ...(pass ? {} : { message: 'Declining should silently submit a deny-all consent (mandatory cookies still granted) and must never show the banner' }),
    }, options)
  }

  return checks
}

// ─── Orchestrator ───────────────────────────────────────────────────────────────

export async function runFunctionalChecks(jurisdictions: string[], states: WidgetState[], options: FunctionalOptions): Promise<FunctionalCheck[]> {
  const checks: FunctionalCheck[] = []
  const nonAgeGateStates = states.filter((s): s is Exclude<WidgetState, 'ageGateModal'> => s !== 'ageGateModal')
  const includeAgeGate = states.includes('ageGateModal')

  for (const jurisdiction of jurisdictions) {
    for (const state of nonAgeGateStates) {
      checks.push(...await runButtonChecks(jurisdiction, state, options))
      if (state === 'prefModal') {
        checks.push(...await runCategoryChecks(jurisdiction, options))
        checks.push(...await runCombinedCategoryChecks(jurisdiction, options))
      }
    }
    if (nonAgeGateStates.length > 0) {
      checks.push(...await runScriptGatingChecks(jurisdiction, options))
      checks.push(...await runLifecycleChecks(jurisdiction, options))
    }
    if (includeAgeGate) {
      checks.push(...await runAgeGateChecks(jurisdiction, options))
    }
  }

  return checks
}
