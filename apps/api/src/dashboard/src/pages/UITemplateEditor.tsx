import { useState, useEffect } from 'preact/hooks'
import { usePageTitle } from '../context/pageTitle'
import { BannerUIEditor } from '../components/BannerUIEditor'
import { ModalUIEditor } from '../components/ModalUIEditor'
import { PreviewPane } from '../components/PreviewPane'
import { useT } from '../context/locale'
import {
  defaultUISettings, defaultCookies, defaultCategories, defaultLocaleContent, composeProfileJson,
  buttonsToMap, mapToButtonRows,
  type TemplateBannerUI, type TemplateModalUI,
} from '../utils/templates'
import { uiTemplatesApi } from '../api/templates'
import { useConfirmDialog } from '../components/ConfirmDialog'

type UITab = 'main' | 'gpc' | 'modal'

const BLANK_BANNER: TemplateBannerUI = {
  position: 'bottom',
  overlayOpacity: 0.5,
  showClose: true,
  headingTag: 'h2',
  buttons: [],
}

const BLANK_MODAL: TemplateModalUI = {
  position: 'center',
  overlayOpacity: 0.5,
  showClose: true,
  persistent: false,
  headingTag: 'h2',
  hasSubheading: false,
  buttons: [],
}

function isBlank(main: TemplateBannerUI, gpc: TemplateBannerUI, modal: TemplateModalUI): boolean {
  return main.buttons.length === 0 && gpc.buttons.length === 0 && modal.buttons.length === 0
}

