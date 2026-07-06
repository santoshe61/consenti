import { useState, useEffect } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { Layout } from '../components/Layout'
import { SquarePen, Trash, Copy } from 'lucide-react'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT } from '../context/locale'
import { cookieTemplatesApi } from '../api/templates'
import { ApiError } from '../api/client'
import type { ServerCookieTemplate } from '@consenti/types'

type BlockingProfile = { id: string; name: string; isActive: boolean }

export function CookieTemplateList({ current }: { current: string }) {
  const t = useT()
  const [templates, setTemplates] = useState<ServerCookieTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteBlockedBy, setDeleteBlockedBy] = useState<BlockingProfile[] | null>(null)
  const [editWarning, setEditWarning] = useState<{ id: string; name: string; profiles: BlockingProfile[] } | null>(null)
  const { requestConfirm, dialog } = useConfirmDialog()

  const load = () => {
    setLoading(true)
    cookieTemplatesApi.list().then(setTemplates).catch(() => setTemplates([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    const ok = await requestConfirm({
      title: t('cookieTemplates.dialog.delete.title', { name }),
      message: t('cookieTemplates.dialog.delete.message'),
    })
    if (!ok) return
    try {
      await cookieTemplatesApi.delete(id)
      load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        try {
          const body = JSON.parse(err.message) as { profiles?: BlockingProfile[] }
          if (body.profiles?.length) { setDeleteBlockedBy(body.profiles); return }
        } catch { /* fall through */ }
      }
    }
  }

  const handleEditClick = async (id: string, name: string) => {
    try {
      const profiles = await cookieTemplatesApi.profileUsage(id)
      if (profiles.length > 0) {
        setEditWarning({ id, name, profiles: profiles.map(p => ({ id: p.id, name: p.name, isActive: p.isActive ?? false })) })
        return
      }
    } catch { /* non-blocking */ }
    window.location.hash = `#/banners/cookie-templates/${id}`
  }

  const handleCopy = async (id: string, name: string) => {
    await cookieTemplatesApi.copy(id, `${name} (Copy)`).catch(() => null)
    load()
  }

  const count = templates.length
  const countLabel = count === 1
    ? t('cookieTemplates.countSingular', { n: count })
    : t('cookieTemplates.count', { n: count })

  return (
    <Layout title={t('cookieTemplates.title')} current={current}>
      {dialog}

      {/* Delete blocked dialog */}
      {deleteBlockedBy && createPortal(
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" onClick={() => setDeleteBlockedBy(null)} aria-hidden="true" />
          <div class="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900">Cannot delete template</h3>
            <p class="text-sm text-gray-600">
              This cookie template is used by the following profiles. Delete or reassign those profiles first:
            </p>
            <ul class="space-y-1 max-h-48 overflow-y-auto">
              {deleteBlockedBy.map(p => (
                <li key={p.id} class="flex items-center gap-2 text-sm">
                  <span class={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <a href={`#/banners/profiles/${p.id}`} class="text-blue-600 hover:underline" onClick={() => setDeleteBlockedBy(null)}>{p.name}</a>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setDeleteBlockedBy(null)} class="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              {t('common.close')}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Edit warning dialog */}
      {editWarning && createPortal(
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" onClick={() => setEditWarning(null)} aria-hidden="true" />
          <div class="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900">Template used in profiles</h3>
            <p class="text-sm text-gray-600">
              This template is used in the following profiles. After editing, open and save each profile for changes to take effect in their JSON files:
            </p>
            <ul class="space-y-1 max-h-48 overflow-y-auto">
              {editWarning.profiles.map(p => (
                <li key={p.id} class="flex items-center gap-2 text-sm">
                  <span class={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span class="text-gray-700">{p.name}</span>
                </li>
              ))}
            </ul>
            <div class="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { const id = editWarning.id; setEditWarning(null); window.location.hash = `#/banners/cookie-templates/${id}` }}
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Continue to edit
              </button>
              <button type="button" onClick={() => setEditWarning(null)} class="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div class="flex justify-between items-center mb-4">
        <p class="text-sm text-gray-500">{countLabel}</p>
        <a
          href="#/banners/cookie-templates/new"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {t('cookieTemplates.new')}
        </a>
      </div>

      {loading && <p class="text-sm text-gray-400" role="status" aria-live="polite">{t('common.loading')}</p>}

      {!loading && templates.length === 0 && (
        <div class="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p class="text-gray-500 text-sm mb-2">{t('cookieTemplates.empty.title')}</p>
          <p class="text-gray-400 text-xs">{t('cookieTemplates.empty.hint')}</p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div class="space-y-3">
          {templates.map(tmpl => (
            <div key={tmpl.id} class="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm text-gray-900">{tmpl.name}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {tmpl.cookies.length} {tmpl.cookies.length !== 1 ? t('cookieTemplates.col.id').toLowerCase() : t('cookieTemplates.col.id').toLowerCase()}
                  {' — '}
                  {tmpl.cookies.filter(c => c.legalBasis === 'mandatory').length} {t('common.mandatory')}
                  {' · '}
                  {t('common.updated')} {new Date(tmpl.updatedAt).toLocaleDateString()}
                </p>
                <div class="flex flex-wrap gap-1 mt-2">
                  {tmpl.cookies.map(c => (
                    <span
                      key={c.id}
                      class={`text-xs px-2 py-0.5 rounded-full ${c.legalBasis === 'mandatory' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {c.id}{c.legalBasis === 'mandatory' ? ` (${t('cookieTemplates.required')})` : ''}{c.tcfVendorId ? ` TCF:${c.tcfVendorId}` : ''}{c.cpraCategory ? ` CPRA:${c.cpraCategory}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <button onClick={() => handleCopy(tmpl.id, tmpl.name)} class="text-gray-400 hover:text-blue-600 transition-colors" title={t('common.duplicate')} aria-label={t('common.duplicate')}>
                  <Copy size={14} aria-hidden="true" />
                </button>
                <button onClick={() => handleEditClick(tmpl.id, tmpl.name)} class="text-blue-600 hover:text-blue-800 transition-colors" title={t('common.edit')} aria-label={t('common.edit')}>
                  <SquarePen size={14} aria-hidden="true" />
                </button>
                <button onClick={() => handleDelete(tmpl.id, tmpl.name)} class="text-red-400 hover:text-red-600 transition-colors" title={t('common.delete')} aria-label={t('common.delete')}>
                  <Trash size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
