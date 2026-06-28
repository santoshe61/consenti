import { useState, useEffect } from 'preact/hooks'
import { SquarePen, Trash, Copy } from 'lucide-react'
import { Layout } from '../components/Layout'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { uiTemplatesApi } from '../api/templates'
import type { ServerUITemplate } from '@consenti/types'

export function UITemplateList({ current }: { current: string }) {
  const [templates, setTemplates] = useState<ServerUITemplate[]>([])
  const [loading, setLoading] = useState(true)
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    uiTemplatesApi.list().then(setTemplates).catch(() => setTemplates([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: `Delete "${name}"?`,
      message: 'This UI template will be permanently removed. Profiles linked to it will lose their UI settings.',
    })
    if (!ok) return
    await uiTemplatesApi.delete(id).catch(() => null)
    load()
  }

  const handleCopy = async (id: string, name: string) => {
    await uiTemplatesApi.copy(id, `${name} (Copy)`).catch(() => null)
    load()
  }

  return (
    <Layout title="UI Templates" current={current}>
      {dialog}
      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        <a
          href="#/banners/ui-templates/new"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New UI Template
        </a>
      </div>

      {loading && <p class="text-sm text-gray-400">Loading…</p>}

      {!loading && templates.length === 0 && (
        <div class="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p class="text-gray-500 text-sm mb-2">No UI templates yet.</p>
          <p class="text-gray-400 text-xs">UI templates define the visual configuration — positions, buttons, categories — for your consent banners and modals.</p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div class="space-y-3">
          {templates.map(t => (
            <div key={t.id} class="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm text-gray-900">{t.name}</p>
                <div class="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  <span>Main banner: <span class="text-gray-700">{t.mainBanner.position}</span></span>
                  <span>GPC banner: <span class="text-gray-700">{t.gpcBanner.position}</span></span>
                  <span>Modal: <span class="text-gray-700">{t.preferenceModal.position}</span></span>
                  <span>{t.preferenceModal.categories.length} categories</span>
                  <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-2">
                  {t.mainBanner.buttons.map((b, i) => (
                    <span key={i} class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {b.type}: {b.text}
                    </span>
                  ))}
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <button onClick={() => handleCopy(t.id, t.name)} class="text-gray-400 hover:text-blue-600 transition-colors" title="Duplicate"><Copy size={14} /></button>
                <a href={`#/banners/ui-templates/${t.id}`} class="text-blue-600 hover:text-blue-800 transition-colors" title="Edit"><SquarePen size={14} /></a>
                <button onClick={() => handleDelete(t.id, t.name)} class="text-red-400 hover:text-red-600 transition-colors" title="Delete"><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
