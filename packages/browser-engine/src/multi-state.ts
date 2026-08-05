import { join } from 'node:path'
import { captureSignals } from './capture.js'
import { launchSession } from './session.js'
import { takeScreenshot } from './screenshot.js'
import type { MultiStateOptions, MultiStateResult, StateStep } from './types.js'

const DEFAULT_SETTLE_TIMEOUT_MS = 2_000

export async function runMultiState(
  url: string,
  states: StateStep[],
  options: MultiStateOptions = {}
): Promise<Record<string, MultiStateResult>> {
  const results: Record<string, MultiStateResult> = {}

  for (const state of states) {
    const session = await launchSession(url, options)
    try {
      await state.apply?.(session)
      await session.page.waitForTimeout(options.settleTimeoutMs ?? DEFAULT_SETTLE_TIMEOUT_MS)

      const signals = await captureSignals(session)
      const screenshotPath = state.screenshot
        ? await takeScreenshot(session, join(options.outputDir ?? '.', `${state.name}.png`))
        : null

      results[state.name] = { signals, screenshotPath }
    } finally {
      await session.close()
    }
  }

  return results
}
