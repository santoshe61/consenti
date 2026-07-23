import { useEffect, useRef, useState } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { Check, ChevronLeft, ChevronRight, Download, Upload, Wand2 } from 'lucide-react'
import { usePageTitle } from '../context/pageTitle'
import { LocaleTabBar } from '../components/LocaleTabBar'
import { HtmlEditor } from '../components/HtmlEditor'
import { DomainsInput } from '../components/DomainsInput'
import { PreviewPane } from '../components/PreviewPane'
import { Select } from '../components/Select'
import { CountrySelecter } from '../components/CountrySelecter'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useT } from '../context/locale'
import type { TranslationKey } from '../context/locale'
import { profilesApi } from '../api/profiles'
import { consentTemplatesApi, uiTemplatesApi } from '../api/templates'
import {
  exportAllLocalesJson,
  exportAllLocalesCsv,
  importAllLocalesFromJson,
  importAllLocalesFromCsv,
  downloadFile,
} from '../utils/localeExport'
import { checkReadability } from '../../../utils/readability'
import { buildDefaultContent } from '../utils/profileContentDefaults'
import { htmlToJson, serializeContent } from '../utils/contentjson'
import {
  mapToButtonRows,
  type LocaleContent,
  type CategoryContent,
  type TemplateBannerUI,
  type TemplateModalUI,
} from '../utils/templates'
import type { ServerConsentTemplate, ServerUITemplate, CookieMap, CategoryMap, MainBanner, GpcBanner, PreferenceModal, LocaleContentInput } from '@consenti/types'
import type { DashboardProfile } from '@consenti/types'
import { COMPLIANCE_GROUPS, GPC_OPTIONS, buildCookieCategoryIndex, getCookieLegalBasis, renderContentText, hasVisibleText } from '@consenti/utils'

/** Stores an HTML string as the compact rich-text `ContentDoc` JSON — the inverse of
 * `renderContentText()`, used to prefill the editor from already-resolved content. */
function storeHtml(html: string): string {
  return serializeContent(htmlToJson(html))
}

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

/** Builds a `{ buttonId: '' }` skeleton for every button the template defines — the starting
 * point for a not-yet-authored locale's `buttonLabels`. */
function blankButtonLabels(buttons: ServerUITemplate['mainBanner']['buttons']): Record<string, string> {
  return Object.fromEntries(Object.keys(buttons).map(id => [id, '']))
}

/** Resolves a UI template's button map + a locale's `buttonLabels` into the resolved-profile
 * `ButtonMap` shape the widget/preview expects — keyed by the same button id throughout. */
function resolvedButtonsMap(
  buttons: ServerUITemplate['mainBanner']['buttons'],
  labels: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [id, btn] of Object.entries(buttons)) {
    result[id] = {
      text: labels[id] ?? '',
      style: btn.type,
      action: btn.action,
      ...(btn.cookies != null ? { cookies: btn.cookies } : {}),
      ...(btn.url != null ? { url: btn.url } : {}),
    }
  }
  return result
}

function defaultLocaleFromTemplate(ut: ServerUITemplate, ct?: ServerConsentTemplate | null): LocaleContent {
  return {
    mainBanner: { heading: '', htmlText: '', buttonLabels: blankButtonLabels(ut.mainBanner.buttons) },
    gpcBanner: { heading: '', htmlText: '', buttonLabels: blankButtonLabels(ut.gpcBanner.buttons) },
    preferenceModal: {
      heading: '', subheading: '', htmlText: '',
      buttonLabels: blankButtonLabels(ut.preferenceModal.buttons),
      categories: Object.keys(ct?.categories ?? {}).map(id => ({ id, heading: '', htmlText: '' })),
    },
  }
}

function syncLocaleToTemplate(content: LocaleContent, ut: ServerUITemplate, ct?: ServerConsentTemplate | null): LocaleContent {
  const categoryIds = Object.keys(ct?.categories ?? {})
  const syncLabels = (buttons: ServerUITemplate['mainBanner']['buttons'], labels: Record<string, string>) =>
    Object.fromEntries(Object.keys(buttons).map(id => [id, labels[id] ?? '']))
  return {
    ...content,
    mainBanner: {
      ...content.mainBanner,
      buttonLabels: syncLabels(ut.mainBanner.buttons, content.mainBanner.buttonLabels),
    },
    gpcBanner: {
      ...content.gpcBanner,
      buttonLabels: syncLabels(ut.gpcBanner.buttons, content.gpcBanner.buttonLabels),
    },
    preferenceModal: {
      ...content.preferenceModal,
      buttonLabels: syncLabels(ut.preferenceModal.buttons, content.preferenceModal.buttonLabels),
      categories: categoryIds.map(id => ({
        id,
        heading: content.preferenceModal.categories.find(c => c.id === id)?.heading ?? '',
        htmlText: content.preferenceModal.categories.find(c => c.id === id)?.htmlText ?? '',
      })),
    },
  }
}

/**
 * Auto-defaults `cookiesOverride` preGrant deltas for a compliance group, mirroring the rule
 * already enforced (locked) at template-authoring time: preGrant only ever applies to
 * legalBasis === 'consent' cookies. `opt-out`/`opt-out-strict` force it off on those; every other
 * group forces it on for cookies the template didn't already pre-grant. Only returns a delta when
 * the effective value actually differs from the template's authored one, keeping overrides
 * minimal and diffable.
 */
function defaultCookiesOverride(groupId: string, cookies: CookieMap, categories: CategoryMap): Record<string, { preGrant: boolean }> {
  const categoryIndex = buildCookieCategoryIndex(categories)
  const forceOff = groupId === 'opt-out' || groupId === 'opt-out-strict'
  const result: Record<string, { preGrant: boolean }> = {}
  for (const [cookieId, cookie] of Object.entries(cookies)) {
    if (getCookieLegalBasis(cookieId, categoryIndex) !== 'consent') continue
    const effective = !forceOff
    if (effective !== (cookie.preGrant ?? false)) result[cookieId] = { preGrant: effective }
  }
  return result
}

/**
 * Resolves one locale's authored `LocaleContent` against its UI/Consent Templates into the
 * fully-resolved `{mainBanner, gpcBanner?, preferenceModal}` shape both the live preview and the
 * real save payload need — the server no longer does this resolution itself (see
 * `packages/types/src/api.ts` `StoredProfileJson`/`LocaleContentInput`), it only stores/serves
 * whatever the dashboard already resolved.
 */
