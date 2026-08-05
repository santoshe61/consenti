# @consenti/scanner

Local, offline CLI that crawls a site and reports undeclared third-party trackers — the gap
between what your cookie profile *declares* and what the site actually *fires*, captured under
three consent states so you can see exactly what runs before a visitor has agreed to anything.

No account, no server, no hosted service. Everything runs on your machine; the only network
traffic is the crawl itself.

## Install

```
npm install -D @consenti/scanner
npx consenti-scanner install-browsers   # one-time: installs Playwright's Chromium
```

## Usage

```
npx consenti-scanner scan https://example.com --depth 2 --output-dir ./scan-results
```

| Flag | Default | Meaning |
|---|---|---|
| `--depth <n>` | `1` | Link-crawl depth in hops from the start URL |
| `--page-limit <n>` | `10` | Max pages scanned, including the start URL |
| `--output-dir <dir>` | `./scan-results` | Base output directory — each scan gets its own `<dir>/<scan-id>/` (see below) |
| `--timeout <ms>` | `30000` | Per-page navigation timeout |
| `--headed` | off | Visible browser window, for debugging a scan |
| `--verbose` | off | Print every progress step on its own line instead of a single status spinner |
| `--skip-robots-txt` | off | Crawl every discovered link regardless of `robots.txt` disallow rules |
| `--skip-user-agent-checks` | off | Neutralize `navigator.webdriver` and strip "Headless" from the `User-Agent` — bypasses sites/CMPs that treat detected automation differently |
| `--enable-gpc` | off | Set `navigator.globalPrivacyControl = true` and send `Sec-GPC: 1` on every request |
| `--crawl-delay <s>` | jittered `uniform(2.0, 5.0)`s | Base wait, in seconds, applied after every navigation before acting on the page — see "Pacing and rate limits" below |

Exits non-zero when the report has unclassified trackers or anything firing before consent, or
when the scan was stopped early (Ctrl+C — see "Stopping a scan early" below) — usable as a CI/CD
gate (`npx consenti-scanner scan ... || exit 1`).

## Bypassing bot-averse CMPs and checking GPC behavior

`--skip-user-agent-checks` is the fix for the "known limitation" above where a site's CMP treats
detected automation differently (e.g. never rendering a banner for it) — off by default since it's
a deliberate act of bypassing a site's own check, not something to do silently on every scan. It
only affects requests made *after* the page has already loaded (the very first navigation request
necessarily goes out before this tool has a chance to correct anything) — which covers the common
case, since most CMPs run their own bot-check from an init script after load, not before.

`--enable-gpc` simulates a visitor with Global Privacy Control turned on. Run a scan with and
without it to see whether a site's tracking behavior actually changes in response — several US
state privacy laws require honoring GPC as an opt-out-of-sale/sharing signal, and a site that
doesn't is worth flagging regardless of what its cookie banner claims.

## Pacing and rate limits

Scanning a site too quickly can trip a CDN/WAF's per-IP rate limit (CloudFront and similar
commonly enforce one) — and once that happens, the same request-storm that got the scan blocked
can *also* look exactly like "this page has no CMP" (a request that never completes can't finish
loading an async banner script either). `--crawl-delay <seconds>` — named after robots.txt's own
`Crawl-delay` directive — is the fix for both at once: it's the wait applied after every single
navigation in the scan (crawl link-discovery, each consent state, preference-panel discovery, each
per-category test) before anything else touches the page, so a slow-to-initialize CMP gets time to
actually render *and* the target site sees requests spaced out rather than fired back-to-back.

Every wait is jittered, re-rolled independently per navigation — not a fixed interval repeated
every time. With no flag, each wait is drawn fresh from `uniform(2.0, 5.0)` seconds; with
`--crawl-delay 3`, each wait is `3 ± uniform(0, 2.0)` seconds. A perfectly periodic request cadence
is itself a signal some rate-limiters key off, so randomized spacing is closer to how a real
visitor's browser behaves than a fixed delay would be — and it also means link discovery no longer
needs a separate crawl pass: the same already-loaded, already-settled `no-consent` session harvests
the page's links directly, so a scan makes one fewer request per page than it used to.

