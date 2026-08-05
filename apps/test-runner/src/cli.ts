#!/usr/bin/env node
import { resolveRunConfig } from './config.js'
import { runMatrix } from './run.js'
import { logFunctionalCheck, logVisualOutcome } from './log.js'
import { color } from '@consenti/utils'

async function main(): Promise<void> {
  const config = await resolveRunConfig(process.argv.slice(2))

  // Results stream to the console live via these hooks as each combo/check completes,
  // instead of being buffered and dumped only once the whole (potentially multi-minute)
  // matrix finishes — see RunHooks in types.ts.
  if (config.scope === 'visual' || config.scope === 'both') {
    console.log(color.bold(`── Visual (${config.scope}) ──`))
  }
  let functionalHeaderPrinted = false
  const report = await runMatrix(config, {
    onVisualOutcome: logVisualOutcome,
    onFunctionalCheck: check => {
      if (!functionalHeaderPrinted) {
        console.log(color.bold(`\n── Functional (${config.scope}) ──`))
        functionalHeaderPrinted = true
      }
      logFunctionalCheck(check)
    },
  })

  const v = report.summary.visual
  const f = report.summary.functional
  console.log(
    `\nVisual:     ${v.pass} pass, ${v.fail} fail, ${v.newBaseline} new-baseline, ${v.notApplicable} n/a, ${v.error} error ` +
    `(${report.outcomes.length} combos)`,
  )
  console.log(
    `Functional: ${f.pass} pass, ${f.fail} fail, ${f.notApplicable} n/a, ${f.error} error ` +
    `(${report.functionalChecks.length} checks)`,
  )
  console.log(`\nHTML report: ${config.resultsDir}/report.html`)

  if (v.fail > 0 || v.error > 0 || f.fail > 0 || f.error > 0) process.exitCode = 1
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack ?? err.message : err)
  process.exitCode = 1
})
