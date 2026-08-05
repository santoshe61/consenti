import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ConsentiConfig, DeepPartial } from '@consenti/types'
import { ALL_JURISDICTIONS } from './jurisdictions.js'
import { WIDGET_STATES, type RunConfig, type WidgetState, type WidgetScope } from './types.js'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const RESULTS_ROOT = join(PACKAGE_ROOT, 'results')

export const DEFAULT_RUN_CONFIG: RunConfig = {
  jurisdictions: [...ALL_JURISDICTIONS],
  states: [...WIDGET_STATES],
  scope: 'both',
  locale: 'en',
  threshold: 0.1,
  maxDiffRatio: 0.01,
  updateBaseline: false,
  resultsDir: join(RESULTS_ROOT, new Date().toISOString().slice(0, 10)),
  outputDir: join(RESULTS_ROOT, new Date().toISOString().slice(0, 10), 'output'),
  baselineDir: join(PACKAGE_ROOT, 'baseline'),
  diffDir: join(RESULTS_ROOT, new Date().toISOString().slice(0, 10), 'diff'),
  configOptions: {},
}

/**
 * Picks `results/<ISO_DATE>`, or `results/<ISO_DATE>-V{n}` if that date's directory already
 * exists — same collision convention as this repo's `changelog/YYYY-MM-DD-V{n}.md` files.
 * Ensures an accidental re-run never silently overwrites a previous run's report/screenshots.
 */
function findAvailableResultsDir(): string {
  const isoDate = new Date().toISOString(); //.slice(0, 10)
  const base = join(RESULTS_ROOT, isoDate)
  if (!existsSync(base)) return base

  let n = 2
  let candidate = join(RESULTS_ROOT, `${isoDate}-V${n}`)
  while (existsSync(candidate)) {
    n++
    candidate = join(RESULTS_ROOT, `${isoDate}-V${n}`)
  }
  return candidate
}

const VALID_SCOPES = new Set(['visual', 'functional', 'both'])

function parseScope(v: string): WidgetScope {
  if (!VALID_SCOPES.has(v)) throw new Error(`Invalid --scope "${v}" — expected visual, functional, or both`)
  return v as WidgetScope
}

export type ConfigFileShape = Partial<RunConfig>

export interface CliOverrides extends ConfigFileShape {
  configPath?: string
}

function splitList(v: string): string[] {
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Minimal hand-rolled parser — this is an internal dev tool with a handful of flags, not
 * worth an external arg-parsing dependency. Unknown flags are ignored rather than rejected,
 * so this can't accidentally break on a flag meant for something else in a wrapper script.
 */
export function parseCliArgs(argv: string[]): CliOverrides {
  const out: CliOverrides = {}
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg === undefined) break

    const takeValue = (): string => {
      i++
      const v = argv[i]
      if (v === undefined) throw new Error(`Missing value for ${arg}`)
      return v
    }

    switch (arg) {
      case '--jurisdiction':
      case '--jurisdictions':
        out.jurisdictions = splitList(takeValue())
        break
      case '--state':
      case '--states':
        out.states = splitList(takeValue()) as WidgetState[]
        break
      case '--scope':
        out.scope = parseScope(takeValue())
        break
      case '--config-options':
        out.configOptions = JSON.parse(takeValue()) as DeepPartial<ConsentiConfig>
        break
      case '--locale':
        out.locale = takeValue()
        break
      case '--threshold':
        out.threshold = Number(takeValue())
        break
      case '--max-diff-ratio':
        out.maxDiffRatio = Number(takeValue())
        break
      case '--update-baseline':
        out.updateBaseline = true
        break
      case '--results-dir':
        out.resultsDir = takeValue()
        break
      case '--output':
        out.outputDir = takeValue()
        break
      case '--baseline':
        out.baselineDir = takeValue()
        break
      case '--diff':
        out.diffDir = takeValue()
        break
      case '--config':
        out.configPath = takeValue()
        break
      default:
        break
    }
    i++
  }
  return out
}

export async function loadConfigFile(path: string): Promise<ConfigFileShape> {
  const raw = await readFile(path, 'utf-8')
  return JSON.parse(raw) as ConfigFileShape
}

/** Precedence: CLI flags > `--config` file > defaults (full matrix). */
export async function resolveRunConfig(argv: string[]): Promise<RunConfig> {
  const { configPath, ...cliOverrides } = parseCliArgs(argv)
  const fileConfig = configPath ? await loadConfigFile(configPath) : {}
  const explicit = { ...fileConfig, ...cliOverrides }

  // Every real run (not just callers relying on the static DEFAULT_RUN_CONFIG) gets a fresh,
  // collision-checked dated directory unless the caller explicitly pinned one of these paths.
  const resultsDir = explicit.resultsDir ?? findAvailableResultsDir()
  const outputDir = explicit.outputDir ?? join(resultsDir, 'output')
  const diffDir = explicit.diffDir ?? join(resultsDir, 'diff')

  return {
    ...DEFAULT_RUN_CONFIG,
    ...fileConfig,
    ...cliOverrides,
    resultsDir,
    outputDir,
    diffDir,
  }
}
