import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { Pagination } from '../components/Pagination'
import { visitorsApi } from '../api/visitors'
import type { Visitor } from '@consenti/types'

export function VisitorList({ current }: { current: string }) {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p: number) => {
    setLoading(true)
    visitorsApi.list({ page: p })
      .then(setVisitors)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  return (
    <Layout title="Visitors" current={current}>
      <Table
        loading={loading}
        keyFn={r => (r as unknown as Visitor).id}
        rows={visitors as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'visitorId', label: 'Visitor ID', render: r => <span class="font-mono text-xs">{(r as unknown as Visitor).visitorId.slice(0, 16)}…</span> },
          { key: 'country', label: 'Country', render: r => (r as unknown as Visitor).country ?? '—' },
          { key: 'firstSeen', label: 'First Seen', render: r => new Date((r as unknown as Visitor).firstSeen).toLocaleDateString() },
          { key: 'lastSeen', label: 'Last Seen', render: r => new Date((r as unknown as Visitor).lastSeen).toLocaleDateString() },
        ]}
        emptyText="No visitors recorded yet."
      />
      <Pagination page={page} hasMore={visitors.length === 50} onPage={setPage} />
    </Layout>
  )
}
