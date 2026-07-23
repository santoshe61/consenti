import { useEffect, useRef, useState } from 'preact/hooks'
import { ShieldCheck } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { DataTable } from '../components/DataTable'
import { RecordDetailModal, JsonValue } from '../components/RecordDetailModal'
import { consentsApi } from '../api/consents'
import { apiDownload } from '../api/client'
import { useHashQuery } from '../hooks/useHashQuery'
import { useT } from '../context/locale'
import type { ConsentSummary, ConsentDbRecord } from '@consenti/types'

const BASE_HASH = '#/consents'

export function ConsentList({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('consents.title'))
  const { params, setParams } = useHashQuery(BASE_HASH)

  const [records, setRecords] = useState<ConsentSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(() => Number(params.get('page')) || 1)
  const [pageSize, setPageSize] = useState(() => Number(params.get('limit')) || 25)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => params.get('from') ?? '')
  const [to, setTo] = useState(() => params.get('to') ?? '')
  const [gpcOnly, setGpcOnly] = useState(false)
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [selected, setSelected] = useState<ConsentDbRecord | null>(null)

  const load = (p: number, limit: number, search: string, fromDate: string, toDate: string) => {
    setLoading(true)
    consentsApi.list({ page: p, limit, from: fromDate || undefined, to: toDate || undefined, q: search || undefined })
      .then(res => { setRecords(res.items); setTotal(res.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page, pageSize, q, from, to) }, [page, pageSize, from, to])

  const isFirstQRender = useRef(true)
  useEffect(() => {
    if (isFirstQRender.current) { isFirstQRender.current = false; return }
    const handle = setTimeout(() => { setPage(1); load(1, pageSize, q, from, to) }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  useEffect(() => {
    setParams({ page: page > 1 ? page : undefined, limit: pageSize !== 25 ? pageSize : undefined, q: q || undefined, from: from || undefined, to: to || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q, from, to])

  const openDetail = (c: ConsentSummary) => {
    consentsApi.get(c.visitorId).then(setSelected).catch(() => {})
  }

  const filteredRecords = gpcOnly ? records.filter(r => r.gpcDetected) : records

  const exportUrl = () => {
    const p = new URLSearchParams({ format: 'csv' })
    if (from) p.set('from', from)
    if (to) p.set('to', to)
    return `/export/consents?${p.toString()}`
  }

  return (
    <>
      <RecordDetailModal
        open={!!selected}
        title={t('consents.detail.title')}
        onClose={() => setSelected(null)}
        fields={selected ? [
          { label: t('consents.col.visitorId'), value: <span class="font-mono text-xs">{selected.visitorId}</span> },
          { label: t('consents.col.profile'), value: <span class="font-mono text-xs">{selected.profileId}</span> },
          { label: t('consents.col.locale'), value: selected.locale },
          { label: t('consents.col.gpc'), value: selected.gpcDetected ? t('consents.gpcYes') : '—' },
          { label: t('consents.col.age'), value: selected.ageVerified ? t('consents.ageVerified') : '—' },
          { label: t('consents.col.source'), value: selected.source },
          { label: t('consents.col.created'), value: new Date(selected.createdAt).toLocaleString() },
          { label: t('consents.detail.updated'), value: new Date(selected.updatedAt).toLocaleString() },
          {
            label: t('consents.detail.signature'),
            value: selected.signature
              ? (
                <span class="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                  <ShieldCheck size={13} aria-hidden="true" /> {t('consents.detail.signed')}
                </span>
              )
              : <span class="text-gray-400">{t('consents.detail.unsigned')}</span>,
          },
          { label: t('consents.detail.consentJson'), value: <JsonValue value={selected.consentJson} /> },
        ] : []}
      />

      <DataTable
        loading={loading}
        rows={filteredRecords as unknown as Record<string, unknown>[]}
        keyFn={r => (r as unknown as ConsentSummary).id}
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder={t('consents.searchPlaceholder')}
        total={total}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={n => { setPageSize(n); setPage(1) }}
        filters={
          <>
            <label class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              {t('consents.filterFrom')}
              <input
                type="date"
                value={from}
                onInput={e => { setFrom((e.target as HTMLInputElement).value); setPage(1) }}
                class="ml-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
            </label>
            <label class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              {t('consents.filterTo')}
              <input
                type="date"
                value={to}
                onInput={e => { setTo((e.target as HTMLInputElement).value); setPage(1) }}
                class="ml-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
            </label>
            <label class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" checked={gpcOnly} onChange={e => setGpcOnly((e.target as HTMLInputElement).checked)} />
              {t('consents.filterGpc')}
            </label>
          </>
        }
        toolbarEnd={
          <>
            <span class="text-sm text-gray-500 dark:text-gray-400">{t('consents.records', { n: total })}</span>
            <button onClick={() => { void apiDownload(exportUrl()) }} class="text-sm text-blue-600 hover:underline">
              {t('common.exportCsv')}
            </button>
          </>
        }
        columns={[
          { key: 'visitorId', label: t('consents.col.visitorId'), render: r => {
            const c = r as unknown as ConsentSummary
            return (
              <button onClick={() => openDetail(c)} class="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {c.visitorId.slice(0, 12)}…
              </button>
            )
          }},
          { key: 'profileId', label: t('consents.col.profile'), render: r => <span class="font-mono text-xs">{(r as unknown as ConsentSummary).profileId.slice(0, 8)}</span> },
          { key: 'locale', label: t('consents.col.locale') },
          { key: 'gpcDetected', label: t('consents.col.gpc'), render: r => (r as unknown as ConsentSummary).gpcDetected ? <span class="text-amber-600 font-medium text-xs">{t('consents.gpcYes')}</span> : '' },
          { key: 'ageVerified', label: t('consents.col.age'), render: r => (r as unknown as ConsentSummary).ageVerified ? <span class="text-green-600 font-medium text-xs">{t('consents.ageVerified')}</span> : '' },
          { key: 'source', label: t('consents.col.source') },
          { key: 'createdAt', label: t('consents.col.created'), render: r => new Date((r as unknown as ConsentSummary).createdAt).toLocaleString() },
        ]}
        emptyText={t('consents.empty')}
      />
    </>
  )
}
