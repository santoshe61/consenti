import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import type { DiffResult } from './types.js'

export interface DiffOptions {
  outputPath: string
  baselinePath: string
  diffPath: string
  /** Per-pixel pixelmatch sensitivity, 0–1 (pixelmatch default 0.1). */
  threshold: number
  /** Fraction of total pixels allowed to differ before the combo is a fail. */
  maxDiffRatio: number
  updateBaseline: boolean
}

/**
 * Compares a freshly captured screenshot against its checked-in baseline.
 *
 * - `--update-baseline` always accepts the new capture as the baseline (used to record a
 *   first baseline, or to intentionally accept a visual change after human review).
 * - No baseline file yet, and not updating → `new-baseline`, not a failure. The combo is
 *   flagged as a candidate for someone to review and commit via `--update-baseline`, same as
 *   a code review — never auto-committed to `baseline/` on a plain run.
 * - Dimension mismatch (baseline predates a layout change) is treated as a full-frame fail
 *   rather than throwing, since pixelmatch requires equal dimensions.
 */
export async function diffAgainstBaseline(options: DiffOptions): Promise<DiffResult> {
  const { outputPath, baselinePath, diffPath, threshold, maxDiffRatio, updateBaseline } = options

  if (updateBaseline) {
    await mkdir(dirname(baselinePath), { recursive: true })
    await copyFile(outputPath, baselinePath)
    return { status: 'new-baseline' }
  }

  if (!existsSync(baselinePath)) {
    return { status: 'new-baseline' }
  }

  const [outputBuf, baselineBuf] = await Promise.all([readFile(outputPath), readFile(baselinePath)])
  const output = PNG.sync.read(outputBuf)
  const baseline = PNG.sync.read(baselineBuf)

  if (output.width !== baseline.width || output.height !== baseline.height) {
    return { status: 'fail', diffPath, diffPixels: -1, diffRatio: 1 }
  }

  const { width, height } = output
  const diff = new PNG({ width, height })
  const diffPixels = pixelmatch(baseline.data, output.data, diff.data, width, height, { threshold })
  const diffRatio = diffPixels / (width * height)

  if (diffRatio > maxDiffRatio) {
    await mkdir(dirname(diffPath), { recursive: true })
    await writeFile(diffPath, PNG.sync.write(diff))
    return { status: 'fail', diffPath, diffPixels, diffRatio }
  }

  return { status: 'pass' }
}
