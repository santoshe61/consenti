export type BannerPosition = 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
export type ModalPosition = 'left' | 'right' | 'center'

// Visual appearance of the button
export type ButtonVisualType = 'primary' | 'secondary' | 'accent' | 'text'
// Behavior/action the button performs
export type ButtonAction = 'submit' | 'custom' | 'manage' | 'close' | 'link'

export interface TemplateButton {
  text: string
  type: ButtonVisualType
  action: ButtonAction
  cookies?: string[] | '*' | '!' | undefined
  url?: string | undefined
}

export interface TemplateCookie {
  id: string
  type: 'consent' | 'legitimate_interest'
  mandatory: boolean
  listenGpc: boolean
  expiry: number
  tcfVendorId?: number | undefined
  tcfPurposes?: number[] | undefined
  cpraCategory?: 'sale' | 'sharing' | 'sensitive' | undefined
}

export interface TemplateCategoryDef {
  id: string
  headingTag: string
  mandatory: boolean
  type: 'consent' | 'legitimate_interest'
  liEnabled: boolean
  cookies: string[]
}

export interface TemplateBannerUI {
  position: BannerPosition
  overlayOpacity: number
  showClose: boolean
  showLocaleSwitcher?: boolean
  headingTag: string
  buttons: TemplateButton[]
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
  categories: TemplateCategoryDef[]
}

export interface CookieTemplate {
  id: string
  name: string
  cookies: TemplateCookie[]
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
}

export interface LocaleContent {
  mainBanner: { heading: string; htmlText: string; buttonLabels: string[] }
  gpcBanner: { heading: string; htmlText: string; buttonLabels: string[] }
  preferenceModal: {
    heading: string
    subheading: string
    htmlText: string
    categories: CategoryContent[]
    buttonLabels: string[]
  }
}

const COOKIE_KEY = 'consenti_cookie_templates'
const UI_KEY = 'consenti_ui_templates'

function loadArr<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[] } catch { return [] }
}

function saveArr<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export const cookieTemplateStore = {
  list: (): CookieTemplate[] => loadArr<CookieTemplate>(COOKIE_KEY),
  get: (id: string): CookieTemplate | undefined =>
    loadArr<CookieTemplate>(COOKIE_KEY).find(t => t.id === id),
  save: (data: Omit<CookieTemplate, 'id' | 'createdAt' | 'updatedAt'>): CookieTemplate => {
    const all = loadArr<CookieTemplate>(COOKIE_KEY)
    const now = new Date().toISOString()
    const t: CookieTemplate = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    saveArr(COOKIE_KEY, [...all, t])
    return t
  },
  update: (id: string, data: Partial<Omit<CookieTemplate, 'id' | 'createdAt'>>): void => {
    const all = loadArr<CookieTemplate>(COOKIE_KEY)
    const idx = all.findIndex(t => t.id === id)
    if (idx !== -1) {
      all[idx] = { ...all[idx]!, ...data, updatedAt: new Date().toISOString() }
      saveArr(COOKIE_KEY, all)
    }
  },
  remove: (id: string): void =>
    saveArr(COOKIE_KEY, loadArr<CookieTemplate>(COOKIE_KEY).filter(t => t.id !== id)),
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
    { id: 'necessary', type: 'consent', mandatory: true, listenGpc: false, expiry: 365 },
    { id: 'analytics_storage', type: 'consent', mandatory: false, listenGpc: true, expiry: 365 },
    { id: 'ad_storage', type: 'consent', mandatory: false, listenGpc: true, expiry: 365 },
    { id: 'ad_user_data', type: 'consent', mandatory: false, listenGpc: true, expiry: 365 },
    { id: 'ad_personalization', type: 'consent', mandatory: false, listenGpc: true, expiry: 365 },
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
        { text: 'Accept All', type: 'primary', action: 'custom', cookies: '*' },
        { text: 'Reject All', type: 'accent', action: 'custom', cookies: '!' },
        { text: 'Manage Preferences', type: 'secondary', action: 'manage' },
      ],
    },
    gpcBanner: {
      position: 'bottom',
      overlayOpacity: 0,
      showClose: false,
      headingTag: 'h2',
      buttons: [
        { text: 'Accept All', type: 'primary', action: 'custom', cookies: '*' },
        { text: 'Continue with GPC', type: 'accent', action: 'custom', cookies: '!' },
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
        { text: 'Save Preferences', type: 'primary', action: 'submit' },
        { text: 'Accept All', type: 'secondary', action: 'custom', cookies: '*' },
      ],
      categories: [
        { id: 'necessary', headingTag: 'h3', mandatory: true, type: 'consent', liEnabled: false, cookies: ['necessary'] },
        { id: 'analytics', headingTag: 'h3', mandatory: false, type: 'consent', liEnabled: false, cookies: ['analytics_storage'] },
        { id: 'marketing', headingTag: 'h3', mandatory: false, type: 'consent', liEnabled: false, cookies: ['ad_storage', 'ad_user_data', 'ad_personalization'] },
      ],
    },
  }
}

