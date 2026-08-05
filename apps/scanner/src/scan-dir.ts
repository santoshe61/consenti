import { join } from 'node:path'

/** Every scan's output — JSON report, HTML report, and screenshots — lives under
 * `<outputDir>/<scan.id>/`, so a single scan is fully self-contained in one directory and
 * concurrent or historical scans never collide or overwrite each other. Shared by `scan.ts`
 * (screenshot paths, computed while the scan is still running) and `report.ts`/`html-report.ts`
 * (written once the scan is done) so the formula only lives in one place. */
export function scanDirPath(outputDir: string, id: string): string {
  return join(outputDir, id)
}
