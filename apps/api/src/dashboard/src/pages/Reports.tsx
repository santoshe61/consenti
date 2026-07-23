import { useEffect, useState } from 'preact/hooks'
import { usePageTitle } from '../context/pageTitle'
import { StatCard, TimelineChart, BreakdownBarChart } from '../components/charts'
import { statsApi } from '../api/stats'
import { analyticsApi } from '../api/analytics'
import { apiDownload } from '../api/client'
import { useT } from '../context/locale'
import type { CategoryStats, OptInStats, TimelineEntry } from '@consenti/types'

export function Reports({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('reports.title'))
  const [categories, setCategories] = useState<CategoryStats | null>(null)
  const [optIn, setOptIn] = useState<OptInStats | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const filters: { from?: string; to?: string } = {}
    if (from) filters.from = from
    if (to) filters.to = to
    Promise.all([
      statsApi.categories().then(setCategories).catch(() => {}),
      analyticsApi.optIn(filters).then(setOptIn).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const categoryRows = categories
    ? Object.entries(categories).map(([label, v]) => ({ label, granted: v.granted, denied: v.denied, objected: v.objected }))
    : []

  const localeRows = optIn
    ? Object.entries(optIn.byLocale).map(([label, v]) => ({ label, granted: v.granted, denied: v.denied, objected: v.managed }))
    : []

  const byDateTimeline: TimelineEntry[] = optIn
    ? optIn.byDate.map(d => ({ date: d.date, count: d.total }))
    : []

  return (
    <>
      <div class="space-y-6">
        <form
          class="flex flex-wrap items-end gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          onSubmit={e => { e.preventDefault(); load() }}
        >
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1" for="reports-from">{t('reports.filters.from')}</label>
            <input
              id="reports-from"
              type="date"
              value={from}
              onChange={e => setFrom((e.target as HTMLInputElement).value)}
              class="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1" for="reports-to">{t('reports.filters.to')}</label>
            <input
              id="reports-to"
              type="date"
              value={to}
              onChange={e => setTo((e.target as HTMLInputElement).value)}
              class="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1.5"
            />
          </div>
          <button type="submit" class="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            {t('reports.filters.apply')}
          </button>
          <button
            type="button"
            onClick={() => apiDownload('/export/consents?format=csv')}
            class="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('common.exportCsv')}
          </button>
        </form>

        {loading ? (
          <p role="status" aria-live="polite" class="text-gray-400 text-sm">{t('common.loading')}</p>
        ) : (
          <>
            {optIn && (
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label={t('reports.optin.total')} value={optIn.total} />
                <StatCard label={t('reports.optin.granted')} value={`${optIn.grantedPct}%`} />
                <StatCard label={t('reports.optin.denied')} value={`${optIn.deniedPct}%`} />
                <StatCard label={t('reports.optin.managed')} value={`${optIn.managedPct}%`} />
              </div>
            )}

            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('reports.optin.byDate')}</p>
              <TimelineChart
                data={byDateTimeline}
                ariaLabel={t('reports.optin.byDateAria')}
                noDataLabel={t('dashboard.chart.noData')}
              />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('reports.category.title')}</p>
                <BreakdownBarChart
                  rows={categoryRows}
                  noDataLabel={t('dashboard.chart.noData')}
                  grantedLabel={t('reports.legend.granted')}
                  deniedLabel={t('reports.legend.denied')}
                  objectedLabel={t('reports.legend.objected')}
                />
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('reports.optin.byLocale')}</p>
                <BreakdownBarChart
                  rows={localeRows}
                  noDataLabel={t('dashboard.chart.noData')}
                  grantedLabel={t('reports.legend.granted')}
                  deniedLabel={t('reports.legend.denied')}
                  objectedLabel={t('reports.legend.managed')}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