export function defaultLocaleContent(
  categories: TemplateCategoryDef[],
  ui?: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'>,
): LocaleContent {
  const categoryDefaults: Record<string, { heading: string; htmlText: string }> = {
    necessary: {
      heading: 'Necessary',
      htmlText: 'Essential cookies required for the website to function properly. These cannot be disabled.',
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
      buttonLabels: ui?.mainBanner.buttons.map(b => b.text) ?? [],
    },
    gpcBanner: {
      heading: 'Global Privacy Control Detected',
      htmlText: 'We detected a GPC signal from your browser. Your preferences have been automatically adjusted.',
      buttonLabels: ui?.gpcBanner.buttons.map(b => b.text) ?? [],
    },
    preferenceModal: {
      heading: 'Privacy Preferences',
      subheading: 'Manage your cookie preferences below.',
      htmlText: '',
      buttonLabels: ui?.preferenceModal.buttons.map(b => b.text) ?? [],
      categories: categories.map(cat => ({
        id: cat.id,
        heading: categoryDefaults[cat.id]?.heading ?? cat.id,
        htmlText: categoryDefaults[cat.id]?.htmlText ?? '',
      })),
    },
  }
}

// Migrate a button from the old single-type format to the new type+action format
function migrateButton(b: Record<string, unknown>): TemplateButton {
  // Already in new format
  if (b['action']) return b as unknown as TemplateButton

  const oldType = b['type'] as string
  const cookies = b['cookies'] as TemplateButton['cookies'] | undefined

  const OLD_ACTION_MAP: Record<string, { type: ButtonVisualType; action: ButtonAction }> = {
    submit: { type: 'primary', action: 'submit' },
    manage: { type: 'secondary', action: 'manage' },
    close:  { type: 'text', action: 'close' },
    reject: { type: 'accent', action: 'custom' },
  }
  if (OLD_ACTION_MAP[oldType]) {
    const { type, action } = OLD_ACTION_MAP[oldType]!
    const btn: TemplateButton = { text: b['text'] as string, type, action }
    if (action === 'custom') btn.cookies = cookies ?? '!'
    return btn
  }
  // Was a visual type — infer action from cookies presence
  const action: ButtonAction = cookies ? 'custom' : 'submit'
  const btn: TemplateButton = {
    text: b['text'] as string,
    type: (oldType as ButtonVisualType) ?? 'primary',
    action,
  }
  if (action === 'custom') btn.cookies = cookies ?? '!'
  return btn
}

export function composeProfileJson(
  cookies: TemplateCookie[],
  ui: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'>,
  defaultLocale: string,
  localeContents: Record<string, LocaleContent>,
  meta: { cookieTemplateId?: string; uiTemplateId?: string },
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
        buttons: ui.mainBanner.buttons.map((btn, i) => ({
          ...btn,
          text: content.mainBanner.buttonLabels[i] || btn.text,
        })),
      },
      gpcBanner: {
        position: ui.gpcBanner.position,
        overlayOpacity: ui.gpcBanner.overlayOpacity,
        showClose: ui.gpcBanner.showClose,
        ...(ui.gpcBanner.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
        headingTag: ui.gpcBanner.headingTag,
        heading: content.gpcBanner.heading,
        htmlText: content.gpcBanner.htmlText,
        buttons: ui.gpcBanner.buttons.map((btn, i) => ({
          ...btn,
          text: content.gpcBanner.buttonLabels[i] || btn.text,
        })),
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
        buttons: ui.preferenceModal.buttons.map((btn, i) => ({
          ...btn,
          text: content.preferenceModal.buttonLabels[i] || btn.text,
        })),
        categories: ui.preferenceModal.categories.map(cat => {
          const ct = content.preferenceModal.categories.find(c => c.id === cat.id)
          return {
            id: cat.id,
            heading: ct?.heading ?? cat.id,
            headingTag: cat.headingTag,
            htmlText: ct?.htmlText ?? '',
            mandatory: cat.mandatory,
            type: cat.type,
            ...(cat.liEnabled ? { legitimateInterest: { enabled: true } } : {}),
            cookies: cat.cookies,
          }
        }),
      },
    }
  }
  return {
    _meta: meta,
    cookies,
    defaultLocale,
    translations,
    ...(allowedOrigins && allowedOrigins.length > 0 ? { allowedOrigins } : {}),
    ...(regulations && regulations.length > 0 ? { regulations } : {}),
    ...(dpdpa ? { dpdpa } : {}),
  }
}

