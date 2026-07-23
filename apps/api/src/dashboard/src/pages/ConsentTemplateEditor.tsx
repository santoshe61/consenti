import { useState, useEffect, useMemo } from 'preact/hooks'
import { Tag, ListChecks, Globe, Building2, ShieldCheck, Scale, CheckCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { CookieDefinitionRow } from '../components/CookieDefinitionRow'
import { CategoryDefinitionRow } from '../components/CategoryDefinitionRow'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT, type TranslationKey } from '../context/locale'
import {
  defaultCookies, defaultCategories, cookiesToMap, categoriesToMap, mapToCookieRows, mapToCategoryRows,
  type TemplateCookie, type TemplateCategoryDef,
} from '../utils/templates'
import { consentTemplatesApi } from '../api/templates'

function emptyCookieRow(): TemplateCookie {
  return { id: '', listenGpc: true }
}

function emptyCategoryRow(): TemplateCategoryDef {
  return { id: '', headingTag: 'h3', legalBasis: 'consent', cookies: [] }
}

// ── Field reference panel ──────────────────────────────────────────────────────

type FieldInfo = {
  field: string; label: string; Icon: LucideIcon; description: string
  usage: string | string[]; laws: Array<{ name: string; text: string }>; examples: string; link?: { url: string; label: string }
}

