export interface SessionOptions {
  headless?: boolean
  viewport?: { width: number; height: number }
  locale?: string
  timezoneId?: string
  navigationTimeoutMs?: number
  /** Raw JS injected via `page.addInitScript` before any page script runs — e.g. stubbing `navigator.globalPrivacyControl`. */
  initScripts?: string[]
  /** Emulates the `prefers-reduced-motion` media feature. Consenti's own CSS gates every
   * entrance animation behind `@media (prefers-reduced-motion: no-preference)`, so passing
   * `'reduce'` here skips them — useful for a screenshot taken immediately once a widget state
   * is reached, which would otherwise race a still-in-flight fade/scale transition. */
  reducedMotion?: 'reduce' | 'no-preference'
  /** Whether the launched browser process installs its own SIGINT/SIGTERM/SIGHUP handlers
   * (Playwright's default: `true`). A caller that already owns graceful shutdown itself — e.g. to
   * finish an in-progress step and write out partial results instead of the process exiting the
   * instant Ctrl+C is pressed — should pass `false` so Playwright's own handler doesn't race it
   * and force an early `process.exit`. Left `true` by default to preserve every existing caller's
   * behavior (e.g. `apps/test-runner`, which has no shutdown handling of its own and relies on
   * Playwright's default to still close the browser on Ctrl+C). */
  handleProcessSignals?: boolean
}

export interface CapturedCookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: 'Strict' | 'Lax' | 'None' | undefined
  readableViaDocumentCookie: boolean
}

export interface CapturedStorageEntry {
  key: string
  value: string
}

export interface CapturedIndexedDb {
  databaseName: string
  version: number | null
  objectStores: string[]
}

export interface CapturedRequest {
  url: string
  domain: string
  method: string
  resourceType: string
  initiatorUrl: string | null
  requestHeaders: Record<string, string>
  status: number | null
  responseHeaders: Record<string, string> | null
}

export interface CapturedScriptTag {
  src: string | null
  inline: boolean
  content: string | null
}

export interface CapturedSignals {
  url: string
  cookies: CapturedCookie[]
  localStorage: CapturedStorageEntry[]
  sessionStorage: CapturedStorageEntry[]
  indexedDb: CapturedIndexedDb[]
  requests: CapturedRequest[]
  scriptTags: CapturedScriptTag[]
  iframeOrigins: string[]
}

export interface ScreenshotOptions {
  fullPage?: boolean
  /** When set, screenshots only the first element matching this selector instead of the page. */
  selector?: string
}

export interface StateStep {
  name: string
  /** Runs after initial navigation + network-idle settle, before signals are captured for this state. */
  apply?: (session: import('./session').BrowserSession) => Promise<void>
  /** Capture a screenshot for this state; when set, written under `<outputDir>/<name>.png`. */
  screenshot?: boolean
}

export interface MultiStateOptions extends SessionOptions {
  outputDir?: string
  settleTimeoutMs?: number
}

export interface MultiStateResult {
  signals: CapturedSignals
  screenshotPath: string | null
}
