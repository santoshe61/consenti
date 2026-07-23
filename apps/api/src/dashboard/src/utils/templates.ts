import type { CookiePurpose, CookieMap, CategoryMap, TemplateButtonMap } from '@consenti/types'

export type BannerPosition = 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
export type ModalPosition = 'left' | 'right' | 'center'

// Visual appearance of the button
export type ButtonVisualType = 'primary' | 'secondary' | 'accent' | 'text'
// Behavior/action the button performs
export type ButtonAction = 'submit' | 'custom' | 'manage' | 'close' | 'link'

/**
 * A UI-template button as edited in the dashboard — carries `id` inline (unlike the wire
 * `TemplateButtonDef` shape, where id is the map key), same reasoning as {@link TemplateCookie}:
 * stable per-row identity for Preact's `.map()` and preserved authoring order. `id` is a machine
 * identifier (e.g. `'accept-all'`), not display text — UI templates own layout/behavior only. The
 * actual label a visitor sees is authored per-locale on the profile (`buttonLabels`, keyed by this
 * same button id) and shown next to `id` in the profile editor so authors know which button
 * they're labeling. Converted to/from the wire `TemplateButtonMap` only at the load/save boundary
 * (see {@link buttonsToMap}/{@link mapToButtonRows}).
 */
export interface TemplateButton {
  id: string
  type: ButtonVisualType
  action: ButtonAction
  cookies?: string[] | '*' | '!' | undefined
  url?: string | undefined
}

/**
 * A parameter row as edited in the dashboard — carries `id` inline (unlike the wire `Cookie`
 * shape, where id is the map key) so Preact's `.map()` has stable per-row identity and authors'
 * typed-in order is preserved. Converted to/from `CookieMap` only at the load/save boundary
 * (see {@link cookiesToMap}/{@link mapToCookieRows}).
 */
export interface TemplateCookie {
  id: string
  purpose?: CookiePurpose | undefined
  listenGpc: boolean
  /** Only meaningful when the owning category's legalBasis === 'consent'. */
  preGrant?: boolean | undefined
  tcfVendorId?: number | undefined
  tcfVendorName?: string | undefined
  tcfPurposes?: number[] | undefined
  cpraCategory?: 'sale' | 'sharing' | 'sensitive' | undefined
}

/**
 * A category row as edited in the dashboard — carries `id` inline, same reasoning as
 * {@link TemplateCookie}. Converted to/from `CategoryMap` at the load/save boundary
 * (see {@link categoriesToMap}/{@link mapToCategoryRows}).
 */
export interface TemplateCategoryDef {
  id: string
  headingTag: string
  legalBasis: 'mandatory' | 'consent' | 'legitimate_interest'
  cookies: string[]
}

export interface TemplateBannerUI {
  position: BannerPosition
  overlayOpacity: number
  showClose: boolean
  showLocaleSwitcher?: boolean
  headingTag: string
  buttons: TemplateButton[]
  /** Stack buttons vertically below this viewport width (px). 0 = disabled. Default: 576. */
  stackButtonsOnBreakpoint?: number
}

export interface TemplateModalUI {
  position: ModalPosition
  overlayOpacity: number
  showClose: boolean
  persistent: boolean
  showLocaleSwitcher?: boolean
  headingTag: string
  hasSubheading: boolean
  buttons: TemplateButton[]
  /** Trap keyboard Tab focus within the consent root while this modal is visible. */
  trapFocus?: boolean
}

/** A Consent Template — parameters + the categories that own their legal basis, edited together. */
export interface ConsentTemplate {
  id: string
  name: string
  cookies: TemplateCookie[]
  categories: TemplateCategoryDef[]
  createdAt: string
  updatedAt: string
}

export interface UITemplate {
  id: string
  name: string
  mainBanner: TemplateBannerUI
  gpcBanner: TemplateBannerUI
  preferenceModal: TemplateModalUI
  createdAt: string
  updatedAt: string
}

