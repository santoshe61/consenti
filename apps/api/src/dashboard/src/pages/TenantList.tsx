import { useEffect, useState } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { apiFetch } from '../api/client'

interface Tenant {
  id: string
  name: string
  slug: string
  createdAt: string
}

export function TenantList({ current }: { current: string }) {
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
      title: `Delete "${name}"?`,
      message: 'This site and all associated data will be permanently removed. This cannot be undone.',
    })
    if (!ok) return
    await apiFetch(`/tenants/${id}`, { method: 'DELETE' }).catch(() => {})
    load()
  }

  return (
    <Layout title="Sites / Tenants" current={current}>
      {dialog}
      <div class="mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <p class="text-sm font-medium text-gray-700 mb-3">Create new site</p>
        <div class="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Site name"
            value={newName}
            onInput={e => setNewName((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded px-3 py-1.5 text-sm w-40"
          />
          <input
            type="text"
            placeholder="slug (e.g. site-a)"
            value={newSlug}
            onInput={e => setNewSlug((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded px-3 py-1.5 text-sm w-40"
          />
          <button
            onClick={create}
            disabled={creating}
            class="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>

      <Table
        loading={loading}
        keyFn={r => (r as unknown as Tenant).id}
        rows={tenants as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug', render: r => <span class="font-mono text-xs">{(r as unknown as Tenant).slug}</span> },
          { key: 'id', label: 'ID', render: r => <span class="font-mono text-xs text-gray-400">{(r as unknown as Tenant).id}</span> },
          { key: 'createdAt', label: 'Created', render: r => new Date((r as unknown as Tenant).createdAt).toLocaleDateString() },
          {
            key: 'actions',
            label: '',
            render: r => {
              const t = r as unknown as Tenant
              if (t.id === 'default') return <span class="text-xs text-gray-400">default</span>
              return (
                <button
                  onClick={() => deleteTenant(t.id, t.name)}
                  class="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              )
            },
          },
        ]}
        emptyText="No sites yet."
      />
    </Layout>
  )
}