function resolveLocaleContent(ut: ServerUITemplate, ct: ServerConsentTemplate, content: LocaleContent): LocaleContentInput {
  return {
    mainBanner: {
      position: ut.mainBanner.position,
      overlayOpacity: ut.mainBanner.overlayOpacity,
      showClose: ut.mainBanner.showClose,
      showLocaleSwitcher: ut.mainBanner.showLocaleSwitcher,
      headingTag: ut.mainBanner.headingTag,
      heading: content.mainBanner.heading,
      // Stored as the compact rich-text ContentDoc JSON (see contentjson.ts) — the widget's
      // innerHTML expects real HTML, same conversion the server applies before serving profiles.
      htmlText: renderContentText(content.mainBanner.htmlText),
      buttons: resolvedButtonsMap(ut.mainBanner.buttons, content.mainBanner.buttonLabels),
    },
    gpcBanner: {
      position: ut.gpcBanner.position,
      overlayOpacity: ut.gpcBanner.overlayOpacity,
      showClose: ut.gpcBanner.showClose,
      showLocaleSwitcher: ut.gpcBanner.showLocaleSwitcher,
      headingTag: ut.gpcBanner.headingTag,
      heading: content.gpcBanner.heading,
      htmlText: renderContentText(content.gpcBanner.htmlText),
      buttons: resolvedButtonsMap(ut.gpcBanner.buttons, content.gpcBanner.buttonLabels),
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
      ...(content.preferenceModal.htmlText ? { htmlText: renderContentText(content.preferenceModal.htmlText) } : {}),
      ...(content.preferenceModal.receiptLabel ? { receiptLabel: content.preferenceModal.receiptLabel } : {}),
      ...(content.preferenceModal.receiptDescription ? { receiptDescription: content.preferenceModal.receiptDescription } : {}),
      buttons: resolvedButtonsMap(ut.preferenceModal.buttons, content.preferenceModal.buttonLabels),
      categories: Object.fromEntries(Object.entries(ct.categories).map(([id, cat]) => {
        const c = content.preferenceModal.categories.find(x => x.id === id)
        return [id, {
          heading: c?.heading || cat.heading || id,
          headingTag: cat.headingTag,
          htmlText: renderContentText(c?.htmlText),
          legalBasis: cat.legalBasis,
          ...(cat.legalBasis === 'legitimate_interest' && c?.legitimateInterestDescription
            ? { legitimateInterestDescription: c.legitimateInterestDescription }
            : {}),
          cookies: cat.cookies,
        }]
      })),
    },
  } as unknown as LocaleContentInput
}

/**
 * Inverse of {@link resolveLocaleContent} — extracts the dashboard's editable `LocaleContent`
 * (heading/htmlText/keyed buttonLabels/category text) back out of an already-resolved
 * `{mainBanner, gpcBanner?, preferenceModal}`, to prefill the editor when opening an existing
 * profile. `ct` may be `null` if the linked Consent Template failed to load — categories then
 * fall back to whatever ids the resolved content itself lists.
 */
function deresolveLocaleContent(
  resolved: { mainBanner: MainBanner; gpcBanner?: GpcBanner; preferenceModal: PreferenceModal },
  ct: ServerConsentTemplate | null,
): LocaleContent {
  const labelsFrom = (buttons: MainBanner['buttons'] | undefined): Record<string, string> =>
    Object.fromEntries(Object.entries(buttons ?? {}).map(([id, b]) => [id, b.text ?? '']))
  const categoryIds = ct ? Object.keys(ct.categories) : Object.keys(resolved.preferenceModal.categories ?? {})

  return {
    mainBanner: {
      heading: resolved.mainBanner.heading ?? '',
      htmlText: storeHtml(resolved.mainBanner.htmlText ?? ''),
      buttonLabels: labelsFrom(resolved.mainBanner.buttons),
    },
    gpcBanner: {
      heading: resolved.gpcBanner?.heading ?? '',
      htmlText: storeHtml(resolved.gpcBanner?.htmlText ?? ''),
      buttonLabels: labelsFrom(resolved.gpcBanner?.buttons),
    },
    preferenceModal: {
      heading: resolved.preferenceModal.heading ?? '',
      subheading: resolved.preferenceModal.subheading ?? '',
      htmlText: resolved.preferenceModal.htmlText ? storeHtml(resolved.preferenceModal.htmlText) : '',
      buttonLabels: labelsFrom(resolved.preferenceModal.buttons),
      categories: categoryIds.map(id => {
        const c = resolved.preferenceModal.categories?.[id]
        return {
          id,
          heading: c?.heading ?? '',
          htmlText: c?.htmlText ? storeHtml(c.htmlText) : '',
          ...(c?.legitimateInterestDescription !== undefined ? { legitimateInterestDescription: c.legitimateInterestDescription } : {}),
        }
      }),
      ...(resolved.preferenceModal.receiptLabel !== undefined ? { receiptLabel: resolved.preferenceModal.receiptLabel } : {}),
      ...(resolved.preferenceModal.receiptDescription !== undefined ? { receiptDescription: resolved.preferenceModal.receiptDescription } : {}),
    },
  }
}

/** Default locale always shows as the first tab — re-sorts automatically whenever `defaultLocale`
 * changes, since this is a pure derivation over the current locale set rather than stored order. */
function sortLocalesDefaultFirst(locales: string[], defaultLocale: string): string[] {
  if (!locales.includes(defaultLocale)) return locales
  return [defaultLocale, ...locales.filter(l => l !== defaultLocale)]
}

// ── Mandatory-content validation ────────────────────────────────────────────────
// Mirrors the backend's `validateProfileContent` (apps/api/src/services/
// profile-content-validator.service.ts) — heading is always optional (soft-nudged elsewhere),
// only body text, button labels, and category headings are mandatory. Operates on the dashboard's
// authored `LocaleContent` shape directly (not the resolved wire shape), same `hasVisibleText`
// util shared via @consenti/utils so client and server agree on what "blank" means.

interface MissingContentField {
  locale: string
  section: 'mainBanner' | 'gpcBanner' | 'preferenceModal'
  field: string
}

