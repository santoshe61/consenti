import type { ConsentiConfig, DeepPartial } from '@consenti/types'

export type WidgetState = 'mainBanner' | 'gpcBanner' | 'prefModal' | 'ageGateModal'

export const WIDGET_STATES: readonly WidgetState[] = ['mainBanner', 'gpcBanner', 'prefModal', 'ageGateModal']

export type WidgetScope = 'visual' | 'functional' | 'both'

export interface MatrixCombo {
  jurisdiction: string
  state: WidgetState
}

export type CaptureResult =
  | { status: 'captured'; outputPath: string }
  | { status: 'not-applicable'; reason: string }
  | { status: 'error'; message: string }

export type DiffResult =
  | { status: 'pass' }
  | { status: 'fail'; diffPath: string; diffPixels: number; diffRatio: number }
  | { status: 'new-baseline' }

export type ComboOutcome =
  | { status: 'pass'; combo: MatrixCombo; outputPath: string }
  | { status: 'fail'; combo: MatrixCombo; outputPath: string; diffPath: string; diffPixels: number; diffRatio: number }
  | { status: 'new-baseline'; combo: MatrixCombo; outputPath: string }
  | { status: 'not-applicable'; combo: MatrixCombo; reason: string }
  | { status: 'error'; combo: MatrixCombo; message: string }

// ─── Functional testing ────────────────────────────────────────────────────────

export type FunctionalCheckKind = 'button' | 'category' | 'script-gating' | 'lifecycle' | 'age-gate'

/** One assertion result — e.g. one button click, one category toggle, one gated cookie
 * at one checkpoint, one lifecycle step. `expected`/`actual` are kept as plain JSON-able
 * values (not full ConsentValue objects) so the HTML report can render them directly. */
export interface FunctionalCheck {
  jurisdiction: string
  state: WidgetState | null
  kind: FunctionalCheckKind
  /** Button id / category id / cookie id / lifecycle step name. */
  target: string
  description: string
  expected: unknown
  actual: unknown
  status: 'pass' | 'fail' | 'error' | 'not-applicable'
  message?: string
}

/** Shape returned by the fixture's `window.__testRunnerDescribe()` — read from the resolved
 * profile so button/category/cookie coverage is always derived from real authored config,
 * never a hand-maintained per-jurisdiction list. */
export interface DescribedButton {
  id: string
  action: string
  cookies: string | string[] | null
}

export interface DescribedCategory {
  id: string
  cookieIds: string[]
  legalBasis: string | undefined
}

export interface DescribedCookie {
  id: string
  mandatory: boolean
  legalBasis: string | undefined
}

export interface FixtureDescribe {
  buttons: DescribedButton[]
  categories: DescribedCategory[]
  cookies: DescribedCookie[]
}

// ─── Run configuration & report ────────────────────────────────────────────────

export interface RunConfig {
  jurisdictions: string[]
  states: WidgetState[]
  scope: WidgetScope
  locale: string
  threshold: number
  maxDiffRatio: number
  updateBaseline: boolean
  /** Root directory for this run's artifacts — defaults to `results/<ISO_DATE>` (see
   * `resolveRunConfig`), so an accidental re-run never clobbers a previous run's report. */
  resultsDir: string
  outputDir: string
  baselineDir: string
  diffDir: string
  /** Deep-merged into every combo's `ConsentiConfig` on top of the jurisdiction/locale/ageGate
   * base — lets a run target a custom `profileOverride`, an `api`-hosted profile, or a
   * `complianceGroupsOverride` map instead of only the 8 built-in embedded profiles. */
  configOptions: DeepPartial<ConsentiConfig>
}

/** Optional callbacks invoked the instant each individual result is known — lets a caller
 * (the CLI) print progress live as the run proceeds instead of buffering everything until
 * the whole matrix finishes, which on a full jurisdiction × state run can take minutes. */
export interface RunHooks {
  onVisualOutcome?: (outcome: ComboOutcome) => void
  onFunctionalCheck?: (check: FunctionalCheck) => void
}

export interface RunReport {
  startedAt: string
  finishedAt: string
  config: RunConfig
  outcomes: ComboOutcome[]
  functionalChecks: FunctionalCheck[]
  summary: {
    visual: {
      pass: number
      fail: number
      newBaseline: number
      notApplicable: number
      error: number
    }
    functional: {
      pass: number
      fail: number
      notApplicable: number
      error: number
    }
  }
}
