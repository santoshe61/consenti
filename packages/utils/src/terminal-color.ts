/**
 * Minimal, dependency-free ANSI helpers for coloring console output — shared by any package/app
 * that prints to a terminal (originally `apps/test-runner`'s internal helper, moved here so
 * `apps/scanner` can reuse the same engine instead of duplicating it). Not worth an external
 * chalk/picocolors dependency for a handful of colors. Disabled automatically when stdout isn't a
 * TTY (CI logs, piping to a file) or `NO_COLOR` is set, or forced on via `FORCE_COLOR`.
 */

function colorEnabled(): boolean {
  // Guarded rather than assumed Node-only: this package is also consumed by @consenti/ui in the
  // browser, where `process` doesn't exist at all.
  if (typeof process === 'undefined') return false
  if (process.env.NO_COLOR) return false
  if (process.env.FORCE_COLOR) return true
  return Boolean(process.stdout?.isTTY)
}

function wrap(open: number, close: number): (s: string) => string {
  return (s: string) => (colorEnabled() ? `\x1b[${open}m${s}\x1b[${close}m` : s)
}

export const color = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39),
}

export type StatusKind = 'pass' | 'fail' | 'error' | 'not-applicable' | 'new-baseline'

const STATUS_STYLE: Record<StatusKind, (s: string) => string> = {
  pass: s => color.bold(color.green(s)),
  fail: s => color.bold(color.red(s)),
  error: s => color.bold(color.red(s)),
  'not-applicable': s => color.gray(s),
  'new-baseline': s => color.bold(color.blue(s)),
}

/** A fixed-width, colored status label — e.g. `PASS      ` in bold green. */
export function statusLabel(status: StatusKind, width = 10): string {
  const text = status.toUpperCase().padEnd(width)
  return STATUS_STYLE[status](text)
}

export type LogLevel = 'info' | 'success' | 'warn' | 'error'

const LEVEL_STYLE: Record<LogLevel, { symbol: string; paint: (s: string) => string }> = {
  info: { symbol: 'ℹ', paint: color.cyan },
  success: { symbol: '✓', paint: color.green },
  warn: { symbol: '⚠', paint: color.yellow },
  error: { symbol: '✗', paint: color.red },
}

/** Formats `message` with a level-appropriate color and symbol prefix — e.g.
 * `formatLog('warn', 'Blocked with 429')` → a yellow `⚠ Blocked with 429`. Returns a plain string
 * (never writes anywhere itself) so callers can feed it into `console.log`, a spinner, or any
 * other sink, same as the rest of this file's colorizers. */
export function formatLog(level: LogLevel, message: string): string {
  const { symbol, paint } = LEVEL_STYLE[level]
  return `${paint(symbol)} ${message}`
}
