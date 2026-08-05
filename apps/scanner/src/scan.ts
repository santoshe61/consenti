import { join } from 'node:path'
import type { Page } from 'playwright'
import { captureSignals, launchSession, takeScreenshot } from '@consenti/browser-engine'
import {
  applyCategorySelection,
  clickAcceptAll,
  clickBannerButtonByExactText,
  clickRejectAll,
  detectBanner,
  detectBannerWithMethod,
  isKnownBannerLabel,
  listBannerButtons,
  listPreferenceCategories,
  openPreferencePanel,
  savePreferences,
} from './banner-detect.js'
import { detectBlockingSuspicion, hasBlockingSignal } from './blocking-detect.js'
import { classifyState } from './classify.js'
import { detectCnameCloaking } from './cname-detect.js'
import { computeCrawlDelayMs } from './crawl-delay.js'
import { FINGERPRINT_INIT_SCRIPT, readFingerprintSignals } from './fingerprint-detect.js'
import { applyGpcSignal } from './gpc.js'
import { simulateHumanActivity } from './human-activity.js'
import { color } from './log.js'
import { fetchRobots, isAllowedByRobots, type RobotsRules } from './robots.js'
import { scanDirPath } from './scan-dir.js'
import { generateScanId } from './scan-id.js'
import { deHeadless } from './stealth.js'
import { detectTagManagers } from './tag-manager.js'
import {
  CONSENT_STATES,
  type BannerDetectionMethod,
  type CategoryStateResult,
  type ConsentState,
  type FingerprintFinding,
  type InferredBannerAction,
  type PageResult,
  type PreferenceCategory,
  type ScanOptions,
  type ScanProgressHandler,
  type ScanReport,
  type ScanRunControl,
  type TrackerFinding,
} from './types.js'

/** Launches a session, spends the jittered `--crawl-delay` (see `crawl-delay.ts`) on a few random
 * mouse movements and Tab presses instead of sitting idle (see `human-activity.ts`) so the page
 * has time to settle before anything else touches it, and applies the same de-headless/GPC
 * treatment every scan session gets — regardless of which consent state, preference-panel step,
 * or link-discovery pass it's for. Every navigation in a scan goes through this one function, so
 * the delay is applied uniformly without needing to remember it at each call site. */
async function launchScanSession(
  url: string,
  options: ScanOptions,
  initScripts: string[]
): ReturnType<typeof launchSession> {
  const session = await launchSession(url, {
    headless: options.headless,
    navigationTimeoutMs: options.navigationTimeoutMs,
    initScripts,
    // The CLI owns graceful Ctrl+C shutdown itself (see ScanRunControl.signal) — writing out
    // whatever was discovered so far rather than exiting immediately. Playwright's own default
    // SIGINT handler would otherwise race that and force-exit the process first.
    handleProcessSignals: false,
  })
  await simulateHumanActivity(session.page, computeCrawlDelayMs(options.crawlDelaySeconds))
  const extraHeaders: Record<string, string> = {}
  if (options.skipUserAgentChecks) Object.assign(extraHeaders, await deHeadless(session.page))
  if (options.enableGpc) Object.assign(extraHeaders, await applyGpcSignal(session.page))
  if (Object.keys(extraHeaders).length > 0) await session.page.setExtraHTTPHeaders(extraHeaders)
  return session
}

/** Breadth-first same-origin link discovery, fused directly into the scan loop below rather than
 * a separate pre-pass: the `no-consent` state's session already fully loads and settles every
 * page anyway, so harvesting `<a href>` links from that same, already-open session costs nothing
 * extra and halves the navigation count per page (one fewer request the target site sees — this
 * mattered directly for a site that started rate-limiting after too many requests in a short
 * window). `crawledLinks` is `queued` below — a plain `Set` so a link discovered from two
 * different pages is only ever scanned once. */
