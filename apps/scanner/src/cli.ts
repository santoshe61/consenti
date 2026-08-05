#!/usr/bin/env node
import { color } from './log.js'
import { runScan } from './scan.js'
import { hasBlockingFindings, writeReport } from './report.js'
import { writeHtmlReport } from './html-report.js'
import { generateScanId } from './scan-id.js'
import { scanDirPath } from './scan-dir.js'
import { Spinner } from './spinner.js'
import { DEFAULT_SCAN_OPTIONS, type ScanOptions } from './types.js'

interface ParsedArgs {
  command: string | null
  url: string | null
  options: ScanOptions
  verbose: boolean
}

/** Minimal hand-rolled parser — matches the convention already used by `apps/test-runner`'s
 * `parseCliArgs` (see its comment there): this is a small, fixed set of flags, not worth an
 * external arg-parsing dependency. Unknown flags are ignored. */
function parseArgs(argv: string[]): ParsedArgs {
  const command = argv[0] ?? null
  const url = argv[1] && !argv[1].startsWith('--') ? argv[1] : null
  const options: ScanOptions = { ...DEFAULT_SCAN_OPTIONS }
  let verbose = false

  let i = url ? 2 : 1
  while (i < argv.length) {
    const flag = argv[i]
    const takeValue = (): string => {
      i++
      const v = argv[i]
      if (v === undefined) throw new Error(`Missing value for ${flag}`)
      return v
    }
    switch (flag) {
      case '--depth':
        options.depth = Number(takeValue())
        break
      case '--page-limit':
        options.pageLimit = Number(takeValue())
        break
      case '--output-dir':
        options.outputDir = takeValue()
        break
      case '--timeout':
        options.navigationTimeoutMs = Number(takeValue())
        break
      case '--headed':
        options.headless = false
        break
      case '--verbose':
        verbose = true
        break
      case '--skip-robots-txt':
        options.skipRobotsTxt = true
        break
      case '--skip-user-agent-checks':
        options.skipUserAgentChecks = true
        break
      case '--enable-gpc':
        options.enableGpc = true
        break
      case '--crawl-delay':
        options.crawlDelaySeconds = Number(takeValue())
        break
      default:
        // Unrecognized flag — ignored rather than rejected (see comment above).
        break
    }
    i++
  }

  return { command, url, options, verbose }
}

function printUsage(): void {
  console.log(`
@consenti/scanner — local, offline tracker discovery under three consent states

Usage:
  npx @consenti/scanner scan <url> [options]

Options:
  --depth <n>        Link-crawl depth in hops from the start URL (default: ${DEFAULT_SCAN_OPTIONS.depth})
  --page-limit <n>   Max pages to scan, including the start URL (default: ${DEFAULT_SCAN_OPTIONS.pageLimit})
  --output-dir <dir> Base output directory (default: ${DEFAULT_SCAN_OPTIONS.outputDir})
                     Each scan gets its own <dir>/<scan-id>/ holding scan-results.json,
                     scan-results.html, and screenshots/
  --timeout <ms>     Per-page navigation timeout in ms (default: ${DEFAULT_SCAN_OPTIONS.navigationTimeoutMs})
  --headed           Run with a visible browser window (default: headless)
  --verbose          Print every progress step on its own line instead of a single status
                     spinner — useful for CI logs or debugging a stuck/slow scan
  --skip-robots-txt  Crawl every discovered link regardless of robots.txt disallow rules
  --skip-user-agent-checks
                     Neutralize navigator.webdriver and strip "Headless" from the User-Agent,
                     to bypass sites/CMPs that treat detected automation differently (off by
                     default — an explicit opt-in, not silently applied every scan)
  --enable-gpc       Set navigator.globalPrivacyControl = true and send Sec-GPC: 1 on every
                     request, to check whether a site actually honors the signal
  --crawl-delay <s>  Base wait, in seconds, applied after every navigation before acting on the
                     page — gives a slow-to-initialize CMP time to render, and paces requests
                     to avoid tripping a per-IP rate limit. Default: a fresh uniform(2.0, 5.0)s
                     wait per navigation; a set value jitters ±2.0s around it, re-rolled every
                     navigation (named after robots.txt's own Crawl-delay directive)

Before first use: npx @consenti/scanner install-browsers   (installs Playwright's Chromium)

Exits non-zero when the report has unclassified trackers or anything firing before consent —
usable as a CI/CD gate.
`)
}