export interface CategoryContent {
  id: string
  heading: string
  htmlText: string
  /** Only meaningful when the category's legalBasis === 'legitimate_interest'; optional GDPR balancing-test text. */
  legitimateInterestDescription?: string
}

export interface LocaleContent {
  /** `buttonLabels` keyed by the UI template's button id — was a positional array matched by
   * index; now matched by key, robust against button reordering. */
  mainBanner: { heading: string; htmlText: string; buttonLabels: Record<string, string> }
  gpcBanner: { heading: string; htmlText: string; buttonLabels: Record<string, string> }
  preferenceModal: {
    heading: string
    subheading: string
    htmlText: string
    categories: CategoryContent[]
    buttonLabels: Record<string, string>
    /** Label + description for the optional consent-receipt checkbox (shown when the profile's `allowReceipt` is true). */
    receiptLabel?: string
    receiptDescription?: string
  }
}

// ── Row ↔ map conversion ────────────────────────────────────────────────────────
// The dashboard edits parameters/categories as ordered arrays (id inline, stable render
// identity); the wire format (@consenti/types CookieMap/CategoryMap) keys by id instead.

export function cookiesToMap(rows: TemplateCookie[]): CookieMap {
  const map: CookieMap = {}
  for (const c of rows) {
    map[c.id] = {
      ...(c.purpose !== undefined ? { purpose: c.purpose } : {}),
      listenGpc: c.listenGpc,
      ...(c.preGrant !== undefined ? { preGrant: c.preGrant } : {}),
      ...(c.tcfVendorId !== undefined ? { tcfVendorId: c.tcfVendorId } : {}),
      ...(c.tcfPurposes !== undefined ? { tcfPurposes: c.tcfPurposes } : {}),
      ...(c.cpraCategory !== undefined ? { cpraCategory: c.cpraCategory } : {}),
    }
  }
  return map
}

export function mapToCookieRows(map: CookieMap): TemplateCookie[] {
  return Object.entries(map).map(([id, c]) => ({ id, listenGpc: false, ...c }))
}

export function categoriesToMap(rows: TemplateCategoryDef[]): CategoryMap {
  const map: CategoryMap = {}
  for (const { id, headingTag, legalBasis, cookies } of rows) {
    map[id] = {
      heading: id,
      htmlText: '',
      headingTag,
      legalBasis,
      cookies,
    }
  }
  return map
}

export function mapToCategoryRows(map: CategoryMap): TemplateCategoryDef[] {
  return Object.entries(map).map(([id, cat]) => ({
    id,
    headingTag: cat.headingTag ?? 'h3',
    legalBasis: cat.legalBasis,
    cookies: cat.cookies,
  }))
}

export function buttonsToMap(rows: TemplateButton[]): TemplateButtonMap {
  const map: TemplateButtonMap = {}
  for (const { id, type, action, cookies, url } of rows) {
    map[id] = {
      type,
      action,
      ...(cookies !== undefined ? { cookies } : {}),
      ...(url !== undefined ? { url } : {}),
    }
  }
  return map
}

export function mapToButtonRows(map: TemplateButtonMap): TemplateButton[] {
  return Object.entries(map).map(([id, btn]) => ({
    id,
    type: btn.type ?? 'primary',
    action: btn.action,
    ...(btn.cookies !== undefined ? { cookies: btn.cookies } : {}),
    ...(btn.url !== undefined ? { url: btn.url } : {}),
  }))
}

const UI_KEY = 'consenti_ui_templates'

function loadArr<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[] } catch { return [] }
}