async function extractLinks(page: Page): Promise<string[]> {
  try {
    const resolvedOrigin = new URL(page.url()).origin
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]')).map(a => (a as HTMLAnchorElement).href)
    )
    const sameOrigin = new Set<string>()
    for (const href of hrefs) {
      try {
        const u = new URL(href)
        if (u.origin === resolvedOrigin) sameOrigin.add(normalizeUrl(u.toString()))
      } catch {
        continue
      }
    }
    return Array.from(sameOrigin)
  } catch {
    return []
  }
}

function normalizeUrl(url: string): string {
  const u = new URL(url)
  u.hash = ''
  return u.toString()
}

export async function runScan(
  startUrl: string,
  options: ScanOptions,
  onProgress?: ScanProgressHandler,
  control?: ScanRunControl
): Promise<ScanReport> {
  const notify = onProgress ?? ((): void => {})
  const id = control?.scanId ?? generateScanId()
  const signal = control?.signal
  const scanDir = scanDirPath(options.outputDir, id)
  const normalizedStart = new URL(startUrl).toString()

  if (options.skipRobotsTxt) notify('Skipping robots.txt check (--skip-robots-txt)')
  const robots: RobotsRules = options.skipRobotsTxt
    ? { disallow: [] }
    : await fetchRobots(new URL(normalizedStart).origin)

  const startNormalized = normalizeUrl(normalizedStart)
  const queue: { url: string; depth: number; blockRetryCount?: number }[] = [
    { url: startNormalized, depth: 0 },
  ]
  const queued = new Set<string>([startNormalized])
  const skippedByRobots: string[] = []
  const pages: PageResult[] = []
  const unscannedBlocked: string[] = []

  // Holds a page's result once its scan came back flagged as blocked, without committing it to
  // `pages` yet — until we know whether the NEXT page is blocked too. Two in a row is treated as
  // the rate limiter actually engaging (see `BLOCK_RETRY_WAITS_MS` below): both held results are
  // discarded and their URLs re-queued (with `blockRetryCount: 1`) for a retry once things have
  // had time to cool down, rather than keeping two degraded/incomplete results. A single isolated
  // block (no second one right after it) is accepted as final once the streak breaks — see
  // `flushPendingBlocked`. Once a URL is in its own retry cycle (`blockRetryCount > 0`), it
  // escalates or gives up on its own — it doesn't need a second consecutive block to keep going,
  // since it already proved itself persistently blocked on its first retry.
  let pendingBlocked: {
    item: { url: string; depth: number; blockRetryCount?: number }
    result: PageResult
  }[] = []
  const flushPendingBlocked = (): void => {
    for (const { result } of pendingBlocked) pages.push(result)
    pendingBlocked = []
  }

  notify(
    color.cyan(
      `Scanning from ${normalizedStart} (depth=${options.depth}, page-limit=${options.pageLimit})…`
    )
  )

  let interrupted = false

  while (queue.length > 0 && pages.length < options.pageLimit) {
    if (signal?.aborted) {
      interrupted = true
      notify(color.yellow('Stopping early — writing a report for what was discovered so far…'))
      break
    }

    const next = queue.shift()
    if (!next) break

    if (!isAllowedByRobots(new URL(next.url).pathname, robots)) {
      skippedByRobots.push(next.url)
      notify(color.gray(`Skipped by robots.txt: ${next.url}`))
      continue
    }

    // "Total known so far" — not necessarily `pageLimit`, since a small site may never discover
    // that many pages at all. Recomputed on every iteration (not cached) because depth expansion
    // below can grow it as new pages turn up — the whole point of surfacing "discovered N new
    // page(s)" separately is that this denominator, and the percentage against it, can move.
    const totalSoFar = Math.min(
      options.pageLimit,
      pages.length + pendingBlocked.length + queue.length + 1
    )
    const percent = Math.round((pages.length / totalSoFar) * 100)
    notify(color.blue(`Scanning page ${pages.length + 1}/${totalSoFar} (${percent}%): ${next.url}`))
    const { result, links } = await scanPage(next.url, options, scanDir, notify)

    if (result.blockingSuspicion.suspected) {
      const status = result.blockingSuspicion.statusCodes[0] ?? 'unknown status'
      const retryCount = next.blockRetryCount ?? 0

      if (retryCount > 0) {
        // Already mid-retry for this specific URL — escalate to the next wait, or give up once
        // every attempt is exhausted, independent of whatever else is happening in the queue.
        if (retryCount >= BLOCK_RETRY_WAITS_MS.length) {
          unscannedBlocked.push(next.url)
          notify(
            color.red(`Still blocked with ${status} after ${retryCount} retries — giving up on ${next.url}`)
          )
        } else {
          const waitMs = BLOCK_RETRY_WAITS_MS[retryCount] as number
          notify(color.yellow(`Blocked with ${status}. Retrying in ${waitMs / 1000}s...`))
          await sleep(waitMs, signal)
          if (signal?.aborted) {
            interrupted = true
            notify(color.yellow('Stopping early — writing a report for what was discovered so far…'))
            break
          }
          queue.push({ url: next.url, depth: next.depth, blockRetryCount: retryCount + 1 })
        }
        continue
      }

      pendingBlocked.push({ item: next, result })
      if (pendingBlocked.length >= 2) {
        const waitMs = BLOCK_RETRY_WAITS_MS[0] as number
        notify(color.yellow(`Blocked with ${status}. Retrying in ${waitMs / 1000}s...`))
        await sleep(waitMs, signal)
        if (signal?.aborted) {
          interrupted = true
          notify(color.yellow('Stopping early — writing a report for what was discovered so far…'))
          break
        }
        for (const { item } of pendingBlocked) queue.push({ ...item, blockRetryCount: 1 })
        pendingBlocked = []
      }
      // A blocked page's own link set can't be trusted (the page likely never rendered), so no
      // depth expansion from it regardless of whether this triggered a retry or is still pending.
      continue
    }

    flushPendingBlocked()
    pages.push(result)

    if (next.depth < options.depth) {
      let newlyDiscovered = 0
      for (const link of links) {
        if (!queued.has(link) && pages.length + queue.length < options.pageLimit) {
          queued.add(link)
          queue.push({ url: link, depth: next.depth + 1 })
          newlyDiscovered++
        }
      }
      if (newlyDiscovered > 0) {
        const newTotal = Math.min(options.pageLimit, pages.length + queue.length)
        notify(color.magenta(`Discovered ${newlyDiscovered} new page(s) — ${newTotal} total now`))
      }
    }
  }

  flushPendingBlocked()
  const completionMessage =
    (interrupted ? 'Scan stopped early' : 'Scan complete') +
    `: ${pages.length} page(s) processed` +
    (unscannedBlocked.length > 0 ? `, ${unscannedBlocked.length} gave up as blocked` : '')
  notify(interrupted ? color.yellow(completionMessage) : color.green(completionMessage))

  return buildReport(id, normalizedStart, options, pages, skippedByRobots, unscannedBlocked, interrupted)
}