The wait itself isn't idle either: it's spread across a handful of small random mouse movements
and occasional `Tab` key presses (`src/human-activity.ts`) rather than one flat pause — a page
that never moves the mouse or touches the keyboard for its entire lifetime is itself a signal
some bot-detection heuristics check for. Deliberately narrow: mouse moves go to random viewport
coordinates without hovering or clicking any specific element, and `Tab` only ever shifts keyboard
focus — nothing here can submit a form or activate a button the way a real click/Enter could.

If a scan still reports pages with `blockingSuspicion.suspected: true` (see below) despite
`--crawl-delay`, the site's threshold is stricter than the delay you picked — try a larger value.

**Detecting and recovering from an active block.** Beyond the end-of-scan `blockingSuspicion`
summary, the scan checks every response *as it's captured* for HTTP 403/429/503, or the
`X-Cache: Error from cloudfront` header CloudFront sends on an origin-fetch failure — the same
signals `blockingSuspicion` uses, checked live rather than only after the fact. (Cloudflare's own
numbered error pages, 1015 "rate limited" and 1020 "access denied", are served as ordinary 429/403
at the transport level — no separate status code exists for them, so checking these three codes
already covers both.) The moment any consent state on a page hits one of these, the scan aborts
the *rest of that page's states immediately* rather than continuing to hammer an already-blocked
target — a page that's blocked on `no-consent` never even attempts `reject-all`/`accept-all`.

If two pages in a row both come back blocked, the scan pauses (`Blocked with 429. Retrying in
11s...`) and shifts both pages back into the crawl queue to retry once the pause is over — giving a
transient rate limit time to clear rather than recording those pages as a permanent failure. A
single isolated block (not immediately followed by a second) is recorded as-is and the scan moves
on; it's specifically *two in a row* that trips the retry cycle, since that's the pattern that
actually indicates an engaged rate limiter rather than one one-off hiccup.

Once a URL is in that retry cycle, each further attempt escalates the wait rather than repeating a
flat pause — 11s, 31s, 61s, 301s, 601s, one second past each round number. A URL that recovers
partway through (any attempt that comes back clean) is scanned normally from there, same as any
other page. A URL still blocked after all five retries is given up on — it's added to the report's
`pagesUnscanned` list (and printed at the end of the CLI run) instead of being retried forever;
everything else in the scan proceeds and finishes normally around it.

## Progress output

A scan can take a while (several page loads × three consent states × settle time each), and
nothing was printed between the start and the final summary — indistinguishable from a hung
process. The CLI prints a live spinner for whatever's happening *right now*; once that step
finishes, its line is finalized in place (`✓ ...`) and stays in the scroll-back, and the spinner
moves on to the next line — completed steps are never erased or overwritten. On a non-interactive
stream (piped output, CI logs) each step is simply printed as its own line, same as `--verbose`
forces on an interactive terminal too — useful when debugging a slow or stuck scan.

The scan id (and where its output will land, `<output-dir>/<scan-id>/`) is printed immediately, up
front — before the scan does anything — not just at the end, specifically so it's still visible if
you stop the scan before it finishes (see below).

## Stopping a scan early

Press **Ctrl+C** once and the scan stops at its next safe checkpoint — before starting the next
queued page, or partway through a blocking-retry wait — rather than immediately: whatever page is
currently in flight finishes its current step first, so its result isn't thrown away half-formed.
Everything discovered up to that point is still written out as a normal JSON/HTML report pair
(with `ScanReport.interrupted: true`, an `⚠ Stopped early by user` callout in the HTML report, and
a `STOPPED` result from the CLI) — a scan you stop after 40 of 100 pages still gets you a usable
report for those 40, rather than nothing. Press Ctrl+C a **second** time to force an immediate
quit instead, with nothing written — for when you don't want to wait even for the current step.

Programmatic callers get the same behavior via `runScan`'s optional fourth argument,
`{ signal }` (a standard `AbortSignal`) — see "Programmatic use" below.

Each page announces its overall progress as `Scanning page X/Y (Z%): <url>` — `Y` is the best
current estimate of the total page count, not a fixed target, since depth ≥ 2 crawling discovers
new pages as it goes. Whenever a page's links turn up URLs not already queued, the scan prints
`Discovered N new page(s) — M total now` and `Y` grows to match — the percentage is against
however many pages are actually known about at that point, not an initial guess. A page paused for
a blocking retry (see below) also holds its place in that total until it's resolved, so the
denominator doesn't dip and recover as pages come and go from the retry queue.

