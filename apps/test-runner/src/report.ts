import { writeFile } from 'node:fs/promises'
import { relative, sep } from 'node:path'
import type { ComboOutcome, FunctionalCheck, RunReport } from './types.js'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function relImg(reportDir: string, absPath: string): string {
  return relative(reportDir, absPath).split(sep).join('/')
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number') return String(v)
  return JSON.stringify(v, null, 2)
}

const STATUS_COLOR: Record<string, string> = {
  pass: '#1a7f37',
  fail: '#cf222e',
  'new-baseline': '#0969da',
  'not-applicable': '#6e7781',
  error: '#cf222e',
}

function badge(status: string): string {
  const color = STATUS_COLOR[status] ?? '#6e7781'
  return `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;color:#fff;background:${color}">${esc(status.toUpperCase())}</span>`
}

function visualCell(outcome: ComboOutcome, reportDir: string): string {
  const label = `${esc(outcome.combo.jurisdiction)} / ${esc(outcome.combo.state)}`
  switch (outcome.status) {
    case 'pass':
      return `<div class="cell">${badge('pass')}<br>${label}<br><a href="${relImg(reportDir, outcome.outputPath)}" target="_blank"><img src="${relImg(reportDir, outcome.outputPath)}" style="max-width:220px;border:1px solid #d0d7de;margin-top:4px"></a></div>`
    case 'new-baseline':
      return `<div class="cell">${badge('new-baseline')}<br>${label}<br><a href="${relImg(reportDir, outcome.outputPath)}" target="_blank"><img src="${relImg(reportDir, outcome.outputPath)}" style="max-width:220px;border:1px solid #d0d7de;margin-top:4px"></a></div>`
    case 'fail':
      return `<div class="cell">${badge('fail')}<br>${label} (${(outcome.diffRatio * 100).toFixed(2)}% diff)<br>`
        + `<a href="${relImg(reportDir, outcome.outputPath)}" target="_blank"><img src="${relImg(reportDir, outcome.outputPath)}" style="max-width:160px;border:1px solid #d0d7de;margin:4px 2px" title="output"></a>`
        + `<a href="${relImg(reportDir, outcome.diffPath)}" target="_blank"><img src="${relImg(reportDir, outcome.diffPath)}" style="max-width:160px;border:1px solid #cf222e;margin:4px 2px" title="diff"></a>`
        + `</div>`
    case 'not-applicable':
      return `<div class="cell">${badge('not-applicable')}<br>${label}<br><span style="color:#6e7781;font-size:12px">${outcome.reason}</span></div>`
    case 'error':
      return `<div class="cell">${badge('error')}<br>${label}<br><span style="color:#cf222e;font-size:12px">${esc(outcome.message)}</span></div>`
  }
}

function functionalRow(check: FunctionalCheck, index: number): string {
  return `<tr>
    <td>${index + 1}</td>
    <td>${esc(check.jurisdiction)}</td>
    <td>${esc(check.state ?? '—')}</td>
    <td>${esc(check.kind)}</td>
    <td>${esc(check.target)}</td>
    <td>${esc(check.description)}</td>
    <td><code>${esc(fmt(check.expected))}</code></td>
    <td><code>${esc(fmt(check.actual))}</code></td>
    <td>${badge(check.status)}</td>
    <td>${esc(check.message ?? '')}</td>
  </tr>`
}

function summaryTable(report: RunReport): string {
  const v = report.summary.visual
  const f = report.summary.functional
  return `<table style="border-collapse:collapse;margin-bottom:24px">
    <tr><th></th><th style="padding:4px 12px">pass</th><th style="padding:4px 12px">fail</th><th style="padding:4px 12px">new-baseline</th><th style="padding:4px 12px">n/a</th><th style="padding:4px 12px">error</th></tr>
    <tr><td style="padding:4px 12px;font-weight:600">visual</td><td style="padding:4px 12px">${v.pass}</td><td style="padding:4px 12px">${v.fail}</td><td style="padding:4px 12px">${v.newBaseline}</td><td style="padding:4px 12px">${v.notApplicable}</td><td style="padding:4px 12px">${v.error}</td></tr>
    <tr><td style="padding:4px 12px;font-weight:600">functional</td><td style="padding:4px 12px">${f.pass}</td><td style="padding:4px 12px">${f.fail}</td><td style="padding:4px 12px">—</td><td style="padding:4px 12px">${f.notApplicable}</td><td style="padding:4px 12px">${f.error}</td></tr>
  </table>`
}

/**
 * Renders a self-contained HTML view of a `RunReport` — `report.json` stays the
 * machine-readable source of truth, this is a pure render step over the same data, not a
 * second reporting system. Image `src`s are relative paths computed against `reportDir`
 * (where `report.html` itself is written — the run's `resultsDir`), so the report is only
 * browsable from there — it's a local dev artifact, not something published anywhere.
 */
export async function writeHtmlReport(report: RunReport, htmlPath: string, reportDir: string): Promise<void> {
  const visualRows = report.outcomes.map(o => visualCell(o, reportDir))
  const functionalRows = report.functionalChecks.map(functionalRow)

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Consenti test-runner report</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; margin: 24px; color: #1f2328; }
  h1 { font-size: 20px; }
  h2 { font-size: 16px; margin-top: 32px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #d0d7de; vertical-align: top; text-align: left; font-size: 12px; padding: 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
  .cell { border: 1px solid #d0d7de; padding: 8px; font-size: 12px; }
  code { white-space: pre; text-wrap:auto;}
  .table-header{position: sticky;top: 0;background: #c9c9c9;}
  table td, table th {max-width: 400px;}
</style>
</head>
<body>
<h1>Consenti test-runner report</h1>
<p>Started: ${esc(report.startedAt)} — Finished: ${esc(report.finishedAt)} — Scope: ${esc(report.config.scope)}</p>
${summaryTable(report)}

<h2>Visual (${visualRows.length})</h2>
<div class="grid">${visualRows.join('')}</div>

<h2>Functional (${functionalRows.length})</h2>
<table>
  <tr class="table-header"><th>#</th><th>Jurisdiction</th><th>State</th><th>Kind</th><th>Target</th><th>Description</th><th>Expected</th><th>Actual</th><th>Status</th><th>Message</th></tr>
  ${functionalRows.join('\n')}
</table>
</body>
</html>
`

  await writeFile(htmlPath, html)
}
