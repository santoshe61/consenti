import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { Pagination } from '../components/Pagination'
import { apiDownload } from '../api/client'
import { auditApi } from '../api/audit'
import type { AuditLog } from '@consenti/types'

export function AuditLogPage({ current }: { current: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p: number) => {
    setLoading(true)
    auditApi.list({ page: p })
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  return (
    <Layout title="Audit Log" current={current}>
      <div class="flex justify-end mb-4">
        <button
          onClick={() => apiDownload('/export/audit?format=csv')}
          class="text-sm text-blue-600 hover:underline"
        >
          Export CSV
        </button>
      </div>

      <Table
        loading={loading}
        keyFn={r => (r as unknown as AuditLog).id}
        rows={logs as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'createdAt', label: 'Time', render: r => new Date((r as unknown as AuditLog).createdAt).toLocaleString() },
          { key: 'action', label: 'Action' },
          { key: 'resourceType', label: 'Resource' },
          { key: 'resourceId', label: 'Resource ID', render: r => {
            const id = (r as unknown as AuditLog).resourceId
            return id ? <span class="font-mono text-xs">{id.slice(0, 12)}…</span> : '—'
          }},
          { key: 'userId', label: 'Actor', render: r => {
            const uid = (r as unknown as AuditLog).userId
            return uid ? <span class="font-mono text-xs">{uid.slice(0, 8)}</span> : <span class="text-gray-400">system</span>
          }},
        ]}
        emptyText="No audit events yet."
      />

      <Pagination page={page} hasMore={logs.length === 50} onPage={setPage} />
    </Layout>
  )
}