Progress lines are colored by what kind of event they are — blue for a page starting, magenta for
newly-discovered pages, yellow for a block/retry, red for a give-up or error, green for a
completed step or the final summary — using the shared ANSI color engine in `@consenti/utils`
(`src/log.ts` is this package's single import point for it; the same engine backs
`apps/test-runner`'s colored output, so every CLI in the monorepo colors consistently instead of
each maintaining its own). Colors are skipped automatically when stdout isn't a TTY (piped output,
CI logs) or `NO_COLOR` is set, and forced on via `FORCE_COLOR`.

Programmatic callers get the same (uncolored-safe, since ANSI codes are just characters) stream via
`runScan`'s optional third `onProgress` argument.

## Output layout

Every scan gets a short random id (e.g. `116gltxj`) and its own directory, so concurrent or
historical scans never collide or overwrite each other's screenshots:

```
<output-dir>/<scan-id>/
  scan-results.json
  scan-results.html
  screenshots/
    <page>/no-consent.png
    <page>/reject-all.png
    <page>/accept-all.png
```

The id is also embedded in the report itself (`ScanReport.id`) and shown at the top of both the
console output and the HTML report.

## What it does

- **Crawls** same-origin links from the start URL, respecting `robots.txt`, bounded by
  `--depth`/`--page-limit` — fused directly into each page's `no-consent` scan session rather
  than a separate discovery pass (see "Pacing and rate limits" above).
- **Scans each page under three consent states**: no consent given, reject-all, accept-all —
  clicking through any detected CMP banner via multi-locale accept/reject button-label matching.
  Banner detection has two tiers, in order: (1) ~20 named CMP containers (Consenti's own,
  OneTrust, Cookiebot, Klaro, CookieYes, Sourcepoint, Quantcast, Didomi, TrustArc, Osano, and
  generic `cookie-banner`/`consent-banner` class/id patterns) — essentially certain when matched;
  (2) a generic scored fallback for anything else — a fixed/sticky-positioned element that touches
  a viewport edge, actually mentions cookies/consent/privacy (required, not just scored — this is
  what tells a real banner apart from a chat widget or promo bar sharing the same "fixed overlay"
  structure), and has buttons — reported as `bannerDetectionMethod: 'heuristic-fallback'`, a
  best-effort inference rather than a certainty. If no banner is detected at all by either tier,
  the report says so explicitly (`cmpDetected: false`) rather than guessing.
- **Explores the preference/customize panel**, if the banner has one: every button label on the
  banner (`bannerOptions`), every category toggle found in the panel with its label and
  locked/togglable state (`preferenceCategories`), and — for each togglable category — a dedicated
  test with only that category granted and every other one off (`categoryStates`), answering
  "what fires if a visitor grants only this category?" rather than just the all-or-nothing
  accept-all/reject-all extremes.
- **Behaviorally classifies unlabeled banner buttons**: a button whose label doesn't match any
  known accept/reject/manage/save phrase gets clicked in its own session and classified by what
  it actually does — reveals a new toggle panel (`manage-like`), causes new non-necessary trackers
  to fire beyond the `no-consent` baseline (`accept-like`), or neither (`reject-like`) — reported
  in `inferredBannerActions` with `confidence: 'inferred'`, distinct from a real label match.
- **Captures** cookies, localStorage, sessionStorage, IndexedDB, network requests, script tags,
  and iframe origins per state (via `@consenti/browser-engine`).
- **Classifies** every third-party cookie/request/script against a bundled offline dataset
  (`@consenti/utils`'s cookie-name knowledge base + this package's domain-name knowledge base).
  Unmatched trackers are never guessed into a category — they land in the report's
  `summary.manualReview` list instead.
- **Behavioral detection**: any third-party domain making requests post-load is flagged
  regardless of what its cookies are named.
- **CNAME/first-party-cloaking detection**: subdomains of the scanned site that CNAME to a
  different registrable domain are flagged — catches server-side-tagging setups that make a
  third-party tracker look same-site.
- **Tag manager detection**: recognizes GTM/Tealium container script tags. Doesn't need to
  separately "parse" what a container loads — the live capture above already observes every
  request the container actually fires at runtime.
- **Fingerprinting heuristics**: flags canvas (`getImageData`/`toDataURL`), audio
  (`OfflineAudioContext.startRendering`), and font-enumeration (`document.fonts.check` called
  in a tight loop) API usage as a separate non-cookie tracking category.
