import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { scanDirPath } from './scan-dir.js'
import type { ScanReport } from './types.js'

/** Writes `scan-results.json` under `<outputDir>/<report.id>/` — the same per-scan directory
 * `writeHtmlReport` and the scan's own screenshots use — and returns the path written. */
export async function writeReport(report: ScanReport, outputDir: string): Promise<string> {
  const dir = scanDirPath(outputDir, report.id)
  await mkdir(dir, { recursive: true })
  const path = join(dir, 'scan-results.json')
  await writeFile(path, JSON.stringify(report, null, 2), 'utf-8')
  return path
}

/** Non-zero when the scan found anything a CI gate should fail on: an unclassified/manual-review
 * tracker, any tracker (classified or not) firing before consent, or a page that couldn't be
 * scanned at all (navigation failure). That last case matters as much as the other two — a scan
 * that silently couldn't load a page and reports zero trackers found is not the same thing as a
 * scan that loaded the page and confirmed zero trackers; treating them the same would let a
 * broken URL or a down site pass a CI gate by accident. */
export function hasBlockingFindings(report: ScanReport): boolean {
  return (
    report.summary.unclassifiedCount > 0 ||
    report.summary.firingBeforeConsent > 0 ||
    report.pages.some(p => p.error !== undefined)
  )
}
