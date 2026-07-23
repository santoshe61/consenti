import { useEffect, useRef, useState } from 'preact/hooks'
import { usePageTitle } from '../context/pageTitle'
import { DataTable } from '../components/DataTable'
import { RecordDetailModal } from '../components/RecordDetailModal'
import { visitorsApi } from '../api/visitors'
import { useHashQuery } from '../hooks/useHashQuery'
import { useT } from '../context/locale'
import type { Visitor } from '@consenti/types'

const BASE_HASH = '#/visitors'

export function VisitorList({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('visitors.title'))
  const { params, setParams } = useHashQuery(BASE_HASH)

  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(() => Number(params.get('page')) || 1)
  const [pageSize, setPageSize] = useState(() => Number(params.get('limit')) || 25)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [selected, setSelected] = useState<Visitor | null>(null)

  const openDetail = (v: Visitor) => {
    setSelected(v)
  }

  const load = (p: number, limit: number, search: string) => {
    setLoading(true)
    visitorsApi.list({ page: p, limit, ...(search ? { q: search } : {}) })
      .then(res => { setVisitors(res.items); setTotal(res.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page, pageSize, q) }, [page, pageSize])

  const isFirstQRender = useRef(true)
  useEffect(() => {
    if (isFirstQRender.current) { isFirstQRender.current = false; return }
    const handle = setTimeout(() => { setPage(1); load(1, pageSize, q) }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  useEffect(() => {
    setParams({ page: page > 1 ? page : undefined, limit: pageSize !== 25 ? pageSize : undefined, q: q || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q])

  return (
    <>
      <RecordDetailModal
        open={!!selected}
        title={t('visitors.detail.title')}
        onClose={() => setSelected(null)}
        fields={selected ? [
          { label: t('visitors.col.visitorId'), value: <span class="font-mono text-xs">{selected.visitorId}</span> },
          { label: t('visitors.col.country'), value: selected.country ?? '—' },
          { label: t('visitors.detail.region'), value: selected.region ?? '—' },
          { label: t('visitors.detail.city'), value: selected.city ?? '—' },
          { label: t('visitors.col.firstSeen'), value: new Date(selected.firstSeen).toLocaleString() },
          { label: t('visitors.col.lastSeen'), value: new Date(selected.lastSeen).toLocaleString() },
        ] : []}
      />

      <DataTable
        loading={loading}
        rows={visitors as unknown as Record<string, unknown>[]}
        keyFn={r => (r as unknown as Visitor).id}
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder={t('visitors.searchPlaceholder')}
        total={total}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={n => { setPageSize(n); setPage(1) }}
        columns={[
          { key: 'visitorId', label: t('visitors.col.visitorId'), render: r => {
            const v = r as unknown as Visitor
            return (
              <button onClick={() => openDetail(v)} class="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {v.visitorId.slice(0, 16)}…
              </button>
            )
          }},
          { key: 'country', label: t('visitors.col.country'), render: r => (r as unknown as Visitor).country ?? '—' },
          { key: 'firstSeen', label: t('visitors.col.firstSeen'), render: r => new Date((r as unknown as Visitor).firstSeen).toLocaleDateString() },
          { key: 'lastSeen', label: t('visitors.col.lastSeen'), render: r => new Date((r as unknown as Visitor).lastSeen).toLocaleDateString() },
        ]}
        emptyText={t('visitors.empty')}
      />
    </>
  )
}
