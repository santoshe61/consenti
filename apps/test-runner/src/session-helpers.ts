import type { ConsentiConfig, DeepPartial } from '@consenti/types'
import type { BrowserSession } from '@consenti/browser-engine'
import { launchSession } from '@consenti/browser-engine'
import { buildFixtureUrl, GPC_STUB_SCRIPT, type FixtureUrlOptions } from './fixture-url.js'
import type { FixtureDescribe, WidgetState } from './types.js'

const READY_TIMEOUT_MS = 10_000

export interface WidgetStateSnapshot {
  banner: 'main' | 'gpc' | false
  modal: 'preference' | false
  ageGateVisible: boolean
}

/** The subset of the fixture's `window` surface Node-side code reaches into via
 * `page.evaluate`. `__widget` mirrors `ConsentiWidgetAPI` — see `apps/ui/src/index.ts`. */
export interface TestRunnerWindow {
  __testRunnerDone?: boolean
  __testRunnerError?: string | null
  __testRunnerState?: () => WidgetStateSnapshot
  __testRunnerDescribe?: () => FixtureDescribe
  __testRunnerScriptPresent?: (cookieId: string) => boolean
  __testRunnerScriptPresentAll?: () => Record<string, boolean>
  __widget?: {
    getConsent: () => Record<string, string> | null
    hasConsent: () => boolean
    bannerVisibility: () => 'main' | 'gpc' | false
    modalVisibility: () => 'preference' | false
    showModal: () => void
    reConsent: (resetAgeGate?: boolean) => Promise<void>
    forgetMe: (resetAgeGate?: boolean) => Promise<void>
    deleteConsent: () => Promise<void>
  }
}

export function matchesTargetState(state: WidgetState, snapshot: WidgetStateSnapshot): boolean {
  switch (state) {
    case 'mainBanner': return snapshot.banner === 'main'
    case 'gpcBanner': return snapshot.banner === 'gpc'
    case 'prefModal': return snapshot.modal === 'preference'
    case 'ageGateModal': return snapshot.ageGateVisible === true
  }
}

// `hideBanner()`/`showModal()` hide the banner via CSS, not by removing it from the DOM — so
// while the preference modal is open, both it and the (hidden) banner are present at once.
// Profile authors commonly reuse the same button id (e.g. `accept-all`) in both
// `mainBanner.buttons` and `preferenceModal.buttons`, so an unscoped `#accept-all` selector
// can resolve to the hidden banner's copy and hang forever waiting for it to become visible.
// Every click/attribute-read must be scoped to the current state's own surface.
export const STATE_SURFACE_SELECTOR: Record<WidgetState, string> = {
  mainBanner: '#consenti-banner',
  gpcBanner: '#consenti-banner',
  prefModal: '#consenti-modal',
  ageGateModal: '#consenti-age-gate',
}

export interface ReachedSession {
  session: BrowserSession
  error: string | null
}

/** Launches a session against the fixture and waits for it to settle (ready resolved, the
 * age-gate DOM poll resolved, or a fixture-side error was caught) — the common first step
 * for both visual capture and every functional check, which then diverge in what they do
 * with the settled session. */
export async function reachFixtureState(fixtureBaseUrl: string, options: FixtureUrlOptions): Promise<ReachedSession> {
  const url = buildFixtureUrl(fixtureBaseUrl, options)
  const session = await launchSession(url, {
    initScripts: options.state === 'gpcBanner' ? [GPC_STUB_SCRIPT] : [],
    // Consenti's banner/modal entrance animations are gated behind
    // `@media (prefers-reduced-motion: no-preference)` — reducing motion here means a
    // screenshot taken the instant the widget reports a state as reached is never a mid-fade,
    // mid-scale frame (the actual cause of the blurry `prefModal` baseline).
    reducedMotion: 'reduce',
    navigationTimeoutMs: 5000
  })

  await session.page.waitForFunction(
    () => (window as unknown as TestRunnerWindow).__testRunnerDone === true,
    undefined,
    { timeout: READY_TIMEOUT_MS },
  )

  const error = await session.page.evaluate(
    () => (window as unknown as TestRunnerWindow).__testRunnerError ?? null,
  )

  return { session, error }
}

export async function getStateSnapshot(session: BrowserSession): Promise<WidgetStateSnapshot> {
  return session.page.evaluate(
    () => (window as unknown as Required<Pick<TestRunnerWindow, '__testRunnerState'>>).__testRunnerState(),
  )
}

export async function describeFixture(session: BrowserSession): Promise<FixtureDescribe> {
  return session.page.evaluate(
    () => (window as unknown as Required<Pick<TestRunnerWindow, '__testRunnerDescribe'>>).__testRunnerDescribe(),
  )
}

export async function getConsent(session: BrowserSession): Promise<Record<string, string> | null> {
  return session.page.evaluate(
    () => (window as unknown as TestRunnerWindow).__widget?.getConsent() ?? null,
  )
}

export async function getScriptPresenceMap(session: BrowserSession): Promise<Record<string, boolean>> {
  return session.page.evaluate(
    () => (window as unknown as Required<Pick<TestRunnerWindow, '__testRunnerScriptPresentAll'>>).__testRunnerScriptPresentAll(),
  )
}

export interface FreshSessionOutcome<T> {
  result: T | null
  error: string | null
  notApplicable: string | null
}

/**
 * Launches a fresh session, reaches `state`, verifies the widget actually got there under
 * real conditions, then runs `fn` against the settled session and always closes it. Shared
 * by every functional check kind — each one only supplies what to do once the session is
 * ready, not the launch/verify/cleanup boilerplate.
 */
export async function withFreshSession<T>(
  fixtureBaseUrl: string,
  jurisdiction: string,
  state: WidgetState,
  locale: string,
  configOptions: DeepPartial<ConsentiConfig> | undefined,
  fn: (session: BrowserSession) => Promise<T>,
): Promise<FreshSessionOutcome<T>> {
  const { session, error } = await reachFixtureState(fixtureBaseUrl, {
    jurisdiction,
    state,
    locale,
    ...(configOptions ? { configOptions } : {}),
  })
  try {
    if (error) return { result: null, error, notApplicable: null }
    const snapshot = await getStateSnapshot(session)
    if (!matchesTargetState(state, snapshot)) {
      return {
        result: null,
        error: null,
        notApplicable: `Widget did not reach state "${state}" for jurisdiction "${jurisdiction}" under real conditions (observed: ${JSON.stringify(snapshot)})`,
      }
    }
    const result = await fn(session)
    return { result, error: null, notApplicable: null }
  } catch (err) {
    return { result: null, error: err instanceof Error ? err.message : String(err), notApplicable: null }
  } finally {
    await session.close()
  }
}
