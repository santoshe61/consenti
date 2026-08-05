import { mkdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { hasBlockingFindings } from './report.js'
import { scanDirPath } from './scan-dir.js'
import { buildSuggestedSetup } from './suggest.js'
import type {
  CategoryStateResult,
  CloakingFinding,
  ConsentState,
  FingerprintFinding,
  InferredBannerAction,
  PageResult,
  PreferenceCategory,
  ScanReport,
  TagManagerFinding,
  TrackerFinding,
} from './types.js'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function json(value: unknown): string {
  return esc(JSON.stringify(value, null, 2))
}

function relImg(reportDir: string, absPath: string): string {
  return relative(reportDir, absPath).split(sep).join('/')
}

const CONFIDENCE_COLOR: Record<string, string> = {
  exact: '#1a7f37',
  pattern: '#9a6700',
  'behavioral-only': '#9a6700',
  unclassified: '#cf222e',
}

function confidenceBadge(confidence: string): string {
  const color = CONFIDENCE_COLOR[confidence] ?? '#6e7781'
  return `<span class="badge" style="background:${color}">${esc(confidence)}</span>`
}

function statePill(state: ConsentState): string {
  const color = state === 'no-consent' ? '#cf222e' : state === 'reject-all' ? '#9a6700' : '#1a7f37'
  return `<span class="pill" style="border-color:${color};color:${color}">${esc(state)}</span>`
}

/** One `TrackerFinding` merged across every page it appeared on — the Summary section's unit of
 * display. Most sites reuse the same handful of trackers on every page, so a per-page findings
 * table is almost entirely duplicate rows; this collapses them to one row per `kind:id`, while
 * keeping enough page attribution (`pages`) to flag the exception — a finding that only fired on
 * some pages, which is exactly the kind of detail a fully-collapsed table would hide. */
interface AggregatedFinding {
  id: string
  kind: TrackerFinding['kind']
  vendor: string | null
  category: TrackerFinding['category']
  confidence: TrackerFinding['confidence']
  seenInStates: ConsentState[]
  pages: string[]
}

const KIND_LABELS: Record<TrackerFinding['kind'], string> = {
  cookie: 'Cookies',
  request: 'Requests',
  script: 'Scripts',
  localStorage: 'Local Storage',
  sessionStorage: 'Session Storage',
  iframe: 'Iframes',
}

const KIND_ORDER: TrackerFinding['kind'][] = [
  'cookie',
  'request',
  'script',
  'localStorage',
  'sessionStorage',
  'iframe',
]

function aggregateFindingsByKind(pages: PageResult[]): Map<TrackerFinding['kind'], AggregatedFinding[]> {
  const byKey = new Map<string, AggregatedFinding>()
  for (const page of pages) {
    for (const f of page.findings) {
      const key = `${f.kind}:${f.id}`
      let agg = byKey.get(key)
      if (!agg) {
        agg = { id: f.id, kind: f.kind, vendor: f.vendor, category: f.category, confidence: f.confidence, seenInStates: [], pages: [] }
        byKey.set(key, agg)
      }
      if (!agg.vendor && f.vendor) agg.vendor = f.vendor
      if (!agg.category && f.category) agg.category = f.category
      if (agg.confidence === 'unclassified' && f.confidence !== 'unclassified') agg.confidence = f.confidence
      for (const s of f.seenInStates) if (!agg.seenInStates.includes(s)) agg.seenInStates.push(s)
      if (!agg.pages.includes(page.url)) agg.pages.push(page.url)
    }
  }
  const byKind = new Map<TrackerFinding['kind'], AggregatedFinding[]>()
  for (const agg of byKey.values()) {
    const list = byKind.get(agg.kind)
    if (list) list.push(agg)
    else byKind.set(agg.kind, [agg])
  }
  return byKind
}

/** A finding present on every (or nearly every) scanned page is the norm — the same analytics
 * tag on every page of a site — so it's `pages.length === totalPages` that gets the quiet label.
 * A finding confined to half or fewer of the scanned pages is the exception worth calling out: it
 * might be a page-specific pixel, or it might be a tracker that only fires on, say, the checkout
 * flow — either way a reader shouldn't assume it applies site-wide just because it's in this table. */
function pageAttributionCell(pages: string[], totalPages: number): string {
  if (totalPages <= 1) return '—'
  if (pages.length === totalPages) return `<span class="pill" style="border-color:#57606a;color:#57606a">all ${totalPages} pages</span>`
  const isPageSpecific = pages.length <= Math.ceil(totalPages / 2)
  const list = pages.slice(0, 3).map(esc).join('<br>') + (pages.length > 3 ? `<br>+${pages.length - 3} more` : '')
  if (isPageSpecific) {
    return `<span class="pill" style="border-color:#9a6700;color:#9a6700">page-specific (${pages.length}/${totalPages})</span><div style="margin-top:4px;font-size:11px;word-break:break-all">${list}</div>`
  }
  return `<span class="pill">${pages.length}/${totalPages} pages</span>`
}

function aggregatedKindTable(kind: TrackerFinding['kind'], findings: AggregatedFinding[], totalPages: number): string {
  const rows = findings
    .slice()
    .sort((a, b) => b.pages.length - a.pages.length || a.id.localeCompare(b.id))
    .map(
      f => `<tr>
      <td><code>${esc(f.id)}</code></td>
      <td>${esc(f.vendor ?? '—')}</td>
      <td>${esc(f.category ?? '—')}</td>
      <td>${confidenceBadge(f.confidence)}</td>
      <td>${f.seenInStates.map(statePill).join(' ') || '—'}</td>
      <td>${pageAttributionCell(f.pages, totalPages)}</td>
    </tr>`
    )
    .join('')
  return `<h3>${KIND_LABELS[kind]} (${findings.length})</h3>
  <div class="scroll-panel"><table><thead><tr><th>id</th><th>vendor</th><th>category</th><th>confidence</th><th>seen in</th><th>pages</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

/** One aggregated table per finding kind, in `KIND_ORDER` — the Summary section's main content.
 * Skips kinds with zero findings entirely rather than rendering an empty table. */
function aggregatedFindingsSection(pages: PageResult[]): string {
  const byKind = aggregateFindingsByKind(pages)
  const totalPages = pages.length
  return KIND_ORDER.map(kind => {
    const findings = byKind.get(kind)
    if (!findings || findings.length === 0) return ''
    return aggregatedKindTable(kind, findings, totalPages)
  }).join('')
}

function findingsCountByKind(findings: TrackerFinding[]): string {
  if (findings.length === 0) return '<p class="empty">No trackers found.</p>'
  const counts = new Map<TrackerFinding['kind'], number>()
  for (const f of findings) counts.set(f.kind, (counts.get(f.kind) ?? 0) + 1)
  const parts = KIND_ORDER.filter(k => counts.has(k)).map(k => `${counts.get(k)} ${KIND_LABELS[k].toLowerCase()}`)
  return `<p class="rationale">${parts.join(', ')} — see the <a href="#summary">Summary</a> section's per-category tables for full detail across all pages.</p>`
}

function findingsTable(findings: TrackerFinding[]): string {
  if (findings.length === 0) return '<p class="empty">No trackers found.</p>'
  const rows = findings
    .map(
      f => `<tr>
      <td><code>${esc(f.id)}</code></td>
      <td>${esc(f.kind)}</td>
      <td>${esc(f.vendor ?? '—')}</td>
      <td>${esc(f.category ?? '—')}</td>
      <td>${confidenceBadge(f.confidence)}</td>
      <td>${f.seenInStates.map(statePill).join(' ') || '—'}</td>
      <td>${esc(f.detail ?? '')}</td>
    </tr>`
    )
    .join('')
  return `<table><thead><tr><th>id</th><th>kind</th><th>vendor</th><th>category</th><th>confidence</th><th>seen in</th><th>detail</th></tr></thead><tbody>${rows}</tbody></table>`
}

function cloakingTable(findings: CloakingFinding[]): string {
  if (findings.length === 0) return ''
  const rows = findings
    .map(
      f => `<tr><td><code>${esc(f.subdomain)}</code></td><td><code>${esc(f.cnameTarget)}</code></td><td>${esc(f.cnameTargetRegistrableDomain)}</td><td>${esc(f.note)}</td></tr>`
    )
    .join('')
  return `<h4>Cloaking (${findings.length})</h4><table><thead><tr><th>subdomain</th><th>cname target</th><th>registrable domain</th><th>note</th></tr></thead><tbody>${rows}</tbody></table>`
}

function fingerprintTable(findings: FingerprintFinding[]): string {
  if (findings.length === 0) return ''
  const rows = findings
    .map(
      f => `<tr><td>${esc(f.technique)}</td><td>${f.scriptUrl ? `<code>${esc(f.scriptUrl)}</code>` : '—'}</td><td>${f.seenInStates.map(statePill).join(' ') || '—'}</td></tr>`
    )
    .join('')
  return `<h4>Fingerprinting (${findings.length})</h4><table><thead><tr><th>technique</th><th>script</th><th>seen in</th></tr></thead><tbody>${rows}</tbody></table>`
}

function tagManagerTable(findings: TagManagerFinding[]): string {
  if (findings.length === 0) return ''
  const rows = findings
    .map(f => `<tr><td>${esc(f.type)}</td><td><code>${esc(f.containerId)}</code></td><td><code>${esc(f.scriptUrl)}</code></td></tr>`)
    .join('')
  return `<h4>Tag managers (${findings.length})</h4><table><thead><tr><th>type</th><th>container id</th><th>script</th></tr></thead><tbody>${rows}</tbody></table>`
}

function bannerOptionsList(options: string[]): string {
  if (options.length === 0) return ''
  return `<h4>Banner options (${options.length})</h4><div>${options.map(o => `<span class="pill">${esc(o)}</span>`).join(' ')}</div>`
}

function preferenceCategoriesTable(categories: PreferenceCategory[]): string {
  if (categories.length === 0) return ''
  const rows = categories
    .map(
      c => `<tr>
      <td>${esc(c.label)}</td>
      <td>${c.locked ? '<span class="pill" style="border-color:#6e7781;color:#6e7781">locked</span>' : '<span class="pill" style="border-color:#1a7f37;color:#1a7f37">togglable</span>'}</td>
    </tr>`
    )
    .join('')
  return `<h4>Preference categories (${categories.length})</h4><table><thead><tr><th>category</th><th>state</th></tr></thead><tbody>${rows}</tbody></table>`
}

function categoryStatesSection(states: CategoryStateResult[], reportDir: string): string {
  if (states.length === 0) return ''
  const blocks = states
    .map(cs => {
      const screenshot = cs.screenshot
        ? `<div class="shots"><a href="${esc(relImg(reportDir, cs.screenshot))}" target="_blank"><figure><img src="${esc(relImg(reportDir, cs.screenshot))}" loading="lazy"></figure></a></div>`
        : ''
      return `<details class="page-card">
        <summary>${esc(cs.category)} <span class="pill">${cs.findings.length} finding${cs.findings.length === 1 ? '' : 's'}</span></summary>
        <div class="page-body">
          ${findingsTable(cs.findings)}
          ${screenshot}
        </div>
      </details>`
    })
    .join('')
  return `<h4>Per-category firing test (${states.length}) <span class="pill" style="border-color:#57606a;color:#57606a">only this category granted, all others off</span></h4>${blocks}`
}

const INFERRED_ACTION_COLOR: Record<InferredBannerAction['inferredAction'], string> = {
  'accept-like': '#1a7f37',
  'reject-like': '#9a6700',
  'manage-like': '#0969da',
  inconclusive: '#6e7781',
}

function inferredBannerActionsSection(actions: InferredBannerAction[]): string {
  if (actions.length === 0) return ''
  const blocks = actions
    .map(a => {
      const color = INFERRED_ACTION_COLOR[a.inferredAction]
      return `<details class="page-card">
        <summary>
          "${esc(a.buttonLabel)}"
          <span class="pill" style="border-color:${color};color:${color}">${esc(a.inferredAction)}</span>
          <span class="pill">inferred</span>
        </summary>
        <div class="page-body">${findingsTable(a.findings)}</div>
      </details>`
    })
    .join('')
  return `<h4>Behaviorally-inferred banner actions (${actions.length}) <span class="pill" style="border-color:#57606a;color:#57606a">unlabeled buttons, classified by observed behavior</span></h4>${blocks}`
}

function screenshots(page: PageResult, reportDir: string): string {
  const entries = Object.entries(page.screenshotsByState).filter(([, path]) => !!path) as [ConsentState, string][]
  if (entries.length === 0) return ''
  const cells = entries
    .map(
      ([state, path]) =>
        `<a href="${esc(relImg(reportDir, path))}" target="_blank"><figure>${statePill(state)}<img src="${esc(relImg(reportDir, path))}" loading="lazy"></figure></a>`
    )
    .join('')
  return `<h4>Screenshots</h4><div class="shots">${cells}</div>`
}

function blockingSuspicionCallout(page: PageResult): string {
  if (!page.blockingSuspicion.suspected) return ''
  const items = page.blockingSuspicion.evidence.map(e => `<li>${esc(e)}</li>`).join('')
  return `<div class="blocking-callout">
    <strong>⚠ Possible CDN/WAF block or rate-limit</strong> — this page's results may be incomplete,
    not necessarily a compliance gap. Try <code>--crawl-delay</code> to slow down.
    <ul>${items}</ul>
  </div>`
}

function pageCard(page: PageResult, index: number, reportDir: string): string {
  const totalFindings = page.findings.length
  const errorBanner = page.error ? `<p class="error-banner">Scan error: ${esc(page.error)}</p>` : ''
  return `<details class="page-card">
    <summary>
      <span class="page-index">#${index + 1}</span>
      <span class="page-url">${esc(page.url)}</span>
      <span class="pill" style="border-color:${page.cmpDetected ? '#1a7f37' : '#cf222e'};color:${page.cmpDetected ? '#1a7f37' : '#cf222e'}">${page.cmpDetected ? `CMP detected${page.bannerDetectionMethod === 'heuristic-fallback' ? ' (inferred)' : ''}` : 'no CMP detected'}</span>
      <span class="pill">${totalFindings} finding${totalFindings === 1 ? '' : 's'}</span>
      ${page.error ? '<span class="pill" style="border-color:#cf222e;color:#cf222e">error</span>' : ''}
      ${page.blockingSuspicion.suspected ? '<span class="pill" style="border-color:#9a6700;color:#9a6700">⚠ blocking suspected</span>' : ''}
    </summary>
    <div class="page-body">
      ${errorBanner}
      ${blockingSuspicionCallout(page)}
      <h4>Findings (${totalFindings})</h4>
      ${findingsCountByKind(page.findings)}
      ${cloakingTable(page.cloaking)}
      ${fingerprintTable(page.fingerprinting)}
      ${tagManagerTable(page.tagManagers)}
      ${screenshots(page, reportDir)}
      ${bannerOptionsList(page.bannerOptions)}
      ${preferenceCategoriesTable(page.preferenceCategories)}
      ${categoryStatesSection(page.categoryStates, reportDir)}
      ${inferredBannerActionsSection(page.inferredBannerActions)}
      <details class="raw-json"><summary>Raw JSON for this page</summary><pre class="json">${json(page)}</pre></details>
    </div>
  </details>`
}

const STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; color: #1f2328; background: #f6f8fa; }
  header { position: sticky; top: 0; z-index: 10; background: #fff; border-bottom: 1px solid #d0d7de; padding: 16px 24px; }
  header h1 { margin: 0 0 4px; font-size: 20px; }
  .meta { color: #57606a; font-size: 13px; }
  .top-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; color: #fff; margin-left: 8px; }
  nav { margin-top: 10px; display: flex; gap: 14px; flex-wrap: wrap; }
  nav a { font-size: 13px; color: #0969da; text-decoration: none; }
  nav a:hover { text-decoration: underline; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px; }
  section { background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px; }
  section h2 { margin-top: 0; font-size: 17px; }
  section h3 { font-size: 14px; margin: 20px 0 8px; }
  section h4 { font-size: 13px; margin: 16px 0 6px; }
  p.rationale { color: #57606a; font-size: 13px; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 8px; }
  .stat { border: 1px solid #d0d7de; border-radius: 6px; padding: 10px 14px; }
  .stat .n { font-size: 22px; font-weight: 700; display: block; }
  .stat .l { font-size: 12px; color: #57606a; }
  .scroll-panel { max-height: 420px; overflow: auto; border: 1px solid #d0d7de; border-radius: 6px; }
  .scroll-panel.tall { max-height: 640px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border-bottom: 1px solid #eaeef2; text-align: left; padding: 6px 10px; vertical-align: top; }
  thead th { position: sticky; top: 0; background: #f6f8fa; }
  code { background: #f6f8fa; border-radius: 4px; padding: 1px 5px; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; }
  .pill { display: inline-block; padding: 1px 8px; border: 1px solid #d0d7de; border-radius: 10px; font-size: 11px; margin-right: 4px; }
  .page-card { border-bottom: 1px solid #eaeef2; padding: 10px 12px; }
  .page-card summary { cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .page-index { color: #57606a; }
  .page-url { font-weight: 600; flex: 1; word-break: break-all; }
  .page-body { padding: 10px 4px 4px; }
  .error-banner { color: #cf222e; font-weight: 600; }
  .blocking-callout { background: #fff8e6; border: 1px solid #d4a72c; border-radius: 6px; padding: 10px 14px; margin: 10px 0; font-size: 12.5px; color: #5a4a0a; }
  .blocking-callout ul { margin: 6px 0 0; padding-left: 18px; }
  .shots { display: flex; gap: 12px; flex-wrap: wrap; }
  .shots figure { margin: 0; text-align: center; }
  .shots img { max-width: 200px; border: 1px solid #d0d7de; border-radius: 4px; margin-top: 4px; display: block; }
  details.raw-json { margin-top: 10px; }
  details.raw-json summary { cursor: pointer; font-size: 12px; color: #57606a; }
  details.raw-json[open] summary { margin-bottom: 6px; }
  /* Setting summary { display: flex } (above, for .page-card) drops the browser's native
     disclosure triangle entirely rather than just restyling it — so every <summary> in this
     report gets an explicit, always-visible chevron instead, consistent whether or not it's
     flexed. Without this a collapsed section is visually indistinguishable from "there's nothing
     more here". */
  summary { list-style: none; }
  summary::-webkit-details-marker { display: none; }
  summary::before {
    content: '▸'; display: inline-block; flex-shrink: 0; margin-right: 6px;
    transition: transform 0.15s ease; color: #57606a;
  }
  details[open] > summary::before { transform: rotate(90deg); }
  pre.json, pre.code {
    margin: 0; padding: 12px; font-size: 11.5px; white-space: pre-wrap; word-break: break-word;
    max-height: 320px; overflow: auto; border: 1px solid #d0d7de; border-radius: 6px;
  }
  pre.code { font-size: 12.5px; background: #0d1117; color: #e6edf3; border-color: #0d1117; }
  .copy-btn { float: right; font-size: 11px; border: 1px solid #d0d7de; background: #fff; border-radius: 6px; padding: 3px 8px; cursor: pointer; }
  ul.plain { margin: 4px 0; padding-left: 18px; font-size: 12.5px; }
  footer { text-align: center; color: #8c959f; font-size: 12px; padding: 24px; }
`

const SCRIPT = `
  document.querySelectorAll('time.local-date').forEach(function (el) {
    var d = new Date(el.getAttribute('datetime'));
    if (!isNaN(d.getTime())) el.textContent = d.toLocaleString();
  });
  document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.getElementById(btn.getAttribute('data-copy-target'));
      if (!target) return;
      navigator.clipboard.writeText(target.textContent).then(function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 1200);
      }).catch(function () {});
    });
  });
`

/**
 * Renders a self-contained, offline HTML view of a `ScanReport` — the JSON report stays the
 * canonical, machine-readable source of truth (used for CI gating and programmatic consumption
 * via `hasBlockingFindings`); this is a pure render step over the same data, not a second
 * reporting system. Every finding, page, and suggestion is embedded directly in the returned
 * HTML string (no fetch, no external assets, no CDN) — the file works by itself once written,
 * consistent with the scanner's "everything runs on your machine" design. Screenshot `src`s are
 * relative paths computed against `reportDir` (where the HTML file itself lives), so keep the
 * HTML alongside the JSON report it was built from.
 */
export function renderHtmlReport(report: ScanReport, reportDir: string): string {
  const hostname = new URL(report.startUrl).hostname
  const failing = hasBlockingFindings(report)
  const setup = buildSuggestedSetup(report)
  const erroredPages = report.pages.filter(p => p.error !== undefined)

  const pagesHtml = report.pages.map((p, i) => pageCard(p, i, reportDir)).join('')

  const manualReviewHtml =
    report.summary.manualReview.length === 0
      ? '<p class="empty">Nothing flagged — every discovered tracker matched a known vendor/category.</p>'
      : findingsTable(report.summary.manualReview)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Consenti scan report — ${esc(hostname)} — ${esc(report.id)}</title>
<style>${STYLE}</style>
</head>
<body>
<header>
  <h1>Consenti Scanner Report<span class="top-badge" style="background:${report.interrupted ? '#9a6700' : failing ? '#cf222e' : '#1a7f37'}">${report.interrupted ? 'STOPPED EARLY' : failing ? 'FAIL' : 'PASS'}</span></h1>
  <div class="meta">
    Scan ID: <code>${esc(report.id)}</code> —
    ${esc(report.startUrl)} — scanned <time class="local-date" datetime="${esc(report.scannedAt)}">${esc(report.scannedAt)}</time> — depth ${report.depth}, page limit ${report.pageLimit} —
    ${report.pagesScanned.length} page(s) scanned, ${report.pagesSkippedRobots.length} skipped by robots.txt
    ${erroredPages.length > 0 ? `, ${erroredPages.length} failed to scan` : ''}
    ${report.pagesUnscanned.length > 0 ? `, ${report.pagesUnscanned.length} gave up as blocked` : ''}
  </div>
  ${report.interrupted ? '<div class="blocking-callout"><strong>⚠ Stopped early by user</strong> — this report reflects only what was discovered before the scan was stopped, not a complete crawl.</div>' : ''}
  <nav>
    <a href="#summary">Summary</a>
    <a href="#pages">Pages (${report.pages.length})</a>
    <a href="#crawl">Crawl metadata</a>
    <a href="#suggested-setup">Suggested setup</a>
    <a href="#frontend-only">Frontend-only profile</a>
    <a href="#raw-report">Full report (raw JSON)</a>
  </nav>
</header>
<main>

<section id="summary">
  <h2>Summary</h2>
  <div class="stat-grid">
    <div class="stat"><span class="n">${report.summary.totalUniqueTrackers}</span><span class="l">unique trackers</span></div>
    <div class="stat"><span class="n">${report.summary.firingBeforeConsent}</span><span class="l">firing before consent</span></div>
    <div class="stat"><span class="n">${report.summary.unclassifiedCount}</span><span class="l">unclassified</span></div>
    <div class="stat"><span class="n">${erroredPages.length}</span><span class="l">pages failed to scan</span></div>
    <div class="stat"><span class="n">${report.summary.pagesWithBlockingSuspicion}</span><span class="l">pages: blocking suspected</span></div>
  </div>
  ${report.summary.pagesWithBlockingSuspicion > 0 ? '<div class="blocking-callout"><strong>⚠ Some pages show signs of a CDN/WAF block or rate-limit mid-scan</strong> — those results may be incomplete, not necessarily a compliance gap. See the flagged pages below, or try <code>--crawl-delay</code> to slow down.</div>' : ''}
  <p class="rationale">One row per tracker, merged across every page it appeared on — most sites reuse the same
    trackers site-wide, so this is the view worth reading first. The <strong>pages</strong> column calls out
    anything that only fired on some pages instead of (nearly) all of them. Per-page detail is still available
    in <a href="#pages">Pages</a> below.</p>
  ${aggregatedFindingsSection(report.pages)}
  <h3>Flagged for manual review (${report.summary.manualReview.length})</h3>
  <div class="scroll-panel">${manualReviewHtml}</div>
  <details class="raw-json"><summary>Raw JSON — summary</summary><pre class="json">${json(report.summary)}</pre></details>
</section>

<section id="pages">
  <h2>Pages (${report.pages.length})</h2>
  <div class="scroll-panel tall">${pagesHtml}</div>
  <details class="raw-json"><summary>Raw JSON — all pages</summary><pre class="json">${json(report.pages)}</pre></details>
</section>

<section id="crawl">
  <h2>Crawl metadata</h2>
  <h3>Pages scanned (${report.pagesScanned.length})</h3>
  <div class="scroll-panel"><ul class="plain">${report.pagesScanned.map(u => `<li>${esc(u)}</li>`).join('')}</ul></div>
  <h3>Skipped by robots.txt (${report.pagesSkippedRobots.length})</h3>
  <div class="scroll-panel">${report.pagesSkippedRobots.length === 0 ? '<p class="empty">None.</p>' : `<ul class="plain">${report.pagesSkippedRobots.map(u => `<li>${esc(u)}</li>`).join('')}</ul>`}</div>
  <h3>Gave up as blocked (${report.pagesUnscanned.length})</h3>
  <div class="scroll-panel">${report.pagesUnscanned.length === 0 ? '<p class="empty">None.</p>' : `<ul class="plain">${report.pagesUnscanned.map(u => `<li>${esc(u)}</li>`).join('')}</ul>`}</div>
  <details class="raw-json"><summary>Raw JSON — crawl metadata</summary><pre class="json">${json({
    startUrl: report.startUrl,
    scannedAt: report.scannedAt,
    depth: report.depth,
    pageLimit: report.pageLimit,
    interrupted: report.interrupted,
    pagesScanned: report.pagesScanned,
    pagesSkippedRobots: report.pagesSkippedRobots,
    pagesUnscanned: report.pagesUnscanned,
  })}</pre></details>
</section>

<section id="suggested-setup">
  <h2>Suggested setup</h2>
  <p class="rationale"><strong>Suggested compliance group: ${esc(setup.complianceGroup)}.</strong> ${esc(setup.complianceRationale)}</p>
  ${setup.needsManualReview.length > 0 ? `<p class="rationale">${setup.needsManualReview.length} tracker(s) could not be confidently placed into a category and are excluded from the suggestions below — review them in the Summary section above before importing anything.</p>` : ''}
  <p class="rationale">Generated from this scan — review before importing. This tool never writes to a live profile itself.</p>

  <h3>1. Consent template <button class="copy-btn" data-copy-target="consent-template-json">Copy</button></h3>
  <pre class="json" id="consent-template-json">${json(setup.consentTemplate)}</pre>

  <h3>2. UI template <button class="copy-btn" data-copy-target="ui-template-json">Copy</button></h3>
  <pre class="json" id="ui-template-json">${json(setup.uiTemplate)}</pre>

  <h3>3. Profile <button class="copy-btn" data-copy-target="profile-json">Copy</button></h3>
  <pre class="json" id="profile-json">${json(setup.profile)}</pre>
</section>

<section id="frontend-only">
  <h2>Frontend-only profile (no backend)</h2>
  <p class="rationale">
    A self-contained <code>ConsentiProfile</code> — cookies, categories, and banner/modal text inline, no
    <code>consentTemplateId</code>/<code>uiTemplateId</code> and no server round trip. Paste directly into a
    site using <code>@consenti/ui</code> without <code>@consenti/api</code>. See "Local profile (no backend)"
    in <code>apps/ui/README.md</code> for the full runtime shape.
  </p>
  <button class="copy-btn" data-copy-target="frontend-only-code">Copy</button>
  <pre class="code" id="frontend-only-code">${esc(`import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'

const profile = new ConsentiProfile(${JSON.stringify(setup.frontendOnlyProfile, null, 2)})

new ConsentiSetup({
  compliance: { type: profile.getComplianceGroup() },
})`)}</pre>
</section>

<section id="raw-report">
  <h2>Full report (raw JSON)</h2>
  <p class="rationale">The complete <code>ScanReport</code> this page was rendered from is written alongside this
    HTML file as its own JSON file — not duplicated here, since embedding the whole report a second time made this
    page considerably heavier for little benefit (every section above already exposes its own relevant slice as raw
    JSON, collapsed by default). Open <a href="scan-results.json"><code>scan-results.json</code></a> directly for
    programmatic use.</p>
</section>

</main>
<footer>Generated by @consenti/scanner — scan <code>${esc(report.id)}</code> — <time class="local-date" datetime="${esc(report.scannedAt)}">${esc(report.scannedAt)}</time></footer>
<script>${SCRIPT}</script>
</body>
</html>
`
}

/** Writes `scan-results.html` under `<outputDir>/<report.id>/` — the same per-scan directory
 * `writeReport` and the scan's own screenshots use — and returns the path written. Screenshot
 * links inside are relative to that directory. */
export async function writeHtmlReport(report: ScanReport, outputDir: string): Promise<string> {
  const dir = scanDirPath(outputDir, report.id)
  await mkdir(dir, { recursive: true })
  const path = join(dir, 'scan-results.html')
  const html = renderHtmlReport(report, dir)
  await writeFile(path, html, 'utf-8')
  return path
}
