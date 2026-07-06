import { useEffect, useRef, useState } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { Check, ChevronLeft, ChevronRight, Download, Upload, Wand2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { LocaleTabBar } from '../components/LocaleTabBar'
import { HtmlEditor } from '../components/HtmlEditor'
import { DomainsInput } from '../components/DomainsInput'
import { PreviewPane } from '../components/PreviewPane'
import { Select } from '../components/Select'
import { CountrySelecter } from '../components/CountrySelecter'
import { useT } from '../context/locale'
import type { TranslationKey } from '../context/locale'
import { profilesApi } from '../api/profiles'
import { cookieTemplatesApi, uiTemplatesApi } from '../api/templates'
import {
  exportAllLocalesJson,
  exportLocaleCsv,
  importAllLocalesFromJson,
  importFromCsv,
  downloadFile,
} from '../utils/localeExport'
import { checkReadability } from '../../../utils/readability'
import { buildDefaultContent } from '../utils/profileContentDefaults'
import type {
  LocaleContent,
  CategoryContent,
  TemplateBannerUI,
  TemplateModalUI,
} from '../utils/templates'
import type { ServerCookieTemplate, ServerUITemplate } from '@consenti/types'
import type { DashboardProfile } from '@consenti/types'
import { COMPLIANCE_GROUPS, GPC_OPTIONS } from '@consenti/utils'

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepBar({
  step,
  labels,
  disabledSteps = [],
}: {
  step: number
  labels: string[]
  disabledSteps?: number[]
}) {
  return (
    <div class="flex items-center gap-0 mb-6">
      {labels.map((label, i) => {
        const n = i + 1
        const disabled = disabledSteps.includes(n)
        const done = step > n && !disabled
        const active = step === n
        return (
          <div key={n} class="flex items-center flex-1 last:flex-none">
            <div class="flex items-center gap-2 shrink-0">
              <div class={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${disabled ? 'bg-gray-100 text-gray-300' :
                done ? 'bg-green-500 text-white' :
                  active ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500'
                }`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span class={`text-sm font-medium hidden sm:block ${disabled ? 'text-gray-300 line-through' :
                active ? 'text-blue-600' :
                  done ? 'text-green-600' :
                    'text-gray-400'
                }`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
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

// ── Readability warning callout ────────────────────────────────────────────────

const READABILITY_KEYS: Record<string, TranslationKey> = {
  heading_too_long: 'readability.headingTooLong',
  avg_sentence_too_long: 'readability.avgSentenceLong',
  total_words_too_long: 'readability.totalWordsLong',
}

function ReadabilityCallout({ heading, htmlText }: { heading?: string; htmlText?: string }) {
  const t = useT()
  const warnings = checkReadability({
    ...(heading !== undefined ? { heading } : {}),
    ...(htmlText !== undefined ? { htmlText } : {}),
  })
  if (!warnings.length) return null
  return (
    <div class="mt-1 space-y-0.5">
      {warnings.map((w, i) => (
        <p key={i} class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          {t(READABILITY_KEYS[w.code] ?? 'readability.headingTooLong', { n: w.value })}
        </p>
      ))}
    </div>
  )
}

// ── Read-only cookie preview table ─────────────────────────────────────────────

function CookiePreviewTable({ cookies, labels }: { cookies: ServerCookieTemplate['cookies']; labels: Record<string, string> }) {
  if (!cookies.length) {
    return <p class="text-xs text-gray-400 italic">{labels['noNoCookies']}</p>
  }
  return (
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th scope="col" class="pb-2 pr-3 pl-1 font-medium">{labels['id']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium">{labels['legalBasis']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium text-center">{labels['gpc']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium">{labels['expiry']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium">{labels['tcfVendor']}</th>
            <th scope="col" class="pb-2 font-medium">{labels['cpraCategory']}</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map(c => (
            <tr key={c.id} class="border-b border-gray-100 last:border-0">
              <td class="py-1.5 pr-3 pl-1 font-mono text-gray-800">{c.id}</td>
              <td class="py-1.5 pr-3 text-gray-600">{c.legalBasis ?? c.type ?? 'consent'}</td>
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
  const t = useT()
  const isNew = !id || id === 'new'

  // ── Step 1: Config ─────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('')
  const [defaultLocale, setDefaultLocale] = useState('en')
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([])
  const [regulations, setRegulations] = useState<string[]>([])
  const [complianceGroup, setComplianceGroup] = useState('')
  const [gpcMode, setGpcMode] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [hidePoweredBy, setHidePoweredBy] = useState(false)
  const [allowReceipt, setAllowReceipt] = useState(false)
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

  // ── Steps 3–5: Content ──────────────────────────────────────────────
  const [activeLocale, setActiveLocale] = useState('en')
  const [localeContents, setLocaleContents] = useState<Record<string, LocaleContent>>({})
  const [importError, setImportError] = useState('')
  const [importedLocales, setImportedLocales] = useState<string[]>([])
  const [skippedLocales, setSkippedLocales] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Step 2: compliance validation state ────────────────────────────
  const [complianceErrors, setComplianceErrors] = useState<{ cookieId: string; message: string }[]>([])
  const [complianceWarnings, setComplianceWarnings] = useState<{ cookieId: string; message: string }[]>([])
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)

  // ── Conflict dialog ─────────────────────────────────────────────────
  type ConflictInfo = { id: string; name: string }
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null)
  const [pendingSaveData, setPendingSaveData] = useState<unknown>(null)

  // ── Common ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Guards auto-populate from running on initial profile load
  const profileReadyRef = useRef(isNew)

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
      if (Array.isArray(pj.regulations)) setRegulations(pj.regulations)
      else if (typeof pj.regulation === 'string' && pj.regulation) setRegulations([pj.regulation])
      if (Array.isArray(pj.allowedOrigins)) setAllowedOrigins(pj.allowedOrigins)
      if (typeof pj.complianceGroup === 'string') setComplianceGroup(pj.complianceGroup)
      if (pj.gpcMode !== undefined) setGpcMode(String(pj.gpcMode))
      if (pj.darkMode === true) setDarkMode(true)
      if (pj.hidePoweredBy === true) setHidePoweredBy(true)
      if (pj.allowReceipt === true) setAllowReceipt(true)
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
    }).catch(() => setError(t('profileEditor.error.load'))).finally(() => {
      setLoading(false)
      profileReadyRef.current = true
    })
  }, [id, isNew])

  // Auto-populate step 1 fields when compliance group changes (user-initiated only)
  useEffect(() => {
    if (!profileReadyRef.current) return
    if (!complianceGroup) {
      setGpcMode('')
      return
    }
    const group = COMPLIANCE_GROUPS[complianceGroup as keyof typeof COMPLIANCE_GROUPS]
    if (!group) return
    setGpcMode(group.defaultGpc)
    setAllowReceipt(complianceGroup.startsWith('opt-in'))
  }, [complianceGroup])

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

  const handleLoadSectionDefaults = (section: 'mainBanner' | 'gpcBanner' | 'preferenceModal') => {
    if (!uiTemplate) return
    const defaults = buildDefaultContent(complianceGroup, uiTemplate)
    setLocaleContents(prev => {
      const base = prev[activeLocale] ?? defaultLocaleFromTemplate(uiTemplate)
      return { ...prev, [activeLocale]: { ...base, [section]: defaults[section] } }
    })
  }

  const handleExportJson = () => {
    if (!uiTemplate || !Object.keys(localeContents).length) return
    const json = exportAllLocalesJson(
      localeContents,
      uiTemplate.mainBanner as unknown as TemplateBannerUI,
      uiTemplate.gpcBanner as unknown as TemplateBannerUI,
      uiTemplate.preferenceModal as unknown as TemplateModalUI,
    )
    downloadFile(json, 'locales.json', 'application/json')
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
    setImportedLocales([])
    setSkippedLocales([])
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      try {
        const base: LocaleContent = localeContents[defaultLocale] ?? localeContents[activeLocale] ?? (uiTemplate
          ? defaultLocaleFromTemplate(uiTemplate)
          : { mainBanner: { heading: '', htmlText: '', buttonLabels: [] }, gpcBanner: { heading: '', htmlText: '', buttonLabels: [] }, preferenceModal: { heading: '', subheading: '', htmlText: '', buttonLabels: [], categories: [] } })
        if (file.name.endsWith('.csv')) {
          const updated = importFromCsv(text, localeContents[activeLocale] ?? base)
          setLocaleContents(prev => ({ ...prev, [activeLocale]: updated }))
          setImportedLocales([activeLocale])
        } else {
          const { locales, skipped } = importAllLocalesFromJson(text, base)
          setLocaleContents(prev => ({ ...prev, ...locales }))
          const imported = Object.keys(locales)
          setImportedLocales(imported)
          setSkippedLocales(skipped)
          const newLocale = imported.find(l => !Object.keys(localeContents).includes(l)) ?? imported[0]
          if (newLocale) setActiveLocale(newLocale)
        }
      } catch {
        setImportError(t('profileEditor.content.importError'))
      }
    }
    reader.readAsText(file)
  }

  const previewDraft = cookieTemplate && uiTemplate
    ? buildPreviewDraft(cookieTemplate, uiTemplate, defaultLocale, localeContents)
    : null

  const buildSaveData = (choice?: string) => {
    const dpdpaConfig = (regulations.includes('dpdpa') || COMPLIANCE_GROUPS[complianceGroup as keyof typeof COMPLIANCE_GROUPS]?.requiresDpdpaDisclosure) && dpdpaFiduciary.trim() && dpdpaGrievanceEmail.trim()
      ? { dataFiduciary: dpdpaFiduciary.trim(), grievanceEmail: dpdpaGrievanceEmail.trim(), ...(dpdpaPurpose.trim() ? { purposeDescription: dpdpaPurpose.trim() } : {}) }
      : undefined

    return {
      name: profileName,
      defaultLocale,
      ...(choice ? { choice } : {}),
      profileJson: {
        cookieTemplateId,
        uiTemplateId,
        defaultLocale,
        ...(regulations.length > 0 ? { regulations } : {}),
        ...(complianceGroup ? { complianceGroup } : {}),
        ...(gpcMode ? { gpcMode: gpcMode === 'true' ? true : gpcMode === 'false' ? false : gpcMode } : {}),
        ...(allowedOrigins.length > 0 ? { allowedOrigins } : {}),
        ...(dpdpaConfig ? { dpdpa: dpdpaConfig } : {}),
        ...(darkMode ? { darkMode: true } : {}),
        ...(hidePoweredBy ? { hidePoweredBy: true } : {}),
        ...(allowReceipt ? { allowReceipt: true } : {}),
        localeContents,
      },
    }
  }

  const doSave = async (choice?: string) => {
    setSaving(true)
    setError('')
    try {
      const data = buildSaveData(choice)
      const result = isNew ? await profilesApi.create(data) : await profilesApi.update(id!, data)
      if (result.requiresChoice) {
        setPendingSaveData(data)
        setConflictInfo(result.conflict)
        return
      }
      window.location.hash = '#/banners/profiles'
    } catch {
      setError(t('profileEditor.error.failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!profileName.trim()) { setError(t('profileEditor.error.nameRequired')); setStep(1); return }
    if (!cookieTemplateId) { setError(t('profileEditor.error.cookieRequired')); setStep(2); return }
    if (!uiTemplateId) { setError(t('profileEditor.error.uiRequired')); setStep(2); return }
    await doSave()
  }

  const handleConflictChoice = async (choice: 'deactivate' | 'inactive') => {
    setConflictInfo(null)
    setPendingSaveData(null)
    await doSave(choice)
  }

  // GPC step (step 4) is disabled when gpcMode is ignore or default-inherit with a non-GPC group
  const isGpcStepDisabled = gpcMode === 'ignore' || (gpcMode === '' && (
    !complianceGroup || COMPLIANCE_GROUPS[complianceGroup as keyof typeof COMPLIANCE_GROUPS]?.defaultGpc === 'ignore'
  ))

  const showDpdpaSection = regulations.includes('dpdpa') ||
    COMPLIANCE_GROUPS[complianceGroup as keyof typeof COMPLIANCE_GROUPS]?.requiresDpdpaDisclosure === true

  const currentContent = localeContents[activeLocale]
  const defaultContent = activeLocale !== defaultLocale ? localeContents[defaultLocale] : undefined
  const locales = Object.keys(localeContents).length ? Object.keys(localeContents) : [defaultLocale]

  const tableLabels = {
    noNoCookies: t('profileEditor.table.noNoCookies'),
    id: t('profileEditor.table.id'),
    legalBasis: t('profileEditor.table.legalBasis'),
    gpc: t('profileEditor.table.gpc'),
    expiry: t('profileEditor.table.expiry'),
    tcfVendor: t('profileEditor.table.tcfVendor'),
    cpraCategory: t('profileEditor.table.cpraCategory'),
  }

  if (loading) {
    return <Layout title={t('profileEditor.title.loading')} current={current}><p class="text-gray-400 text-sm" role="status" aria-live="polite">{t('common.loading')}</p></Layout>
  }

  const stepLabels = [
    t('profileEditor.step.config'),
    t('profileEditor.step.templates'),
    t('profileEditor.step.mainBanner'),
    t('profileEditor.step.gpcBanner'),
    t('profileEditor.step.prefModal'),
  ]

  // ── Shared locale toolbar for content steps (3–5) ──────────────────
  const ContentLocaleToolbar = ({
    showImportExport,
    section,
  }: {
    showImportExport?: boolean
    section: 'mainBanner' | 'gpcBanner' | 'preferenceModal'
  }) => (
    <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
      <LocaleTabBar
        locales={locales}
        defaultLocale={defaultLocale}
        activeLocale={activeLocale}
        onSelect={setActiveLocale}
        onAdd={addLocale}
      />
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => handleLoadSectionDefaults(section)}
          disabled={!uiTemplate}
          class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-purple-300 rounded hover:bg-purple-50 text-purple-700 transition-colors disabled:opacity-40"
          title={t('profileEditor.content.loadDefaultsTitle')}
        >
          <Wand2 size={12} aria-hidden="true" /> {t('profileEditor.content.loadDefaults')}
        </button>
        {showImportExport && (
          <>
            <button type="button" onClick={handleExportJson} disabled={!uiTemplate}
              class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40"
              title={t('profileEditor.export.jsonTitle')}>
              <Download size={12} aria-hidden="true" /> {t('profileEditor.export.json')}
            </button>
            <button type="button" onClick={handleExportCsv} disabled={!uiTemplate}
              class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40"
              title={t('profileEditor.export.csvTitle')}>
              <Download size={12} aria-hidden="true" /> {t('profileEditor.export.csv')}
            </button>
            <label
              class="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-blue-300 rounded hover:bg-blue-50 text-blue-600 cursor-pointer transition-colors"
              title={t('profileEditor.export.importTitle')}
            >
              <Upload size={12} aria-hidden="true" /> {t('profileEditor.export.import')}
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
          </>
        )}
      </div>
    </div>
  )

  return (
    <Layout title={isNew ? t('profileEditor.title.new') : t('profileEditor.title.edit')} current={current}>
      {conflictInfo && createPortal(
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" onClick={() => setConflictInfo(null)} aria-hidden="true" />
          <div class="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 class="text-sm font-semibold text-gray-900">{t('profileEditor.conflict.title')}</h3>
            <p class="text-sm text-gray-600">
              {t('profileEditor.conflict.message', { name: conflictInfo.name })}
            </p>
            <div class="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleConflictChoice('deactivate')}
                class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t('profileEditor.conflict.deactivate', { name: conflictInfo.name })}
              </button>
              <button
                type="button"
                onClick={() => handleConflictChoice('inactive')}
                class="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                {t('profileEditor.conflict.saveInactive')}
              </button>
              <button
                type="button"
                onClick={() => { setConflictInfo(null); setPendingSaveData(null) }}
                class="w-full text-gray-400 px-4 py-1.5 text-sm hover:text-gray-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <StepBar step={step} labels={stepLabels} disabledSteps={isGpcStepDisabled ? [4] : []} />

      {/* ── Step 1: Profile Config ──────────────────────────────────────── */}
      {step === 1 && (
        <div class="space-y-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="profile-name" class="block text-sm font-medium text-gray-700 mb-1">{t('profileEditor.config.profileName')} <span class="text-red-500" aria-hidden="true">*</span></label>
                <input
                  id="profile-name"
                  class={`w-full border rounded px-3 py-2 text-sm ${!profileName.trim() && error ? 'border-red-400' : 'border-gray-300'}`}
                  value={profileName}
                  onInput={e => setProfileName((e.target as HTMLInputElement).value)}
                  placeholder={t('profileEditor.config.profileNamePlaceholder')}
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label for="default-locale" class="block text-sm font-medium text-gray-700 mb-1">{t('profileEditor.config.defaultLocale')}</label>
                <CountrySelecter
                  id="default-locale"
                  value={defaultLocale}
                  onChange={setDefaultLocale}
                  placeholder={t('profileEditor.config.selectDefaultLocale')}
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {t('profileEditor.config.allowedDomains')}
                <span class="ml-1.5 text-xs font-normal text-gray-400">
                  {t('profileEditor.config.allowedDomainsHint')}
                </span>
              </label>
              <DomainsInput value={allowedOrigins} onChange={setAllowedOrigins} />
            </div>

            {/* Compliance Group */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {t('profileEditor.config.complianceGroup')}
                <span class="ml-1.5 text-xs font-normal text-gray-400">({t('common.optional')})</span>
              </label>
              <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {(Object.entries(COMPLIANCE_GROUPS) as Array<[string, typeof COMPLIANCE_GROUPS[keyof typeof COMPLIANCE_GROUPS]]>).map(([key, group]) => (
                  <label
                    key={key}
                    class={`flex flex-col gap-1 p-3 border rounded-lg cursor-pointer transition-colors select-none ${complianceGroup === key ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                  >
                    <div class="flex items-center gap-2">
                      <input
                        type="radio"
                        name="complianceGroup"
                        class="accent-blue-600 shrink-0"
                        checked={complianceGroup === key}
                        onChange={() => setComplianceGroup(complianceGroup === key ? '' : key)}
                      />
                      <span class="text-sm font-medium text-gray-700 leading-tight">{group.label}</span>
                    </div>
                    <div class="ml-5 flex flex-wrap gap-1">
                      <p class="text-[11px] text-gray-500 py-2">{group.description}</p>
                      {(group.compliances as readonly string[]).map(c => (
                        <span key={c} class="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-mono">{c}</span>
                      ))}
                    </div>
                  </label>
                ))}
                <label
                  class={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors select-none ${!complianceGroup ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <input
                    type="radio"
                    name="complianceGroup"
                    class="accent-gray-600 shrink-0"
                    checked={!complianceGroup}
                    onChange={() => setComplianceGroup('')}
                  />
                  <span class="text-sm font-medium text-gray-600">{t('profileEditor.config.complianceGroupNone')}</span>
                </label>
              </div>
            </div>

            <hr class="my-7 text-gray-300" />


            <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* GPC Mode */}
              <div>
                <label for="gpc-mode" class="block text-sm font-medium text-gray-700 mb-1">
                  {t('profileEditor.config.gpcMode')}
                  <span class="ml-1.5 text-xs font-normal text-gray-400">({t('common.optional')})</span>
                </label>
                <Select
                  id="gpc-mode"
                  options={[
                    { value: '', label: t('profileEditor.config.gpcModeDefault') },
                    ...GPC_OPTIONS.map((o: { value: string; label: string; description: string }) => ({ value: o.value, label: `${o.label} — ${o.description}` })),
                  ]}
                  value={gpcMode}
                  onChange={setGpcMode}
                  placeholder={t('profileEditor.config.gpcModePlaceholder')}
                />
              </div>
              {/* Display toggles */}
              {[
                { checked: darkMode, onChange: setDarkMode, label: t('profileEditor.config.darkMode'), hint: t('profileEditor.config.darkModeHint') },
                { checked: hidePoweredBy, onChange: setHidePoweredBy, label: t('profileEditor.config.hidePoweredBy'), hint: t('profileEditor.config.hidePoweredByHint') },
                { checked: allowReceipt, onChange: setAllowReceipt, label: t('profileEditor.config.allowReceipt'), hint: t('profileEditor.config.allowReceiptHint') },
              ].map(({ checked, onChange, label, hint }) => (
                <label key={label} class="flex items-start gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 bg-white select-none">
                  <input
                    type="checkbox"
                    class="mt-2 accent-blue-600 shrink-0"
                    checked={checked}
                    onChange={e => onChange((e.target as HTMLInputElement).checked)}
                  />
                  <div>
                    <span class="text-sm font-medium text-gray-700">{label}</span>
                    <p class="text-xs text-gray-500 mt-0.5">{hint}</p>
                  </div>
                </label>
              ))}
            </div>

            {showDpdpaSection && (
              <div class="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                <p class="text-xs font-semibold text-amber-800">{t('profileEditor.config.dpdpa.heading')}</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">{t('profileEditor.config.dpdpa.fiduciary')} <span class="text-red-500" aria-hidden="true">*</span></label>
                    <input
                      class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      value={dpdpaFiduciary}
                      onInput={e => setDpdpaFiduciary((e.target as HTMLInputElement).value)}
                      placeholder={t('profileEditor.config.dpdpa.fiduciaryPlaceholder')}
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">{t('profileEditor.config.dpdpa.grievanceEmail')} <span class="text-red-500" aria-hidden="true">*</span></label>
                    <input
                      type="email"
                      class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      value={dpdpaGrievanceEmail}
                      onInput={e => setDpdpaGrievanceEmail((e.target as HTMLInputElement).value)}
                      placeholder={t('profileEditor.config.dpdpa.grievanceEmailPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">{t('profileEditor.config.dpdpa.purpose')}</label>
                  <input
                    class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={dpdpaPurpose}
                    onInput={e => setDpdpaPurpose((e.target as HTMLInputElement).value)}
                    placeholder={t('profileEditor.config.dpdpa.purposePlaceholder')}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <a href="#/banners/profiles" class="px-5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-100 transition-colors">
              {t('common.cancel')}
            </a>
            <button
              type="button"
              onClick={() => {
                if (!profileName.trim()) { setError(t('profileEditor.error.nameRequiredContinue')); return }
                setError('')
                setStep(2)
              }}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              {t('profileEditor.nav.nextTemplates')} <ChevronRight size={14} aria-hidden="true" />
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
                <h3 class="text-sm font-semibold text-gray-700">{t('profileEditor.templates.cookieTemplate')}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {t('profileEditor.templates.cookieTemplateHint')}
                </p>
              </div>
              <a href="#/banners/cookie-templates/new" class="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0" target="_blank">
                {t('profileEditor.newLink')}
              </a>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm mb-4"
              value={cookieTemplateId}
              onChange={e => onCookieTemplateChange((e.target as HTMLSelectElement).value)}
            >
              <option value="">{t('profileEditor.templates.selectCookie')}</option>
              {cookieTemplates.map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tmpl.cookies.length} cookie{tmpl.cookies.length !== 1 ? 's' : ''})</option>
              ))}
            </select>
            {cookieTemplate
              ? <CookiePreviewTable cookies={cookieTemplate.cookies} labels={tableLabels} />
              : <p class="text-xs text-gray-400 italic">{t('profileEditor.templates.noTemplate')}</p>
            }
          </div>

          {/* UI Template */}
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-700">{t('profileEditor.templates.uiTemplate')}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {t('profileEditor.templates.uiTemplateHint')}
                </p>
              </div>
              <a href="#/banners/ui-templates/new" class="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0" target="_blank">
                {t('profileEditor.newLink')}
              </a>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm mb-4"
              value={uiTemplateId}
              onChange={e => onUITemplateChange((e.target as HTMLSelectElement).value)}
            >
              <option value="">{t('profileEditor.templates.selectUi')}</option>
              {uiTemplates.map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
              ))}
            </select>
            {uiTemplate && (
              <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                <span>{t('uiTemplates.mainBanner')} <strong class="text-gray-700">{uiTemplate.mainBanner.position}</strong></span>
                <span>{t('uiTemplates.gpcBanner')} <strong class="text-gray-700">{uiTemplate.gpcBanner.position}</strong></span>
                <span>{t('uiTemplates.modal')} <strong class="text-gray-700">{uiTemplate.preferenceModal.position}</strong></span>
                <span><strong class="text-gray-700">{uiTemplate.preferenceModal.categories.length}</strong> {t('profileEditor.templates.categoriesCount')}</span>
                <span><strong class="text-gray-700">{uiTemplate.mainBanner.buttons.length + uiTemplate.preferenceModal.buttons.length}</strong> {t('profileEditor.templates.buttonsTotal')}</span>
              </div>
            )}
          </div>

          {/* Combined live preview */}
          {previewDraft
            ? <PreviewPane draft={previewDraft} expandable />
            : (
              <div class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-xs text-gray-400">
                {t('profileEditor.templates.previewPrompt')}
              </div>
            )
          }

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          {complianceErrors.length > 0 && (
            <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
              <p class="text-xs font-semibold text-red-700">{t('profileEditor.compliance.errors.heading')}</p>
              {complianceErrors.map((e, i) => (
                <p key={i} class="text-xs text-red-600">• [{e.cookieId}] {e.message}</p>
              ))}
            </div>
          )}

          {complianceWarnings.length > 0 && (
            <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-2">
              <p class="text-xs font-semibold text-amber-800">{t('profileEditor.compliance.warnings.heading')}</p>
              {complianceWarnings.map((w, i) => (
                <p key={i} class="text-xs text-amber-700">• [{w.cookieId}] {w.message}</p>
              ))}
              <label class="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  class="accent-amber-700"
                  checked={warningAcknowledged}
                  onChange={e => setWarningAcknowledged((e.target as HTMLInputElement).checked)}
                />
                <span class="text-xs text-amber-800 font-medium">{t('profileEditor.compliance.warnings.acknowledge')}</span>
              </label>
            </div>
          )}

          <div class="flex justify-between">
            <button type="button" onClick={() => { setError(''); setStep(1) }}
              class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} aria-hidden="true" /> {t('common.back')}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!cookieTemplateId) { setError(t('profileEditor.error.cookieContinue')); return }
                if (!uiTemplateId) { setError(t('profileEditor.error.uiContinue')); return }

                if (complianceGroup && cookieTemplate) {
                  try {
                    const result = await profilesApi.validateCompliance({
                      complianceGroup,
                      cookies: cookieTemplate.cookies as unknown[],
                    })
                    setComplianceErrors(result.errors ?? [])
                    setComplianceWarnings(result.warnings ?? [])
                    if (!result.valid && (result.errors ?? []).length > 0) return
                    if ((result.warnings ?? []).length > 0 && !warningAcknowledged) return
                  } catch {
                    // Non-blocking: allow through if validate endpoint fails
                  }
                }

                if (!localeContents[defaultLocale] && uiTemplate) {
                  setLocaleContents(prev => ({ ...prev, [defaultLocale]: defaultLocaleFromTemplate(uiTemplate) }))
                }
                setActiveLocale(defaultLocale)
                setError('')
                setStep(3)
              }}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              {t('profileEditor.nav.nextMainBanner')} <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Main Banner Content ────────────────────────────────── */}
      {step === 3 && (
        <div class="space-y-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <ContentLocaleToolbar showImportExport section="mainBanner" />

            {importError && (
              <p class="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">{importError}</p>
            )}
            {importedLocales.length > 0 && (
              <p class="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-3">
                {t(importedLocales.length === 1 ? 'profileEditor.import.importedSingular' : 'profileEditor.import.imported', { n: importedLocales.length, list: importedLocales.join(', ') })}
              </p>
            )}
            {skippedLocales.length > 0 && (
              <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
                {t(skippedLocales.length === 1 ? 'profileEditor.import.skippedSingular' : 'profileEditor.import.skipped', { n: skippedLocales.length, list: skippedLocales.join(', ') })}
              </p>
            )}

            <p class="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded px-3 py-1.5 mb-4">
              {t('profileEditor.content.loadDefaultsNotice')}
            </p>

            {currentContent && uiTemplate ? (
              <div class="space-y-3">
                <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('profileEditor.content.mainBanner')}</h4>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">{t('profileEditor.content.heading')} <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input
                    class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={currentContent.mainBanner.heading}
                    onInput={e => setLocaleField('mainBanner', 'heading', (e.target as HTMLInputElement).value)}
                    placeholder={defaultContent?.mainBanner.heading || t('profileEditor.content.mainBannerHeadingPlaceholder')}
                  />
                  <ReadabilityCallout heading={currentContent.mainBanner.heading} />
                </div>
                <HtmlEditor
                  label={t('profileEditor.content.bodyText')}
                  value={currentContent.mainBanner.htmlText}
                  onChange={v => setLocaleField('mainBanner', 'htmlText', v)}
                  placeholder={t('profileEditor.content.mainBannerBodyPlaceholder')}
                  rows={4}
                />
                <ReadabilityCallout htmlText={currentContent.mainBanner.htmlText} />
                {uiTemplate.mainBanner.buttons.length > 0 && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1.5">{t('profileEditor.content.buttonLabels')}</label>
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
            ) : (
              <p class="text-xs text-gray-400 italic py-4 text-center">
                {uiTemplateId && !uiTemplate ? t('profileEditor.content.loadingTemplate') : t('profileEditor.content.noContent')}
              </p>
            )}
          </div>

          {previewDraft && <PreviewPane draft={previewDraft} expandable previewMode="main" />}

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <button type="button" onClick={() => { setError(''); setStep(2) }}
              class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} aria-hidden="true" /> {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() => { setError(''); setStep(isGpcStepDisabled ? 5 : 4) }}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              {isGpcStepDisabled ? t('profileEditor.nav.nextPrefModal') : t('profileEditor.nav.nextGpcBanner')} <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: GPC Banner Content ─────────────────────────────────── */}
      {step === 4 && (
        <div class="space-y-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <ContentLocaleToolbar section="gpcBanner" />

            <p class="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded px-3 py-1.5 mb-4">
              {t('profileEditor.content.loadDefaultsNotice')}
            </p>

            {currentContent && uiTemplate ? (
              <div class="space-y-3">
                <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('profileEditor.content.gpcBanner')}</h4>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">{t('profileEditor.content.heading')}</label>
                  <input
                    class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={currentContent.gpcBanner.heading}
                    onInput={e => setLocaleField('gpcBanner', 'heading', (e.target as HTMLInputElement).value)}
                    placeholder={defaultContent?.gpcBanner.heading || t('profileEditor.content.gpcHeadingPlaceholder')}
                  />
                  <ReadabilityCallout heading={currentContent.gpcBanner.heading} />
                </div>
                <HtmlEditor
                  label={t('profileEditor.content.bodyText')}
                  value={currentContent.gpcBanner.htmlText}
                  onChange={v => setLocaleField('gpcBanner', 'htmlText', v)}
                  rows={3}
                />
                <ReadabilityCallout htmlText={currentContent.gpcBanner.htmlText} />
                {uiTemplate.gpcBanner.buttons.length > 0 && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1.5">{t('profileEditor.content.buttonLabels')}</label>
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
            ) : (
              <p class="text-xs text-gray-400 italic py-4 text-center">
                {uiTemplateId && !uiTemplate ? t('profileEditor.content.loadingTemplate') : t('profileEditor.content.noContent')}
              </p>
            )}
          </div>

          {previewDraft && <PreviewPane draft={previewDraft} expandable previewMode="gpc" />}

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <button type="button" onClick={() => { setError(''); setStep(3) }}
              class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} aria-hidden="true" /> {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() => { setError(''); setStep(5) }}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              {t('profileEditor.nav.nextPrefModal')} <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Preference Modal Content ──────────────────────────── */}
      {step === 5 && (
        <div class="space-y-5">
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <ContentLocaleToolbar section="preferenceModal" />

            <p class="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded px-3 py-1.5 mb-4">
              {t('profileEditor.content.loadDefaultsNotice')}
            </p>

            {currentContent && uiTemplate ? (
              <div class="space-y-3">
                <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('profileEditor.content.prefModal')}</h4>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">{t('profileEditor.content.heading')} <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input
                    class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    value={currentContent.preferenceModal.heading}
                    onInput={e => setModalField('heading', (e.target as HTMLInputElement).value)}
                    placeholder={defaultContent?.preferenceModal.heading || t('profileEditor.content.prefHeadingPlaceholder')}
                  />
                  <ReadabilityCallout heading={currentContent.preferenceModal.heading} />
                </div>
                {uiTemplate.preferenceModal.hasSubheading && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">{t('profileEditor.content.subheading')}</label>
                    <input
                      class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                      value={currentContent.preferenceModal.subheading}
                      onInput={e => setModalField('subheading', (e.target as HTMLInputElement).value)}
                      placeholder={defaultContent?.preferenceModal.subheading || t('profileEditor.content.prefSubheadingPlaceholder')}
                    />
                  </div>
                )}
                <HtmlEditor
                  label={t('profileEditor.content.introText')}
                  value={currentContent.preferenceModal.htmlText}
                  onChange={v => setModalField('htmlText', v)}
                  placeholder={t('profileEditor.content.prefIntroPlaceholder')}
                  rows={3}
                />
                {uiTemplate.preferenceModal.buttons.length > 0 && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1.5">{t('profileEditor.content.buttonLabels')}</label>
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
                        <span class="text-xs font-semibold text-gray-700">{cat.id || t('profileEditor.content.categoryFallback', { n: String(idx + 1) })}</span>
                        {catDef?.mandatory && <span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{t('common.mandatory')}</span>}
                        {catDef?.type === 'legitimate_interest' && <span class="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">LI</span>}
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-0.5">{t('profileEditor.content.categoryHeading')} <span class="text-red-500" aria-hidden="true">*</span></label>
                        <input
                          class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          value={cat.heading}
                          onInput={e => setCategoryContent(idx, 'heading', (e.target as HTMLInputElement).value)}
                          placeholder={defaultContent?.preferenceModal.categories.find(c => c.id === cat.id)?.heading || cat.id}
                        />
                      </div>
                      <HtmlEditor
                        label={t('profileEditor.content.categoryDesc')}
                        value={cat.htmlText}
                        onChange={v => setCategoryContent(idx, 'htmlText', v)}
                        placeholder={t('profileEditor.content.categoryDescPlaceholder')}
                        rows={3}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p class="text-xs text-gray-400 italic py-4 text-center">
                {uiTemplateId && !uiTemplate ? t('profileEditor.content.loadingTemplate') : t('profileEditor.content.noContent')}
              </p>
            )}
          </div>

          {previewDraft && <PreviewPane draft={previewDraft} expandable previewMode="modal" />}

          {error && <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div class="flex justify-between">
            <button type="button" onClick={() => { setError(''); setStep(isGpcStepDisabled ? 3 : 4) }}
              class="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} aria-hidden="true" /> {t('common.back')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? t('common.saving') : isNew ? t('profileEditor.action.create') : t('profileEditor.action.save')}
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