function saveArr<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const uiTemplateStore = {
  list: (): UITemplate[] => loadArr<UITemplate>(UI_KEY),
  get: (id: string): UITemplate | undefined =>
    loadArr<UITemplate>(UI_KEY).find(t => t.id === id),
  save: (data: Omit<UITemplate, 'id' | 'createdAt' | 'updatedAt'>): UITemplate => {
    const all = loadArr<UITemplate>(UI_KEY)
    const now = new Date().toISOString()
    const t: UITemplate = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    saveArr(UI_KEY, [...all, t])
    return t
  },
  update: (id: string, data: Partial<Omit<UITemplate, 'id' | 'createdAt'>>): void => {
    const all = loadArr<UITemplate>(UI_KEY)
    const idx = all.findIndex(t => t.id === id)
    if (idx !== -1) {
      all[idx] = { ...all[idx]!, ...data, updatedAt: new Date().toISOString() }
      saveArr(UI_KEY, all)
    }
  },
  remove: (id: string): void =>
    saveArr(UI_KEY, loadArr<UITemplate>(UI_KEY).filter(t => t.id !== id)),
}

export function defaultCookies(): TemplateCookie[] {
  return [
    { id: "security_storage", purpose: "necessary", listenGpc: false },
    { id: "functionality_storage", purpose: "functional", listenGpc: false },
    { id: "personalization_storage", purpose: "preferences", listenGpc: false },
    { id: "analytics_storage", purpose: "analytics", listenGpc: true },
    { id: "ad_storage", purpose: "marketing", listenGpc: true, cpraCategory: "sharing" },
    { id: "ad_user_data", purpose: "marketing", listenGpc: true, cpraCategory: "sale" },
    { id: "ad_personalization", purpose: "marketing", listenGpc: true, cpraCategory: "sharing" },
  ]
}

export function defaultCategories(): TemplateCategoryDef[] {
  return [
    { id: 'necessary', headingTag: 'h3', legalBasis: 'mandatory', cookies: ['security_storage'] },
    { id: 'functional', headingTag: 'h3', legalBasis: 'legitimate_interest', cookies: ['functionality_storage', 'personalization_storage'] },
    { id: 'analytics', headingTag: 'h3', legalBasis: 'consent', cookies: ['analytics_storage'] },
    { id: 'marketing', headingTag: 'h3', legalBasis: 'consent', cookies: ['ad_storage', 'ad_user_data', 'ad_personalization'] },
  ]
}

export function defaultUISettings(): Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'> {
  return {
    mainBanner: {
      position: 'bottom',
      overlayOpacity: 0,
      showClose: false,
      headingTag: 'h2',
      buttons: [
        { id: 'accept-all', type: 'primary', action: 'custom', cookies: '*' },
        { id: 'reject-optional', type: 'accent', action: 'custom', cookies: '!' },
        { id: 'customize', type: 'secondary', action: 'manage' },
      ],
    },
    gpcBanner: {
      position: 'bottom',
      overlayOpacity: 0,
      showClose: false,
      headingTag: 'h2',
      buttons: [
        { id: 'accept-all', type: 'primary', action: 'custom', cookies: '*' },
        { id: 'continue-with-gpc', type: 'accent', action: 'custom', cookies: '!' },
      ],
    },
    preferenceModal: {
      position: 'right',
      overlayOpacity: 50,
      showClose: true,
      persistent: false,
      headingTag: 'h2',
      hasSubheading: true,
      buttons: [
        { id: 'save-preferences', type: 'primary', action: 'submit' },
        { id: 'accept-all', type: 'secondary', action: 'custom', cookies: '*' },
      ],
    },
  }
}

/** English starter text for the default button ids above — used only by "Load Defaults"; authors can retype anything. */
const BUTTON_LABEL_DEFAULTS: Record<string, string> = {
  'accept-all': 'Accept All',
  'reject-optional': 'Reject Optional',
  customize: 'Customize',
  'continue-with-gpc': 'Continue with GPC',
  'save-preferences': 'Save Preferences',
}

/** Falls back to a Title Case label derived from the id (`'accept-everything'` → `'Accept Everything'`) for
 * any button id not in `BUTTON_LABEL_DEFAULTS` — e.g. after an author renames a button's id — so the preview
 * always shows readable placeholder text instead of going blank. */
