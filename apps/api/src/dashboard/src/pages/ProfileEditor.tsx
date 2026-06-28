import { useEffect, useRef, useState } from 'preact/hooks'
import { Check, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import { Layout } from '../components/Layout'
import { LocaleTabBar } from '../components/LocaleTabBar'
import { HtmlEditor } from '../components/HtmlEditor'
import { DomainsInput } from '../components/DomainsInput'
import { PreviewPane } from '../components/PreviewPane'
import { profilesApi } from '../api/profiles'
import { cookieTemplatesApi, uiTemplatesApi } from '../api/templates'
import {
  exportLocaleJson,
  exportLocaleCsv,
  importFromJson,
  importFromCsv,
  downloadFile,
} from '../utils/localeExport'
import type {
  LocaleContent,
  CategoryContent,
  TemplateBannerUI,
  TemplateModalUI,
} from '../utils/templates'
import type { ServerCookieTemplate, ServerUITemplate } from '@consenti/types'
import type { DashboardProfile } from '@consenti/types'

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Profile Config', 'Templates', 'Content']
  return (
    <div class="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        return (
          <div key={n} class="flex items-center flex-1 last:flex-none">
            <div class="flex items-center gap-2 shrink-0">
              <div class={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span class={`text-sm font-medium hidden sm:block ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div class={`h-px flex-1 mx-3 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Template ↔ locale helpers ──────────────────────────────────────────────────

function defaultLocaleFromTemplate(ut: ServerUITemplate): LocaleContent {
  return {
    mainBanner: { heading: '', htmlText: '', buttonLabels: ut.mainBanner.buttons.map(b => b.text) },
    gpcBanner: { heading: '', htmlText: '', buttonLabels: ut.gpcBanner.buttons.map(b => b.text) },
    preferenceModal: {
      heading: '', subheading: '', htmlText: '',
      buttonLabels: ut.preferenceModal.buttons.map(b => b.text),
      categories: ut.preferenceModal.categories.map(c => ({ id: c.id, heading: '', htmlText: '' })),
    },
  }
}

function syncLocaleToTemplate(content: LocaleContent, ut: ServerUITemplate): LocaleContent {
  return {
    ...content,
    mainBanner: {
      ...content.mainBanner,
      buttonLabels: ut.mainBanner.buttons.map((b, i) => content.mainBanner.buttonLabels[i] ?? b.text),
    },
    gpcBanner: {
      ...content.gpcBanner,
      buttonLabels: ut.gpcBanner.buttons.map((b, i) => content.gpcBanner.buttonLabels[i] ?? b.text),
    },
    preferenceModal: {
      ...content.preferenceModal,
      buttonLabels: ut.preferenceModal.buttons.map((b, i) => content.preferenceModal.buttonLabels[i] ?? b.text),
      categories: ut.preferenceModal.categories.map(cat => ({
        id: cat.id,
        heading: content.preferenceModal.categories.find(c => c.id === cat.id)?.heading ?? '',
        htmlText: content.preferenceModal.categories.find(c => c.id === cat.id)?.htmlText ?? '',
      })),
    },
  }
}

function buildPreviewDraft(
  ct: ServerCookieTemplate,
  ut: ServerUITemplate,
  defaultLocale: string,
  localeContents: Record<string, LocaleContent>,
): object {
  const content = localeContents[defaultLocale] ?? defaultLocaleFromTemplate(ut)
  return {
    cookies: ct.cookies,
    defaultLocale,
    translations: {
      [defaultLocale]: {
        mainBanner: {
          position: ut.mainBanner.position,
          overlayOpacity: ut.mainBanner.overlayOpacity,
          showClose: ut.mainBanner.showClose,
          showLocaleSwitcher: ut.mainBanner.showLocaleSwitcher,
          headingTag: ut.mainBanner.headingTag,
          heading: content.mainBanner.heading,
          htmlText: content.mainBanner.htmlText,
          buttons: ut.mainBanner.buttons.map((btn, i) => ({
            text: content.mainBanner.buttonLabels[i] ?? btn.text,
            type: btn.type,
            action: btn.action,
            ...(btn.cookies != null ? { cookies: btn.cookies } : {}),
            ...(btn.url != null ? { url: btn.url } : {}),
          })),
        },
        gpcBanner: {
          position: ut.gpcBanner.position,
          overlayOpacity: ut.gpcBanner.overlayOpacity,
          showClose: ut.gpcBanner.showClose,
          showLocaleSwitcher: ut.gpcBanner.showLocaleSwitcher,
          headingTag: ut.gpcBanner.headingTag,
          heading: content.gpcBanner.heading,
          htmlText: content.gpcBanner.htmlText,
          buttons: ut.gpcBanner.buttons.map((btn, i) => ({
            text: content.gpcBanner.buttonLabels[i] ?? btn.text,
            type: btn.type,
            action: btn.action,
            ...(btn.cookies != null ? { cookies: btn.cookies } : {}),
            ...(btn.url != null ? { url: btn.url } : {}),
          })),
        },
        preferenceModal: {
          position: ut.preferenceModal.position,
          overlayOpacity: ut.preferenceModal.overlayOpacity,
          showClose: ut.preferenceModal.showClose,
          showLocaleSwitcher: ut.preferenceModal.showLocaleSwitcher,
          persistent: ut.preferenceModal.persistent,
          headingTag: ut.preferenceModal.headingTag,
          heading: content.preferenceModal.heading,
          ...(ut.preferenceModal.hasSubheading && content.preferenceModal.subheading
            ? { subheading: content.preferenceModal.subheading } : {}),
          ...(content.preferenceModal.htmlText ? { htmlText: content.preferenceModal.htmlText } : {}),
          buttons: ut.preferenceModal.buttons.map((btn, i) => ({
            text: content.preferenceModal.buttonLabels[i] ?? btn.text,
            type: btn.type,
            action: btn.action,
            ...(btn.cookies != null ? { cookies: btn.cookies } : {}),
            ...(btn.url != null ? { url: btn.url } : {}),
          })),
          categories: ut.preferenceModal.categories.map(cat => {
            const c = content.preferenceModal.categories.find(x => x.id === cat.id)
            return {
              id: cat.id,
              heading: c?.heading || cat.id,
              headingTag: cat.headingTag,
              htmlText: c?.htmlText ?? '',
              mandatory: cat.mandatory,
              type: cat.type,
              ...(cat.liEnabled ? { legitimateInterest: { enabled: true } } : {}),
              cookies: cat.cookies,
            }
          }),
        },
      },
    },
  }
}

// ── Read-only cookie preview table ─────────────────────────────────────────────

function CookiePreviewTable({ cookies }: { cookies: ServerCookieTemplate['cookies'] }) {
  if (!cookies.length) {
    return <p class="text-xs text-gray-400 italic">No cookies defined in this template.</p>
  }
  return (
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th class="pb-2 pr-3 pl-1 font-medium">ID</th>
            <th class="pb-2 pr-3 font-medium">Legal Basis</th>
            <th class="pb-2 pr-3 font-medium text-center">Mandatory</th>
            <th class="pb-2 pr-3 font-medium text-center">GPC</th>
            <th class="pb-2 pr-3 font-medium">Expiry</th>
            <th class="pb-2 pr-3 font-medium">TCF Vendor</th>
            <th class="pb-2 font-medium">CPRA Category</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map(c => (
            <tr key={c.id} class="border-b border-gray-100 last:border-0">
              <td class="py-1.5 pr-3 pl-1 font-mono text-gray-800">{c.id}</td>
              <td class="py-1.5 pr-3 text-gray-600">{c.type ?? 'consent'}</td>
              <td class="py-1.5 pr-3 text-center text-gray-600">{c.mandatory ? '✓' : '–'}</td>
              <td class="py-1.5 pr-3 text-center text-gray-600">{c.listenGpc ? '✓' : '–'}</td>
              <td class="py-1.5 pr-3 text-gray-600">{c.expiry != null ? `${c.expiry}d` : '–'}</td>
              <td class="py-1.5 pr-3 text-gray-600">{c.tcfVendorId ?? '–'}</td>
              <td class="py-1.5 text-gray-600">{c.cpraCategory ?? '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProfileEditor({ id, current }: { id?: string; current: string }) {
  const isNew = !id || id === 'new'

  // ── Step 1: Config ─────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('')
  const [defaultLocale, setDefaultLocale] = useState('en')
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([])
  const [regulations, setRegulations] = useState<string[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [dpdpaFiduciary, setDpdpaFiduciary] = useState('')
  const [dpdpaGrievanceEmail, setDpdpaGrievanceEmail] = useState('')
  const [dpdpaPurpose, setDpdpaPurpose] = useState('')

  // ── Step 2: Templates ───────────────────────────────────────────────
  const [cookieTemplates, setCookieTemplates] = useState<ServerCookieTemplate[]>([])
  const [uiTemplates, setUITemplates] = useState<ServerUITemplate[]>([])
  const [cookieTemplateId, setCookieTemplateId] = useState('')
  const [cookieTemplate, setCookieTemplate] = useState<ServerCookieTemplate | null>(null)
  const [uiTemplateId, setUITemplateId] = useState('')
  const [uiTemplate, setUITemplate] = useState<ServerUITemplate | null>(null)

  // ── Step 3: Content ─────────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState('en')
  const [localeContents, setLocaleContents] = useState<Record<string, LocaleContent>>({})
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Common ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load template lists on mount
  useEffect(() => {
    Promise.all([cookieTemplatesApi.list(), uiTemplatesApi.list()])
      .then(([cts, uts]) => { setCookieTemplates(cts); setUITemplates(uts) })
      .catch(() => { })
  }, [])

  // Load existing profile
  useEffect(() => {
    if (isNew) return
    profilesApi.get(id).then(p => {
      const profile = p as DashboardProfile
      setProfileName(profile.name)
      setDefaultLocale(profile.defaultLocale)
      setActiveLocale(profile.defaultLocale)
      const pj = profile.profileJson
      // Regulations — handle both new array format and legacy single-string
      if (Array.isArray(pj.regulations)) setRegulations(pj.regulations)
      else if (typeof pj.regulation === 'string' && pj.regulation) setRegulations([pj.regulation])
      if (Array.isArray(pj.allowedOrigins)) setAllowedOrigins(pj.allowedOrigins)
      if (pj.darkMode === true) setDarkMode(true)
      if (pj.localeContents && typeof pj.localeContents === 'object') {
        setLocaleContents(pj.localeContents as Record<string, LocaleContent>)
      }
      if (pj.dpdpa) {
        setDpdpaFiduciary(pj.dpdpa['dataFiduciary'] ?? '')
        setDpdpaGrievanceEmail(pj.dpdpa['grievanceEmail'] ?? '')
        setDpdpaPurpose(pj.dpdpa['purposeDescription'] ?? '')
      }
      const ctId = pj.cookieTemplateId
      const utId = pj.uiTemplateId
      if (ctId) {
        setCookieTemplateId(ctId)
        cookieTemplatesApi.get(ctId).then(setCookieTemplate).catch(() => { })
      }
      if (utId) {
        setUITemplateId(utId)
        uiTemplatesApi.get(utId).then(setUITemplate).catch(() => { })
      }
    }).catch(() => setError('Failed to load profile.')).finally(() => setLoading(false))
  }, [id, isNew])

  const onCookieTemplateChange = (tid: string) => {
    setCookieTemplateId(tid)
    if (!tid) { setCookieTemplate(null); return }
    cookieTemplatesApi.get(tid).then(setCookieTemplate).catch(() => setCookieTemplate(null))
  }

  const onUITemplateChange = (tid: string) => {
    setUITemplateId(tid)
    if (!tid) { setUITemplate(null); return }
    uiTemplatesApi.get(tid).then(ut => {
      setUITemplate(ut)
      // Sync existing locale content to the new template's structure
      setLocaleContents(prev => {
        const existingLocales = Object.keys(prev)
        const locales = existingLocales.length ? existingLocales : [defaultLocale]
        const updated: Record<string, LocaleContent> = {}
        for (const locale of locales) {
          updated[locale] = prev[locale] ? syncLocaleToTemplate(prev[locale]!, ut) : defaultLocaleFromTemplate(ut)
        }
        return updated
      })
    }).catch(() => setUITemplate(null))
  }

  const addLocale = (locale: string) => {
    setLocaleContents(prev => ({
      ...prev,
      [locale]: uiTemplate ? defaultLocaleFromTemplate(uiTemplate) : {
        mainBanner: { heading: '', htmlText: '', buttonLabels: [] },
        gpcBanner: { heading: '', htmlText: '', buttonLabels: [] },
        preferenceModal: { heading: '', subheading: '', htmlText: '', buttonLabels: [], categories: [] },
      },
    }))
    setActiveLocale(locale)
  }

  const setLocaleField = (section: 'mainBanner' | 'gpcBanner', field: 'heading' | 'htmlText', value: string) => {
    setLocaleContents(prev => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale]!, [section]: { ...prev[activeLocale]![section], [field]: value } },
    }))
  }

  const setModalField = (field: 'heading' | 'subheading' | 'htmlText', value: string) => {
    setLocaleContents(prev => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale]!,
        preferenceModal: { ...prev[activeLocale]!.preferenceModal, [field]: value },
      },
    }))
  }

  const setCategoryContent = (idx: number, field: keyof CategoryContent, value: string) => {
    setLocaleContents(prev => {
      const cats = [...(prev[activeLocale]?.preferenceModal.categories ?? [])]
      cats[idx] = { ...cats[idx]!, [field]: value }
      return {
        ...prev,
        [activeLocale]: { ...prev[activeLocale]!, preferenceModal: { ...prev[activeLocale]!.preferenceModal, categories: cats } },
      }
    })
  }

  const setButtonLabel = (section: 'mainBanner' | 'gpcBanner' | 'preferenceModal', idx: number, text: string) => {
    setLocaleContents(prev => {
      const content = prev[activeLocale]!
      const labels = [...(content[section].buttonLabels ?? [])]
      labels[idx] = text
      return { ...prev, [activeLocale]: { ...content, [section]: { ...content[section], buttonLabels: labels } } }
    })
  }

  const handleExportJson = () => {
    const content = localeContents[activeLocale]
    if (!content || !uiTemplate) return
    const json = exportLocaleJson(
      activeLocale, content,
      uiTemplate.mainBanner as unknown as TemplateBannerUI,
      uiTemplate.gpcBanner as unknown as TemplateBannerUI,
      uiTemplate.preferenceModal as unknown as TemplateModalUI,
    )
    downloadFile(json, `locale-${activeLocale}.json`, 'application/json')
  }

  const handleExportCsv = () => {
    const content = localeContents[activeLocale]
    if (!content || !uiTemplate) return
    const csv = exportLocaleCsv(
      activeLocale, content,
      uiTemplate.mainBanner as unknown as TemplateBannerUI,
      uiTemplate.gpcBanner as unknown as TemplateBannerUI,
      uiTemplate.preferenceModal as unknown as TemplateModalUI,
    )
    downloadFile(csv, `locale-${activeLocale}.csv`, 'text/csv')
  }

  const handleImport = (file: File) => {
    setImportError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      try {
        const base: LocaleContent = localeContents[activeLocale] ?? (uiTemplate
          ? defaultLocaleFromTemplate(uiTemplate)
          : { mainBanner: { heading: '', htmlText: '', buttonLabels: [] }, gpcBanner: { heading: '', htmlText: '', buttonLabels: [] }, preferenceModal: { heading: '', subheading: '', htmlText: '', buttonLabels: [], categories: [] } })
        const updated = file.name.endsWith('.csv') ? importFromCsv(text, base) : importFromJson(text, base)
        setLocaleContents(prev => ({ ...prev, [activeLocale]: updated }))
      } catch {
        setImportError('Could not parse the uploaded file. Make sure it matches the Consenti locale template format.')
      }
    }
    reader.readAsText(file)
  }

  const previewDraft = cookieTemplate && uiTemplate
    ? buildPreviewDraft(cookieTemplate, uiTemplate, defaultLocale, localeContents)
    : null

  const handleSave = async () => {
    if (!profileName.trim()) { setError('Profile name is required.'); setStep(1); return }
    if (!cookieTemplateId) { setError('Select a cookie template.'); setStep(2); return }
    if (!uiTemplateId) { setError('Select a UI template.'); setStep(2); return }

    const dpdpaConfig = regulations.includes('dpdpa') && dpdpaFiduciary.trim() && dpdpaGrievanceEmail.trim()
      ? { dataFiduciary: dpdpaFiduciary.trim(), grievanceEmail: dpdpaGrievanceEmail.trim(), ...(dpdpaPurpose.trim() ? { purposeDescription: dpdpaPurpose.trim() } : {}) }
      : undefined

    const profileJson = {
      cookieTemplateId,
      uiTemplateId,
      defaultLocale,
      ...(regulations.length > 0 ? { regulations } : {}),
      ...(allowedOrigins.length > 0 ? { allowedOrigins } : {}),
      ...(dpdpaConfig ? { dpdpa: dpdpaConfig } : {}),
      ...(darkMode ? { darkMode: true } : {}),
      localeContents,
    }

    setSaving(true)
    setError('')
    try {
      const data = { name: profileName, defaultLocale, profileJson }
      if (isNew) await profilesApi.create(data)
      else await profilesApi.update(id, data)
      window.location.hash = '#/banners/profiles'
    } catch {
      setError('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const currentContent = localeContents[activeLocale]
  const locales = Object.keys(localeContents).length ? Object.keys(localeContents) : [defaultLocale]

  if (loading) {
    return <Layout title="Profile Editor" current={current}><p class="text-gray-400 text-sm">Loading…</p></Layout>
  }

  return (
    <Layout title={isNew ? 'New Profile' : 'Edit Profile'} current={current}>
      <StepBar step={step} />

      {/* ── Step 1: Profile Config ──────────────────────────────────────── */}
      {step === 1 && (
        <div class="space-y-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Profile Name <span class="text-red-500">*</span></label>
                <input
                  class={`w-full border rounded px-3 py-2 text-sm ${!profileName.trim() && error ? 'border-red-400' : 'border-gray-300'}`}
                  value={profileName}
                  onInput={e => setProfileName((e.target as HTMLInputElement).value)}
                  placeholder="My Website"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Default Locale</label>
                <input
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={defaultLocale}
                  onInput={e => setDefaultLocale((e.target as HTMLInputElement).value)}
                  placeholder="en"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Allowed Domains
                <span class="ml-1.5 text-xs font-normal text-gray-400">
                  Supports wildcards (*.example.com). Leave empty to allow all.
                </span>
              </label>
              <DomainsInput value={allowedOrigins} onChange={setAllowedOrigins} />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Compliance Regulations
                <span class="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                {([
                  { value: 'gdpr', label: 'GDPR', desc: 'EU/EEA opt-in. No tracking until consent is given. Banner shown on first visit.' },
                  { value: 'ccpa', label: 'CCPA', desc: 'California opt-out. Cookies default granted. Provide a "Do Not Sell" trigger.' },
                  { value: 'cpra', label: 'CPRA', desc: 'California 2023. Opt-out for sale/sharing; opt-in for sensitive data. GPC honored.' },
                  { value: 'dpdpa', label: 'DPDPA', desc: 'India 2023. Opt-in like GDPR. GPC not recognised. Data Fiduciary notice required.' },
                ] as const).map(r => (
                  <label
                    key={r.value}
                    class={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors select-none ${regulations.includes(r.value) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      class="mt-0.5 accent-blue-600 shrink-0"
                      checked={regulations.includes(r.value)}
                      onChange={e => {
                        if ((e.target as HTMLInputElement).checked) setRegulations(prev => [...prev, r.value])
                        else setRegulations(prev => prev.filter(x => x !== r.value))
                      }}
                    />
                    <div>
                      <span class="text-sm font-medium text-gray-700">{r.label}</span>
                      <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label class="flex items-center gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 bg-white select-none w-fit">
                <input
                  type="checkbox"
                  class="accent-blue-600"
                  checked={darkMode}
                  onChange={e => setDarkMode((e.target as HTMLInputElement).checked)}
                />
                <div>
                  <span class="text-sm font-medium text-gray-700">Enable Dark Mode</span>
                  <p class="text-xs text-gray-500 mt-0.5">Applies dark colour tokens to the consent widget for sites with a dark theme.</p>
                </div>
              </label>
            </div>

            {regulations.includes('dpdpa') && (
              <div class="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                <p class="text-xs font-semibold text-amber-800">DPDPA — Required Consent Notice Fields</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Data Fiduciary Name <span class="text-red-500">*</span></label>
                    <input
                      class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      value={dpdpaFiduciary}
                      onInput={e => setDpdpaFiduciary((e.target as HTMLInputElement).value)}
                      placeholder="Acme Corp Pvt Ltd"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Grievance Officer Email <span class="text-red-500">*</span></label>
                    <input
                      type="email"
                      class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      value={dpdpaGrievanceEmail}
                      onInput={e => setDpdpaGrievanceEmail((e.target as HTMLInputElement).value)}
                      placeholder="grievance@acme.com"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Purpose Description</label>
                  <input
                    class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={dpdpaPurpose}
                    onInput={e => setDpdpaPurpose((e.target as HTMLInputElement).value)}
                    placeholder="We collect your data to personalise your experience…"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <a href="#/banners/profiles" class="px-5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-100 transition-colors">
              Cancel
            </a>
            <button
              type="button"
              onClick={() => {
                if (!profileName.trim()) { setError('Profile name is required before continuing.'); return }
                setError('')
                setStep(2)
              }}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              Next: Templates <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Templates ──────────────────────────────────────────── */}
      {step === 2 && (
        <div class="space-y-5">

          {/* Cookie Template */}
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-700">Cookie Template</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  Defines which cookies/purposes appear in the preference modal.
                  All fields are derived from the template — read-only in the profile.
                </p>
              </div>
              <a href="#/banners/cookie-templates/new" class="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0" target="_blank">
                + New ↗
              </a>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm mb-4"
              value={cookieTemplateId}
              onChange={e => onCookieTemplateChange((e.target as HTMLSelectElement).value)}
            >
              <option value="">— Select a cookie template —</option>
              {cookieTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.cookies.length} cookie{t.cookies.length !== 1 ? 's' : ''})</option>
              ))}
            </select>
            {cookieTemplate
              ? <CookiePreviewTable cookies={cookieTemplate.cookies} />
              : <p class="text-xs text-gray-400 italic">No template selected.</p>
            }
          </div>

          {/* UI Template */}
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-700">UI Template</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  Defines banner/modal layout, button count, and category structure.
                  You add text content in Step 3.
                </p>
              </div>
              <a href="#/banners/ui-templates/new" class="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0" target="_blank">
                + New ↗
              </a>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm mb-4"
              value={uiTemplateId}
              onChange={e => onUITemplateChange((e.target as HTMLSelectElement).value)}
            >
              <option value="">— Select a UI template —</option>
              {uiTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {uiTemplate && (
              <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                <span>Main banner: <strong class="text-gray-700">{uiTemplate.mainBanner.position}</strong></span>
                <span>GPC banner: <strong class="text-gray-700">{uiTemplate.gpcBanner.position}</strong></span>
                <span>Modal: <strong class="text-gray-700">{uiTemplate.preferenceModal.position}</strong></span>
                <span><strong class="text-gray-700">{uiTemplate.preferenceModal.categories.length}</strong> categories</span>
                <span><strong class="text-gray-700">{uiTemplate.mainBanner.buttons.length + uiTemplate.preferenceModal.buttons.length}</strong> buttons total</span>
              </div>
            )}
          </div>

          {/* Combined live preview */}
          {previewDraft
            ? <PreviewPane draft={previewDraft} expandable />
            : (
              <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-xs text-gray-400">
                Select both a cookie template and a UI template to see a live preview.
              </div>
            )
          }

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <button type="button" onClick={() => { setError(''); setStep(1) }}
              class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!cookieTemplateId) { setError('Select a cookie template to continue.'); return }
                if (!uiTemplateId) { setError('Select a UI template to continue.'); return }
                // Ensure default locale content exists before entering step 3
                if (!localeContents[defaultLocale] && uiTemplate) {
                  setLocaleContents(prev => ({ ...prev, [defaultLocale]: defaultLocaleFromTemplate(uiTemplate) }))
                }
                setActiveLocale(defaultLocale)
                setError('')
                setStep(3)
              }}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              Next: Content <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Content ────────────────────────────────────────────── */}
      {step === 3 && (
        <div class="space-y-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5">

            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
              <LocaleTabBar
                locales={locales}
                defaultLocale={defaultLocale}
                activeLocale={activeLocale}
                onSelect={setActiveLocale}
                onAdd={addLocale}
              />
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={handleExportJson} disabled={!uiTemplate}
                  class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40"
                  title="Download locale content as JSON">
                  <Download size={12} /> JSON
                </button>
                <button type="button" onClick={handleExportCsv} disabled={!uiTemplate}
                  class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40"
                  title="Download locale content as CSV for translation">
                  <Download size={12} /> CSV
                </button>
                {activeLocale !== defaultLocale && (
                  <label
                    class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-blue-300 rounded hover:bg-blue-50 text-blue-600 cursor-pointer transition-colors"
                    title="Upload translated JSON or CSV"
                  >
                    <Upload size={12} /> Import
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv"
                      class="hidden"
                      onChange={e => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) handleImport(file)
                          ; (e.target as HTMLInputElement).value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {importError && (
              <p class="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{importError}</p>
            )}

            {currentContent && uiTemplate
              ? (
                <div class="space-y-6">

                  {/* Main Banner */}
                  <section>
                    <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Main Banner</h4>
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Heading <span class="text-red-500">*</span></label>
                        <input
                          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                          value={currentContent.mainBanner.heading}
                          onInput={e => setLocaleField('mainBanner', 'heading', (e.target as HTMLInputElement).value)}
                          placeholder="We value your privacy"
                        />
                      </div>
                      <HtmlEditor
                        label="Body Text"
                        value={currentContent.mainBanner.htmlText}
                        onChange={v => setLocaleField('mainBanner', 'htmlText', v)}
                        placeholder="We use cookies to improve your experience…"
                        rows={4}
                      />
                      {uiTemplate.mainBanner.buttons.length > 0 && (
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-1.5">Button Labels</label>
                          <div class="grid grid-cols-3 gap-3">
                            {uiTemplate.mainBanner.buttons.map((btn, i) => (
                              <div key={i}>
                                <label class="block text-xs text-gray-400 mb-1">{btn.action} <span class="text-red-500">*</span></label>
                                <input
                                  class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={currentContent.mainBanner.buttonLabels[i] ?? ''}
                                  onInput={e => setButtonLabel('mainBanner', i, (e.target as HTMLInputElement).value)}
                                  placeholder={btn.text}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <hr />

                  {/* GPC Banner */}
                  <section>
                    <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">GPC Banner</h4>
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Heading</label>
                        <input
                          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                          value={currentContent.gpcBanner.heading}
                          onInput={e => setLocaleField('gpcBanner', 'heading', (e.target as HTMLInputElement).value)}
                          placeholder="Global Privacy Control Detected"
                        />
                      </div>
                      <HtmlEditor
                        label="Body Text"
                        value={currentContent.gpcBanner.htmlText}
                        onChange={v => setLocaleField('gpcBanner', 'htmlText', v)}
                        rows={3}
                      />
                      {uiTemplate.gpcBanner.buttons.length > 0 && (
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-1.5">Button Labels</label>
                          <div class="grid grid-cols-3 gap-3">
                            {uiTemplate.gpcBanner.buttons.map((btn, i) => (
                              <div key={i}>
                                <label class="block text-xs text-gray-400 mb-1">{btn.action} <span class="text-red-500">*</span></label>
                                <input
                                  class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={currentContent.gpcBanner.buttonLabels[i] ?? ''}
                                  onInput={e => setButtonLabel('gpcBanner', i, (e.target as HTMLInputElement).value)}
                                  placeholder={btn.text}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <hr />

                  {/* Preference Modal */}
                  <section>
                    <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Preference Modal</h4>
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">Heading <span class="text-red-500">*</span></label>
                        <input
                          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                          value={currentContent.preferenceModal.heading}
                          onInput={e => setModalField('heading', (e.target as HTMLInputElement).value)}
                          placeholder="Privacy Preferences"
                        />
                      </div>
                      {uiTemplate.preferenceModal.hasSubheading && (
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-1">Subheading</label>
                          <input
                            class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                            value={currentContent.preferenceModal.subheading}
                            onInput={e => setModalField('subheading', (e.target as HTMLInputElement).value)}
                            placeholder="Manage your cookie preferences below."
                          />
                        </div>
                      )}
                      <HtmlEditor
                        label="Intro Text (optional)"
                        value={currentContent.preferenceModal.htmlText}
                        onChange={v => setModalField('htmlText', v)}
                        placeholder="Optional intro above categories…"
                        rows={3}
                      />
                      {uiTemplate.preferenceModal.buttons.length > 0 && (
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-1.5">Button Labels</label>
                          <div class="grid grid-cols-3 gap-3">
                            {uiTemplate.preferenceModal.buttons.map((btn, i) => (
                              <div key={i}>
                                <label class="block text-xs text-gray-400 mb-1">{btn.action} <span class="text-red-500">*</span></label>
                                <input
                                  class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={currentContent.preferenceModal.buttonLabels[i] ?? ''}
                                  onInput={e => setButtonLabel('preferenceModal', i, (e.target as HTMLInputElement).value)}
                                  placeholder={btn.text}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentContent.preferenceModal.categories.map((cat, idx) => {
                        const catDef = uiTemplate.preferenceModal.categories.find(c => c.id === cat.id)
                        return (
                          <div key={cat.id} class="border border-gray-100 rounded p-3 bg-gray-50 space-y-2">
                            <div class="flex items-center gap-2">
                              <span class="text-xs font-semibold text-gray-700">{cat.id || `Category ${idx + 1}`}</span>
                              {catDef?.mandatory && <span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">mandatory</span>}
                              {catDef?.type === 'legitimate_interest' && <span class="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">LI</span>}
                            </div>
                            <div>
                              <label class="block text-xs font-medium text-gray-600 mb-0.5">Category Heading <span class="text-red-500">*</span></label>
                              <input
                                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                value={cat.heading}
                                onInput={e => setCategoryContent(idx, 'heading', (e.target as HTMLInputElement).value)}
                                placeholder={cat.id}
                              />
                            </div>
                            <HtmlEditor
                              label="Category Description"
                              value={cat.htmlText}
                              onChange={v => setCategoryContent(idx, 'htmlText', v)}
                              placeholder="Description of this cookie category…"
                              rows={3}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>
              )
              : (
                <p class="text-xs text-gray-400 italic py-4 text-center">
                  {uiTemplateId && !uiTemplate ? 'Loading template…' : 'Select a UI template in step 2 to begin editing content.'}
                </p>
              )
            }
          </div>

          {previewDraft && <PreviewPane draft={previewDraft} expandable />}

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <button type="button" onClick={() => { setError(''); setStep(2) }}
              class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} /> Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : isNew ? 'Create Profile' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
