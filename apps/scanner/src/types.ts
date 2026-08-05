import type { CapturedSignals } from '@consenti/browser-engine'

export type ConsentState = 'no-consent' | 'reject-all' | 'accept-all'

export const CONSENT_STATES: ConsentState[] = ['no-consent', 'reject-all', 'accept-all']

export type Confidence = 'exact' | 'pattern' | 'behavioral-only'

/** How the banner was found: `known-selector` matched one of the ~20 named CMP containers
 * (essentially certain); `heuristic-fallback` matched the generic scored heuristic instead (a
 * best-effort inference — see `findGenericBannerFallback` in `banner-detect.ts`). `null` when no
 * banner was detected at all. */
export type BannerDetectionMethod = 'known-selector' | 'heuristic-fallback'

export interface TrackerFinding {
  /** Cookie name, storage key, or request hostname — whatever identified this tracker. */
  id: string
  kind: 'cookie' | 'localStorage' | 'sessionStorage' | 'request' | 'script' | 'iframe'
  vendor: string | null
  category: 'necessary' | 'functional' | 'preferences' | 'analytics' | 'marketing' | 'fingerprinting' | null
  confidence: Confidence | 'unclassified'
  /** States in which this finding was observed firing. A finding present in `no-consent` is the
   * headline compliance violation this tool exists to catch. */
  seenInStates: ConsentState[]
  detail?: string | undefined
}

export interface CloakingFinding {
  subdomain: string
  cnameTarget: string
  cnameTargetRegistrableDomain: string
  note: string
}

export interface FingerprintFinding {
  technique: 'canvas' | 'font-enumeration' | 'audio'
  scriptUrl: string | null
  seenInStates: ConsentState[]
}

export interface TagManagerFinding {
  type: 'gtm' | 'tealium'
  containerId: string
  scriptUrl: string
}

/** One toggle found in a CMP's preference/customize panel — the granular options a real visitor
 * sees beyond the banner's binary accept-all/reject-all buttons. */
export interface PreferenceCategory {
  /** The toggle's accessible label (aria-label, associated <label>, or aria-labelledby text) —
   * e.g. "Performance Cookies", "Strictly Necessary". Best-effort: a CMP whose toggles carry no
   * discoverable label is simply not represented here rather than guessed at. */
  label: string
  /** True when the toggle is disabled/non-interactive — the "Strictly Necessary, Always Active"
   * case every CMP has. Locked categories are never included in `categoryStates` (there's nothing
   * to test: their state can't be changed). */
  locked: boolean
}

/** The result of testing one non-locked preference category in isolation: every other togglable
 * category set off, only this one set on, then Save clicked — answers "what fires if a visitor
 * grants only this category?" as opposed to the all-or-nothing `accept-all`/`reject-all` states. */
export interface CategoryStateResult {
  category: string
  signals: CapturedSignals
  findings: TrackerFinding[]
  screenshot: string | null
}

/** Evidence-based signal that a CDN/WAF may have blocked or throttled part of this page's scan —
 * see `blocking-detect.ts` for exactly what's checked. `evidence` is always populated when
 * `suspected` is true, so a report reader can judge the signal themselves rather than take a flag
 * on faith; empty otherwise. */
export interface BlockingSuspicion {
  suspected: boolean
  evidence: string[]
  /** Distinct blocking-range HTTP status codes actually observed (403/429/503) — Cloudflare's own
   * numbered error pages (1015 rate-limited, 1020 access denied) are served as ordinary 429/403 at
   * the wire level, so those are what shows up here, not the CDN-specific numbers. Empty when
   * `suspected` is true only via the request-count-collapse signal, with no status code involved. */
  statusCodes: number[]
}

/** What clicking one banner button whose label didn't match any known accept/reject/manage/save
 * list appeared to do, inferred from observed behavior rather than its text — see
 * `testBannerButtonBehavior` in `scan.ts`. Always `confidence: 'inferred'`, distinct from a real
 * label match, since behavioral inference has genuine ambiguity a label match doesn't. */
export interface InferredBannerAction {
  buttonLabel: string
  inferredAction: 'accept-like' | 'reject-like' | 'manage-like' | 'inconclusive'
  confidence: 'inferred'
  /** Trackers observed firing after the click that weren't already present in the no-consent
   * baseline — empty for `manage-like` (no signals captured; the panel appearing is itself the
   * signal) and for `inconclusive`. */
  findings: TrackerFinding[]
}

export interface PageResult {
  url: string
  cmpDetected: boolean
  /** Which tier found the banner — `null` when `cmpDetected` is false. See
   * {@link BannerDetectionMethod}. */
  bannerDetectionMethod: BannerDetectionMethod | null
  /** Every button label found on the detected banner — e.g. `["Accept All Cookies", "Reject All",
   * "Cookie Settings"]`. Empty when no banner was detected. */
  bannerOptions: string[]
  /** Every category found in the CMP's preference/customize panel, if the banner has one and it
   * could be opened. Empty when there's no such panel, or it couldn't be found/opened. */
  preferenceCategories: PreferenceCategory[]
  /** One entry per non-locked category in `preferenceCategories` — the per-category firing test.
   * Empty when `preferenceCategories` has no togglable (non-locked) entries. */
  categoryStates: CategoryStateResult[]
  /** One entry per banner button whose label didn't match any known accept/reject/manage/save
   * list, each clicked in its own session and classified by observed behavior. Empty when every
   * button's label was already recognized, or no banner was detected. */
  inferredBannerActions: InferredBannerAction[]
  signalsByState: Partial<Record<ConsentState, CapturedSignals>>
  findings: TrackerFinding[]
  cloaking: CloakingFinding[]
  fingerprinting: FingerprintFinding[]
  tagManagers: TagManagerFinding[]
  screenshotsByState: Partial<Record<ConsentState, string | null>>
  blockingSuspicion: BlockingSuspicion
  error?: string
}