function defaultButtonLabel(id: string): string {
  return BUTTON_LABEL_DEFAULTS[id] ?? id.split('-').filter(Boolean).map(w => w[0]!.toUpperCase() + w.slice(1)).join(' ')
}

function defaultButtonLabels(buttons: TemplateButton[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const b of buttons) result[b.id] = defaultButtonLabel(b.id)
  return result
}

export function defaultLocaleContent(categories: TemplateCategoryDef[], ui?: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'>): LocaleContent {
  const categoryDefaults: Record<string, { heading: string; htmlText: string }> = {
    necessary: {
      heading: 'Necessary',
      htmlText: 'Essential cookies required for the website to function properly. These cannot be disabled.',
    },
    functional: {
      heading: 'Functional',
      htmlText: 'Cookies for optional features and remembering your preferences. The site works without them.',
    },
    analytics: {
      heading: 'Analytics',
      htmlText: 'Cookies that help us understand how visitors interact with our website.',
    },
    marketing: {
      heading: 'Marketing',
      htmlText: 'Cookies used for advertising and tracking across websites.',
    },
  }
  return {
    mainBanner: {
      heading: 'We value your privacy',
      htmlText: 'We use cookies to improve your experience, analyze site usage, and for marketing. Please accept or manage your preferences.',
      buttonLabels: ui ? defaultButtonLabels(ui.mainBanner.buttons) : {},
    },
    gpcBanner: {
      heading: 'Global Privacy Control Detected',
      htmlText: 'We detected a GPC signal from your browser. Your preferences have been automatically adjusted.',
      buttonLabels: ui ? defaultButtonLabels(ui.gpcBanner.buttons) : {},
    },
    preferenceModal: {
      heading: 'Privacy Preferences',
      subheading: 'Manage your cookie preferences below.',
      htmlText: '',
      buttonLabels: ui ? defaultButtonLabels(ui.preferenceModal.buttons) : {},
      categories: categories.map(cat => ({
        id: cat.id,
        heading: categoryDefaults[cat.id]?.heading ?? cat.id,
        htmlText: categoryDefaults[cat.id]?.htmlText ?? '',
      })),
      receiptLabel: 'Get a copy of my consent choices (JSON)',
      receiptDescription: 'A JSON file will be downloaded to your device when you save your preferences.',
    },
  }
}

// Migrate a button from the old single-type format to the new type+action format. `id` is the
// button's key in the stored `TemplateButtonMap` — authoritative, not derived from the value.
function migrateButton(id: string, b: Record<string, unknown>): TemplateButton {
  // Already in new action format
  if (b['action']) return { ...b, id } as unknown as TemplateButton

  const oldType = b['type'] as string
  const cookies = b['cookies'] as TemplateButton['cookies'] | undefined

  const OLD_ACTION_MAP: Record<string, { type: ButtonVisualType; action: ButtonAction }> = {
    submit: { type: 'primary', action: 'submit' },
    manage: { type: 'secondary', action: 'manage' },
    close: { type: 'text', action: 'close' },
    reject: { type: 'accent', action: 'custom' },
  }
  if (OLD_ACTION_MAP[oldType]) {
    const { type, action } = OLD_ACTION_MAP[oldType]!
    const btn: TemplateButton = { id, type, action }
    if (action === 'custom') btn.cookies = cookies ?? '!'
    return btn
  }
  // Was a visual type — infer action from cookies presence
  const action: ButtonAction = cookies ? 'custom' : 'submit'
  const btn: TemplateButton = {
    id,
    type: (oldType as ButtonVisualType) ?? 'primary',
    action,
  }
  if (action === 'custom') btn.cookies = cookies ?? '!'
  return btn
}

