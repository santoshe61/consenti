import { useEffect, useState } from 'preact/hooks'
import { usePageTitle } from '../context/pageTitle'
import { StatCard, TimelineChart, CountryChart, GpcMeter } from '../components/charts'
import { statsApi } from '../api/stats'
import { useT } from '../context/locale'
import type { OverviewStats, TimelineEntry, CountryStat, GpcStats } from '@consenti/types'

export function Dashboard({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('dashboard.title'))
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
    <>
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

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <a href="#/reports" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {t('dashboard.viewReports')}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
