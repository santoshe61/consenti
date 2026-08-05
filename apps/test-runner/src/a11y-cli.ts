#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runA11yCheck, type A11yCombo, type A11yOutcome, type A11yState } from './a11y.js'
import { startFixtureServer } from './fixture-server.js'
import { ALL_JURISDICTIONS } from './jurisdictions.js'
import { color } from '@consenti/utils'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const UI_DIST_INDEX = join(PACKAGE_ROOT, '..', '..', 'apps', 'ui', 'dist', 'index.mjs')

// mainBanner + prefModal — the two states a visitor actually reads/interacts with. See
// A11yState's doc comment in a11y.ts for why gpcBanner/ageGateModal aren't separately covered.
const STATES: readonly A11yState[] = ['mainBanner', 'prefModal']

function logOutcome(outcome: A11yOutcome): void {
  const label = `${outcome.combo.jurisdiction} / ${outcome.combo.state}`
  switch (outcome.status) {
    case 'pass':
      console.log(color.green(`  ✓ ${label}`))
      break
    case 'not-applicable':
      console.log(color.dim(`  · ${label} — n/a (${outcome.reason})`))
      break
    case 'error':
      console.log(color.red(`  ! ${label} — error: ${outcome.message}`))
      break
    case 'fail':
      console.log(color.red(`  ✗ ${label} — ${outcome.violations.length} violation(s):`))
      for (const v of outcome.violations) {
        console.log(color.red(`      [${v.impact}] ${v.id}: ${v.help} (${v.nodeCount} node(s)) — ${v.helpUrl}`))
      }
      break
  }
}

async function main(): Promise<void> {
  if (!existsSync(UI_DIST_INDEX)) {
    throw new Error(
      `apps/ui build not found at ${UI_DIST_INDEX}. Run "npm run build --workspace=apps/ui" first — ` +
      'a11y checks drive the real built widget bundle, not raw src.',
    )
  }

  const server = await startFixtureServer()
  const outcomes: A11yOutcome[] = []

  try {
    console.log(color.bold('── Accessibility (axe-core, WCAG 2.x A/AA, serious+critical) ──'))
    for (const jurisdiction of ALL_JURISDICTIONS) {
      for (const state of STATES) {
        const combo: A11yCombo = { jurisdiction, state }
        const outcome = await runA11yCheck(combo, { fixtureBaseUrl: server.url, locale: 'en' })
        outcomes.push(outcome)
        logOutcome(outcome)
      }
    }
  } finally {
    await server.close()
  }

  const pass = outcomes.filter(o => o.status === 'pass').length
  const fail = outcomes.filter(o => o.status === 'fail').length
  const notApplicable = outcomes.filter(o => o.status === 'not-applicable').length
  const error = outcomes.filter(o => o.status === 'error').length

  console.log(`\nAccessibility: ${pass} pass, ${fail} fail, ${notApplicable} n/a, ${error} error (${outcomes.length} combos)`)

  if (fail > 0 || error > 0) process.exitCode = 1
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack ?? err.message : err)
  process.exitCode = 1
})