/** Escalating pause before each retry of a blocked URL, in order of attempt — 11s, 31s, 61s,
 * 301s, 601s (each one second past a round number, matching the exact schedule requested: "10+1,
 * 30+1, 60+1, 300+1, 600+1"). Five entries means five retry attempts; a URL still blocked after
 * the fifth is given up on rather than retried forever — see `unscannedBlocked` above. Long enough
 * at each step to plausibly clear a short-window per-IP rate limit, escalating in case the block
 * is a longer one, per the exact behavior observed scanning a site that started 403-ing after too
 * many requests too quickly. */
const BLOCK_RETRY_WAITS_MS = [11_000, 31_000, 61_000, 301_000, 601_000]

/** Resolves early on `signal` abort rather than always waiting the full `ms` — matters here since
 * some of these waits run past 10 minutes (`BLOCK_RETRY_WAITS_MS`'s last entry); a user stopping
 * the scan shouldn't have to wait that out. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    }, { once: true })
  })
}

async function scanPage(
  url: string,
  options: ScanOptions,
  scanDir: string,
  notify: ScanProgressHandler
): Promise<{ result: PageResult; links: string[] }> {
  const pageHostname = new URL(url).hostname
  const signalsByState: PageResult['signalsByState'] = {}
  const screenshotsByState: PageResult['screenshotsByState'] = {}
  const findingsByKey = new Map<string, TrackerFinding>()
  const fingerprintByKey = new Map<string, FingerprintFinding>()
  const allTagManagers: PageResult['tagManagers'] = []
  let cmpDetected = false
  let bannerDetectionMethod: BannerDetectionMethod | null = null
  let bannerOptions: string[] = []
  let preferenceCategories: PreferenceCategory[] = []
  const categoryStates: CategoryStateResult[] = []
  const inferredBannerActions: InferredBannerAction[] = []
  let links: string[] = []

  try {
    for (const state of CONSENT_STATES) {
      notify(`  [${state}] navigating…`)
      const session = await launchScanSession(url, options, [FINGERPRINT_INIT_SCRIPT])
      try {
        if (state === 'no-consent') {
          links = await extractLinks(session.page)
          notify(`  [${state}] discovered ${links.length} link(s)`)
          const banner = await detectBannerWithMethod(session.page)
          cmpDetected = banner.detected
          bannerDetectionMethod = banner.method
          notify(
            `  [${state}] ${cmpDetected ? `CMP banner detected (${bannerDetectionMethod})` : 'no CMP banner detected'}`
          )
        } else if (cmpDetected) {
          if (state === 'reject-all') {
            const clicked = await clickRejectAll(session.page)
            notify(`  [${state}] ${clicked ? 'clicked "reject all"' : 'no matching button found'}`)
          }
          if (state === 'accept-all') {
            const clicked = await clickAcceptAll(session.page)
            notify(`  [${state}] ${clicked ? 'clicked "accept all"' : 'no matching button found'}`)
          }
        }
        // No banner detected: skip the click, which naturally leaves this state's captured
        // signals equivalent to no-consent's — the "collapse to state 1" behavior the v1 plan
        // asks for, without literally aliasing the result object (still an independent capture,
        // in case something is genuinely time-varying between runs).

        await session.page.waitForTimeout(options.settleTimeoutMs)

        const signals = await captureSignals(session)
        signalsByState[state] = signals
        mergeFindings(findingsByKey, classifyState(signals, pageHostname), state)
        mergeFingerprints(fingerprintByKey, await readFingerprintSignals(session.page), state)
        allTagManagers.push(...detectTagManagers(signals.scriptTags))

        screenshotsByState[state] = await takeScreenshot(
          session,
          join(scanDir, 'screenshots', pathSafe(url), `${state}.png`)
        )
        notify(`  [${state}] captured ${signals.cookies.length} cookie(s), ${signals.requests.length} request(s)`)

        const blockSignal = hasBlockingSignal(signals)
        if (blockSignal.blocked) {
          notify(
            color.yellow(`  [${state}] blocked (HTTP ${blockSignal.status}) — skipping remaining states for this page`)
          )
          break
        }
      } finally {
        await session.close()
      }
    }

    if (cmpDetected) {
      notify('  [preferences] exploring preference panel…')
      const discovery = await discoverPreferencePanel(url, options)
      bannerOptions = discovery.bannerOptions
      preferenceCategories = discovery.categories
      notify(
        `  [preferences] ${bannerOptions.length} banner option(s), ${preferenceCategories.length} categor${preferenceCategories.length === 1 ? 'y' : 'ies'} found`
      )

      const togglable = preferenceCategories.filter(c => !c.locked)
      const togglableLabels = togglable.map(c => c.label)
      for (const category of togglable) {
        notify(`  [category:${category.label}] testing in isolation…`)
        try {
          const categoryResult = await scanCategoryState(
            url,
            options,
            scanDir,
            pageHostname,
            category.label,
            togglableLabels
          )
          categoryStates.push(categoryResult)
          notify(
            `  [category:${category.label}] captured ${categoryResult.signals.cookies.length} cookie(s), ${categoryResult.findings.length} finding(s)`
          )
        } catch (err) {
          notify(
            color.red(`  [category:${category.label}] error: ${err instanceof Error ? err.message : String(err)}`)
          )
        }
      }

      const unlabeledButtons = bannerOptions.filter(label => label.trim() && !isKnownBannerLabel(label))
      const noConsentBaselineIds = new Set(
        Array.from(findingsByKey.values())
          .filter(f => f.seenInStates.includes('no-consent') && f.category !== 'necessary')
          .map(f => f.id)
      )
      for (const buttonLabel of unlabeledButtons) {
        notify(`  [behavioral:${buttonLabel}] testing…`)
        try {
          const action = await testBannerButtonBehavior(
            url,
            options,
            pageHostname,
            buttonLabel,
            noConsentBaselineIds
          )
          inferredBannerActions.push(action)
          notify(`  [behavioral:${buttonLabel}] classified as ${action.inferredAction}`)
        } catch (err) {
          notify(color.red(`  [behavioral:${buttonLabel}] error: ${err instanceof Error ? err.message : String(err)}`))
        }
      }
    }

    const requestHostnames = Array.from(
      new Set(Object.values(signalsByState).flatMap(s => s?.requests.map(r => r.domain) ?? []))
    )
    const cloaking = await detectCnameCloaking(requestHostnames, pageHostname)
    const blockingSuspicion = detectBlockingSuspicion(signalsByState)
    if (blockingSuspicion.suspected) {
      notify(color.yellow(`  [blocking-suspicion] ${blockingSuspicion.evidence[0]}`))
    }

    notify(color.green(`  done: ${findingsByKey.size} finding(s)`))
    return {
      result: {
        url,
        cmpDetected,
        bannerDetectionMethod,
        bannerOptions,
        preferenceCategories,
        categoryStates,
        inferredBannerActions,
        signalsByState,
        findings: Array.from(findingsByKey.values()),
        cloaking,
        fingerprinting: Array.from(fingerprintByKey.values()),
        tagManagers: dedupeTagManagers(allTagManagers),
        screenshotsByState,
        blockingSuspicion,
      },
      links,
    }
  } catch (err) {
    notify(color.red(`  error: ${err instanceof Error ? err.message : String(err)}`))
    return {
      result: {
        url,
        cmpDetected,
        bannerDetectionMethod,
        bannerOptions,
        preferenceCategories,
        categoryStates,
        inferredBannerActions,
        signalsByState,
        findings: Array.from(findingsByKey.values()),
        cloaking: [],
        fingerprinting: Array.from(fingerprintByKey.values()),
        tagManagers: dedupeTagManagers(allTagManagers),
        screenshotsByState,
        blockingSuspicion: detectBlockingSuspicion(signalsByState),
        error: err instanceof Error ? err.message : String(err),
      },
      links,
    }
  }
}

/** Opens the CMP's preference/customize panel (if any) in a dedicated, throwaway session and
 * reads what it exposes — every banner button label, and every category toggle with its label
 * and locked/non-locked state. Used once per page, before the per-category firing tests below,
 * so those tests know exactly which categories exist and which are actually togglable. Any
 * failure along the way (no banner, no manage button, an unrecognized panel structure) degrades
 * to empty results rather than aborting the page's scan — this is discovery, not a required step. */
