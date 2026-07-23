import type { TimelineEntry, CountryStat, GpcStats } from '@consenti/types'

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      <p class="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {sub && <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export function TimelineChart({ data, ariaLabel, noDataLabel }: { data: TimelineEntry[]; ariaLabel: string; noDataLabel: string }) {
  if (data.length === 0) return <p class="text-sm text-gray-400">{noDataLabel}</p>
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 600
  const H = 120
  const PAD = 24
  const w = W - PAD * 2
  const h = H - PAD * 2
  const step = w / Math.max(data.length - 1, 1)

  const points = data.map((d, i) => ({
    x: PAD + i * step,
    y: PAD + h - (d.count / max) * h,
    label: d.date.slice(5),
    count: d.count,
  }))

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${points[points.length - 1]!.x} ${PAD + h} L ${points[0]!.x} ${PAD + h} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="w-full" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#tl-grad)" />
      <path d={path} fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" />
          {i % Math.max(Math.floor(data.length / 6), 1) === 0 && (
            <text x={p.x} y={H - 4} text-anchor="middle" font-size="8" fill="#9ca3af">{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

export function CountryChart({ data, noDataLabel }: { data: CountryStat[]; noDataLabel: string }) {
  if (data.length === 0) return <p class="text-sm text-gray-400">{noDataLabel}</p>
  const top = data.slice(0, 8)
  const max = Math.max(...top.map(d => d.count), 1)
  return (
    <div class="space-y-2">
      {top.map(d => (
        <div key={d.country} class="flex items-center gap-2">
          <span class="text-xs text-gray-500 w-8 text-right">{d.country}</span>
          <div class="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
            <div
              class="h-full bg-indigo-500 rounded"
              style={{ width: `${(d.count / max) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span class="text-xs text-gray-600 w-8">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

export function GpcMeter({ data, label, sub }: { data: GpcStats; label: string; sub: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (data.rate / 100) * circ
  return (
    <div class="flex items-center gap-4">
      <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${label}: ${data.rate}%`}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" stroke-width="8" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke="#6366f1" stroke-width="8"
          stroke-dasharray={`${dash} ${circ}`}
          stroke-linecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="49" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor" class="text-gray-800 dark:text-gray-100" aria-hidden="true">
          {data.rate}%
        </text>
      </svg>
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

interface BreakdownRow {
  label: string
  granted: number
  denied: number
  objected: number
}

/** Horizontal stacked bar per row — one bar per category/locale, segmented granted/denied/objected. */
export function BreakdownBarChart({ rows, noDataLabel, grantedLabel, deniedLabel, objectedLabel }: {
  rows: BreakdownRow[]
  noDataLabel: string
  grantedLabel: string
  deniedLabel: string
  objectedLabel: string
}) {
  if (rows.length === 0) return <p class="text-sm text-gray-400">{noDataLabel}</p>
  const max = Math.max(...rows.map(r => r.granted + r.denied + r.objected), 1)
  return (
    <div class="space-y-3">
      <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" aria-hidden="true" />{grantedLabel}</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" aria-hidden="true" />{deniedLabel}</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" aria-hidden="true" />{objectedLabel}</span>
      </div>
      {rows.map(r => {
        const total = r.granted + r.denied + r.objected
        return (
          <div key={r.label} class="flex items-center gap-2">
            <span class="text-xs text-gray-600 dark:text-gray-300 w-28 truncate" title={r.label}>{r.label}</span>
            <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded h-3 overflow-hidden flex">
              {total > 0 && (
                <>
                  <div class="h-full bg-emerald-500" style={{ width: `${(r.granted / max) * 100}%` }} aria-hidden="true" />
                  <div class="h-full bg-rose-500" style={{ width: `${(r.denied / max) * 100}%` }} aria-hidden="true" />
                  <div class="h-full bg-amber-500" style={{ width: `${(r.objected / max) * 100}%` }} aria-hidden="true" />
                </>
              )}
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{total}</span>
          </div>
        )
      })}
    </div>
  )
}