async function main(): Promise<void> {
  const { command, url, options, verbose } = parseArgs(process.argv.slice(2))

  if (command !== 'scan' || !url) {
    printUsage()
    process.exitCode = command === 'scan' ? 1 : 0
    return
  }

  try {
    new URL(url)
  } catch {
    console.error(`Invalid URL: ${url}`)
    process.exitCode = 1
    return
  }

  const scanId = generateScanId()
  const scanDir = scanDirPath(options.outputDir, scanId)
  console.log(`Scanning ${url} (depth=${options.depth}, page-limit=${options.pageLimit})…`)
  console.log(color.cyan(`Scan ID: ${scanId}`) + color.gray(` (output: ${scanDir})`))
  console.log(
    color.gray('Press Ctrl+C to stop early — a report for whatever was discovered so far is still written.')
  )

  const controller = new AbortController()
  let sigintCount = 0
  const onSigint = (): void => {
    sigintCount++
    if (sigintCount === 1) {
      console.log(
        color.yellow(
          '\nStopping — finishing the current step, then writing a report for what was discovered so far. Press Ctrl+C again to force quit immediately (no report).'
        )
      )
      controller.abort()
    } else {
      console.log(color.red('\nForce quitting — nothing was written.'))
      process.exit(1)
    }
  }
  process.on('SIGINT', onSigint)

  const spinner = new Spinner()
  let spinnerStarted = false
  const onProgress = (message: string): void => {
    if (verbose) {
      console.log(message)
      return
    }
    if (!spinnerStarted) {
      spinner.start(message)
      spinnerStarted = true
    } else {
      spinner.update(message)
    }
  }

  const report = await runScan(url, options, onProgress, { scanId, signal: controller.signal })
  process.off('SIGINT', onSigint)
  if (!verbose) spinner.stop()

  if (report.interrupted) {
    console.log(
      color.yellow(
        `\n⚠ Stopped early by user — results below reflect only the ${report.pagesScanned.length} page(s) discovered before stopping.`
      )
    )
  }

  const jsonPath = await writeReport(report, options.outputDir)
  const htmlPath = await writeHtmlReport(report, options.outputDir)

  console.log(
    `\nPages scanned: ${report.pagesScanned.length} (${report.pagesSkippedRobots.length} skipped by robots.txt, ${report.pagesUnscanned.length} gave up as blocked)`
  )
  console.log(`Unique trackers found: ${report.summary.totalUniqueTrackers}`)
  console.log(`Firing before consent: ${report.summary.firingBeforeConsent}`)
  console.log(`Unclassified (manual review): ${report.summary.unclassifiedCount}`)

  if (report.summary.pagesWithBlockingSuspicion > 0) {
    console.log(
      color.yellow(
        `\n⚠ ${report.summary.pagesWithBlockingSuspicion} page(s) show signs of a CDN/WAF block or rate-limit mid-scan — those results may be incomplete, not necessarily a compliance gap. See each page's blockingSuspicion in the report. Try --crawl-delay to slow down and reduce this.`
      )
    )
  }

  const erroredPages = report.pages.filter(p => p.error !== undefined)
  if (erroredPages.length > 0) {
    console.log(color.red(`\nPages that failed to scan (${erroredPages.length}):`))
    for (const p of erroredPages) console.log(color.red(`  ${p.url}: ${p.error}`))
  }

  if (report.pagesUnscanned.length > 0) {
    console.log(
      color.red(
        `\n${report.pagesUnscanned.length} page(s) gave up as blocked after every retry attempt — never scanned:`
      )
    )
    for (const u of report.pagesUnscanned) console.log(color.red(`  ${u}`))
  }

  console.log(`\nJSON report: ${jsonPath}`)
  console.log(`HTML report: ${htmlPath}`)

  if (report.interrupted) {
    console.log(color.yellow('\nResult: STOPPED — partial scan, stopped early by user before it finished.'))
    process.exitCode = 1
  } else if (hasBlockingFindings(report)) {
    console.log(
      color.red(
        '\nResult: FAIL — unclassified trackers, pre-consent firing, or a page that failed to scan.'
      )
    )
    process.exitCode = 1
  } else {
    console.log(color.green('\nResult: PASS'))
  }
}

main().catch(err => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err)
  process.exitCode = 1
})