async function discoverPreferencePanel(
  url: string,
  options: ScanOptions
): Promise<{ bannerOptions: string[]; categories: PreferenceCategory[] }> {
  let session: Awaited<ReturnType<typeof launchScanSession>> | undefined
  try {
    session = await launchScanSession(url, options, [FINGERPRINT_INIT_SCRIPT])
    const detected = await detectBanner(session.page)
    if (!detected) return { bannerOptions: [], categories: [] }

    const bannerOptions = await listBannerButtons(session.page)
    const opened = await openPreferencePanel(session.page)
    if (!opened) return { bannerOptions, categories: [] }

    await session.page.waitForTimeout(500)
    const categories = await listPreferenceCategories(session.page)
    return { bannerOptions, categories }
  } catch {
    return { bannerOptions: [], categories: [] }
  } finally {
    if (session) await session.close()
  }
}

/** Tests one non-locked category in isolation: opens the preference panel in a fresh session,
 * sets `targetCategory` on and every other category in `allTogglableLabels` off, clicks Save, and
 * captures signals exactly like a consent state — answering "what fires if a visitor grants only
 * this category?" Locked categories are already excluded by the caller (there's nothing to toggle
 * for "Strictly Necessary"), and `applyCategorySelection` itself skips any locked toggle it
 * encounters regardless. */
