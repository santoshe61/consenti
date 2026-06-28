import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { Pagination } from '../components/Pagination'
import { consentsApi } from '../api/consents'
import { apiDownload } from '../api/client'
import type { ConsentDbRecord } from '@consenti/types'

export function ConsentList({ current }: { current: string }) {
  const [records, setRecords] = useState<ConsentDbRecord[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [gpcOnly, setGpcOnly] = useState(false)

  const load = (p: number) => {
    setLoading(true)
    consentsApi.list({ page: p, from: from || undefined, to: to || undefined })
      .then(rows => {
        const filtered = gpcOnly ? rows.filter(r => r.gpcDetected) : rows
        setRecords(filtered)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page, from, to, gpcOnly])

  const exportUrl = () => {
    const params = new URLSearchParams({ format: 'csv' })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return `/export/consents?${params.toString()}`
  }

  return (
    <Layout title="Consent Records" current={current}>
      <div class="flex flex-wrap gap-3 items-center mb-4">
        <label class="flex items-center gap-1 text-sm text-gray-600">
          From
          <input
            type="date"
            value={from}
            onInput={e => { setFrom((e.target as HTMLInputElement).value); setPage(1) }}
            class="ml-1 border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </label>
        <label class="flex items-center gap-1 text-sm text-gray-600">
          To
          <input
            type="date"
            value={to}
            onInput={e => { setTo((e.target as HTMLInputElement).value); setPage(1) }}
            class="ml-1 border border-gray-300 rounded px-2 py-1 text-xs"
          />
        </label>
        <label class="flex items-center gap-1 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={gpcOnly}
            onChange={e => { setGpcOnly((e.target as HTMLInputElement).checked); setPage(1) }}
          />
          GPC only
        </label>
        <div class="ml-auto flex items-center gap-3">
          <span class="text-sm text-gray-500">{records.length} records</span>
          <button
            onClick={() => apiDownload(exportUrl())}
            class="text-sm text-blue-600 hover:underline"
          >
            Export CSV
          </button>
        </div>
      </div>

      <Table
        loading={loading}
        keyFn={r => (r as unknown as ConsentDbRecord).id}
        rows={records as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'visitorId', label: 'Visitor ID', render: r => <span class="font-mono text-xs">{(r as unknown as ConsentDbRecord).visitorId.slice(0, 12)}…</span> },
          { key: 'profileId', label: 'Profile', render: r => <span class="font-mono text-xs">{(r as unknown as ConsentDbRecord).profileId.slice(0, 8)}</span> },
          { key: 'locale', label: 'Locale' },
          { key: 'gpcDetected', label: 'GPC', render: r => (r as unknown as ConsentDbRecord).gpcDetected ? <span class="text-amber-600 font-medium text-xs">Yes</span> : '' },
          { key: 'ageVerified', label: 'Age', render: r => (r as unknown as ConsentDbRecord).ageVerified ? <span class="text-green-600 font-medium text-xs">Verified</span> : '' },
          { key: 'source', label: 'Source' },
          { key: 'createdAt', label: 'Created', render: r => new Date((r as unknown as ConsentDbRecord).createdAt).toLocaleString() },
        ]}
        emptyText="No consent records yet."
      />

      <Pagination page={page} hasMore={records.length === 50} onPage={setPage} />
    </Layout>
  )
}
