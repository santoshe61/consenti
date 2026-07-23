// Locale content export (JSON + CSV) and import (JSON or CSV), covering every locale on the
// profile in a single file — not one file per locale. All processing happens in the browser,
// no server round-trip needed.

import { parseContent, jsonToHtml, htmlToJson, serializeContent } from './contentjson'
import type { LocaleContent } from './templates'
import type { TemplateBannerUI, TemplateModalUI } from './templates'
import type { CategoryMap } from '@consenti/types'
import { LOCALE_OPTIONS } from '../components/CountrySelecter'

function storeHtml(html: string): string {
  return serializeContent(htmlToJson(html))
}

function loadHtml(json: string): string {
  return jsonToHtml(parseContent(json))
}

// ── Dot-path field keys ──────────────────────────────────────────────────────
// The same ordered key set is used as CSV columns (after the leading `locale` column) and as
// the per-locale object keys in the JSON export — derived from the UI template's button ids
// and the consent template's category ids, so it's identical for every locale on the profile.

export function dotPathKeys(
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): string[] {
  const keys: string[] = []
  keys.push('mainBanner.heading', 'mainBanner.htmlText')
  for (const b of mainBanner.buttons) keys.push(`mainBanner.button.${b.id}`)
  keys.push('gpcBanner.heading', 'gpcBanner.htmlText')
  for (const b of gpcBanner.buttons) keys.push(`gpcBanner.button.${b.id}`)
  keys.push('preferenceModal.heading', 'preferenceModal.subheading', 'preferenceModal.htmlText')
  for (const b of preferenceModal.buttons) keys.push(`preferenceModal.button.${b.id}`)
  keys.push('preferenceModal.receiptLabel', 'preferenceModal.receiptDescription')
  for (const [catId, cat] of Object.entries(categories)) {
    keys.push(`category.${catId}.heading`, `category.${catId}.htmlText`)
    if (cat.legalBasis === 'legitimate_interest') keys.push(`category.${catId}.legitimateInterestDescription`)
  }
  return keys
}

// ── Locale content ↔ flat dot-path record ────────────────────────────────────

export function flattenLocaleContent(
  content: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): Record<string, string> {
  const flat: Record<string, string> = {}
  flat['mainBanner.heading'] = content.mainBanner.heading
  flat['mainBanner.htmlText'] = loadHtml(content.mainBanner.htmlText)
  mainBanner.buttons.forEach(b => { flat[`mainBanner.button.${b.id}`] = content.mainBanner.buttonLabels[b.id] ?? '' })

  flat['gpcBanner.heading'] = content.gpcBanner.heading
  flat['gpcBanner.htmlText'] = loadHtml(content.gpcBanner.htmlText)
  gpcBanner.buttons.forEach(b => { flat[`gpcBanner.button.${b.id}`] = content.gpcBanner.buttonLabels[b.id] ?? '' })

  flat['preferenceModal.heading'] = content.preferenceModal.heading
  flat['preferenceModal.subheading'] = content.preferenceModal.subheading
  flat['preferenceModal.htmlText'] = loadHtml(content.preferenceModal.htmlText)
  preferenceModal.buttons.forEach(b => { flat[`preferenceModal.button.${b.id}`] = content.preferenceModal.buttonLabels[b.id] ?? '' })
  flat['preferenceModal.receiptLabel'] = content.preferenceModal.receiptLabel ?? ''
  flat['preferenceModal.receiptDescription'] = content.preferenceModal.receiptDescription ?? ''

  for (const [catId, cat] of Object.entries(categories)) {
    const catContent = content.preferenceModal.categories.find(c => c.id === catId)
    flat[`category.${catId}.heading`] = catContent?.heading ?? ''
    flat[`category.${catId}.htmlText`] = catContent ? loadHtml(catContent.htmlText) : ''
    if (cat.legalBasis === 'legitimate_interest') {
      flat[`category.${catId}.legitimateInterestDescription`] = catContent?.legitimateInterestDescription ?? ''
    }
  }
  return flat
}