// Extract editable state from an existing stored profileJson
export function extractFromProfileJson(profileJson: unknown): {
  cookies: TemplateCookie[]
  ui: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'>
  localeContents: Record<string, LocaleContent>
  defaultLocale: string
  meta: { cookieTemplateId?: string; uiTemplateId?: string }
  allowedOrigins: string[]
  regulations?: string[]
  dpdpa?: { dataFiduciary: string; grievanceEmail: string; purposeDescription?: string }
} | null {
  try {
    const pj = profileJson as Record<string, unknown>
    type RawButton = Record<string, unknown>
    type RawLocale = {
      mainBanner: { position?: string; overlayOpacity?: number; showClose?: boolean; headingTag?: string; heading?: string; htmlText: string; buttons?: RawButton[] }
      gpcBanner?: { position?: string; overlayOpacity?: number; showClose?: boolean; headingTag?: string; heading?: string; htmlText?: string; buttons?: RawButton[] }
      preferenceModal: { position?: string; overlayOpacity?: number; showClose?: boolean; persistent?: boolean; headingTag?: string; heading?: string; subheading?: string; htmlText?: string; buttons?: RawButton[]; categories?: Array<{ id: string; heading: string; headingTag?: string; htmlText?: string; mandatory?: boolean; type?: string; legitimateInterest?: unknown; cookies?: string[] }> }
    }
    const translations = (pj['translations'] ?? {}) as Record<string, RawLocale>
    const defaultLocale = (pj['defaultLocale'] as string) ?? 'en'
    const rawCookies = (pj['cookies'] as TemplateCookie[]) ?? []
    const meta = (pj['_meta'] as { cookieTemplateId?: string; uiTemplateId?: string }) ?? {}
    const firstLocale = Object.values(translations)[0]
    if (!firstLocale) return null

    const ui: Omit<UITemplate, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
      mainBanner: {
        position: (firstLocale.mainBanner.position ?? 'bottom') as BannerPosition,
        overlayOpacity: firstLocale.mainBanner.overlayOpacity ?? 0,
        showClose: firstLocale.mainBanner.showClose ?? false,
        headingTag: firstLocale.mainBanner.headingTag ?? 'h2',
        buttons: (firstLocale.mainBanner.buttons ?? []).map(migrateButton),
      },
      gpcBanner: {
        position: (firstLocale.gpcBanner?.position ?? 'bottom') as BannerPosition,
        overlayOpacity: firstLocale.gpcBanner?.overlayOpacity ?? 0,
        showClose: firstLocale.gpcBanner?.showClose ?? false,
        headingTag: firstLocale.gpcBanner?.headingTag ?? 'h2',
        buttons: (firstLocale.gpcBanner?.buttons ?? []).map(migrateButton),
      },
      preferenceModal: {
        position: (firstLocale.preferenceModal.position ?? 'right') as ModalPosition,
        overlayOpacity: firstLocale.preferenceModal.overlayOpacity ?? 50,
        showClose: firstLocale.preferenceModal.showClose ?? true,
        persistent: firstLocale.preferenceModal.persistent ?? false,
        headingTag: firstLocale.preferenceModal.headingTag ?? 'h2',
        hasSubheading: !!firstLocale.preferenceModal.subheading,
        buttons: (firstLocale.preferenceModal.buttons ?? []).map(migrateButton),
        categories: (firstLocale.preferenceModal.categories ?? []).map(cat => ({
          id: cat.id,
          headingTag: cat.headingTag ?? 'h3',
          mandatory: cat.mandatory ?? false,
          type: (cat.type ?? 'consent') as 'consent' | 'legitimate_interest',
          liEnabled: !!cat.legitimateInterest,
          cookies: cat.cookies ?? [],
        })),
      },
    }

    const localeContents: Record<string, LocaleContent> = {}
    for (const [locale, data] of Object.entries(translations)) {
      localeContents[locale] = {
        mainBanner: {
          heading: data.mainBanner.heading ?? '',
          htmlText: data.mainBanner.htmlText,
          // Buttons in stored translations already have locale text applied
          buttonLabels: (data.mainBanner.buttons ?? []).map(b => (b as Record<string, unknown>)['text'] as string ?? ''),
        },
        gpcBanner: {
          heading: data.gpcBanner?.heading ?? '',
          htmlText: data.gpcBanner?.htmlText ?? '',
          buttonLabels: (data.gpcBanner?.buttons ?? []).map(b => (b as Record<string, unknown>)['text'] as string ?? ''),
        },
        preferenceModal: {
          heading: data.preferenceModal.heading ?? '',
          subheading: data.preferenceModal.subheading ?? '',
          htmlText: data.preferenceModal.htmlText ?? '',
          buttonLabels: (data.preferenceModal.buttons ?? []).map(b => (b as Record<string, unknown>)['text'] as string ?? ''),
          categories: (data.preferenceModal.categories ?? []).map(c => ({
            id: c.id,
            heading: c.heading,
            htmlText: c.htmlText ?? '',
          })),
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
      ui,
      localeContents,
      defaultLocale,
      meta,
      allowedOrigins,
      ...(regulations !== undefined ? { regulations } : {}),
      ...(dpdpa !== undefined ? { dpdpa } : {}),
    }
  } catch {
    return null
  }
}
