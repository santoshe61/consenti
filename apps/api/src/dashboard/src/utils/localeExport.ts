// Locale content export (JSON + CSV) and import (JSON or CSV).
// All processing happens in the browser — no server round-trip needed.

import { parseContent, jsonToHtml, htmlToJson, serializeContent } from './contentjson'
import type { LocaleContent } from './templates'
import type { TemplateBannerUI, TemplateModalUI } from './templates'

// ── Export types ───────────────────────────────────────────────────────────────

interface ExportCategory { id: string; heading: string; htmlText: string }
interface ExportBanner { heading: string; htmlText: string; buttons: string[] }
interface ExportModal extends ExportBanner { subheading: string; categories: ExportCategory[] }

export interface LocaleExportDoc {
  locale: string
  mainBanner: ExportBanner
  gpcBanner: ExportBanner
  preferenceModal: ExportModal
}

// ── Build exportable representation ───────────────────────────────────────────

function toExportDoc(
  locale: string,
  content: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
): LocaleExportDoc {
  const resolvedLabel = (labels: string[], idx: number, fallback: string) =>
    labels[idx] || fallback

  return {
    locale,
    mainBanner: {
      heading: content.mainBanner.heading,
      htmlText: jsonToHtml(parseContent(content.mainBanner.htmlText)),
      buttons: mainBanner.buttons.map((b, i) => resolvedLabel(content.mainBanner.buttonLabels, i, b.text)),
    },
    gpcBanner: {
      heading: content.gpcBanner.heading,
      htmlText: jsonToHtml(parseContent(content.gpcBanner.htmlText)),
      buttons: gpcBanner.buttons.map((b, i) => resolvedLabel(content.gpcBanner.buttonLabels, i, b.text)),
    },
    preferenceModal: {
      heading: content.preferenceModal.heading,
      subheading: content.preferenceModal.subheading,
      htmlText: jsonToHtml(parseContent(content.preferenceModal.htmlText)),
      buttons: preferenceModal.buttons.map((b, i) => resolvedLabel(content.preferenceModal.buttonLabels, i, b.text)),
      categories: content.preferenceModal.categories.map(cat => ({
        id: cat.id,
        heading: cat.heading,
        htmlText: jsonToHtml(parseContent(cat.htmlText)),
      })),
    },
  }
}

// ── JSON export ────────────────────────────────────────────────────────────────

export function exportLocaleJson(
  locale: string,
  content: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
): string {
  return JSON.stringify(toExportDoc(locale, content, mainBanner, gpcBanner, preferenceModal), null, 2)
}

// ── CSV export ─────────────────────────────────────────────────────────────────

