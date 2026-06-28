import { useState, useEffect } from 'preact/hooks'
import { Layout } from '../components/Layout'
import { BannerUIEditor } from '../components/BannerUIEditor'
import { ModalUIEditor } from '../components/ModalUIEditor'
import { PreviewPane } from '../components/PreviewPane'
import {
  defaultUISettings, defaultCookies, defaultLocaleContent, composeProfileJson,
  type TemplateBannerUI, type TemplateModalUI,
} from '../utils/templates'
import { uiTemplatesApi } from '../api/templates'
import { profilesApi } from '../api/profiles'

type UITab = 'main' | 'gpc' | 'modal'

export function UITemplateEditor({ id, current }: { id?: string; current: string }) {
  const isNew = !id || id === 'new'
  const defaults = defaultUISettings()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [activeTab, setActiveTab] = useState<UITab>('main')
  const [mainBanner, setMainBanner] = useState<TemplateBannerUI>(defaults.mainBanner)
  const [gpcBanner, setGpcBanner] = useState<TemplateBannerUI>(defaults.gpcBanner)
  const [preferenceModal, setPreferenceModal] = useState<TemplateModalUI>(defaults.preferenceModal)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (!isNew && id) {
      uiTemplatesApi.get(id)
        .then(t => {
          setName(t.name)
          setMainBanner(t.mainBanner as TemplateBannerUI)
          setGpcBanner(t.gpcBanner as TemplateBannerUI)
          setPreferenceModal(t.preferenceModal as TemplateModalUI)
        })
        .catch(() => setError('Template not found.'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const previewDraft = composeProfileJson(
    defaultCookies(),
    { mainBanner, gpcBanner, preferenceModal },
    'en',
    { en: defaultLocaleContent(preferenceModal.categories, { mainBanner, gpcBanner, preferenceModal }) },
    {},
  )

  const validateAndSave = async () => {
    let ok = true
    if (!name.trim()) { setNameError('Template name is required.'); ok = false }
    else setNameError('')

    const allButtons = [...mainBanner.buttons, ...gpcBanner.buttons, ...preferenceModal.buttons]
    if (allButtons.some(b => !b.text.trim())) { setError('All buttons must have a label.'); return }
    if (allButtons.some(b => b.action === 'custom' && !b.cookies)) { setError('All "custom" action buttons must have cookies selected.'); return }

    const cats = preferenceModal.categories
    const catIds = cats.map(c => c.id.trim())
    if (cats.some(c => !c.id.trim())) { setError('All category IDs are required.'); return }
    if (new Set(catIds).size !== catIds.length) { setError('Category IDs must be unique.'); return }
    if (cats.some(c => !c.cookies.length)) { setError('Each category must include at least one cookie.'); return }

    if (!ok) return

    if (!isNew && id) {
      const profiles = await profilesApi.list().catch(() => [] as Awaited<ReturnType<typeof profilesApi.list>>)
      const affected = profiles.filter(p => {
        const pj = p.profileJson as Record<string, unknown>
        return pj['uiTemplateId'] === id || (pj['_meta'] as Record<string, unknown> | undefined)?.['uiTemplateId'] === id
      })
      if (affected.length > 0) {
        const names = affected.map(p => `"${p.name}"`).join(', ')
        const confirmed = window.confirm(`This template is used by ${affected.length} profile${affected.length !== 1 ? 's' : ''}: ${names}.\n\nSaving will apply UI changes to all of them. Continue?`)
        if (!confirmed) return
      }
    }

    setError('')
    setSaving(true)
    try {
      if (isNew) await uiTemplatesApi.create({ name, mainBanner: mainBanner as never, gpcBanner: gpcBanner as never, preferenceModal: preferenceModal as never })
      else await uiTemplatesApi.update(id!, { name, mainBanner: mainBanner as never, gpcBanner: gpcBanner as never, preferenceModal: preferenceModal as never })
      window.location.hash = '#/banners/ui-templates'
    } catch {
      setError('Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: UITab; label: string }[] = [
    { key: 'main', label: 'Main Banner' },
    { key: 'gpc', label: 'GPC Banner' },
    { key: 'modal', label: 'Preference Modal' },
  ]

  if (loading) return <Layout title="Edit UI Template" current={current}><p class="text-sm text-gray-400">Loading template…</p></Layout>

  return (
    <Layout title={isNew ? 'New UI Template' : 'Edit UI Template'} current={current}>
      <div class="space-y-5">
        <div class="bg-white border border-gray-200 rounded-lg p-5">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Template Name <span class="text-red-500">*</span>
          </label>
          <input
            class={`w-full border rounded px-3 py-2 text-sm ${nameError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            value={name}
            onInput={e => { setName((e.target as HTMLInputElement).value); setNameError('') }}
            placeholder="e.g. Standard GDPR Layout"
          />
          {nameError && <p class="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                class={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div class="p-5">
            {activeTab === 'main' && (
              <BannerUIEditor
                label="Shown on first visit when no consent has been recorded."
                value={mainBanner}
                onChange={setMainBanner}
              />
            )}
            {activeTab === 'gpc' && (
              <BannerUIEditor
                label="Shown instead of the main banner when a GPC signal is detected (autoHonorGPC enabled)."
                value={gpcBanner}
                onChange={setGpcBanner}
              />
            )}
            {activeTab === 'modal' && (
              <ModalUIEditor value={preferenceModal} onChange={setPreferenceModal} />
            )}
          </div>
        </div>

        {error && (
          <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        <div class="flex gap-3">
          <button
            type="button"
            onClick={validateAndSave}
            disabled={saving}
            class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Create Template' : 'Save Template'}
          </button>
          <a href="#/banners/ui-templates" class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </a>
        </div>

        <PreviewPane draft={previewDraft} expandable previewMode={activeTab} />
      </div>
    </Layout>
  )
}