// Merges a flat dot-path record into `current` — only keys present (and non-undefined) in
// `flat` are applied, everything else is carried over from `current` unchanged.
export function unflattenLocaleContent(
  flat: Record<string, string | undefined>,
  current: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): LocaleContent {
  const get = (key: string): string | undefined => flat[key]

  const mainBannerLabels = { ...current.mainBanner.buttonLabels }
  mainBanner.buttons.forEach(b => {
    const v = get(`mainBanner.button.${b.id}`)
    if (v !== undefined) mainBannerLabels[b.id] = v
  })
  const gpcBannerLabels = { ...current.gpcBanner.buttonLabels }
  gpcBanner.buttons.forEach(b => {
    const v = get(`gpcBanner.button.${b.id}`)
    if (v !== undefined) gpcBannerLabels[b.id] = v
  })
  const preferenceModalLabels = { ...current.preferenceModal.buttonLabels }
  preferenceModal.buttons.forEach(b => {
    const v = get(`preferenceModal.button.${b.id}`)
    if (v !== undefined) preferenceModalLabels[b.id] = v
  })

  const receiptLabel = get('preferenceModal.receiptLabel')
  const receiptDescription = get('preferenceModal.receiptDescription')

  return {
    mainBanner: {
      heading: get('mainBanner.heading') ?? current.mainBanner.heading,
      htmlText: get('mainBanner.htmlText') !== undefined ? storeHtml(get('mainBanner.htmlText')!) : current.mainBanner.htmlText,
      buttonLabels: mainBannerLabels,
    },
    gpcBanner: {
      heading: get('gpcBanner.heading') ?? current.gpcBanner.heading,
      htmlText: get('gpcBanner.htmlText') !== undefined ? storeHtml(get('gpcBanner.htmlText')!) : current.gpcBanner.htmlText,
      buttonLabels: gpcBannerLabels,
    },
    preferenceModal: {
      heading: get('preferenceModal.heading') ?? current.preferenceModal.heading,
      subheading: get('preferenceModal.subheading') ?? current.preferenceModal.subheading,
      htmlText: get('preferenceModal.htmlText') !== undefined ? storeHtml(get('preferenceModal.htmlText')!) : current.preferenceModal.htmlText,
      buttonLabels: preferenceModalLabels,
      ...(receiptLabel !== undefined ? { receiptLabel } : (current.preferenceModal.receiptLabel !== undefined ? { receiptLabel: current.preferenceModal.receiptLabel } : {})),
      ...(receiptDescription !== undefined ? { receiptDescription } : (current.preferenceModal.receiptDescription !== undefined ? { receiptDescription: current.preferenceModal.receiptDescription } : {})),
      categories: Object.keys(categories).map(catId => {
        const existing = current.preferenceModal.categories.find(c => c.id === catId)
        const heading = get(`category.${catId}.heading`)
        const htmlText = get(`category.${catId}.htmlText`)
        const liDesc = get(`category.${catId}.legitimateInterestDescription`)
        return {
          id: catId,
          heading: heading ?? existing?.heading ?? '',
          htmlText: htmlText !== undefined ? storeHtml(htmlText) : (existing?.htmlText ?? ''),
          ...(liDesc !== undefined ? { legitimateInterestDescription: liDesc } : (existing?.legitimateInterestDescription !== undefined ? { legitimateInterestDescription: existing.legitimateInterestDescription } : {})),
        }
      }),
    },
  }
}

// ── JSON export/import — { [locale]: { [dotPathKey]: value } } ──────────────
// Scoped to locales actually present on the profile (unlike the CSV, which lists every
// supported locale up front, same idea as the CSV: a locale the profile doesn't have content
// for yet still gets its key in the file — as an empty object — so a translator knows exactly
// which locale codes are valid without needing to invent or look one up.

