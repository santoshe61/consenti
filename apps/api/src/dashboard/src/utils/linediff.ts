// Minimal dependency-free line diff (classic LCS dynamic programming) — used to render a
// git-style unified diff between two pretty-printed JSON version snapshots. Version files are
// small (single profile snapshots), so the O(n*m) table is negligible; not meant for large inputs.

export interface DiffLine {
  type: 'same' | 'add' | 'del'
  line: string
}

export function diffLines(before: string[], after: string[]): DiffLine[] {
  const n = before.length
  const m = after.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = before[i] === after[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
    }
  }
  const result: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      result.push({ type: 'same', line: before[i]! })
      i++; j++
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      result.push({ type: 'del', line: before[i]! })
      i++
    } else {
      result.push({ type: 'add', line: after[j]! })
      j++
    }
  }
  while (i < n) { result.push({ type: 'del', line: before[i]! }); i++ }
  while (j < m) { result.push({ type: 'add', line: after[j]! }); j++ }
  return result
}