function findMissingMandatoryFields(
  localeContents: Record<string, LocaleContent>,
  sections: Array<'mainBanner' | 'gpcBanner' | 'preferenceModal'>,
): MissingContentField[] {
  const missing: MissingContentField[] = []
  for (const [locale, content] of Object.entries(localeContents)) {
    if (sections.includes('mainBanner')) {
      if (!hasVisibleText(content.mainBanner.htmlText)) missing.push({ locale, section: 'mainBanner', field: 'htmlText' })
      for (const [buttonId, label] of Object.entries(content.mainBanner.buttonLabels)) {
        if (!label.trim()) missing.push({ locale, section: 'mainBanner', field: `buttons.${buttonId}` })
      }
    }
    if (sections.includes('gpcBanner')) {
      if (!hasVisibleText(content.gpcBanner.htmlText)) missing.push({ locale, section: 'gpcBanner', field: 'htmlText' })
      for (const [buttonId, label] of Object.entries(content.gpcBanner.buttonLabels)) {
        if (!label.trim()) missing.push({ locale, section: 'gpcBanner', field: `buttons.${buttonId}` })
      }
    }
    if (sections.includes('preferenceModal')) {
      if (!content.preferenceModal.heading?.trim()) missing.push({ locale, section: 'preferenceModal', field: 'heading' })
      for (const [buttonId, label] of Object.entries(content.preferenceModal.buttonLabels)) {
        if (!label.trim()) missing.push({ locale, section: 'preferenceModal', field: `buttons.${buttonId}` })
      }
      for (const cat of content.preferenceModal.categories) {
        if (!cat.heading?.trim()) missing.push({ locale, section: 'preferenceModal', field: `categories.${cat.id}.heading` })
      }
    }
  }
  return missing
}

/** Optional fields the wizard nudges (not blocks) on if left blank — banner heading, modal intro
 * text. Same idea as {@link findMissingMandatoryFields} but advisory only. */
function findBlankOptionalFields(
  content: LocaleContent,
  section: 'mainBanner' | 'gpcBanner' | 'preferenceModal',
): string[] {
  if (section === 'preferenceModal') return hasVisibleText(content.preferenceModal.htmlText) ? [] : ['htmlText']
  return content[section].heading?.trim() ? [] : ['heading']
}

