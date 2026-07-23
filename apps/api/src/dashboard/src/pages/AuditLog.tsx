import { useEffect, useRef, useState } from 'preact/hooks'
import { History } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { DataTable } from '../components/DataTable'
import { RecordDetailModal, JsonValue } from '../components/RecordDetailModal'
import { apiDownload } from '../api/client'
import { auditApi } from '../api/audit'
import { useHashQuery } from '../hooks/useHashQuery'
import { useT } from '../context/locale'
import type { AuditLog, AuditLogSummary } from '@consenti/types'

const BASE_HASH = '#/audit'
const PROFILE_EDIT_ACTIONS = new Set(['profile.created', 'profile.updated'])

/** Deep-links to the version history page, preselecting the version this audit entry produced
 * and, when it's not the very first version, comparing it against the one right before it. Needs
 * the full record (`newData`), so it's only computable once the detail modal has fetched it. */
function historyHref(log: AuditLog): string | null {
  if (log.resourceType !== 'profile' || !PROFILE_EDIT_ACTIONS.has(log.action) || !log.resourceId) return null
  const version = (log.newData as { version?: number } | undefined)?.version
  if (version === undefined) return null
  const params = new URLSearchParams({ version: String(version) })
  if (version > 1) params.set('compare', String(version - 1))
  return `#/banners/profiles/${log.resourceId}/history?${params}`
}

export function AuditLogPage({ current }: { current: string }) {
  const t = useT()
  usePageTitle(t('audit.title'))
  const { params, setParams } = useHashQuery(BASE_HASH)

  const [logs, setLogs] = useState<AuditLogSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(() => Number(params.get('page')) || 1)
  const [pageSize, setPageSize] = useState(() => Number(params.get('limit')) || 25)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const load = (p: number, limit: number, search: string) => {
    setLoading(true)
    auditApi.list({ page: p, limit, ...(search ? { q: search } : {}) })
      .then(res => { setLogs(res.items); setTotal(res.total) })
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

  const openDetail = (id: string) => {
    auditApi.get(id).then(setSelected).catch(() => {})
  }

  return (
    <>
      <RecordDetailModal
        open={!!selected}
        title={t('audit.detail.title')}
        onClose={() => setSelected(null)}
        fields={selected ? [
          { label: t('audit.col.time'), value: new Date(selected.createdAt).toLocaleString() },
          { label: t('audit.col.action'), value: selected.action },
          { label: t('audit.col.resource'), value: selected.resourceType },
          { label: t('audit.col.resourceId'), value: selected.resourceId ? <span class="font-mono text-xs">{selected.resourceId}</span> : '—' },
          { label: t('audit.col.actor'), value: selected.userId ? <span class="font-mono text-xs">{selected.userId}</span> : <span class="text-gray-400">{t('audit.actor.system')}</span> },
          ...(historyHref(selected) ? [{
            label: '',
            value: (
              <a href={historyHref(selected)!} class="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <History size={12} aria-hidden="true" /> {t('audit.viewHistory')}
              </a>
            ),
          }] : []),
          { label: t('audit.detail.oldData'), value: <JsonValue value={selected.oldData} /> },
          { label: t('audit.detail.newData'), value: <JsonValue value={selected.newData} /> },
        ] : []}
      />

      <DataTable
        loading={loading}
        rows={logs as unknown as Record<string, unknown>[]}
        keyFn={r => (r as unknown as AuditLogSummary).id}
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder={t('audit.searchPlaceholder')}
        total={total}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={n => { setPageSize(n); setPage(1) }}
        toolbarEnd={
          <button onClick={() => { void apiDownload('/export/audit?format=csv') }} class="text-sm text-blue-600 hover:underline">
            {t('common.exportCsv')}
          </button>
        }
        columns={[
          { key: 'createdAt', label: t('audit.col.time'), render: r => new Date((r as unknown as AuditLogSummary).createdAt).toLocaleString() },
          { key: 'action', label: t('audit.col.action') },
          { key: 'resourceType', label: t('audit.col.resource') },
          { key: 'resourceId', label: t('audit.col.resourceId'), render: r => {
            const log = r as unknown as AuditLogSummary
            return log.resourceId ? (
              <button onClick={() => openDetail(log.id)} class="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {log.resourceId.slice(0, 12)}…
              </button>
            ) : '—'
          }},
          { key: 'userId', label: t('audit.col.actor'), render: r => {
            const uid = (r as unknown as AuditLogSummary).userId
            return uid
              ? <span class="font-mono text-xs">{uid.slice(0, 8)}</span>
              : <span class="text-gray-400">{t('audit.actor.system')}</span>
          }},
        ]}
        emptyText={t('audit.empty')}
      />
    </>
  )
}