async function scanCategoryState(
  url: string,
  options: ScanOptions,
  scanDir: string,
  pageHostname: string,
  targetCategory: string,
  allTogglableLabels: string[]
): Promise<CategoryStateResult> {
  const session = await launchScanSession(url, options, [FINGERPRINT_INIT_SCRIPT])
  try {
    const detected = await detectBanner(session.page)
    if (detected && (await openPreferencePanel(session.page))) {
      await session.page.waitForTimeout(500)
      const desired = new Map<string, boolean>(allTogglableLabels.map(label => [label, label === targetCategory]))
      await applyCategorySelection(session.page, desired)
      await savePreferences(session.page)
    }

    await session.page.waitForTimeout(options.settleTimeoutMs)
    const signals = await captureSignals(session)
    const findings = classifyState(signals, pageHostname)
    const screenshot = await takeScreenshot(
      session,
      join(scanDir, 'screenshots', pathSafe(url), `category-${pathSafeLabel(targetCategory)}.png`)
    )
    return { category: targetCategory, signals, findings, screenshot }
  } finally {
    await session.close()
  }
}

/**
 * Click-and-observe fallback for a banner button whose label didn't match any known
 * accept/reject/manage/save list — real buttons can be labeled in any language or with entirely
 * custom wording, so this classifies the button by what clicking it actually *does* instead:
 *
 * - A new toggle-containing panel appears → `manage-like` (a clean signal: revealing category
 *   toggles is specific to a "customize" action regardless of language).
 * - New non-necessary trackers fire that weren't already present in the `no-consent` baseline →
 *   `accept-like`.
 * - Neither → `reject-like`.
 * - The click caused navigation away from the page (comparing origin+pathname, not the full URL —
 *   a query string or hash change alone isn't treated as "navigated away") → `inconclusive`,
 *   discarding the result rather than guessing; a genuine consent action doesn't leave the page.
 *
 * Compared against the `no-consent` baseline rather than a bare "did anything non-necessary fire"
 * check — a tracker already firing in every state regardless of what's clicked (the exact
 * violation this tool exists to catch) would otherwise make every single button misclassify as
 * `accept-like`.
 */