function buildPreviewDraft(
  ct: ServerConsentTemplate,
  ut: ServerUITemplate,
  defaultLocale: string,
  localeContents: Record<string, LocaleContent>,
  expiryDays?: number,
  previewLocale?: string,
): object {
  // Preview whatever locale tab is active — falling back to the profile's default locale (and
  // then the template defaults) only when the active tab has no content yet — instead of always
  // rendering `defaultLocale`, which made switching locale tabs a no-op in the live preview.
  const locale = previewLocale ?? defaultLocale
  const content = localeContents[locale] ?? localeContents[defaultLocale] ?? defaultLocaleFromTemplate(ut, ct)
  const resolved = resolveLocaleContent(ut, ct, content)
  return {
    cookies: ct.cookies,
    ...(expiryDays !== undefined ? { expiryDays } : {}),
    defaultLocale: locale,
    translations: {
      [locale]: resolved,
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

// ── Read-only category preview table ────────────────────────────────────────────

function CategoryPreviewTable({ categories, labels }: { categories: CategoryMap; labels: Record<string, string> }) {
  const entries = Object.entries(categories)
  if (!entries.length) return null
  return (
    <div class="overflow-x-auto mb-4">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th scope="col" class="pb-2 pr-3 pl-1 font-medium">{labels['id']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium">{labels['legalBasis']}</th>
            <th scope="col" class="pb-2 font-medium">{labels['cookies']}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([id, cat]) => (
            <tr key={id} class="border-b border-gray-100 last:border-0 align-top">
              <td class="py-1.5 pr-3 pl-1 font-mono text-gray-800">{id}</td>
              <td class="py-1.5 pr-3 text-gray-600">{cat.legalBasis}</td>
              <td class="py-1.5 text-gray-600 flex gap-2">
                <span class="text-gray-400">({cat.cookies.length})</span> {cat.cookies.map(c => <span key={c} class="bg-gray-100 px-2 py-1 rounded-full text-[10px] text-italic font-mono">{c}</span>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Read-only cookie preview table ─────────────────────────────────────────────

function CookiePreviewTable({
  cookies, categories, labels, cookiesOverride, onTogglePreGrant,
}: {
  cookies: CookieMap
  categories: CategoryMap
  labels: Record<string, string>
  cookiesOverride?: Record<string, { preGrant?: boolean }>
  onTogglePreGrant?: (id: string, next: boolean) => void
}) {
  const entries = Object.entries(cookies)
  if (!entries.length) {
    return <p class="text-xs text-gray-400 italic">{labels['noNoCookies']}</p>
  }
  const categoryIndex = buildCookieCategoryIndex(categories)
  return (
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="text-left text-gray-500 border-b border-gray-200">
            <th scope="col" class="pb-2 pr-3 pl-1 font-medium">{labels['id']}</th>
            <th scope="col" class="pb-2 pr-3 pl-1 font-medium">{labels['purpose']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium text-center">{labels['gpc']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium text-center">{labels['preGrant']}</th>
            <th scope="col" class="pb-2 pr-3 font-medium">{labels['tcfVendor']}</th>
            <th scope="col" class="pb-2 font-medium">{labels['cpraCategory']}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([id, c]) => {
            const preGrantLocked = getCookieLegalBasis(id, categoryIndex) !== 'consent'
            const effectivePreGrant = preGrantLocked ? true : (cookiesOverride?.[id]?.preGrant ?? c.preGrant ?? false)
            return (
              <tr key={id} class="border-b border-gray-100 last:border-0">
                <td class="py-1.5 pr-3 pl-1 font-mono text-gray-800">{id}</td>
                <td class="py-1.5 pr-3 pl-1 font-mono text-gray-800">{c.purpose}</td>
                <td class="py-1.5 pr-3 text-center text-gray-600">{c.listenGpc ? <span class="text-green-600">✓</span> : '–'}</td>
                <td class="py-1.5 pr-3 text-center text-gray-600">
                  {onTogglePreGrant ? (
                    <input
                      type="checkbox"
                      class="w-3.5 h-3.5 accent-blue-600"
                      checked={effectivePreGrant}
                      disabled={preGrantLocked}
                      onChange={e => onTogglePreGrant(id, (e.target as HTMLInputElement).checked)}
                      title={preGrantLocked ? labels['preGrantLocked'] : ''}
                      aria-label={`${labels['preGrant']} ${id}`}
                    />
                  ) : (
                    effectivePreGrant ? <span class="text-green-600">✓</span> : '–'
                  )}
                </td>
                <td class="py-1.5 pr-3 text-gray-600">{c.tcfVendorId ?? '–'}</td>
                <td class="py-1.5 text-gray-600">{c.cpraCategory ?? '–'}</td>
              </tr>
            )
          })}
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
  const [customComplianceGroup, setCustomComplianceGroup] = useState('')
  const [gpcMode, setGpcMode] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [hidePoweredBy, setHidePoweredBy] = useState(true)
  const [allowReceipt, setAllowReceipt] = useState(false)
  const [enhanceAccessibility, setEnhanceAccessibility] = useState(false)
  const [showFooterMetadata, setShowFooterMetadata] = useState(false)
  const [dpdpaFiduciary, setDpdpaFiduciary] = useState('')
  const [dpdpaGrievanceEmail, setDpdpaGrievanceEmail] = useState('')
  const [dpdpaPurpose, setDpdpaPurpose] = useState('')
  const [expiryDays, setExpiryDays] = useState(365)
  const [expiryDaysError, setExpiryDaysError] = useState('')

  // ── Step 2: Templates ───────────────────────────────────────────────
  const [consentTemplates, setConsentTemplates] = useState<ServerConsentTemplate[]>([])
  const [uiTemplates, setUITemplates] = useState<ServerUITemplate[]>([])
  const [consentTemplateId, setConsentTemplateId] = useState('')
  const [consentTemplate, setConsentTemplate] = useState<ServerConsentTemplate | null>(null)
  const [uiTemplateId, setUITemplateId] = useState('')
  const [uiTemplate, setUITemplate] = useState<ServerUITemplate | null>(null)
  const [cookiesOverride, setCookiesOverride] = useState<Record<string, { preGrant?: boolean }>>({})
  const [preGrantOverridden, setPreGrantOverridden] = useState(false)

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

  // ── Optional-field nudge dialog (mandatory fields are hard-blocked, not nudged) ──────
  const { requestConfirm, dialog: nudgeDialog } = useConfirmDialog()

  // ── Common ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(!isNew)
  usePageTitle(loading ? t('profileEditor.title.loading') : (isNew ? t('profileEditor.title.new') : t('profileEditor.title.edit')))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load template lists on mount
  useEffect(() => {
    Promise.all([consentTemplatesApi.list(), uiTemplatesApi.list()])
      .then(([cts, uts]) => { setConsentTemplates(cts); setUITemplates(uts) })
      .catch(() => { })
  }, [])

  // Load existing profile. Sequenced (not fire-and-forget) because de-resolving locale content
  // needs the linked UI Template loaded first — the default locale's content comes straight off
  // the row, but every other locale needs a separate fetch (its current-version file), which also
  // needs the template to de-resolve `buttons`/`categories` back into editable rows.
  useEffect(() => {
    if (isNew) return
    let cancelled = false
    ;(async () => {
      try {
        const profile = await profilesApi.get(id) as DashboardProfile
        if (cancelled) return
        setProfileName(profile.name)
        setDefaultLocale(profile.defaultLocale)
        setActiveLocale(profile.defaultLocale)
        const pj = profile.profileJson
        if (Array.isArray(pj.regulations)) setRegulations(pj.regulations)
        else if (typeof pj.regulation === 'string' && pj.regulation) setRegulations([pj.regulation])
        if (Array.isArray(pj.allowedOrigins)) setAllowedOrigins(pj.allowedOrigins)
        if (typeof pj.complianceGroup === 'string') setComplianceGroup(pj.complianceGroup)
        if (typeof pj.customComplianceGroup === 'string') setCustomComplianceGroup(pj.customComplianceGroup)
        if (pj.gpcMode !== undefined) setGpcMode(String(pj.gpcMode))
        if (pj.darkMode === true) setDarkMode(true)
        if (typeof pj.hidePoweredBy === 'boolean') setHidePoweredBy(pj.hidePoweredBy)
        if (pj.allowReceipt === true) setAllowReceipt(true)
        if (pj.enhanceAccessibility === true) setEnhanceAccessibility(true)
        if (pj.showFooterMetadata === true) setShowFooterMetadata(true)
        if (typeof pj.expiryDays === 'number') setExpiryDays(pj.expiryDays)
        if (pj.dpdpa) {
          setDpdpaFiduciary(pj.dpdpa['dataFiduciary'] ?? '')
          setDpdpaGrievanceEmail(pj.dpdpa['grievanceEmail'] ?? '')
          setDpdpaPurpose(pj.dpdpa['purposeDescription'] ?? '')
        }
        if (pj.cookiesOverride && typeof pj.cookiesOverride === 'object') {
          setCookiesOverride(pj.cookiesOverride as Record<string, { preGrant?: boolean }>)
        }

        const ctId = pj.consentTemplateId
        const utId = pj.uiTemplateId
        let ct: ServerConsentTemplate | null = null
        if (ctId) {
          setConsentTemplateId(ctId)
          ct = await consentTemplatesApi.get(ctId).catch(() => null)
          if (!cancelled && ct) setConsentTemplate(ct)
        }
        if (utId) {
          setUITemplateId(utId)
          const ut = await uiTemplatesApi.get(utId).catch(() => null)
          if (cancelled) return
          if (ut) setUITemplate(ut)

          // Default locale's content lives directly on the row; every other locale is fetched
          // from its current-version file and de-resolved back into editable rows. Eager, not
          // lazy-on-tab-click — a future refinement, not required for correctness here.
          if (ut && pj.mainBanner && pj.preferenceModal) {
            const locales = pj.locales?.length ? pj.locales : [profile.defaultLocale]
            const entries = await Promise.all(locales.map(async (locale): Promise<[string, LocaleContent]> => {
              if (locale === profile.defaultLocale) {
                return [locale, deresolveLocaleContent({ mainBanner: pj.mainBanner!, ...(pj.gpcBanner ? { gpcBanner: pj.gpcBanner } : {}), preferenceModal: pj.preferenceModal! }, ct)]
              }
              try {
                const raw = await profilesApi.getVersion(id, String(profile.version), locale) as { mainBanner: MainBanner; gpcBanner?: GpcBanner; preferenceModal: PreferenceModal }
                return [locale, deresolveLocaleContent(raw, ct)]
              } catch {
                return [locale, defaultLocaleFromTemplate(ut, ct)]
              }
            }))
            if (!cancelled) setLocaleContents(Object.fromEntries(entries))
          }
        }
      } catch {
        if (!cancelled) setError(t('profileEditor.error.load'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id, isNew])

  // Auto-populate step 1 fields when the user picks a compliance group. Deliberately
  // called only from the radio's onChange (not a useEffect keyed on `complianceGroup`):
  // that state also changes when an existing profile finishes loading, and effects run
  // after commit — by then there is no reliable "was this the load or a click" signal,
  // so a saved profile's own custom gpcMode/allowReceipt would get silently overwritten
  // by the group defaults the moment it's opened for editing.
  const onComplianceGroupChange = (next: string) => {
    setComplianceGroup(next)
    if (!next) {
      setGpcMode('')
      setPreGrantOverridden(false)
      return
    }
    // A formal compliance group was picked — the free-form custom label no longer applies.
    setCustomComplianceGroup('')
    const group = COMPLIANCE_GROUPS[next as keyof typeof COMPLIANCE_GROUPS]
    if (!group) return
    setGpcMode(group.defaultGpc)
    setAllowReceipt(next.startsWith('opt-in'))
    if (consentTemplate) {
      const overrides = defaultCookiesOverride(next, consentTemplate.cookies, consentTemplate.categories)
      setCookiesOverride(overrides)
      setPreGrantOverridden(Object.keys(overrides).length > 0 && (next === 'opt-out' || next === 'opt-out-strict'))
    }
  }

  const onTogglePreGrant = (cookieId: string, next: boolean) => {
    setCookiesOverride(prev => {
      const authored = consentTemplate?.cookies[cookieId]?.preGrant ?? false
      const { [cookieId]: _drop, ...rest } = prev
      void _drop
      return next === authored ? rest : { ...rest, [cookieId]: { preGrant: next } }
    })
  }

  // Normalize free-typed text to lower-kebab-case as the user types (mirrors the
  // slugify used for UI Template button ids in utils/templates.ts).
  const onCustomComplianceGroupInput = (raw: string) => {
    setCustomComplianceGroup(
      raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
  }

  const onConsentTemplateChange = (tid: string) => {
    setConsentTemplateId(tid)
    if (!tid) { setConsentTemplate(null); return }
    consentTemplatesApi.get(tid).then(ct => {
      setConsentTemplate(ct)
      if (complianceGroup) {
        const overrides = defaultCookiesOverride(complianceGroup, ct.cookies, ct.categories)
        setCookiesOverride(overrides)
        setPreGrantOverridden(Object.keys(overrides).length > 0 && (complianceGroup === 'opt-out' || complianceGroup === 'opt-out-strict'))
      }
    }).catch(() => setConsentTemplate(null))
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
          updated[locale] = prev[locale] ? syncLocaleToTemplate(prev[locale]!, ut, consentTemplate) : defaultLocaleFromTemplate(ut, consentTemplate)
        }
        return updated
      })
    }).catch(() => setUITemplate(null))
  }

  const addLocale = (locale: string) => {
    setLocaleContents(prev => ({
      ...prev,
      [locale]: uiTemplate ? defaultLocaleFromTemplate(uiTemplate, consentTemplate) : {
        mainBanner: { heading: '', htmlText: '', buttonLabels: {} },
        gpcBanner: { heading: '', htmlText: '', buttonLabels: {} },
        preferenceModal: { heading: '', subheading: '', htmlText: '', buttonLabels: {}, categories: [] },
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

  const setModalField = (field: 'heading' | 'subheading' | 'htmlText' | 'receiptLabel' | 'receiptDescription', value: string) => {
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

  const setButtonLabel = (section: 'mainBanner' | 'gpcBanner' | 'preferenceModal', buttonId: string, text: string) => {
    setLocaleContents(prev => {
      const content = prev[activeLocale]!
      const labels = { ...content[section].buttonLabels, [buttonId]: text }
      return { ...prev, [activeLocale]: { ...content, [section]: { ...content[section], buttonLabels: labels } } }
    })
  }

  const handleLoadSectionDefaults = (section: 'mainBanner' | 'gpcBanner' | 'preferenceModal') => {
    if (!uiTemplate) return
    const defaults = buildDefaultContent(complianceGroup, uiTemplate, consentTemplate, activeLocale)
    setLocaleContents(prev => {
      const base = prev[activeLocale] ?? defaultLocaleFromTemplate(uiTemplate, consentTemplate)
      return { ...prev, [activeLocale]: { ...base, [section]: defaults[section] } }
    })
  }

  /** `ServerUITemplate`'s sections carry `buttons` as the wire `TemplateButtonMap`; the dashboard's
   * `TemplateBannerUI`/`TemplateModalUI` (used by the CSV/JSON export/import helpers) expect the
   * array-of-rows shape instead — convert at this boundary rather than casting past the mismatch. */
  const toBannerUI = (b: ServerUITemplate['mainBanner']): TemplateBannerUI =>
    ({ ...b, buttons: mapToButtonRows(b.buttons) }) as TemplateBannerUI
  const toModalUI = (m: ServerUITemplate['preferenceModal']): TemplateModalUI =>
    ({ ...m, buttons: mapToButtonRows(m.buttons) }) as unknown as TemplateModalUI

  const handleExportJson = () => {
    if (!uiTemplate || !consentTemplate || !Object.keys(localeContents).length) return
    const json = exportAllLocalesJson(
      localeContents,
      toBannerUI(uiTemplate.mainBanner),
      toBannerUI(uiTemplate.gpcBanner),
      toModalUI(uiTemplate.preferenceModal),
      consentTemplate.categories,
    )
    downloadFile(json, 'locales.json', 'application/json')
  }

  const handleExportCsv = () => {
    if (!uiTemplate || !consentTemplate) return
    const csv = exportAllLocalesCsv(
      localeContents,
      toBannerUI(uiTemplate.mainBanner),
      toBannerUI(uiTemplate.gpcBanner),
      toModalUI(uiTemplate.preferenceModal),
      consentTemplate.categories,
    )
    downloadFile(csv, 'locales.csv', 'text/csv')
  }

  const handleImport = (file: File) => {
    setImportError('')
    setImportedLocales([])
    setSkippedLocales([])
    if (!uiTemplate || !consentTemplate) { setImportError(t('profileEditor.content.importError')); return }
    const mb = toBannerUI(uiTemplate.mainBanner)
    const gb = toBannerUI(uiTemplate.gpcBanner)
    const pm = toModalUI(uiTemplate.preferenceModal)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      try {
        const base: LocaleContent = localeContents[defaultLocale] ?? localeContents[activeLocale]
          ?? defaultLocaleFromTemplate(uiTemplate, consentTemplate)
        const { locales, skipped } = file.name.endsWith('.csv')
          ? importAllLocalesFromCsv(text, base, mb, gb, pm, consentTemplate.categories)
          : importAllLocalesFromJson(text, base, mb, gb, pm, consentTemplate.categories)
        setLocaleContents(prev => ({ ...prev, ...locales }))
        const imported = Object.keys(locales)
        setImportedLocales(imported)
        setSkippedLocales(skipped)
        const newLocale = imported.find(l => !Object.keys(localeContents).includes(l)) ?? imported[0]
        if (newLocale) setActiveLocale(newLocale)
      } catch {
        setImportError(t('profileEditor.content.importError'))
      }
    }
    reader.readAsText(file)
  }

  const previewDraft = consentTemplate && uiTemplate
    ? buildPreviewDraft(consentTemplate, uiTemplate, defaultLocale, localeContents, expiryDays, activeLocale)
    : null

  const buildSaveData = (choice?: string) => {
    if (!consentTemplate || !uiTemplate) {
      throw new Error('Consent Template and UI Template must be selected before saving')
    }
    const dpdpaConfig = (regulations.includes('dpdpa') || COMPLIANCE_GROUPS[complianceGroup as keyof typeof COMPLIANCE_GROUPS]?.requiresDpdpaDisclosure) && dpdpaFiduciary.trim() && dpdpaGrievanceEmail.trim()
      ? { dataFiduciary: dpdpaFiduciary.trim(), grievanceEmail: dpdpaGrievanceEmail.trim(), ...(dpdpaPurpose.trim() ? { purposeDescription: dpdpaPurpose.trim() } : {}) }
      : undefined

    // Default locale's resolved content goes directly on profileJson (stored on the DB row);
    // every other locale's resolved content goes in the sibling `localeContent` map, written to
    // its own on-disk version file — never persisted in the DB row. See `StoredProfileJson`/
    // `LocaleContentInput` (packages/types/src/api.ts) for why the split exists (row-size).
    const locales = sortLocalesDefaultFirst(Object.keys(localeContents).length > 0 ? Object.keys(localeContents) : [defaultLocale], defaultLocale)
    const defaultContent = localeContents[defaultLocale] ?? defaultLocaleFromTemplate(uiTemplate, consentTemplate)
    const resolvedDefault = resolveLocaleContent(uiTemplate, consentTemplate, defaultContent)
    const localeContent: Record<string, LocaleContentInput> = {}
    for (const locale of locales) {
      if (locale === defaultLocale) continue
      const content = localeContents[locale]
      if (!content) continue
      localeContent[locale] = resolveLocaleContent(uiTemplate, consentTemplate, content)
    }

    return {
      name: profileName,
      defaultLocale,
      ...(choice ? { choice } : {}),
      profileJson: {
        consentTemplateId,
        uiTemplateId,
        defaultLocale,
        expiryDays,
        locales: locales.includes(defaultLocale) ? locales : [defaultLocale, ...locales],
        ...(regulations.length > 0 ? { regulations } : {}),
        ...(complianceGroup ? { complianceGroup } : {}),
        ...(!complianceGroup && customComplianceGroup ? { customComplianceGroup } : {}),
        ...(gpcMode ? { gpcMode: gpcMode === 'true' ? true : gpcMode === 'false' ? false : gpcMode } : {}),
        ...(allowedOrigins.length > 0 ? { allowedOrigins } : {}),
        ...(dpdpaConfig ? { dpdpa: dpdpaConfig } : {}),
        ...(darkMode ? { darkMode: true } : {}),
        hidePoweredBy,
        ...(allowReceipt ? { allowReceipt: true } : {}),
        ...(enhanceAccessibility ? { enhanceAccessibility: true } : {}),
        ...(showFooterMetadata ? { showFooterMetadata: true } : {}),
        ...(Object.keys(cookiesOverride).length > 0 ? { cookiesOverride } : {}),
        ...resolvedDefault,
      },
      ...(Object.keys(localeContent).length > 0 ? { localeContent } : {}),
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

  /** Hard-blocks on any blank mandatory field across the given section(s), for every locale —
   * jumps to the first offending locale/tab instead of just a generic error. Returns true if the
   * caller should stop (something's missing). */
  const blockOnMissingContent = (sections: Array<'mainBanner' | 'gpcBanner' | 'preferenceModal'>): boolean => {
    const missing = findMissingMandatoryFields(localeContents, sections)
    if (missing.length === 0) return false
    const first = missing[0]!
    setActiveLocale(first.locale)
    setStep(first.section === 'mainBanner' ? 3 : first.section === 'gpcBanner' ? 4 : 5)
    setError(t('profileEditor.error.missingRequiredContent', { locale: first.locale }))
    return true
  }

  /** Soft nudge for the active locale's optional field in `section` (banner heading / modal intro
   * text) — advisory only. Resolves true if the user wants to stay and fill it in. */
  const nudgeIfOptionalBlank = async (section: 'mainBanner' | 'gpcBanner' | 'preferenceModal'): Promise<boolean> => {
    const content = localeContents[activeLocale]
    if (!content || findBlankOptionalFields(content, section).length === 0) return false
    return requestConfirm({
      title: t('profileEditor.nudge.title'),
      message: t(section === 'preferenceModal' ? 'profileEditor.nudge.introBlank' : 'profileEditor.nudge.headingBlank'),
      confirmLabel: t('profileEditor.nudge.addNow'),
      cancelLabel: t('profileEditor.nudge.ignore'),
      danger: false,
    })
  }

  /** Shared by the tab bar (leaving the active locale) and each content step's "Next" button
   * (leaving the whole section) — nudges once for the active locale's optional field, then either
   * stays (user chose "Add now") or runs `proceed`. */
  const withOptionalNudge = async (section: 'mainBanner' | 'gpcBanner' | 'preferenceModal', proceed: () => void): Promise<void> => {
    const stay = await nudgeIfOptionalBlank(section)
    if (!stay) proceed()
  }

  const goToNextContentStep = async (nextStep: number, section: 'mainBanner' | 'gpcBanner' | 'preferenceModal') => {
    setError('')
    if (blockOnMissingContent([section])) return
    await withOptionalNudge(section, () => setStep(nextStep))
  }

  const handleSave = async () => {
    if (!profileName.trim()) { setError(t('profileEditor.error.nameRequired')); setStep(1); return }
    if (expiryDays < 1) { setError(t('profileEditor.error.expiryDays')); setStep(1); return }
    if (!complianceGroup && !customComplianceGroup.trim()) { setError(t('profileEditor.error.customComplianceGroupRequired')); setStep(1); return }
    if (!consentTemplateId) { setError(t('profileEditor.error.cookieRequired')); setStep(2); return }
    if (!uiTemplateId) { setError(t('profileEditor.error.uiRequired')); setStep(2); return }
    if (blockOnMissingContent(isGpcStepDisabled ? ['mainBanner', 'preferenceModal'] : ['mainBanner', 'gpcBanner', 'preferenceModal'])) return
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
  const locales = sortLocalesDefaultFirst(Object.keys(localeContents).length ? Object.keys(localeContents) : [defaultLocale], defaultLocale)

  const tableLabels = {
    noNoCookies: t('profileEditor.table.noNoCookies'),
    id: t('profileEditor.table.id'),
    purpose: t('consentTemplates.col.purposeShort'),
    legalBasis: t('profileEditor.table.legalBasis'),
    gpc: t('profileEditor.table.gpc'),
    preGrant: t('profileEditor.table.preGrant'),
    preGrantLocked: t('profileEditor.table.preGrantLocked'),
    tcfVendor: t('profileEditor.table.tcfVendor'),
    cpraCategory: t('profileEditor.table.cpraCategory'),
  }

  if (loading) {
    return <p class="text-gray-400 text-sm" role="status" aria-live="polite">{t('common.loading')}</p>
  }

  const stepLabels = [
    t('profileEditor.step.config'),
    t('profileEditor.step.templates'),
    t('profileEditor.step.mainBanner'),
    t('profileEditor.step.gpcBanner'),
    t('profileEditor.step.prefModal'),
  ]

  // ── Shared locale toolbar for content steps (3–5) — Load Defaults is per-section ──
  const ContentLocaleToolbar = ({
    section,
  }: {
    section: 'mainBanner' | 'gpcBanner' | 'preferenceModal'
  }) => (
    <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
      <LocaleTabBar
        locales={locales}
        defaultLocale={defaultLocale}
        activeLocale={activeLocale}
        onSelect={locale => void withOptionalNudge(section, () => setActiveLocale(locale))}
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
      </div>
    </div>
  )

  // ── Export/Import — covers the whole profile (all sections, all locales), available on
  // every content step (3–5), not scoped to whichever step is currently active ──────────
  const ContentImportExportBar = () => (
    <div class="flex flex-wrap items-center justify-end gap-1.5 mb-3">
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
    </div>
  )

  return (
    <>
      {nudgeDialog}
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

      {(step === 3 || step === 4 || step === 5) && (
        <>
          <ContentImportExportBar />
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
        </>
      )}

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
                        class="accent-blue-600 shrink-0 w-4 h-4"
                        checked={complianceGroup === key}
                        onChange={() => onComplianceGroupChange(complianceGroup === key ? '' : key)}
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
                <div
                  class={`flex flex-col gap-1 p-3 border rounded-lg transition-colors select-none ${!complianceGroup ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="complianceGroup"
                      class="accent-gray-600 shrink-0"
                      checked={!complianceGroup}
                      onChange={() => onComplianceGroupChange('')}
                    />
                    <span class="text-sm font-medium text-gray-600">{t('profileEditor.config.complianceGroupNone')}</span>
                  </label>
                  {!complianceGroup && (
                    <div class="ml-5 mt-1">
                      <label for="custom-compliance-group" class="block text-[11px] text-gray-500 mb-1">
                        {t('profileEditor.config.customComplianceGroup')} <span class="text-red-500" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="custom-compliance-group"
                        class={`w-full border rounded px-2 py-1 text-xs font-mono ${!customComplianceGroup.trim() && error ? 'border-red-400' : 'border-gray-300'}`}
                        value={customComplianceGroup}
                        onInput={e => onCustomComplianceGroupInput((e.target as HTMLInputElement).value)}
                        placeholder={t('profileEditor.config.customComplianceGroupPlaceholder')}
                        required
                        aria-required="true"
                      />
                      <p class="text-[10px] text-gray-400 mt-0.5">{t('profileEditor.config.customComplianceGroupHint')}</p>
                    </div>
                  )}
                </div>
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
              {/* Expiry (days) */}
              <div>
                <label for="expiry-days" class="block text-sm font-medium text-gray-700 mb-1">
                  {t('profileEditor.config.expiryDays')}
                </label>
                <input
                  id="expiry-days"
                  type="number"
                  min="1"
                  max="3650"
                  class={`w-full border rounded px-3 py-2 text-sm ${expiryDaysError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  value={expiryDays}
                  onInput={e => {
                    const v = parseInt((e.target as HTMLInputElement).value, 10)
                    setExpiryDays(isNaN(v) ? 1 : v)
                    setExpiryDaysError('')
                  }}
                />
                <p class="text-xs text-gray-400 mt-0.5">{t('profileEditor.config.expiryDaysHint')}</p>
                {expiryDaysError && <p role="alert" class="text-xs text-red-500 mt-0.5">{expiryDaysError}</p>}
              </div>
              {/* Display toggles */}
              {[
                { checked: darkMode, onChange: setDarkMode, label: t('profileEditor.config.darkMode'), hint: t('profileEditor.config.darkModeHint') },
                { checked: hidePoweredBy, onChange: setHidePoweredBy, label: t('profileEditor.config.hidePoweredBy'), hint: t('profileEditor.config.hidePoweredByHint') },
                { checked: allowReceipt, onChange: setAllowReceipt, label: t('profileEditor.config.allowReceipt'), hint: t('profileEditor.config.allowReceiptHint') },
                { checked: enhanceAccessibility, onChange: setEnhanceAccessibility, label: t('profileEditor.config.enhanceAccessibility'), hint: t('profileEditor.config.enhanceAccessibilityHint') },
                { checked: showFooterMetadata, onChange: setShowFooterMetadata, label: t('profileEditor.config.showFooterMetadata'), hint: t('profileEditor.config.showFooterMetadataHint') },
              ].map(({ checked, onChange, label, hint }) => (
                <label key={label} class="flex items-start gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 bg-white select-none">
                  <input
                    type="checkbox"
                    class="mt-2 accent-blue-600 shrink-0 w-4 h-4"
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
                if (expiryDays < 1) { setExpiryDaysError(t('profileEditor.error.expiryDays')); setError(t('profileEditor.error.expiryDays')); return }
                if (!complianceGroup && !customComplianceGroup.trim()) { setError(t('profileEditor.error.customComplianceGroupRequired')); return }
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

          {/* Consent Template */}
          <div class="bg-white border border-gray-200 rounded-lg p-5">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-700">{t('profileEditor.templates.cookieTemplate')}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {t('profileEditor.templates.cookieTemplateHint')}
                </p>
              </div>
              <a href="#/banners/consent-templates/new" class="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0" target="_blank">
                {t('profileEditor.newLink')}
              </a>
            </div>
            <select
              class="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm mb-4"
              value={consentTemplateId}
              onChange={e => onConsentTemplateChange((e.target as HTMLSelectElement).value)}
            >
              <option value="">{t('profileEditor.templates.selectCookie')}</option>
              {consentTemplates.map(tmpl => {
                const cookieCount = Object.keys(tmpl.cookies).length
                const categoryCount = Object.keys(tmpl.categories).length
                return <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({cookieCount} {t('consentTemplates.editor.definitions')}, {categoryCount} {t('consentTemplates.editor.categories')})</option>
              })}
            </select>
            {consentTemplate
              ? (
                <>
                  <p class="text-xs text-gray-500 mt-4 mb-2">
                    <strong class="text-gray-700">{t('consentTemplates.editor.definitions')}</strong>
                  </p>
                  {preGrantOverridden && (
                    <p class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-2">
                      {t('profileEditor.compliance.preGrantOverridden')}
                    </p>
                  )}
                  <CookiePreviewTable
                    cookies={consentTemplate.cookies}
                    categories={consentTemplate.categories}
                    labels={tableLabels}
                    cookiesOverride={cookiesOverride}
                    onTogglePreGrant={onTogglePreGrant}
                  />
                  <p class="text-xs text-gray-500 mt-6 mb-2">
                    <strong class="text-gray-700">{t('consentTemplates.editor.categories')}</strong>
                  </p>
                  <CategoryPreviewTable categories={consentTemplate.categories} labels={tableLabels} />
                </>
              )
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
                <span><strong class="text-gray-700">{Object.keys(uiTemplate.mainBanner.buttons).length + Object.keys(uiTemplate.preferenceModal.buttons).length}</strong> {t('profileEditor.templates.buttonsTotal')}</span>
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
                if (!consentTemplateId) { setError(t('profileEditor.error.cookieContinue')); return }
                if (!uiTemplateId) { setError(t('profileEditor.error.uiContinue')); return }

                if (complianceGroup && consentTemplate) {
                  try {
                    const result = await profilesApi.validateCompliance({
                      complianceGroup,
                      cookies: consentTemplate.cookies,
                      categories: consentTemplate.categories,
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
                  setLocaleContents(prev => ({ ...prev, [defaultLocale]: defaultLocaleFromTemplate(uiTemplate, consentTemplate) }))
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
            <ContentLocaleToolbar section="mainBanner" />

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
                {Object.keys(uiTemplate.mainBanner.buttons).length > 0 && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1.5">{t('profileEditor.content.buttonLabels')}</label>
                    <div class="grid grid-cols-3 gap-3">
                      {Object.entries(uiTemplate.mainBanner.buttons).map(([id, btn]) => (
                        <div key={id}>
                          <label class="block text-xs text-gray-400 mb-1">{id} ({btn.action}) <span class="text-red-500">*</span></label>
                          <input
                            class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={currentContent.mainBanner.buttonLabels[id] ?? ''}
                            onInput={e => setButtonLabel('mainBanner', id, (e.target as HTMLInputElement).value)}
                            placeholder={t('profileEditor.content.buttonLabelPlaceholder')}
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
              onClick={() => void goToNextContentStep(isGpcStepDisabled ? 5 : 4, 'mainBanner')}
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
                {Object.keys(uiTemplate.gpcBanner.buttons).length > 0 && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1.5">{t('profileEditor.content.buttonLabels')}</label>
                    <div class="grid grid-cols-3 gap-3">
                      {Object.entries(uiTemplate.gpcBanner.buttons).map(([id, btn]) => (
                        <div key={id}>
                          <label class="block text-xs text-gray-400 mb-1">{id} ({btn.action}) <span class="text-red-500">*</span></label>
                          <input
                            class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={currentContent.gpcBanner.buttonLabels[id] ?? ''}
                            onInput={e => setButtonLabel('gpcBanner', id, (e.target as HTMLInputElement).value)}
                            placeholder={t('profileEditor.content.buttonLabelPlaceholder')}
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
              onClick={() => void goToNextContentStep(5, 'gpcBanner')}
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
                {Object.keys(uiTemplate.preferenceModal.buttons).length > 0 && (
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1.5">{t('profileEditor.content.buttonLabels')}</label>
                    <div class="grid grid-cols-3 gap-3">
                      {Object.entries(uiTemplate.preferenceModal.buttons).map(([id, btn]) => (
                        <div key={id}>
                          <label class="block text-xs text-gray-400 mb-1">{id} ({btn.action}) <span class="text-red-500">*</span></label>
                          <input
                            class="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            value={currentContent.preferenceModal.buttonLabels[id] ?? ''}
                            onInput={e => setButtonLabel('preferenceModal', id, (e.target as HTMLInputElement).value)}
                            placeholder={t('profileEditor.content.buttonLabelPlaceholder')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentContent.preferenceModal.categories.map((cat, idx) => {
                  const catDef = consentTemplate?.categories[cat.id]
                  return (
                    <div key={cat.id} class="border border-gray-100 rounded p-3 bg-gray-50 space-y-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-gray-700">{cat.id || t('profileEditor.content.categoryFallback', { n: String(idx + 1) })}</span>
                        {catDef?.legalBasis === 'mandatory' && <span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{t('common.mandatory')}</span>}
                        {catDef?.legalBasis === 'legitimate_interest' && <span class="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">LI</span>}
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
                      {catDef?.legalBasis === 'legitimate_interest' && (
                        <div>
                          <label class="block text-xs font-medium text-gray-600 mb-0.5">{t('profileEditor.content.liDescription')}</label>
                          <textarea
                            class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            value={cat.legitimateInterestDescription ?? ''}
                            onInput={e => setCategoryContent(idx, 'legitimateInterestDescription', (e.target as HTMLTextAreaElement).value)}
                            placeholder={defaultContent?.preferenceModal.categories.find(c => c.id === cat.id)?.legitimateInterestDescription || t('profileEditor.content.liDescriptionPlaceholder')}
                            rows={2}
                          />
                          <p class="text-xs text-gray-400 mt-0.5">{t('profileEditor.content.liDescriptionHint')}</p>
                        </div>
                      )}
                    </div>
                  )
                })}

                {allowReceipt && (
                  <div class="border border-gray-100 rounded p-3 bg-gray-50 space-y-2">
                    <span class="text-xs font-semibold text-gray-700">{t('profileEditor.content.receiptHeading')}</span>
                    <p class="text-xs text-gray-500">{t('profileEditor.content.receiptHint')}</p>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-0.5">{t('profileEditor.content.receiptLabel')}</label>
                      <input
                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        value={currentContent.preferenceModal.receiptLabel ?? ''}
                        onInput={e => setModalField('receiptLabel', (e.target as HTMLInputElement).value)}
                        placeholder={defaultContent?.preferenceModal.receiptLabel || 'Get a copy of my consent choices (JSON)'}
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-0.5">{t('profileEditor.content.receiptDescription')}</label>
                      <input
                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                        value={currentContent.preferenceModal.receiptDescription ?? ''}
                        onInput={e => setModalField('receiptDescription', (e.target as HTMLInputElement).value)}
                        placeholder={defaultContent?.preferenceModal.receiptDescription || 'A JSON file will be downloaded to your device when you save your preferences.'}
                      />
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
    </>
  )
}