export interface ScanReport {
  /** Short, random identifier for this scan run — also the name of the directory (under
   * `ScanOptions.outputDir`) holding this scan's JSON/HTML reports and screenshots. */
  id: string
  startUrl: string
  scannedAt: string
  depth: number
  pageLimit: number
  pagesScanned: string[]
  pagesSkippedRobots: string[]
  /** URLs that stayed blocked (403/429/503/CloudFront-error) through every escalating retry
   * attempt (see `BLOCK_RETRY_WAITS_MS` in `scan.ts`) and were given up on rather than retried
   * forever — genuinely missing from this scan, not merely incomplete like a
   * `blockingSuspicion`-flagged page still counted in `pages`. */
  pagesUnscanned: string[]
  /** True when the scan was stopped early via `ScanRunControl.signal` (e.g. the CLI's Ctrl+C
   * handler) rather than finishing naturally — `pages` reflects only what was discovered before
   * the stop, not a complete crawl. Nothing already found is lost, but a consumer (CI gate,
   * dashboard) should treat this report as partial rather than a clean pass/fail verdict. */
  interrupted: boolean
  pages: PageResult[]
  /** Deduplicated, site-wide view of every finding across all scanned pages — what a human
   * actually reads first. Per-page detail in `pages` is the drill-down. */
  summary: {
    totalUniqueTrackers: number
    firingBeforeConsent: number
    unclassifiedCount: number
    manualReview: TrackerFinding[]
    /** Pages where `detectBlockingSuspicion` found evidence of a CDN/WAF block or throttle —
     * surfaced here too, not just per-page, since it directly qualifies how much to trust
     * `cmpDetected: false`/low finding counts on those pages. */
    pagesWithBlockingSuspicion: number
  }
}

/** Called with a short human-readable line describing whatever the scan is doing right now
 * (crawling, navigating a page, detecting/clicking a CMP banner, capturing signals, …) — the only
 * way to tell a long-running scan apart from a hung process, since nothing else is reported until
 * the whole scan finishes. Purely informational: never awaited, never affects scan behavior. */
export type ScanProgressHandler = (message: string) => void

/** Runtime controls for a single `runScan` call — separate from `ScanOptions` since neither field
 * is scan *configuration* (nothing here changes what gets scanned or how): both are ways for a
 * caller to reach into an already-started run rather than describe the run up front. */
export interface ScanRunControl {
  /** A pre-generated id (from the exported `generateScanId()`) to use instead of generating one
   * internally — lets a caller (the CLI) know the id, and therefore the output directory, before
   * the scan starts rather than only at the end, so it can be printed immediately and used to
   * find partial results if the scan is later stopped early. */
  scanId?: string
  /** Aborting stops the scan at its next safe checkpoint — before starting the next queued page,
   * or during a blocking-retry wait — rather than mid-page-scan. Whatever pages were already
   * scanned are still returned and written out as a report (with `ScanReport.interrupted: true`),
   * not discarded. */
  signal?: AbortSignal
}

export interface ScanOptions {
  depth: number
  pageLimit: number
  /** Base directory for scan output. Each scan gets its own `<outputDir>/<scan.id>/`
   * subdirectory holding `scan-results.json`, `scan-results.html`, and `screenshots/` — so
   * concurrent or historical scans never collide or overwrite each other. */
  outputDir: string
  headless: boolean
  navigationTimeoutMs: number
  settleTimeoutMs: number
  /** Skip fetching/respecting `robots.txt` entirely — every discovered link is crawled regardless
   * of disallow rules. Off by default: this tool already only makes the crawl's own requests (no
   * separate "politeness" concern for a one-off local scan), but robots.txt is sometimes also
   * used to keep entire staging/admin sections out of search index — worth an explicit opt-in
   * rather than silently ignoring it. */
  skipRobotsTxt: boolean
  /** Neutralize `navigator.webdriver` and strip "Headless" from the `User-Agent` (`src/stealth.ts`)
   * — bypasses the small number of real-world CMPs/bot-mitigation layers that key off these two
   * trivially-visible automation signals (see README's "Known limitation: geo-gated or
   * bot-mitigated CMPs"). Off by default — an explicit, named opt-in rather than silently always
   * masking the fact that this is an automated scan. */
  skipUserAgentChecks: boolean
  /** Sets `navigator.globalPrivacyControl = true` and sends the `Sec-GPC: 1` request header for
   * every session in this scan — simulates a visitor who has GPC enabled, so a scan can be
   * compared with/without this flag to see whether a site actually honors the signal (many US
   * state privacy laws require honoring it as an opt-out-of-sale signal). Off by default. */
  enableGpc: boolean
  /** Base wait, in seconds, applied after every navigation in the scan, before acting on the page
   * — named after robots.txt's own `Crawl-delay` directive. `undefined` (the default, no
   * `--crawl-delay` flag) draws each wait fresh from `uniform(2.0, 5.0)`; a set value jitters
   * `±2.0` seconds around it, re-rolled independently for every navigation. See
   * `crawl-delay.ts`'s `computeCrawlDelayMs`. */
  crawlDelaySeconds?: number
}

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  depth: 1,
  pageLimit: 10,
  outputDir: './scan-results',
  headless: true,
  navigationTimeoutMs: 30_000,
  settleTimeoutMs: 2_000,
  skipRobotsTxt: false,
  skipUserAgentChecks: false,
  enableGpc: false,
}