async function testBannerButtonBehavior(
  url: string,
  options: ScanOptions,
  pageHostname: string,
  buttonLabel: string,
  noConsentBaselineIds: Set<string>
): Promise<InferredBannerAction> {
  const inconclusive: InferredBannerAction = {
    buttonLabel,
    inferredAction: 'inconclusive',
    confidence: 'inferred',
    findings: [],
  }

  const session = await launchScanSession(url, options, [FINGERPRINT_INIT_SCRIPT])
  try {
    const originalUrl = new URL(session.page.url())
    const detected = await detectBanner(session.page)
    if (!detected) return inconclusive

    const clicked = await clickBannerButtonByExactText(session.page, buttonLabel)
    if (!clicked) return inconclusive

    await session.page.waitForTimeout(500)

    const afterClickUrl = new URL(session.page.url())
    if (afterClickUrl.origin !== originalUrl.origin || afterClickUrl.pathname !== originalUrl.pathname) {
      return inconclusive
    }

    const categoriesRevealed = await listPreferenceCategories(session.page)
    if (categoriesRevealed.length > 0) {
      return { buttonLabel, inferredAction: 'manage-like', confidence: 'inferred', findings: [] }
    }

    await session.page.waitForTimeout(options.settleTimeoutMs)
    const signals = await captureSignals(session)
    const findings = classifyState(signals, pageHostname)
    const newNonNecessary = findings.filter(f => f.category !== 'necessary' && !noConsentBaselineIds.has(f.id))

    return {
      buttonLabel,
      inferredAction: newNonNecessary.length > 0 ? 'accept-like' : 'reject-like',
      confidence: 'inferred',
      findings: newNonNecessary,
    }
  } finally {
    await session.close()
  }
}