function resolvedButtonsMap(buttons: TemplateButton[], labels: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const btn of buttons) {
    result[btn.id] = {
      text: labels[btn.id] || '',
      style: btn.type,
      action: btn.action,
      ...(btn.cookies !== undefined ? { cookies: btn.cookies } : {}),
      ...(btn.url !== undefined ? { url: btn.url } : {}),
    }
  }
  return result
}

export function composeProfileJson(
  cookies: TemplateCookie[],
  categories: TemplateCategoryDef[],
  ui: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'>,
  defaultLocale: string,
  localeContents: Record<string, LocaleContent>,
  meta: { consentTemplateId?: string; uiTemplateId?: string },
  expiryDays?: number,
  allowedOrigins?: string[],
  regulations?: string[],
  dpdpa?: { dataFiduciary: string; grievanceEmail: string; purposeDescription?: string },
): object {
  const translations: Record<string, unknown> = {}
  for (const [locale, content] of Object.entries(localeContents)) {
    translations[locale] = {
      mainBanner: {
        position: ui.mainBanner.position,
        overlayOpacity: ui.mainBanner.overlayOpacity,
        showClose: ui.mainBanner.showClose,
        ...(ui.mainBanner.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
        headingTag: ui.mainBanner.headingTag,
        heading: content.mainBanner.heading,
        htmlText: content.mainBanner.htmlText,
        buttons: resolvedButtonsMap(ui.mainBanner.buttons, content.mainBanner.buttonLabels),
      },
      gpcBanner: {
        position: ui.gpcBanner.position,
        overlayOpacity: ui.gpcBanner.overlayOpacity,
        showClose: ui.gpcBanner.showClose,
        ...(ui.gpcBanner.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
        headingTag: ui.gpcBanner.headingTag,
        heading: content.gpcBanner.heading,
        htmlText: content.gpcBanner.htmlText,
        buttons: resolvedButtonsMap(ui.gpcBanner.buttons, content.gpcBanner.buttonLabels),
      },
      preferenceModal: {
        position: ui.preferenceModal.position,
        overlayOpacity: ui.preferenceModal.overlayOpacity,
        showClose: ui.preferenceModal.showClose,
        ...(ui.preferenceModal.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
        persistent: ui.preferenceModal.persistent,
        headingTag: ui.preferenceModal.headingTag,
        heading: content.preferenceModal.heading,
        ...(ui.preferenceModal.hasSubheading && content.preferenceModal.subheading
          ? { subheading: content.preferenceModal.subheading }
          : {}),
        ...(content.preferenceModal.htmlText ? { htmlText: content.preferenceModal.htmlText } : {}),
        ...(content.preferenceModal.receiptLabel ? { receiptLabel: content.preferenceModal.receiptLabel } : {}),
        ...(content.preferenceModal.receiptDescription ? { receiptDescription: content.preferenceModal.receiptDescription } : {}),
        buttons: resolvedButtonsMap(ui.preferenceModal.buttons, content.preferenceModal.buttonLabels),
        categories: Object.fromEntries(categories.map(cat => {
          const ct = content.preferenceModal.categories.find(c => c.id === cat.id)
          return [cat.id, {
            heading: ct?.heading ?? cat.id,
            headingTag: cat.headingTag,
            htmlText: ct?.htmlText ?? '',
            legalBasis: cat.legalBasis,
            ...(cat.legalBasis === 'legitimate_interest' && ct?.legitimateInterestDescription
              ? { legitimateInterestDescription: ct.legitimateInterestDescription }
              : {}),
            cookies: cat.cookies,
          }]
        })),
      },
    }
  }
  return {
    _meta: meta,
    cookies: cookiesToMap(cookies),
    defaultLocale,
    ...(expiryDays !== undefined ? { expiryDays } : {}),
    translations,
    ...(allowedOrigins && allowedOrigins.length > 0 ? { allowedOrigins } : {}),
    ...(regulations && regulations.length > 0 ? { regulations } : {}),
    ...(dpdpa ? { dpdpa } : {}),
  }
}

// Extract editable state from an existing stored profileJson
export function extractFromProfileJson(profileJson: unknown): {
  cookies: TemplateCookie[]
  categories: TemplateCategoryDef[]
  ui: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'>
  localeContents: Record<string, LocaleContent>
  defaultLocale: string
  expiryDays?: number
  meta: { consentTemplateId?: string; uiTemplateId?: string }
  allowedOrigins: string[]
  regulations?: string[]
  dpdpa?: { dataFiduciary: string; grievanceEmail: string; purposeDescription?: string }
} | null {
  try {
    const pj = profileJson as Record<string, unknown>
    type RawButton = Record<string, unknown>
    type RawButtonMap = Record<string, RawButton>
    type RawLocale = {
      mainBanner: { position?: string; overlayOpacity?: number; showClose?: boolean; headingTag?: string; heading?: string; htmlText: string; buttons?: RawButtonMap }
      gpcBanner?: { position?: string; overlayOpacity?: number; showClose?: boolean; headingTag?: string; heading?: string; htmlText?: string; buttons?: RawButtonMap }
      preferenceModal: {
        position?: string; overlayOpacity?: number; showClose?: boolean; persistent?: boolean; headingTag?: string; heading?: string; subheading?: string; htmlText?: string; buttons?: RawButtonMap
        categories?: Record<string, { heading: string; headingTag?: string; htmlText?: string; legalBasis?: string; legitimateInterestDescription?: string; cookies?: string[] }>
        receiptLabel?: string; receiptDescription?: string
      }
    }
    const translations = (pj['translations'] ?? {}) as Record<string, RawLocale>
    const defaultLocale = (pj['defaultLocale'] as string) ?? 'en'
    const expiryDays = typeof pj['expiryDays'] === 'number' ? pj['expiryDays'] : undefined
    const rawCookies: TemplateCookie[] = mapToCookieRows((pj['cookies'] as CookieMap) ?? {})
    const meta = (pj['_meta'] as { consentTemplateId?: string; uiTemplateId?: string }) ?? {}
    const firstLocale = Object.values(translations)[0]
    if (!firstLocale) return null

    const rawCategories = (firstLocale.preferenceModal.categories ?? {}) as CategoryMap
    const categories: TemplateCategoryDef[] = Object.entries(rawCategories).map(([id, cat]) => ({
      id,
      headingTag: cat.headingTag ?? 'h3',
      legalBasis: (cat.legalBasis ?? 'consent') as TemplateCategoryDef['legalBasis'],
      cookies: cat.cookies ?? [],
    }))

    const ui: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
      mainBanner: {
        position: (firstLocale.mainBanner.position ?? 'bottom') as BannerPosition,
        overlayOpacity: firstLocale.mainBanner.overlayOpacity ?? 0,
        showClose: firstLocale.mainBanner.showClose ?? false,
        headingTag: firstLocale.mainBanner.headingTag ?? 'h2',
        buttons: Object.entries(firstLocale.mainBanner.buttons ?? {}).map(([id, b]) => migrateButton(id, b)),
      },
      gpcBanner: {
        position: (firstLocale.gpcBanner?.position ?? 'bottom') as BannerPosition,
        overlayOpacity: firstLocale.gpcBanner?.overlayOpacity ?? 0,
        showClose: firstLocale.gpcBanner?.showClose ?? false,
        headingTag: firstLocale.gpcBanner?.headingTag ?? 'h2',
        buttons: Object.entries(firstLocale.gpcBanner?.buttons ?? {}).map(([id, b]) => migrateButton(id, b)),
      },
      preferenceModal: {
        position: (firstLocale.preferenceModal.position ?? 'right') as ModalPosition,
        overlayOpacity: firstLocale.preferenceModal.overlayOpacity ?? 50,
        showClose: firstLocale.preferenceModal.showClose ?? true,
        persistent: firstLocale.preferenceModal.persistent ?? false,
        headingTag: firstLocale.preferenceModal.headingTag ?? 'h2',
        hasSubheading: !!firstLocale.preferenceModal.subheading,
        buttons: Object.entries(firstLocale.preferenceModal.buttons ?? {}).map(([id, b]) => migrateButton(id, b)),
      },
    }

    const localeContents: Record<string, LocaleContent> = {}
    for (const [locale, data] of Object.entries(translations)) {
      const localeCategories = (data.preferenceModal.categories ?? {}) as CategoryMap
      localeContents[locale] = {
        mainBanner: {
          heading: data.mainBanner.heading ?? '',
          htmlText: data.mainBanner.htmlText,
          // Buttons in stored translations already have locale text applied
          buttonLabels: Object.fromEntries(Object.entries(data.mainBanner.buttons ?? {}).map(([id, b]) => [id, (b['text'] as string) ?? ''])),
        },
        gpcBanner: {
          heading: data.gpcBanner?.heading ?? '',
          htmlText: data.gpcBanner?.htmlText ?? '',
          buttonLabels: Object.fromEntries(Object.entries(data.gpcBanner?.buttons ?? {}).map(([id, b]) => [id, (b['text'] as string) ?? ''])),
        },
        preferenceModal: {
          heading: data.preferenceModal.heading ?? '',
          subheading: data.preferenceModal.subheading ?? '',
          htmlText: data.preferenceModal.htmlText ?? '',
          buttonLabels: Object.fromEntries(Object.entries(data.preferenceModal.buttons ?? {}).map(([id, b]) => [id, (b['text'] as string) ?? ''])),
          categories: Object.entries(localeCategories).map(([id, c]) => ({
            id,
            heading: c.heading,
            htmlText: c.htmlText ?? '',
            ...(c.legitimateInterestDescription !== undefined ? { legitimateInterestDescription: c.legitimateInterestDescription } : {}),
          })),
          ...(data.preferenceModal.receiptLabel !== undefined ? { receiptLabel: data.preferenceModal.receiptLabel } : {}),
          ...(data.preferenceModal.receiptDescription !== undefined ? { receiptDescription: data.preferenceModal.receiptDescription } : {}),
        },
      }
    }
    const allowedOrigins = Array.isArray(pj['allowedOrigins']) ? (pj['allowedOrigins'] as string[]) : []
    const validRegulations = ['gdpr', 'ccpa', 'cpra', 'dpdpa']
    let regulations: string[] | undefined
    if (Array.isArray(pj['regulations'])) {
      const filtered = (pj['regulations'] as unknown[]).filter(r => typeof r === 'string' && validRegulations.includes(r)) as string[]
      if (filtered.length > 0) regulations = filtered
    } else if (typeof pj['regulation'] === 'string' && validRegulations.includes(pj['regulation'])) {
      regulations = [pj['regulation']]
    }
    const rawDpdpa = pj['dpdpa'] as Record<string, unknown> | undefined
    const dpdpa = rawDpdpa && typeof rawDpdpa['dataFiduciary'] === 'string' && typeof rawDpdpa['grievanceEmail'] === 'string'
      ? {
        dataFiduciary: rawDpdpa['dataFiduciary'],
        grievanceEmail: rawDpdpa['grievanceEmail'],
        ...(typeof rawDpdpa['purposeDescription'] === 'string' ? { purposeDescription: rawDpdpa['purposeDescription'] } : {}),
      }
      : undefined
    return {
      cookies: rawCookies,
      categories,
      ui,
      localeContents,
      defaultLocale,
      ...(expiryDays !== undefined ? { expiryDays } : {}),
      meta,
      allowedOrigins,
      ...(regulations !== undefined ? { regulations } : {}),
      ...(dpdpa !== undefined ? { dpdpa } : {}),
    }
  } catch {
    return null
  }
}
