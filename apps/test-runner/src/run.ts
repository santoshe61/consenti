import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { captureCombo } from './capture.js'
import { diffAgainstBaseline } from './diff.js'
import { runFunctionalChecks } from './functional.js'
import { startFixtureServer } from './fixture-server.js'
import { writeHtmlReport } from './report.js'
import type { ComboOutcome, FunctionalCheck, MatrixCombo, RunConfig, RunHooks, RunReport } from './types.js'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const UI_DIST_INDEX = join(PACKAGE_ROOT, '..', '..', 'apps', 'ui', 'dist', 'index.mjs')

function buildMatrix(config: RunConfig): MatrixCombo[] {
  const combos: MatrixCombo[] = []
  for (const jurisdiction of config.jurisdictions) {
    for (const state of config.states) {
      combos.push({ jurisdiction, state })
    }
  }
  return combos
}

async function runVisual(config: RunConfig, fixtureBaseUrl: string, hooks: RunHooks): Promise<ComboOutcome[]> {
  const outcomes: ComboOutcome[] = []

  const emit = (outcome: ComboOutcome): void => {
    outcomes.push(outcome)
    hooks.onVisualOutcome?.(outcome)
  }

  for (const combo of buildMatrix(config)) {
    const captured = await captureCombo(combo, {
      fixtureBaseUrl,
      locale: config.locale,
      outputDir: config.outputDir,
      ...(Object.keys(config.configOptions).length > 0 ? { configOptions: config.configOptions } : {}),
    })

    if (captured.status === 'not-applicable') {
      emit({ status: 'not-applicable', combo, reason: captured.reason })
      continue
    }
    if (captured.status === 'error') {
      emit({ status: 'error', combo, message: captured.message })
      continue
    }

    const relPath = join(combo.jurisdiction, `${combo.state}.png`)
    const diffResult = await diffAgainstBaseline({
      outputPath: captured.outputPath,
      baselinePath: join(config.baselineDir, relPath),
      diffPath: join(config.diffDir, relPath),
      threshold: config.threshold,
      maxDiffRatio: config.maxDiffRatio,
      updateBaseline: config.updateBaseline,
    })

    if (diffResult.status === 'pass') {
      emit({ status: 'pass', combo, outputPath: captured.outputPath })
    } else if (diffResult.status === 'new-baseline') {
      emit({ status: 'new-baseline', combo, outputPath: captured.outputPath })
    } else {
      emit({
        status: 'fail',
        combo,
        outputPath: captured.outputPath,
        diffPath: diffResult.diffPath,
        diffPixels: diffResult.diffPixels,
        diffRatio: diffResult.diffRatio,
      })
    }
  }

  return outcomes
}

export async function runMatrix(config: RunConfig, hooks: RunHooks = {}): Promise<RunReport> {
  if (!existsSync(UI_DIST_INDEX)) {
    throw new Error(
      `apps/ui build not found at ${UI_DIST_INDEX}. Run "npm run build --workspace=apps/ui" first — ` +
      `test-runner drives the real built widget bundle, not raw src.`,
    )
  }

  const startedAt = new Date().toISOString()
  const server = await startFixtureServer()
  let outcomes: ComboOutcome[] = []
  let functionalChecks: FunctionalCheck[] = []

  try {
    if (config.scope === 'visual' || config.scope === 'both') {
      outcomes = await runVisual(config, server.url, hooks)
    }
    if (config.scope === 'functional' || config.scope === 'both') {
      functionalChecks = await runFunctionalChecks(config.jurisdictions, config.states, {
        fixtureBaseUrl: server.url,
        locale: config.locale,
        ...(Object.keys(config.configOptions).length > 0 ? { configOptions: config.configOptions } : {}),
        ...(hooks.onFunctionalCheck ? { onCheck: hooks.onFunctionalCheck } : {}),
      })
    }
  } finally {
    await server.close()
  }

  const summary = {
    visual: {
      pass: outcomes.filter(o => o.status === 'pass').length,
      fail: outcomes.filter(o => o.status === 'fail').length,
      newBaseline: outcomes.filter(o => o.status === 'new-baseline').length,
      notApplicable: outcomes.filter(o => o.status === 'not-applicable').length,
      error: outcomes.filter(o => o.status === 'error').length,
    },
    functional: {
      pass: functionalChecks.filter(c => c.status === 'pass').length,
      fail: functionalChecks.filter(c => c.status === 'fail').length,
      notApplicable: functionalChecks.filter(c => c.status === 'not-applicable').length,
      error: functionalChecks.filter(c => c.status === 'error').length,
    },
  }

  const report: RunReport = {
    startedAt,
    finishedAt: new Date().toISOString(),
    config,
    outcomes,
    functionalChecks,
    summary,
  }

  await mkdir(config.resultsDir, { recursive: true })
  await writeFile(join(config.resultsDir, 'report.json'), JSON.stringify(report, null, 2))
  await writeHtmlReport(report, join(config.resultsDir, 'report.html'), config.resultsDir)

  return report
}
