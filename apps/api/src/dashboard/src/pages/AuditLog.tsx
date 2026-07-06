import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { Pagination } from '../components/Pagination'
import { apiDownload } from '../api/client'
import { auditApi } from '../api/audit'
import { useT } from '../context/locale'
import type { AuditLog } from '@consenti/types'

export function AuditLogPage({ current }: { current: string }) {
  const t = useT()
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
    <Layout title={t('audit.title')} current={current}>
      <div class="flex justify-end mb-4">
        <button
          onClick={() => apiDownload('/export/audit?format=csv')}
          class="text-sm text-blue-600 hover:underline"
        >
          {t('common.exportCsv')}
        </button>
      </div>

      <Table
        loading={loading}
        keyFn={r => (r as unknown as AuditLog).id}
        rows={logs as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'createdAt', label: t('audit.col.time'), render: r => new Date((r as unknown as AuditLog).createdAt).toLocaleString() },
          { key: 'action', label: t('audit.col.action') },
          { key: 'resourceType', label: t('audit.col.resource') },
          { key: 'resourceId', label: t('audit.col.resourceId'), render: r => {
            const id = (r as unknown as AuditLog).resourceId
            return id ? <span class="font-mono text-xs">{id.slice(0, 12)}…</span> : '—'
          }},
          { key: 'userId', label: t('audit.col.actor'), render: r => {
            const uid = (r as unknown as AuditLog).userId
            return uid
              ? <span class="font-mono text-xs">{uid.slice(0, 8)}</span>
              : <span class="text-gray-400">{t('audit.actor.system')}</span>
          }},
        ]}
        emptyText={t('audit.empty')}
      />

      <Pagination page={page} hasMore={logs.length === 50} onPage={setPage} />
    </Layout>
  )
}
