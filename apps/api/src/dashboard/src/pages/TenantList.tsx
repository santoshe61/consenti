import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT } from '../context/locale'
import { apiFetch } from '../api/client'

interface Tenant {
  id: string
  name: string
  slug: string
  createdAt: string
}

export function TenantList({ current }: { current: string }) {
  const t = useT()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    apiFetch<Tenant[]>('/tenants')
      .then(setTenants)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newName.trim() || !newSlug.trim()) return
    setCreating(true)
    try {
      await apiFetch('/tenants', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() }),
      })
      setNewName('')
      setNewSlug('')
      load()
    } catch {
      // error silently ignored
    } finally {
      setCreating(false)
    }
  }

  const deleteTenant = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: t('sites.dialog.delete.title', { name }),
      message: t('sites.dialog.delete.message'),
    })
    if (!ok) return
    await apiFetch(`/tenants/${id}`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  return (
    <Layout title={t('sites.title')} current={current}>
      {dialog}
      <div class="mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <p class="text-sm font-medium text-gray-700 mb-3">{t('sites.createNew')}</p>
        <div class="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder={t('sites.namePlaceholder')}
            value={newName}
            onInput={e => setNewName((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded px-3 py-1.5 text-sm w-40"
            aria-label={t('sites.namePlaceholder')}
          />
          <input
            type="text"
            placeholder={t('sites.slugPlaceholder')}
            value={newSlug}
            onInput={e => setNewSlug((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded px-3 py-1.5 text-sm w-40"
            aria-label={t('sites.slugPlaceholder')}
          />
          <button
            onClick={create}
            disabled={creating}
            class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {t('common.create')}
          </button>
        </div>
      </div>

      <Table
        loading={loading}
        keyFn={r => (r as unknown as Tenant).id}
        rows={tenants as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'name', label: t('sites.col.name') },
          { key: 'slug', label: t('sites.col.slug'), render: r => <span class="font-mono text-xs">{(r as unknown as Tenant).slug}</span> },
          { key: 'id', label: t('sites.col.id'), render: r => <span class="font-mono text-xs text-gray-400">{(r as unknown as Tenant).id}</span> },
          { key: 'createdAt', label: t('sites.col.created'), render: r => new Date((r as unknown as Tenant).createdAt).toLocaleDateString() },
          {
            key: 'actions',
            label: '',
            render: r => {
              const tenant = r as unknown as Tenant
              if (tenant.id === 'default') return <span class="text-xs text-gray-400">{t('common.default')}</span>
              return (
                <button
                  onClick={() => deleteTenant(tenant.id, tenant.name)}
                  class="text-xs text-red-500 hover:underline"
                >
                  {t('common.delete')}
                </button>
              )
            },
          },
        ]}
        emptyText={t('sites.empty')}
      />
    </Layout>
  )
}
