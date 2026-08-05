export { runMatrix } from './run.js'
export { resolveRunConfig, DEFAULT_RUN_CONFIG, parseCliArgs, loadConfigFile } from './config.js'
export { ALL_JURISDICTIONS } from './jurisdictions.js'
export { captureCombo } from './capture.js'
export { diffAgainstBaseline } from './diff.js'
export { startFixtureServer } from './fixture-server.js'
export {
  runFunctionalChecks,
  runButtonChecks,
  runCategoryChecks,
  runCombinedCategoryChecks,
  runScriptGatingChecks,
  runLifecycleChecks,
  runAgeGateChecks,
} from './functional.js'
export { writeHtmlReport } from './report.js'
export { buildFixtureUrl } from './fixture-url.js'
export { color, statusLabel } from '@consenti/utils'
export { logVisualOutcome, logFunctionalCheck } from './log.js'

export type {
  WidgetState,
  WidgetScope,
  MatrixCombo,
  CaptureResult,
  DiffResult,
  ComboOutcome,
  FunctionalCheck,
  FunctionalCheckKind,
  DescribedButton,
  DescribedCategory,
  DescribedCookie,
  FixtureDescribe,
  RunConfig,
  RunHooks,
  RunReport,
} from './types.js'
export { WIDGET_STATES } from './types.js'