export function exportAllLocalesJson(
  localeContents: Record<string, LocaleContent>,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): string {
  const result: Record<string, Record<string, string>> = {}
  for (const { value: locale } of LOCALE_OPTIONS) {
    const content = localeContents[locale]
    result[locale] = content ? flattenLocaleContent(content, mainBanner, gpcBanner, preferenceModal, categories) : {}
  }
  return JSON.stringify(result, null, 2)
}

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/i

export function importAllLocalesFromJson(
  jsonStr: string,
  base: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): { locales: Record<string, LocaleContent>; skipped: string[] } {
  const parsed: unknown = JSON.parse(jsonStr)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON')

  const locales: Record<string, LocaleContent> = {}
  const skipped: string[] = []
  for (const [locale, flat] of Object.entries(parsed as Record<string, unknown>)) {
    if (!LOCALE_RE.test(locale) || !flat || typeof flat !== 'object' || Array.isArray(flat)) {
      skipped.push(locale)
      continue
    }
    // A locale the exported file listed but never got content for — e.g. every unauthored
    // locale in the full-locale-list export. Not an error, just nothing to import.
    if (Object.keys(flat).length === 0) continue
    try {
      locales[locale] = unflattenLocaleContent(flat as Record<string, string>, base, mainBanner, gpcBanner, preferenceModal, categories)
    } catch {
      skipped.push(locale)
    }
  }
  return { locales, skipped }
}

// ── CSV export/import — one row per supported locale, column A = locale code ─────────────
// Column A is pre-populated with every locale from `LOCALE_OPTIONS` (not just the ones this
// profile already has content for) so users never hand-type a locale code — that's the
// error-prone part this format exists to avoid. Content columns are pre-filled for locales
// the profile already has; blank otherwise, ready to be filled in.

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`
}

export function exportAllLocalesCsv(
  localeContents: Record<string, LocaleContent>,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): string {
  const keys = dotPathKeys(mainBanner, gpcBanner, preferenceModal, categories)
  const rows: string[][] = [['locale', ...keys]]
  for (const { value: locale } of LOCALE_OPTIONS) {
    const content = localeContents[locale]
    const flat = content ? flattenLocaleContent(content, mainBanner, gpcBanner, preferenceModal, categories) : null
    rows.push([locale, ...keys.map(k => csvEscape(flat?.[k] ?? ''))])
  }
  return rows.map(r => r.join(',')).join('\n')
}

// Parses one CSV line into fields, handling quoted values with embedded commas/newlines-as-\n
// (values are expected on a single physical line — multi-line htmlText isn't supported in CSV).
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { cur += ch }
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(cur); cur = '' }
      else cur += ch
    }
  }
  fields.push(cur)
  return fields
}

export function importAllLocalesFromCsv(
  csvStr: string,
  base: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
  categories: CategoryMap,
): { locales: Record<string, LocaleContent>; skipped: string[] } {
  const lines = csvStr.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 1) return { locales: {}, skipped: [] }
  const header = parseCsvLine(lines[0]!).map(h => h.trim())
  const keys = header.slice(1)

  const locales: Record<string, LocaleContent> = {}
  const skipped: string[] = []
  for (const line of lines.slice(1)) {
    const fields = parseCsvLine(line)
    const locale = (fields[0] ?? '').trim()
    if (!locale) continue
    if (!LOCALE_RE.test(locale)) { skipped.push(locale); continue }
    const flat: Record<string, string> = {}
    let hasContent = false
    keys.forEach((key, i) => {
      const v = (fields[i + 1] ?? '').trim()
      if (v) hasContent = true
      flat[key] = v
    })
    if (!hasContent) continue // row for a supported locale the user didn't fill in — skip
    locales[locale] = unflattenLocaleContent(flat, base, mainBanner, gpcBanner, preferenceModal, categories)
  }
  return { locales, skipped }
}

// ── Browser download helper ────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