function mergeFindings(
  into: Map<string, TrackerFinding>,
  findings: TrackerFinding[],
  state: ConsentState
): void {
  for (const finding of findings) {
    const key = `${finding.kind}:${finding.id}`
    const existing = into.get(key)
    if (existing) {
      if (!existing.seenInStates.includes(state)) existing.seenInStates.push(state)
    } else {
      into.set(key, { ...finding, seenInStates: [state] })
    }
  }
}

function mergeFingerprints(
  into: Map<string, FingerprintFinding>,
  raw: { technique: FingerprintFinding['technique']; url: string | null }[],
  state: ConsentState
): void {
  for (const call of raw) {
    const key = `${call.technique}:${call.url ?? 'inline'}`
    const existing = into.get(key)
    if (existing) {
      if (!existing.seenInStates.includes(state)) existing.seenInStates.push(state)
    } else {
      into.set(key, { technique: call.technique, scriptUrl: call.url, seenInStates: [state] })
    }
  }
}

function dedupeTagManagers(tagManagers: PageResult['tagManagers']): PageResult['tagManagers'] {
  const seen = new Map<string, PageResult['tagManagers'][number]>()
  for (const tm of tagManagers) seen.set(`${tm.type}:${tm.containerId}`, tm)
  return Array.from(seen.values())
}

function pathSafe(url: string): string {
  return new URL(url).pathname.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'root'
}

function pathSafeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category'
}

function buildReport(
  id: string,
  startUrl: string,
  options: ScanOptions,
  pages: PageResult[],
  pagesSkippedRobots: string[],
  pagesUnscanned: string[],
  interrupted: boolean
): ScanReport {
  const pagesScanned = pages.map(p => p.url)
  const allFindingsByKey = new Map<string, TrackerFinding>()
  for (const page of pages) {
    for (const finding of page.findings) {
      const key = `${finding.kind}:${finding.id}`
      const existing = allFindingsByKey.get(key)
      if (existing) {
        for (const s of finding.seenInStates) if (!existing.seenInStates.includes(s)) existing.seenInStates.push(s)
      } else {
        allFindingsByKey.set(key, { ...finding, seenInStates: [...finding.seenInStates] })
      }
    }
  }

  const allFindings = Array.from(allFindingsByKey.values())
  const firingBeforeConsent = allFindings.filter(
    f => f.seenInStates.includes('no-consent') && f.category !== 'necessary'
  ).length
  const manualReview = allFindings.filter(f => f.confidence === 'unclassified')
  const pagesWithBlockingSuspicion = pages.filter(p => p.blockingSuspicion.suspected).length

  return {
    id,
    startUrl,
    scannedAt: new Date().toISOString(),
    depth: options.depth,
    pageLimit: options.pageLimit,
    pagesScanned,
    pagesSkippedRobots,
    pagesUnscanned,
    interrupted,
    pages,
    summary: {
      totalUniqueTrackers: allFindings.length,
      firingBeforeConsent,
      unclassifiedCount: manualReview.length,
      manualReview,
      pagesWithBlockingSuspicion,
    },
  }
}