export function exportLocaleCsv(
  locale: string,
  content: LocaleContent,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
): string {
  const doc = toExportDoc(locale, content, mainBanner, gpcBanner, preferenceModal)
  const rows: string[][] = [['field', 'value']]
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`

  rows.push(['mainBanner.heading', esc(doc.mainBanner.heading)])
  rows.push(['mainBanner.htmlText', esc(doc.mainBanner.htmlText)])
  doc.mainBanner.buttons.forEach((btn, i) => rows.push([`mainBanner.button.${i}`, esc(btn)]))

  rows.push(['gpcBanner.heading', esc(doc.gpcBanner.heading)])
  rows.push(['gpcBanner.htmlText', esc(doc.gpcBanner.htmlText)])
  doc.gpcBanner.buttons.forEach((btn, i) => rows.push([`gpcBanner.button.${i}`, esc(btn)]))

  rows.push(['preferenceModal.heading', esc(doc.preferenceModal.heading)])
  rows.push(['preferenceModal.subheading', esc(doc.preferenceModal.subheading)])
  rows.push(['preferenceModal.htmlText', esc(doc.preferenceModal.htmlText)])
  doc.preferenceModal.buttons.forEach((btn, i) => rows.push([`preferenceModal.button.${i}`, esc(btn)]))
  doc.preferenceModal.categories.forEach(cat => {
    rows.push([`category.${cat.id}.heading`, esc(cat.heading)])
    rows.push([`category.${cat.id}.htmlText`, esc(cat.htmlText)])
  })

  return rows.map(r => r.join(',')).join('\n')
}

// ── Import ─────────────────────────────────────────────────────────────────────

// Convert HTML string from import to stored contentjson format
function storeHtml(html: string): string {
  return serializeContent(htmlToJson(html))
}

function importFromDoc(doc: LocaleExportDoc, current: LocaleContent): LocaleContent {
  return {
    mainBanner: {
      heading: String(doc.mainBanner?.heading ?? current.mainBanner.heading),
      htmlText: storeHtml(String(doc.mainBanner?.htmlText ?? '')),
      buttonLabels: (doc.mainBanner?.buttons ?? []).map(String),
    },
    gpcBanner: {
      heading: String(doc.gpcBanner?.heading ?? current.gpcBanner.heading),
      htmlText: storeHtml(String(doc.gpcBanner?.htmlText ?? '')),
      buttonLabels: (doc.gpcBanner?.buttons ?? []).map(String),
    },
    preferenceModal: {
      heading: String(doc.preferenceModal?.heading ?? current.preferenceModal.heading),
      subheading: String(doc.preferenceModal?.subheading ?? current.preferenceModal.subheading),
      htmlText: storeHtml(String(doc.preferenceModal?.htmlText ?? '')),
      buttonLabels: (doc.preferenceModal?.buttons ?? []).map(String),
      categories: current.preferenceModal.categories.map(cat => {
        const imported = doc.preferenceModal?.categories?.find(c => c.id === cat.id)
        return imported
          ? { id: cat.id, heading: String(imported.heading), htmlText: storeHtml(String(imported.htmlText ?? '')) }
          : cat
      }),
    },
  }
}

export function importFromJson(
  jsonStr: string,
  current: LocaleContent,
): LocaleContent {
  return importFromDoc(JSON.parse(jsonStr) as LocaleExportDoc, current)
}

export function importFromCsv(
  csvStr: string,
  current: LocaleContent,
): LocaleContent {
  // Parse CSV into key→value map (handles quoted values with embedded commas/newlines)
  const map: Record<string, string> = {}
  const lines = csvStr.split(/\r?\n/)
  lines.slice(1).forEach(line => {
    if (!line.trim()) return
    const match = line.match(/^([^,]+),(.*)$/)
    if (!match) return
    const key = match[1]!.trim()
    let val = match[2]!.trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/""/g, '"')
    map[key] = val
  })

  const updated = structuredClone(current)

  if (map['mainBanner.heading']) updated.mainBanner.heading = map['mainBanner.heading']!
  if (map['mainBanner.htmlText'] !== undefined) updated.mainBanner.htmlText = storeHtml(map['mainBanner.htmlText']!)

  if (map['gpcBanner.heading']) updated.gpcBanner.heading = map['gpcBanner.heading']!
  if (map['gpcBanner.htmlText'] !== undefined) updated.gpcBanner.htmlText = storeHtml(map['gpcBanner.htmlText']!)

  if (map['preferenceModal.heading']) updated.preferenceModal.heading = map['preferenceModal.heading']!
  if (map['preferenceModal.subheading'] !== undefined) updated.preferenceModal.subheading = map['preferenceModal.subheading']!
  if (map['preferenceModal.htmlText'] !== undefined) updated.preferenceModal.htmlText = storeHtml(map['preferenceModal.htmlText']!)

  // Button labels
  const updateLabels = (prefix: string, labels: string[]) => {
    const newLabels = [...labels]
    for (let i = 0; ; i++) {
      const key = `${prefix}.button.${i}`
      if (map[key] === undefined) break
      newLabels[i] = map[key]!
    }
    return newLabels
  }
  updated.mainBanner.buttonLabels = updateLabels('mainBanner', updated.mainBanner.buttonLabels)
  updated.gpcBanner.buttonLabels = updateLabels('gpcBanner', updated.gpcBanner.buttonLabels)
  updated.preferenceModal.buttonLabels = updateLabels('preferenceModal', updated.preferenceModal.buttonLabels)

  // Categories
  updated.preferenceModal.categories = updated.preferenceModal.categories.map(cat => {
    const headingKey = `category.${cat.id}.heading`
    const bodyKey = `category.${cat.id}.htmlText`
    return {
      ...cat,
      heading: map[headingKey] ?? cat.heading,
      htmlText: map[bodyKey] !== undefined ? storeHtml(map[bodyKey]!) : cat.htmlText,
    }
  })

  return updated
}

// ── Multi-locale export ────────────────────────────────────────────────────────

export function exportAllLocalesJson(
  localeContents: Record<string, LocaleContent>,
  mainBanner: TemplateBannerUI,
  gpcBanner: TemplateBannerUI,
  preferenceModal: TemplateModalUI,
): string {
  const result: Record<string, LocaleExportDoc> = {}
  for (const [locale, content] of Object.entries(localeContents)) {
    result[locale] = toExportDoc(locale, content, mainBanner, gpcBanner, preferenceModal)
  }
  return JSON.stringify(result, null, 2)
}

// ── Multi-locale import ────────────────────────────────────────────────────────

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/i

export function importAllLocalesFromJson(
  jsonStr: string,
  base: LocaleContent,
): { locales: Record<string, LocaleContent>; skipped: string[] } {
  const parsed: unknown = JSON.parse(jsonStr)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON')

  // Single-locale format: has a top-level 'locale' string field
  const p = parsed as Record<string, unknown>
  if (typeof p['locale'] === 'string') {
    const doc = p as unknown as LocaleExportDoc
    const locale = doc.locale
    if (!LOCALE_RE.test(locale)) return { locales: {}, skipped: [locale] }
    return { locales: { [locale]: importFromDoc(doc, base) }, skipped: [] }
  }

  // Multi-locale format: { [locale]: LocaleExportDoc }
  const locales: Record<string, LocaleContent> = {}
  const skipped: string[] = []
  for (const [locale, doc] of Object.entries(p)) {
    if (!LOCALE_RE.test(locale) || !doc || typeof doc !== 'object' || Array.isArray(doc)) {
      skipped.push(locale)
      continue
    }
    try {
      locales[locale] = importFromDoc(doc as LocaleExportDoc, base)
    } catch {
      skipped.push(locale)
    }
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
