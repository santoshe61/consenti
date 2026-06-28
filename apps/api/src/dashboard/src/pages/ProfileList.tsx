import { useEffect, useState } from 'preact/hooks'
import { Check, Copy, SquarePen, Trash, BookCopy } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Table } from '../components/Table'
import { PermissionGate } from '../components/PermissionGate'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { profilesApi } from '../api/profiles'
import type { DashboardProfile } from '@consenti/types'

export function ProfileList({ current }: { current: string }) {
  const [profiles, setDashboardProfiles] = useState<DashboardProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 1500)
    }).catch(() => { })
  }
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    profilesApi.list()
      .then(setDashboardProfiles)
      .catch(() => { })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: `Delete "${name}"?`,
      message: 'This profile and all its locale content will be permanently removed.',
    })
    if (!ok) return
    await profilesApi.delete(id).catch(() => { })
    load()
  }

  const handleCopy = async (p: DashboardProfile) => {
    const ok = await requestConfirm({
      title: `Copy "${p.name}"?`,
      message: 'This profile and all its locale content will be duplicated.',
    })
    if (!ok) return;
    setCopying(p.id)
    try {
      await profilesApi.create({
        name: `Copy of ${p.name}`,
        defaultLocale: p.defaultLocale,
        profileJson: p.profileJson,
      })
      load()
    } catch {
      // ignore
    } finally {
      setCopying(null)
    }
  }

  return (
    <Layout title="DashboardProfiles" current={current}>
      {dialog}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
        <PermissionGate perm="profile:create">
          <a
            href="#/banners/profiles/new"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New DashboardProfile
          </a>
        </PermissionGate>
      </div>

      <Table
        loading={loading}
        keyFn={r => r.id as string}
        rows={profiles as unknown as Record<string, unknown>[]}
        columns={[
          {
            key: 'name', label: 'Name',
            render: r => {
              const p = r as unknown as DashboardProfile
              return (
                <div>
                  <div class="font-medium text-sm text-gray-900">{p.name}</div>
                  <div class="flex items-center gap-1 mt-0.5">
                    <span class="text-xs text-gray-400 font-mono">{p.id}</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleCopyId(p.id) }}
                      class="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy profile ID"
                    >
                      {copiedId === p.id
                        ? <Check size={11} className="text-green-500" />
                        : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              )
            },
          },
          { key: 'defaultLocale', label: 'Default Locale' },
          { key: 'version', label: 'Version' },
          {
            key: 'templates', label: 'Templates',
            render: r => {
              const pj = (r as unknown as DashboardProfile).profileJson
              return (
                <div class="text-xs text-gray-500 space-y-0.5">
                  {pj.cookieTemplateId && <div>Cookie: <span class="font-mono">{pj.cookieTemplateId}</span></div>}
                  {pj.uiTemplateId && <div>UI: <span class="font-mono">{pj.uiTemplateId}</span></div>}
                </div>
              )
            },
          },
          { key: 'createdAt', label: 'Created', render: r => new Date((r as unknown as DashboardProfile).createdAt).toLocaleDateString() },
          {
            key: 'actions', label: '',
            render: r => {
              const p = r as unknown as DashboardProfile
              return (
                <div class="flex gap-3">
                  <a href={`#/profiles/${p.id}`} class="text-blue-600 hover:underline text-xs" title="Edit"><SquarePen size={14} /></a>
                  <PermissionGate perm="profile:create">
                    <button
                      onClick={() => handleCopy(p)}
                      disabled={copying === p.id}
                      class="text-gray-500 hover:text-blue-600 hover:underline text-xs disabled:opacity-50 px-2"
                      title="Copy/Duplicate"
                    >
                      {copying === p.id ? 'Copying…' : <BookCopy size={14} />}
                    </button>
                  </PermissionGate>
                  <PermissionGate perm="profile:delete">
                    <button onClick={() => handleDelete(p.id, p.name)} class="text-red-500 hover:underline text-xs" title="Delete"><Trash size={14} /></button>
                  </PermissionGate>
                </div>
              )
            },
          },
        ]}
        emptyText="No profiles yet. Create one to get started."
      />
    </Layout>
  )
}