function buildFieldInfo(t: (key: TranslationKey) => string): FieldInfo[] {
  return [
    {
      field: 'ID',
      label: 'Cookie ID',
      Icon: Tag,
      description: 'A unique machine-readable identifier for this cookie or tracking purpose.',
      usage: 'Must match exactly what your frontend widget references (e.g. analytics_storage, ad_storage). Used in GTM / Google Consent Mode v2 consent states.',
      laws: [
        { name: 'GDPR', text: 'Each processing purpose must be clearly identified and disclosed in your privacy notice (Art. 13/14).' },
        { name: 'ePrivacy', text: 'Non-essential cookies require prior informed consent. ID is what links consent to a specific purpose.' },
      ],
      examples: 'necessary · analytics_storage · ad_storage · ad_user_data · ad_personalization · functional',
    },
    {
      field: 'Purpose',
      label: 'Cookie Purpose',
      Icon: ListChecks,
      description: 'A fixed classification that tells Consenti what this cookie is for. Because cookie IDs are free-form (e.g. "r_dash"), the purpose is what integrations, compliance checks and reports rely on. Selecting a purpose pre-fills GPC handling and CPRA category — you can still adjust each afterwards.',
      usage: [
        'Necessary: strictly required to deliver the requested service or ensure security (login session, CSRF, payment, the consent cookie itself). Always granted — the visitor cannot opt out.',
        'Functional: optional features that enhance the experience but are not essential (live chat widget, embedded maps, accessibility enhancements).',
        'Preferences: remember user choices — "Remember me" (theme, language, currency, timezone).',
        'Analytics: measure usage and performance (Google Analytics, Clarity, Hotjar, Mixpanel).',
        'Marketing: advertising, profiling, cross-site tracking, retargeting (Meta Pixel, Google Ads, TikTok Pixel).',
      ],
      laws: [
        { name: 'GDPR Art. 5(1)(b)', text: 'Purpose limitation: personal data must be collected for specified, explicit and legitimate purposes and not further processed incompatibly.' },
        { name: 'ePrivacy Dir. Art. 5(3)', text: 'Consent must be informed — the user must know what each cookie is for. A clear purpose per cookie is the basis of a valid consent request.' },
      ],
      examples: 'security_storage → Necessary · personalization_storage → Preferences · analytics_storage → Analytics · ad_storage → Marketing',
    },
    {
      field: 'Listen GPC',
      label: 'Honor GPC Signal',
      Icon: Globe,
      description: 'When enabled, this cookie is automatically denied if the visitor\'s browser sends a Global Privacy Control signal.',
      usage: 'GPC is signalled via the Sec-GPC: 1 HTTP header or navigator.globalPrivacyControl. When honored, non-essential cookies are pre-denied before showing any banner.',
      laws: [
        { name: 'CCPA / CPRA (California)', text: 'Legally required to honor GPC as a valid opt-out of sale/sharing. CA AG has enforced this.' },
        { name: 'Colorado CPA', text: 'Must honor universal opt-out signals including GPC from July 2024.' },
        { name: 'Connecticut CTDPA', text: 'Must honor GPC from 2024.' },
        { name: 'GDPR', text: 'No legal obligation, but highly recommended as a privacy-friendly practice.' },
      ],
      examples: 'Enable for all non-mandatory cookies. Disable only for strictly necessary (mandatory) cookies.',
    },
    {
      field: 'Pre Grant',
      label: 'Pre Grant',
      Icon: CheckCheck,
      description: 'Pre-grant means that the cookie is enabled by default and the user must actively opt-out to disable it.',
      usage: [
        'Pre grant "consent" cookies if you are creating a opt-in style profile',
        'Legitimate interest cookies are pre-granted by default, meaning users must actively opt-out to disable them.',
        'Mandatory cookies are pre-granted by default, and users cannot opt-out of them.',
      ],
      laws: [
        { name: "", text: "Check with guidlines for the by default opt-in for the cookies" }
      ],
      examples: 'server-side analytics',
    },
    {
      field: 'TCF Vendors',
      label: 'TCF Vendor IDs',
      Icon: Building2,
      description: 'Links this cookie purpose to one or more IAB-registered ad-tech vendor IDs from the Global Vendor List (GVL). Required to generate a valid TC String.',
      usage: [
        'Enable the "TCF Vendors" column to expose a vendor ID input per cookie row.',
        'Enter the numeric GVL ID(s) for every ad-tech vendor that processes data under this purpose (e.g. 755 for Google, 32 for AppNexus).',
        'Consenti encodes these IDs along with the accepted purposes into a Base64 TC String, which ad platforms read from the cookie to determine which vendors are authorised to fire.',
        'Without vendor IDs, the TC String will be invalid and compliant ad platforms will refuse to fire their tags.',
      ],
      laws: [
        { name: 'IAB TCF v2.2', text: 'A TC String must encode both purpose consents and vendor consents. Each vendor must be explicitly listed by its GVL ID — blanket consent is not permitted.' },
        { name: 'GDPR Art. 6(1)(a)', text: 'Consent must be specific to each vendor and each purpose. Bundling all vendors into one consent decision is invalid.' },
        { name: 'GDPR Art. 13/14', text: 'Your privacy notice must name every processor. TCF vendor IDs correspond to the processors you must disclose.' },
        { name: 'ePrivacy Dir.', text: 'TCF is the standard mechanism for obtaining valid ad-tech consent under ePrivacy across the EU/EEA.' },
      ],
      examples: '755 (Google Advertising Products) · 32 (AppNexus) · 91 (Criteo) · 52 (IAB Europe) — look up IDs on the TCF Vendors page',
      link: {
        url: "#/vendors",
        label: 'nav.vendors'
      }
    },
    {
      field: 'CPRA Category',
      label: 'CPRA Data Category',
      Icon: ShieldCheck,
      description: 'Maps this cookie to a California Privacy Rights Act (CPRA) data category. Required to correctly scope Do Not Sell / Share opt-out rights and Sensitive PI restrictions.',
      usage: [
        'Enable the "CPRA Category" column to assign a data category to each cookie row.',
        '"Personal Information" (PI): standard consumer data subject to the right to opt-out of sale/sharing.',
        '"Sensitive Personal Information" (SPI): a restricted subset (precise geolocation, race, health, biometrics, etc.) that triggers additional opt-out and use-limitation rights. Consumers can direct you to limit use to what is necessary for providing the service.',
        '"Non-PI": data that does not meet CCPA\'s definition of personal information — no opt-out required.',
      ],
      laws: [
        { name: 'CPRA / CCPA § 1798.100', text: 'Consumers have the right to know what personal information is collected and to opt-out of its sale or sharing.' },
        { name: 'CPRA § 1798.121', text: 'Consumers have the right to limit the use and disclosure of sensitive personal information. Businesses must provide a clear "Limit Use of My SPI" link.' },
        { name: 'CPRA § 1798.140(ae)', text: 'Sensitive PI includes precise geolocation, racial/ethnic origin, religious beliefs, genetic data, biometric data, health data, sexual orientation, and contents of communications.' },
        { name: 'CPRA / GPC', text: 'A GPC signal constitutes a valid opt-out of sale and sharing for PI. Pairing CPRA Category with the "Honor GPC" flag ensures the correct cookies are denied automatically.' },
      ],
      examples: 'analytics_storage → PersonalInfo · ad_storage → PersonalInfo · precise_location → SensitivePI · session → Non-PI',
    },
    {
      field: 'Legal Basis',
      label: 'Legal Basis',
      Icon: Scale,
      description: 'The legal ground under which you process data associated with this cookie.',
      usage: [
        'Consent (default): The user actively opts in. Required for advertising, most analytics, and non-essential cookies. Show the banner before any processing.',
        'Legitimate Interest: You may process on a compelling business need, but must pass a 3-part balancing test, document it, and provide an easy objection mechanism. The balancing-test description is entered per-profile, per-locale in the Preference Modal content step.',
        t('cookieTemplates.editor.legalBasis.mandatoryUsage'),
      ],
      laws: [
        { name: 'GDPR Art. 6(1)(a)', text: 'Consent as a lawful basis. Must be freely given, specific, informed, and unambiguous.' },
        { name: 'GDPR Art. 6(1)(f)', text: 'Legitimate interests. Cannot override fundamental rights/freedoms of data subjects.' },
        { name: 'ePrivacy Dir. Art. 5(3)', text: 'For cookies: consent is the default rule. LI is generally NOT available for tracking cookies under ePrivacy.' },
        { name: t('cookieTemplates.editor.legalBasis.mandatoryLawName'), text: t('cookieTemplates.editor.legalBasis.mandatoryLawText') },
      ],
      examples: t('cookieTemplates.editor.legalBasis.examples'),
    },
  ]
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ConsentTemplateEditor({ id, current }: { id?: string; current: string }) {
  const t = useT()
  const FIELD_INFO = buildFieldInfo(t)
  const isNew = !id || id === 'new'
  usePageTitle(isNew ? t('consentTemplates.editor.title.new') : t('consentTemplates.editor.title.edit'))
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [cookies, setCookies] = useState<TemplateCookie[]>([])
  const [categories, setCategories] = useState<TemplateCategoryDef[]>([])
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [activeInfo, setActiveInfo] = useState(0)
  const [tcfEnabled, setTcfEnabled] = useState(false)
  const [showCpra, setShowCpra] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const { requestConfirm, dialog } = useConfirmDialog()

  useEffect(() => {
    if (!isNew && id) {
      consentTemplatesApi.get(id)
        .then(tmpl => {
          setName(tmpl.name)
          setCookies(mapToCookieRows(tmpl.cookies))
          setCategories(mapToCategoryRows(tmpl.categories))
        })
        .catch(() => setError(t('consentTemplates.editor.error.notFound')))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const idCounts = cookies.reduce<Record<string, number>>((acc, c) => {
    const k = c.id.trim()
    if (k) acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const duplicateIds = new Set(Object.entries(idCounts).filter(([, n]) => n > 1).map(([k]) => k))

  // Live cookie options for each category's multi-select — reflects parameters as they're
  // added/removed/renamed above, since both sections now live in the same component.
  const cookieOptions = useMemo(() => cookies.filter(c => c.id.trim()).map(c => ({ id: c.id.trim() })), [cookies])

  // cookieId -> owning category, used to drive each CookieDefinitionRow's Pre Grant checkbox.
  const categoryByCookieId = useMemo(() => {
    const map = new Map<string, TemplateCategoryDef>()
    for (const cat of categories) {
      for (const cookieId of cat.cookies) map.set(cookieId, cat)
    }
    return map
  }, [categories])

  const handleSave = async () => {
    let ok = true
    if (!name.trim()) { setNameError(t('consentTemplates.editor.nameRequired')); ok = false }
    if (cookies.some(c => !c.id.trim())) { setError(t('consentTemplates.editor.error.allIds')); ok = false }
    if (cookies.some(c => !c.purpose)) { setError(t('consentTemplates.editor.error.purpose')); ok = false }
    if (duplicateIds.size > 0) { setError(t('consentTemplates.editor.error.uniqueIds')); ok = false }
    if (!ok) return

    const catIds = categories.map(c => c.id.trim())
    if (categories.length === 0) { setError(t('consentTemplates.editor.error.noCategories')); return }
    if (categories.some(c => !c.id.trim())) { setError(t('consentTemplates.editor.error.catIds')); return }
    if (new Set(catIds).size !== catIds.length) { setError(t('consentTemplates.editor.error.uniqueCatIds')); return }
    if (categories.some(c => !c.cookies.length)) { setError(t('consentTemplates.editor.error.catCookies')); return }

    // Every parameter must belong to exactly one category — this is what makes legal-basis
    // derivation well-defined at runtime.
    const membership = new Map<string, number>()
    for (const c of cookies) membership.set(c.id.trim(), 0)
    for (const cat of categories) {
      for (const cookieId of cat.cookies) membership.set(cookieId, (membership.get(cookieId) ?? 0) + 1)
    }
    for (const [cookieId, count] of membership) {
      if (count === 0) { setError(t('consentTemplates.editor.error.uncategorized', { id: cookieId })); return }
      if (count > 1) { setError(t('consentTemplates.editor.error.multiCategory', { id: cookieId })); return }
    }

    // Purpose ↔ legal basis alignment: a non-necessary parameter in a Mandatory category grants
    // a tracking parameter with no consent gate (hard error). The reverse (necessary parameter
    // outside Mandatory) only risks breaking functionality — warn, don't block.
    const newWarnings: string[] = []
    for (const cookie of cookies) {
      const cat = categoryByCookieId.get(cookie.id.trim())
      if (!cat) continue
      if (cat.legalBasis === 'mandatory' && cookie.purpose !== 'necessary') {
        setError(t('consentTemplates.editor.error.purposeLegalBasisMismatch', { id: cookie.id }))
        return
      }
      if (cat.legalBasis !== 'mandatory' && cookie.purpose === 'necessary') {
        newWarnings.push(t('consentTemplates.editor.warning.necessaryNotMandatory', { id: cookie.id }))
      }
    }
    setWarnings(newWarnings)

    if (!isNew && id) {
      const affected = await consentTemplatesApi.profileUsage(id).catch(() => [])
      if (affected.length > 0) {
        const names = affected.map(p => `"${p.name}"`).join(', ')
        const confirmed = await requestConfirm({
          title: t(affected.length === 1 ? 'consentTemplates.editor.confirmUpdate.titleSingular' : 'consentTemplates.editor.confirmUpdate.title', { n: affected.length }),
          message: t('consentTemplates.editor.confirmUpdate.message', { names }),
        })
        if (!confirmed) return
      }
    }

    setError('')
    setNameError('')
    setSaving(true)
    try {
      const cookiesMap = cookiesToMap(cookies)
      const categoriesMap = categoriesToMap(categories)
      if (isNew) await consentTemplatesApi.create({ name, cookies: cookiesMap, categories: categoriesMap })
      else await consentTemplatesApi.update(id!, { name, cookies: cookiesMap, categories: categoriesMap })
      window.location.hash = '#/banners/consent-templates'
    } catch {
      setError(t('consentTemplates.editor.error.failed'))
    } finally {
      setSaving(false)
    }
  }

  const info = FIELD_INFO[activeInfo]!

  return (
    <>
      {dialog}
      {loading && <p class="text-sm text-gray-400" role="status" aria-live="polite">{t('common.loading')}</p>}
      {!loading && <div class="space-y-5">
        <div class="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 items-start">
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <div class="py-5">
              <label for="template-name" class="block text-sm font-medium text-gray-700 mb-1">
                {t('consentTemplates.editor.name')} <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="template-name"
                class={`w-full border rounded px-3 py-2 text-sm ${nameError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                value={name}
                onInput={e => { setName((e.target as HTMLInputElement).value); setNameError('') }}
                placeholder={t('consentTemplates.editor.namePlaceholder')}
                required
                aria-required="true"
              />
              {nameError && <p role="alert" class="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>

            {isNew && cookies.length === 0 && categories.length === 0 && (
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
                <p class="text-sm text-amber-800">
                  {t('consentTemplates.editor.loadDefaultsPrompt')}
                </p>
                <button
                  type="button"
                  onClick={() => { setCookies(defaultCookies()); setCategories(defaultCategories()) }}
                  class="shrink-0 bg-amber-700 text-white text-xs px-3 py-1.5 rounded hover:bg-amber-800 transition-colors"
                >
                  {t('consentTemplates.editor.loadDefaultsBtn')}
                </button>
              </div>
            )}

            <div class="flex items-center justify-between my-4">
              <div>
                <h3 class="text-sm font-semibold text-gray-700">{t('consentTemplates.editor.definitions')}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  IDs must match what the frontend widget uses (e.g. <code class="font-mono bg-gray-100 px-1 rounded">analytics_storage</code>).
                </p>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" class="accent-blue-600" checked={tcfEnabled} onChange={e => setTcfEnabled((e.target as HTMLInputElement).checked)} />
                  {t('consentTemplates.editor.showTcf')}
                </label>
                <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" class="accent-blue-600" checked={showCpra} onChange={e => setShowCpra((e.target as HTMLInputElement).checked)} />
                  {t('consentTemplates.editor.showCpra')}
                </label>
                <button
                  type="button"
                  onClick={() => setCookies(prev => [...prev, emptyCookieRow()])}
                  class="text-sm text-blue-600 hover:underline shrink-0"
                >{t('consentTemplates.editor.addCookie')}</button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-left text-gray-500 border-b border-gray-200">
                    <th scope="col" class="pb-2 pr-3 pl-1 font-medium">
                      <button type="button" class="hover:text-blue-600 transition-colors" onClick={() => setActiveInfo(0)}>
                        {t('consentTemplates.col.idShort')} <span class="text-red-500" aria-hidden="true">*</span>
                      </button>
                    </th>
                    <th scope="col" class="pb-2 pr-3 font-medium">
                      <button type="button" class="hover:text-blue-600 transition-colors" onClick={() => setActiveInfo(1)}>
                        {t('consentTemplates.col.purposeShort')} <span class="text-red-500" aria-hidden="true">*</span>
                      </button>
                    </th>
                    <th scope="col" class="pb-2 pr-3 font-medium text-center">
                      <button type="button" class="hover:text-blue-600 transition-colors" onClick={() => setActiveInfo(2)}>
                        {t('consentTemplates.col.gpcShort')}
                      </button>
                    </th>
                    <th scope="col" class="pb-2 pr-3 font-medium text-center">
                      <button type="button" class="hover:text-blue-600 transition-colors" onClick={() => setActiveInfo(3)}>
                        {t('consentTemplates.col.preGrantShort')}
                      </button>
                    </th>
                    {tcfEnabled && <th scope="col" class="pb-2 pr-3 font-medium text-blue-700">
                      <button type="button" class="hover:text-blue-600 transition-colors" onClick={() => setActiveInfo(4)}>
                        {t('consentTemplates.col.tcfVendorShort')}
                      </button>
                    </th>}
                    {showCpra && <th scope="col" class="pb-2 pr-3 font-medium text-purple-700">
                      <button type="button" class="hover:text-blue-600 transition-colors" onClick={() => setActiveInfo(5)}>
                        {t('consentTemplates.col.cpraCategoryShort')}
                      </button>
                    </th>}
                    <th scope="col" class="pb-2 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {cookies.map((c, idx) => (
                    <CookieDefinitionRow
                      key={idx}
                      cookie={c}
                      idx={idx}
                      onChange={updated => setCookies(prev => prev.map((x, i) => i === idx ? updated : x))}
                      onRemove={() => setCookies(prev => prev.filter((_, i) => i !== idx))}
                      duplicateIds={duplicateIds}
                      tcfEnabled={tcfEnabled}
                      showCpra={showCpra}
                      categoryLegalBasis={categoryByCookieId.get(c.id.trim())?.legalBasis}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {cookies.length === 0 && (
              <p class="text-sm text-gray-400 text-center py-4">
                {t('consentTemplates.editor.empty')}
                <br /> <br />
                <button
                  type="button"
                  onClick={() => setCookies(prev => [...prev, emptyCookieRow()])}
                  class="text-sm text-blue-600 hover:underline shrink-0"
                >{t('consentTemplates.editor.addCookie')}</button>
              </p>
            )}

            <div class="mt-8">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-700">{t('consentTemplates.editor.categories')}</h3>
                <button
                  type="button"
                  onClick={() => setCategories(prev => [...prev, emptyCategoryRow()])}
                  class="text-sm text-blue-600 hover:underline shrink-0"
                >{t('consentTemplates.editor.addCategory')}</button>
              </div>
              <p class="text-xs text-gray-400 mb-3">
                Each category groups parameters and owns their legal basis. A parameter must belong to exactly one category.
              </p>
              <div class="space-y-3">
                {categories.map((cat, idx) => (
                  <CategoryDefinitionRow
                    key={idx}
                    cat={cat}
                    onChange={patch => setCategories(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))}
                    onRemove={() => setCategories(prev => prev.filter((_, i) => i !== idx))}
                    cookieOptions={cookieOptions}
                  />
                ))}
              </div>
              {categories.length === 0 && (
                <p class="text-sm text-gray-400 text-center py-4">{t('consentTemplates.editor.noCategories')}</p>
              )}
            </div>

            <div className="mt-7">
              {warnings.length > 0 && (
                <div class="mb-3 space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">{w}</p>
                  ))}
                </div>
              )}
              {error && (
                <p role="alert" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 my-4">{error}</p>
              )}
              <div class="flex justify-between">
                <a href="#/banners/consent-templates" class="px-5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-100 transition-colors">
                  {t('common.cancel')}
                </a>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? t('common.saving') : isNew ? t('consentTemplates.editor.action.create') : t('consentTemplates.editor.action.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div class="bg-white border border-gray-200 rounded-lg p-5 xl:sticky xl:top-4">
            <p class="text-xs text-gray-400 mb-3 uppercase tracking-wide font-semibold">{t('consentTemplates.editor.infoHint')}</p>

            <div class="flex flex-wrap gap-1.5 mb-4">
              {FIELD_INFO.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveInfo(i)}
                  class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeInfo === i
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:border-blue-400'
                    }`}
                >
                  {f.field}
                </button>
              ))}
            </div>

            {info && (
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <info.Icon size={18} className="text-gray-600 shrink-0" />
                  <h4 class="font-semibold text-gray-800 text-sm">{info.label}</h4>
                  <a href={info.link?.url} target={info.link?.url?.startsWith('http') ? '_blank' : undefined} class="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0 ml-auto">
                    {t(info.link?.label as TranslationKey)}
                  </a>
                </div>
                <p class="text-xs text-gray-600 leading-relaxed">{info.description}</p>
                <div class="bg-blue-50 border border-blue-100 rounded p-3">
                  <p class="text-xs font-semibold text-blue-700 mb-1">{t('consentTemplates.editor.infoUsage')}</p>
                  {
                    Array.isArray(info.usage) ?
                      <ul class="list-decimal list-inside">
                        {
                          info.usage.map((u, i) => (
                            <li key={i} class="text-xs text-blue-800 leading-relaxed whitespace-pre-line">{u}</li>
                          ))
                        }
                      </ul>
                      :
                      <p class="text-xs text-blue-800 leading-relaxed whitespace-pre-line">{info.usage}</p>
                  }
                </div>
                <div>
                  <p class="text-xs font-semibold text-gray-600 mb-2">{t('consentTemplates.editor.infoLaws')}</p>
                  <div class="space-y-2">
                    {info.laws.map((law, i) => (
                      <div key={i} class="bg-amber-50 border border-amber-100 rounded p-2.5">
                        <span class="text-xs font-bold text-amber-700">{law.name} </span>
                        <span class="text-xs text-amber-800">{law.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded p-2.5">
                  <p class="text-xs font-semibold text-gray-600 mb-1">{t('consentTemplates.editor.infoExamples')}</p>
                  <p class="text-xs text-gray-500 font-mono leading-relaxed">{info.examples}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>}
    </>
  )
}
