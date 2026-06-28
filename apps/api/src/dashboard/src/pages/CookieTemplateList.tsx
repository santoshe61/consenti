import { useState, useEffect } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { SquarePen, Trash, Copy } from 'lucide-react'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { cookieTemplatesApi } from '../api/templates'
import type { ServerCookieTemplate } from '@consenti/types'

export function CookieTemplateList({ current }: { current: string }) {
  const [templates, setTemplates] = useState<ServerCookieTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    cookieTemplatesApi.list().then(setTemplates).catch(() => setTemplates([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: `Delete "${name}"?`,
      message: 'This cookie template will be permanently removed. Profiles linked to it will lose their cookie definitions.',
    })
    if (!ok) return
    await cookieTemplatesApi.delete(id).catch(() => null)
    load()
  }

  const handleCopy = async (id: string, name: string) => {
    await cookieTemplatesApi.copy(id, `${name} (Copy)`).catch(() => null)
    load()
  }

  return (
    <Layout title="Cookie Templates" current={current}>
      {dialog}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        <a
          href="#/banners/cookie-templates/new"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Cookie Template
        </a>
      </div>

      {loading && <p class="text-sm text-gray-400">Loading…</p>}

      {!loading && templates.length === 0 && (
        <div class="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p class="text-gray-500 text-sm mb-2">No cookie templates yet.</p>
          <p class="text-gray-400 text-xs">Cookie templates define the list of cookies/purposes for your consent profiles. Create one to reuse across multiple profiles.</p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div class="space-y-3">
          {templates.map(t => (
            <div key={t.id} class="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm text-gray-900">{t.name}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {t.cookies.length} cookie{t.cookies.length !== 1 ? 's' : ''}
                  {' — '}
                  {t.cookies.filter(c => c.mandatory).length} mandatory
                  {' · '}
                  Updated {new Date(t.updatedAt).toLocaleDateString()}
                </p>
                <div class="flex flex-wrap gap-1 mt-2">
                  {t.cookies.map(c => (
                    <span
                      key={c.id}
                      class={`text-xs px-2 py-0.5 rounded-full ${c.mandatory ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {c.id}{c.mandatory ? ' (required)' : ''}{c.tcfVendorId ? ` TCF:${c.tcfVendorId}` : ''}{c.cpraCategory ? ` CPRA:${c.cpraCategory}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <button onClick={() => handleCopy(t.id, t.name)} class="text-gray-400 hover:text-blue-600 transition-colors" title="Duplicate"><Copy size={14} /></button>
                <a href={`#/banners/cookie-templates/${t.id}`} class="text-blue-600 hover:text-blue-800 transition-colors" title="Edit"><SquarePen size={14} /></a>
                <button onClick={() => handleDelete(t.id, t.name)} class="text-red-400 hover:text-red-600 transition-colors" title="Delete"><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
