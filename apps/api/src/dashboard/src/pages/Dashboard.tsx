import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { statsApi } from '../api/stats'
import { useT } from '../context/locale'
import type { OverviewStats, TimelineEntry, CountryStat, GpcStats } from '@consenti/types'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      <p class="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {sub && <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function TimelineChart({ data, ariaLabel, noDataLabel }: { data: TimelineEntry[]; ariaLabel: string; noDataLabel: string }) {
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

function CountryChart({ data, noDataLabel }: { data: CountryStat[]; noDataLabel: string }) {
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

function GpcMeter({ data, label, sub }: { data: GpcStats; label: string; sub: string }) {
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
        <p class="text-sm font-medium text-gray-700">{label}</p>
        <p class="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  )
}

export function Dashboard({ current }: { current: string }) {
  const t = useT()
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [countries, setCountries] = useState<CountryStat[]>([])
  const [gpc, setGpc] = useState<GpcStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.overview().then(setStats).catch(() => {}),
      statsApi.timeline(30).then(setTimeline).catch(() => {}),
      statsApi.countries().then(setCountries).catch(() => {}),
      statsApi.gpc().then(setGpc).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <Layout title={t('dashboard.title')} current={current}>
      {loading ? (
        <p role="status" aria-live="polite" class="text-gray-400 text-sm">{t('common.loading')}</p>
      ) : (
        <div class="space-y-6">
          {stats && (
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('dashboard.stats.totalConsents')} value={stats.totalConsents} />
              <StatCard label={t('dashboard.stats.totalVisitors')} value={stats.totalVisitors} />
              <StatCard label={t('dashboard.stats.accepted')} value={`${stats.acceptedPct}%`} sub={t('dashboard.stats.acceptedSub')} />
              <StatCard label={t('dashboard.stats.rejected')} value={`${stats.rejectedPct}%`} sub={t('dashboard.stats.rejectedSub')} />
            </div>
          )}

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('dashboard.chart.timeline')}</p>
              <TimelineChart
                data={timeline}
                ariaLabel={t('dashboard.chart.timelineAria')}
                noDataLabel={t('dashboard.chart.noData')}
              />
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('dashboard.chart.countries')}</p>
              <CountryChart data={countries} noDataLabel={t('dashboard.chart.noCountryData')} />
            </div>
          </div>

          {gpc && (
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <GpcMeter
                data={gpc}
                label={t('dashboard.gpc.label')}
                sub={t('dashboard.gpc.sub', { detected: gpc.detected, total: gpc.total })}
              />
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
