import type { ConsentiConfig, DeepPartial } from '@consenti/types'
import { AxeBuilder } from '@axe-core/playwright'
import {
  getStateSnapshot,
  matchesTargetState,
  reachFixtureState,
  STATE_SURFACE_SELECTOR,
} from './session-helpers.js'
import type { WidgetState } from './types.js'

/** a11y coverage is scoped to the two states a visitor actually reads/interacts with —
 * `gpcBanner` and `ageGateModal` share the same markup patterns as these two and aren't
 * separately checked to keep CI runtime bounded. */
export type A11yState = Extract<WidgetState, 'mainBanner' | 'prefModal'>

export interface A11yCombo {
  jurisdiction: string
  state: A11yState
}

export interface A11yViolation {
  id: string
  impact: string | null
  description: string
  help: string
  helpUrl: string
  nodeCount: number
}

export type A11yOutcome =
  | { status: 'pass'; combo: A11yCombo }
  | { status: 'fail'; combo: A11yCombo; violations: A11yViolation[] }
  | { status: 'not-applicable'; combo: A11yCombo; reason: string }
  | { status: 'error'; combo: A11yCombo; message: string }

export interface A11yOptions {
  fixtureBaseUrl: string
  locale: string
  configOptions?: DeepPartial<ConsentiConfig>
}

// `minor`/`moderate` violations are collected by axe but don't fail CI — they're worth fixing
// but not worth blocking every PR over; `serious`/`critical` back the "AA-oriented" claim (#2)
// with an actual regression gate.
const FAILING_IMPACTS = new Set(['serious', 'critical'])

/**
 * Runs axe-core against one jurisdiction/state combo's own surface (banner or modal — never
 * the full fixture page, which is otherwise empty chrome). Mirrors `captureCombo` in
 * capture.ts: same not-applicable handling for combos the widget can't actually reach (e.g.
 * `mainBanner` for opt-out groups, which write consent silently and never show one).
 */
export async function runA11yCheck(combo: A11yCombo, options: A11yOptions): Promise<A11yOutcome> {
  const { jurisdiction, state } = combo

  try {
    const { session, error } = await reachFixtureState(options.fixtureBaseUrl, {
      jurisdiction,
      state,
      locale: options.locale,
      ...(options.configOptions ? { configOptions: options.configOptions } : {}),
    })

    try {
      if (error) return { status: 'error', combo, message: error }

      const snapshot = await getStateSnapshot(session)
      if (!matchesTargetState(state, snapshot)) {
        return {
          status: 'not-applicable',
          combo,
          reason: `Widget did not reach state "${state}" for jurisdiction "${jurisdiction}" under real conditions (observed: ${JSON.stringify(snapshot)})`,
        }
      }

      const results = await new AxeBuilder({ page: session.page })
        .include(STATE_SURFACE_SELECTOR[state])
        // WCAG 2.x AA is the accessibility target Consenti's docs actually claim — scope the
        // ruleset to match rather than flagging AAA-only rules nothing here promises.
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const violations = results.violations.filter(v => FAILING_IMPACTS.has(v.impact ?? ''))
      if (violations.length === 0) return { status: 'pass', combo }

      return {
        status: 'fail',
        combo,
        violations: violations.map(v => ({
          id: v.id,
          impact: v.impact ?? null,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodeCount: v.nodes.length,
        })),
      }
    } finally {
      await session.close()
    }
  } catch (err) {
    return { status: 'error', combo, message: err instanceof Error ? err.message : String(err) }
  }
}