- **Blocking suspicion**: flags a page whose scan shows signs of a CDN/WAF block or rate-limit —
  a 403/429/503 (or CloudFront's `X-Cache: Error from cloudfront` header) on any request in any
  state, or a dramatic drop in request count between a page's own states (e.g. 73 → 1) — as
  `blockingSuspicion` with concrete evidence strings, so a sparse-looking result can be told apart
  from a genuinely sparse page. Detected live, not just after the fact: a blocked state aborts the
  rest of that page's states immediately, and two blocked pages in a row pause the scan 10 seconds
  before retrying both — see "Pacing and rate limits" above.

## Known limitation: cross-origin iframe banners

A handful of enterprise CMPs (Sourcepoint is the common one) render their banner inside a
cross-origin `<iframe>` rather than directly in the page DOM. This scanner's banner detection and
button-click heuristics only search the main frame plus same-origin frames — a cross-origin
iframe banner won't be found or clicked, and the scan correctly falls back to `cmpDetected: false`
rather than a false click, but that also means states 2/3 collapse to state 1 on those sites even
though a real CMP is present. Validated against a real production site running exactly this
pattern during v1 development (findings correctly landed as `unclassified` rather than being
mis-clicked or mis-classified) — a real, known gap, not a hypothetical one. Revisit with
Playwright's cross-origin `FrameLocator` if this proves common enough to matter for a given
release's target sites.

## Known limitation: geo-gated or bot-mitigated CMPs

Some CMPs (OneTrust in particular) decide server-side, per visitor, whether a banner is required
at all — usually via IP geolocation against the site's configured jurisdiction rules — and simply
never render one for a visitor classified as not needing consent. A scan can therefore correctly
report `cmpDetected: false` for a site that *does* show a real banner to visitors from a different
network/region than wherever the scan runs from; that's the CMP's own rule engine, not something
this tool can or should override. Separately, some sites sit behind bot-mitigation/WAF layers that
may serve automated traffic a degraded experience regardless of consent rules, or rate-limit any
traffic (bot or not) that requests too many pages too quickly — the latter is directly addressed
by `--crawl-delay` (see "Pacing and rate limits" above), and either produces a `blockingSuspicion`
flag in the report rather than a silent, indistinguishable "no CMP." `--skip-user-agent-checks`
(`src/stealth.ts`) reduces false negatives from the most trivial automation signals, but it's
opt-in and deliberately narrow (no fingerprint/TLS spoofing) — it won't help against WAF-level
blocking or a real geo-rule decision. If a scan reports no CMP for a site you know has one, check
`blockingSuspicion` first, then try `--crawl-delay`, `--skip-user-agent-checks`, re-running from a
different network, or `--headed --verbose` to watch what actually happens.

## What it doesn't do (v1)

No daemon/watch mode, no hosted signature feed, no community contribution loop, no hosted SaaS
scanning, no `@consenti/api` integration, no database — see
`plans/PENDING-scanner-v2.md` in the monorepo for what's deliberately deferred and why. No
geo-variant/proxy scanning either — routing scan traffic through region-specific exit nodes is
its own infra/legal surface, out of scope unless there's concrete demand for it.

## Programmatic use

```ts
import { runScan, writeReport, writeHtmlReport, hasBlockingFindings, generateScanId, DEFAULT_SCAN_OPTIONS } from '@consenti/scanner'

const scanId = generateScanId()
console.log(scanId) // known before the scan starts — e.g. to print/log it right away

const controller = new AbortController()
// controller.abort() at any point — from a signal handler, a timeout, whatever fits your
// caller — stops the scan at its next safe checkpoint and still returns a (partial,
// `interrupted: true`) report for whatever was discovered so far, rather than throwing.

const report = await runScan(
  'https://example.com',
  { ...DEFAULT_SCAN_OPTIONS, depth: 2 },
  message => console.log(message), // optional — progress updates as the scan runs
  { scanId, signal: controller.signal } // optional — both fields are independently optional too
)
console.log(report.id, report.interrupted) // e.g. '116gltxj' false — id is also the output directory's name
await writeReport(report, './scan-results')      // → ./scan-results/<report.id>/scan-results.json
await writeHtmlReport(report, './scan-results')  // → ./scan-results/<report.id>/scan-results.html
if (report.interrupted || hasBlockingFindings(report)) process.exitCode = 1
```

## HTML report

The CLI always writes a self-contained HTML report alongside the JSON one, in the same per-scan
directory (see "Output layout" above) — no fetch, no CDN, no external assets, so the file works
standalone once written, same as the rest of this offline-first tool. Sections (each independently
scrollable):

- **Summary** — totals, then one aggregated table per finding kind (Cookies, Requests, Scripts,
  Local Storage, Session Storage, Iframes) merged across every page, plus the site-wide list of
  trackers flagged for manual review. Most sites reuse the same trackers on every page, so this is
  the view worth reading first rather than a per-page table repeating the same rows. A finding
  present on only some pages (not (nearly) all of them) is called out with a `page-specific` pill
  and the exact URLs it fired on, rather than blending into the "normal" rows.
- **Pages** — one collapsible card per scanned page: a compact findings-by-kind count (full detail
  lives in the Summary tables above, cross-referenced by page), cloaking, fingerprinting, tag
  managers, screenshots, banner options, preference categories, per-category firing tests,
  behaviorally-inferred banner actions, a blocking-suspicion callout when flagged, and the page's
  raw JSON.
- **Crawl metadata** — pages scanned, pages skipped by `robots.txt`, pages given up on as blocked.
- **Suggested setup** — a consent template, UI template, and profile generated from the site's
  actual discovered trackers (grouped by purpose into one of Consenti's 8 built-in compliance
  groups, chosen heuristically from what was found — see the report for the rationale). Anything
  that couldn't be confidently classified is excluded and called out for manual review, consistent
  with this tool never auto-assigning `necessary` or writing to a live profile.
- **Frontend-only profile** — the same suggestion as a self-contained `ConsentiProfile({...})`
  snippet, ready to paste into a site using `@consenti/ui` with no backend at all.
- **Full report (raw JSON)** — a link to the sibling `scan-results.json` file, rather than the
  whole `ScanReport` embedded a second time — that duplication used to roughly double this page's
  size for a copy most readers never needed, when every section above already exposes its own
  relevant slice as raw JSON.

These suggestions are a starting point for the dashboard, not something this tool applies on your
behalf — review before importing.

Every section except the last also exposes its underlying data as raw JSON (collapsed by default,
in a short scrollable box) for programmatic use — copy it out, or read it via
`document.getElementById(...).textContent` — without needing the sibling `.json` file open
alongside it.

## Report shape

```
{
  id, startUrl, scannedAt, depth, pageLimit,
  pagesScanned: string[],
  pagesSkippedRobots: string[],
  pagesUnscanned: string[],                  // gave up as blocked after 5 escalating retries — see "Pacing and rate limits"
  interrupted: boolean,                      // true if stopped early via Ctrl+C / an AbortSignal — see "Stopping a scan early"
  pages: [{
    url, cmpDetected,
    bannerDetectionMethod: 'known-selector' | 'heuristic-fallback' | null,
    bannerOptions: string[],                 // every button label found on the banner
    preferenceCategories: [{ label, locked }],
    categoryStates: [{ category, signals, findings, screenshot }],
    inferredBannerActions: [{ buttonLabel, inferredAction, confidence: 'inferred', findings }],
    findings: [{ id, kind, vendor, category, confidence, seenInStates, detail }],
    cloaking: [{ subdomain, cnameTarget, cnameTargetRegistrableDomain, note }],
    fingerprinting: [{ technique, scriptUrl, seenInStates }],
    tagManagers: [{ type, containerId, scriptUrl }],
    screenshotsByState: { "no-consent": "...png", "reject-all": "...png", "accept-all": "...png" },
    blockingSuspicion: { suspected, evidence: string[], statusCodes: number[] },
  }],
  summary: {
    totalUniqueTrackers, firingBeforeConsent, unclassifiedCount, manualReview,
    pagesWithBlockingSuspicion,
  }
}
```

`findings` never auto-assigns `necessary` — that classification only ever comes from an exact or
pattern match against a known vendor whose primary purpose is genuinely necessary (e.g. Stripe
fraud-prevention cookies, Cloudflare bot management). Everything else is `unclassified` until a
human reviews it and imports it into a Consenti profile via the dashboard — this tool never
writes to a live profile itself.