export function UITemplateEditor({ id, current }: { id?: string; current: string }) {
  const t = useT()
  const isNew = !id || id === 'new'

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [activeTab, setActiveTab] = useState<UITab>('main')
  const [mainBanner, setMainBanner] = useState<TemplateBannerUI>(isNew ? BLANK_BANNER : defaultUISettings().mainBanner)
  const [gpcBanner, setGpcBanner] = useState<TemplateBannerUI>(isNew ? BLANK_BANNER : defaultUISettings().gpcBanner)
  const [preferenceModal, setPreferenceModal] = useState<TemplateModalUI>(isNew ? BLANK_MODAL : defaultUISettings().preferenceModal)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  usePageTitle(loading ? t('uiTemplates.editor.title.edit') : (isNew ? t('uiTemplates.editor.title.new') : t('uiTemplates.editor.title.edit')))
  const { requestConfirm, dialog } = useConfirmDialog()

  useEffect(() => {
    if (!isNew && id) {
      uiTemplatesApi.get(id)
        .then(tmpl => {
          setName(tmpl.name)
          setMainBanner({ ...tmpl.mainBanner, buttons: mapToButtonRows(tmpl.mainBanner.buttons) })
          setGpcBanner({ ...tmpl.gpcBanner, buttons: mapToButtonRows(tmpl.gpcBanner.buttons) })
          setPreferenceModal({ ...tmpl.preferenceModal, buttons: mapToButtonRows(tmpl.preferenceModal.buttons) } as TemplateModalUI)
        })
        .catch(() => setError(t('uiTemplates.editor.error.notFound')))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const previewDraft = composeProfileJson(
    defaultCookies(),
    defaultCategories(),
    { mainBanner, gpcBanner, preferenceModal },
    'en',
    { en: defaultLocaleContent(defaultCategories(), { mainBanner, gpcBanner, preferenceModal }) },
    {},
  )

  const validateAndSave = async () => {
    let ok = true
    if (!name.trim()) { setNameError(t('uiTemplates.editor.nameRequired')); ok = false }
    else setNameError('')

    const allButtons = [...mainBanner.buttons, ...gpcBanner.buttons, ...preferenceModal.buttons]
    if (allButtons.some(b => !b.id.trim())) { setError(t('uiTemplates.editor.error.buttons')); return }
    // Uniqueness is scoped per section, not global — mainBanner/gpcBanner/preferenceModal are
    // mutually exclusive surfaces (never rendered together), so reusing an id like 'accept-all'
    // across all three is normal and intentional (it's what the shipped defaults do).
    for (const section of [mainBanner.buttons, gpcBanner.buttons, preferenceModal.buttons]) {
      const ids = section.map(b => b.id.trim())
      if (new Set(ids).size !== ids.length) { setError(t('uiTemplates.editor.error.uniqueButtonIds')); return }
    }
    if (allButtons.some(b => b.action === 'custom' && !b.cookies)) { setError(t('uiTemplates.editor.error.customButtons')); return }

    if (!ok) return

    if (!isNew && id) {
      const affected = await uiTemplatesApi.profileUsage(id).catch(() => [])
      if (affected.length > 0) {
        const names = affected.map(p => `"${p.name}"`).join(', ')
        const confirmed = await requestConfirm({
          title: t(affected.length === 1 ? 'uiTemplates.editor.confirmUpdate.titleSingular' : 'uiTemplates.editor.confirmUpdate.title', { n: affected.length }),
          message: t('uiTemplates.editor.confirmUpdate.message', { names }),
        })
        if (!confirmed) return
      }
    }

    setError('')
    setSaving(true)
    try {
      const payload = {
        name,
        mainBanner: { ...mainBanner, buttons: buttonsToMap(mainBanner.buttons) },
        gpcBanner: { ...gpcBanner, buttons: buttonsToMap(gpcBanner.buttons) },
        preferenceModal: { ...preferenceModal, buttons: buttonsToMap(preferenceModal.buttons) },
      }
      if (isNew) await uiTemplatesApi.create(payload)
      else await uiTemplatesApi.update(id!, payload)
      window.location.hash = '#/banners/ui-templates'
    } catch {
      setError(t('uiTemplates.editor.error.failed'))
    } finally {
      setSaving(false)
    }
  }

  const steps: { key: UITab; label: string }[] = [
    { key: 'main', label: t('uiTemplates.editor.tabMain') },
    { key: 'gpc', label: t('uiTemplates.editor.tabGpc') },
    { key: 'modal', label: t('uiTemplates.editor.tabModal') },
  ]

  const stepIndex = steps.findIndex(s => s.key === activeTab)
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  const goNext = () => { if (!isLast) setActiveTab(steps[stepIndex + 1].key) }
  const goBack = () => { if (!isFirst) setActiveTab(steps[stepIndex - 1].key) }

  if (loading) return <p class="text-sm text-gray-400" role="status" aria-live="polite">{t('uiTemplates.editor.loading')}</p>

  return (
    <>
      {dialog}
      <div class="space-y-5">
        <div class="bg-white border border-gray-200 rounded-lg p-5">
          <label for="ui-template-name" class="block text-sm font-medium text-gray-700 mb-1">
            {t('uiTemplates.editor.name')} <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="ui-template-name"
            class={`w-full border rounded px-3 py-2 text-sm ${nameError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            value={name}
            onInput={e => { setName((e.target as HTMLInputElement).value); setNameError('') }}
            placeholder={t('uiTemplates.editor.namePlaceholder')}
            required
            aria-required="true"
          />
          {nameError && <p role="alert" class="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        {isNew && isBlank(mainBanner, gpcBanner, preferenceModal) && (
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <p class="text-sm text-amber-800">
              {t('uiTemplates.editor.loadDefaultsPrompt')}
            </p>
            <button
              type="button"
              onClick={() => {
                const d = defaultUISettings()
                setMainBanner(d.mainBanner)
                setGpcBanner(d.gpcBanner)
                setPreferenceModal(d.preferenceModal)
              }}
              class="shrink-0 bg-amber-700 text-white text-xs px-3 py-1.5 rounded hover:bg-amber-800 transition-colors"
            >
              {t('uiTemplates.editor.loadDefaultsBtn')}
            </button>
          </div>
        )}

        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Wizard step indicator */}
          <div class="flex items-center border-b border-gray-200 px-5 py-3 gap-2">
            {steps.map((step, i) => (
              <div key={step.key} class="flex items-center gap-2">
                <span class={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === stepIndex ? 'bg-blue-600 text-white' : i < stepIndex ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </span>
                <span class={`text-sm font-medium ${i === stepIndex ? 'text-blue-600' : i < stepIndex ? 'text-blue-400' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <span class="mx-1 text-gray-300 text-xs select-none">›</span>
                )}
              </div>
            ))}
            <span class="ml-auto text-xs text-gray-400">
              {t('uiTemplates.editor.wizard.stepOf', { step: stepIndex + 1, total: steps.length })}
            </span>
          </div>

          <div class="p-5">
            {activeTab === 'main' && (
              <BannerUIEditor
                label={t('uiTemplates.editor.mainBannerHint')}
                value={mainBanner}
                onChange={setMainBanner}
              />
            )}
            {activeTab === 'gpc' && (
              <BannerUIEditor
                label={t('uiTemplates.editor.gpcBannerHint')}
                value={gpcBanner}
                onChange={setGpcBanner}
              />
            )}
            {activeTab === 'modal' && (
              <ModalUIEditor value={preferenceModal} onChange={setPreferenceModal} />
            )}
          </div>

          {error && (
            <div class="px-5 pb-4">
              <p role="alert" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            </div>
          )}

          <div class="flex items-center justify-between border-t border-gray-100 px-5 py-4">
            <div class="flex gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={goBack}
                  class="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {t('uiTemplates.editor.wizard.back')}
                </button>
              )}
              <a href="#/banners/ui-templates" class="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                {t('common.cancel')}
              </a>
            </div>
            <div>
              {!isLast ? (
                <button
                  type="button"
                  onClick={goNext}
                  class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('uiTemplates.editor.wizard.next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={validateAndSave}
                  disabled={saving}
                  class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? t('common.saving') : isNew ? t('uiTemplates.editor.action.create') : t('uiTemplates.editor.action.save')}
                </button>
              )}
            </div>
          </div>
        </div>

        <PreviewPane draft={previewDraft} expandable previewMode={activeTab} />
      </div>
    </>
  )
}
