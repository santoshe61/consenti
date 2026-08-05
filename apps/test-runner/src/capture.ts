import { join } from 'node:path'
import type { ConsentiConfig, DeepPartial } from '@consenti/types'
import { takeScreenshot } from '@consenti/browser-engine'
import { getStateSnapshot, matchesTargetState, reachFixtureState, STATE_SURFACE_SELECTOR } from './session-helpers.js'
import type { CaptureResult, MatrixCombo } from './types.js'

export interface CaptureOptions {
  fixtureBaseUrl: string
  locale: string
  outputDir: string
  configOptions?: DeepPartial<ConsentiConfig>
}

/**
 * Launches one fresh session (fresh context ⇒ no prior consent cookie, exactly the "real
 * conditions" the plan calls for) against the fixture page, waits for the widget to settle,
 * and only screenshots if the widget actually reached the requested state under those real
 * conditions — some jurisdiction/state combos are genuinely unreachable (e.g. `mainBanner`
 * for opt-out groups, which write consent silently and never show a banner). Those come back
 * as `not-applicable`, not a failure.
 */
export async function captureCombo(combo: MatrixCombo, options: CaptureOptions): Promise<CaptureResult> {
  const { jurisdiction, state } = combo

  try {
    const { session, error } = await reachFixtureState(options.fixtureBaseUrl, {
      jurisdiction,
      state,
      locale: options.locale,
      ...(options.configOptions ? { configOptions: options.configOptions } : {}),
    })

    try {
      if (error) return { status: 'error', message: error }

      const snapshot = await getStateSnapshot(session)

      if (!matchesTargetState(state, snapshot)) {
        return {
          status: 'not-applicable',
          reason: `Widget did not reach state "${state}" for jurisdiction "${jurisdiction}" under real conditions (observed: <code>${JSON.stringify(snapshot, null, 2)})</code>`,
        }
      }

      const outputPath = join(options.outputDir, jurisdiction, `${state}.png`)
      // Scoped to the state's own surface rather than a full-page screenshot — the fixture page
      // has no other content, so a full-page capture is 90%+ blank whitespace around a small
      // overlay, which is both a poor manual-review artifact and a noisy pixelmatch target.
      await takeScreenshot(session, outputPath, { selector: STATE_SURFACE_SELECTOR[state] })
      return { status: 'captured', outputPath }
    } finally {
      await session.close()
    }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}
