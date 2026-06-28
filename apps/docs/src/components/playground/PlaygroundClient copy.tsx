'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  ConsentiConfig,
  ConsentValue,
} from '@consenti/ui'

interface WidgetHandle {
  destroy(): void
  init(): Promise<void>
  onReady(cb: () => void): void
  bannerVisibility(): 'main' | 'gpc' | false
  modalVisibility(): 'preference' | false
  hasConsent(): boolean
  getConsentDate(): Date | false
  getConsent(): ConsentValue | null
  getGTMConsent(): Record<string, string> | null
  showBanner(gpc?: boolean): void
  hideBanner(): void
  showModal(): void
  hideModal(): void
  submitConsent(consent: Partial<ConsentValue>): Promise<void>
  deleteConsent(): Promise<void>
  reConsent(): Promise<void>
}

// ── Local state types ──────────────────────────────────────────────────────────

interface CookieItem {
  id: string
  mandatory: boolean
  listenGpc: boolean
  expiry: number
  cpraCategory: '' | 'sale' | 'sharing' | 'sensitive'
}

interface CategoryItem {
  id: string
  heading: string
  headingTag: string
  htmlText: string
  mandatory: boolean
  type: '' | 'consent' | 'legitimate_interest'
  cookies: string[]
}

interface BannerState {
  position: 'bottom' | 'top' | 'middle' | 'left-bottom' | 'right-bottom'
  heading: string
  headingTag: string
  htmlText: string
  overlayOpacity: number
  showClose: boolean
  showLocaleSwitcher: boolean
}

interface ModalState {
  position: 'center' | 'left' | 'right'
  heading: string
  headingTag: string
  subheading: string
  htmlText: string
  overlayOpacity: number
  persistent: boolean
  showClose: boolean
  showLocaleSwitcher: boolean
}

interface GpcState {
  mode: 'false' | 'true' | 'strict'
  bannerPosition: 'bottom' | 'top' | 'middle' | 'left-bottom' | 'right-bottom'
  bannerHeading: string
  bannerHtml: string
  showClose: boolean
  showLocaleSwitcher: boolean
}

interface ButtonItem {
  id: string
  text: string
  style: 'primary' | 'secondary' | 'text' | 'accent'
  action: 'submit' | 'manage' | 'close' | 'custom' | 'link'
  cookiesMode: '*' | '!' | 'ids'
  cookiesIds: string
  url: string
}

interface ThemeState {
  bgColor: string
  textColor: string
  primaryColor: string
  primaryTextColor: string
  secondaryColor: string
  secondaryTextColor: string
  borderColor: string
  accentColor: string
  accentTextColor: string
  fontFamily: string
  fontSizeBase: string
  fontSizeHeading: string
  fontSizeMultiplier: string
  borderRadius: string
  buttonBorderRadius: string
  toggleBgOn: string
  toggleBgOff: string
}

interface CoreState {
  regulation: 'gdpr' | 'uk-gdpr' | 'ccpa' | 'cpra' | 'lgpd' | 'dpdpa' | 'pipeda' | 'popia' | 'pdpa-th' | 'appi' | 'kvkk'
  locale: string
  storage: 'cookie' | 'localStorage'
  cookieDomains: string
  privacyPolicyUrl: string
  allowReceipt: boolean
  disableCssTemplate: boolean
  signCookies: boolean
  cookieSigningKey: string
  userId: string
}

interface GtmState {
  containerId: string
  dataLayer: string
  urlPassthrough: boolean
  adsDataRedaction: boolean
}

interface LiveState {
  bannerVisibility: 'main' | 'gpc' | false
  modalVisibility: 'preference' | false
  hasConsent: boolean
  consentDate: string | null
  consent: ConsentValue | null
  gtmConsentV2: Record<string, string> | null
}

// ── Default values ─────────────────────────────────────────────────────────────

const DEFAULT_BANNER_BUTTONS: ButtonItem[] = [
  { id: 'bb1', text: 'Accept All', style: 'primary', action: 'custom', cookiesMode: '*', cookiesIds: '', url: '' },
  { id: 'bb2', text: 'Reject All', style: 'secondary', action: 'custom', cookiesMode: '!', cookiesIds: '', url: '' },
  { id: 'bb3', text: 'Manage Preferences', style: 'text', action: 'manage', cookiesMode: '*', cookiesIds: '', url: '' },
  { id: 'bb4', text: 'Privacy Policy', style: 'text', action: 'link', cookiesMode: '*', cookiesIds: '', url: '#' },
  { id: 'bb5', text: 'Usage Terms', style: 'text', action: 'link', cookiesMode: '*', cookiesIds: '', url: '#' },
]

const DEFAULT_GPC_BUTTONS: ButtonItem[] = [
  { id: 'gb1', text: 'Understood', style: 'primary', action: 'custom', cookiesMode: '!', cookiesIds: '', url: '' },
  { id: 'gb2', text: 'Manage Preferences', style: 'secondary', action: 'manage', cookiesMode: '*', cookiesIds: '', url: '' },
]

const DEFAULT_MODAL_BUTTONS: ButtonItem[] = [
  { id: 'mb1', text: 'Accept All', style: 'primary', action: 'custom', cookiesMode: '*', cookiesIds: '', url: '' },
  { id: 'mb2', text: 'Save Preferences', style: 'primary', action: 'submit', cookiesMode: '*', cookiesIds: '', url: '' },
  { id: 'mb3', text: 'Reject All', style: 'text', action: 'custom', cookiesMode: '!', cookiesIds: '', url: '' },
]

const DEFAULT_COOKIES: CookieItem[] = [
  { id: 'functionality_storage', mandatory: true, listenGpc: false, expiry: 365, cpraCategory: '' },
  { id: 'analytics_storage', mandatory: false, listenGpc: true, expiry: 365, cpraCategory: '' },
  { id: 'ad_storage', mandatory: false, listenGpc: true, expiry: 365, cpraCategory: 'sale' },
  { id: 'ad_user_data', mandatory: false, listenGpc: true, expiry: 365, cpraCategory: 'sharing' },
  { id: 'ad_personalization', mandatory: false, listenGpc: true, expiry: 365, cpraCategory: '' },
]

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-necessary',
    heading: 'Strictly Necessary',
    headingTag: '',
    htmlText: 'Required for the site to function. Cannot be disabled.',
    mandatory: true,
    type: '',
    cookies: ['functionality_storage'],
  },
  {
    id: 'cat-analytics',
    heading: 'Analytics',
    headingTag: '',
    htmlText: 'Helps us understand how visitors use our site (e.g. Google Analytics).',
    mandatory: false,
    type: '',
    cookies: ['analytics_storage'],
  },
  {
    id: 'cat-advertising',
    heading: 'Advertising',
    headingTag: '',
    htmlText: 'Used to deliver relevant ads and measure campaign performance.',
    mandatory: false,
    type: '',
    cookies: ['ad_storage', 'ad_user_data', 'ad_personalization'],
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function CtrlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ctrl-group">
      <h4 className="ctrl-group-title">{title}</h4>
      {children}
    </div>
  )
}

function CtrlRow({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="ctrl-row">
      {label && <label className="ctrl-label">{label}</label>}
      {children}
      {hint && <span className="ctrl-hint">{hint}</span>}
    </div>
  )
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <select
      className="ctrl-input"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      className="ctrl-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      className="ctrl-input resize-y"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="color"
      className="w-full h-8 p-0.5 border border-slate-300 rounded-md cursor-pointer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function RangeInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        className="flex-1"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {label !== undefined && <span className="ctrl-hint w-8 text-right">{value}%</span>}
    </div>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4" />
      {label}
    </label>
  )
}

function ButtonEditor({
  buttons,
  onChange,
}: {
  buttons: ButtonItem[]
  onChange: (buttons: ButtonItem[]) => void
}) {
  function addButton() {
    onChange([...buttons, {
      id: `btn-${Date.now()}`,
      text: 'Button',
      style: 'secondary',
      action: 'close',
      cookiesMode: '*',
      cookiesIds: '',
      url: '',
    }])
  }
  function removeButton(id: string) {
    onChange(buttons.filter((b) => b.id !== id))
  }
  function updateButton(id: string, patch: Partial<ButtonItem>) {
    onChange(buttons.map((b) => b.id === id ? { ...b, ...patch } : b))
  }

  return (
    <div className="">
      <p className="ctrl-hint mb-2">Buttons rendered in the footer, in order.</p>
      <div className="space-y-2">
        {buttons.length === 0 && (
          <span className="ctrl-hint italic">No buttons. Add at least one.</span>
        )}
        {buttons.map((btn, i) => (
          <div key={btn.id} className="flex flex-wrap gap-1.5 items-center p-2 bg-slate-50 rounded-lg border border-slate-200 relative">
            <span className="text-[11px] text-slate-400 w-4 shrink-0 absolute top-[-8px]">{i + 1}</span>
            <input
              type="text"
              className="ctrl-input flex-1 min-w-[90px]"
              value={btn.text}
              onChange={(e) => updateButton(btn.id, { text: e.target.value })}
              placeholder="Label"
            />
            <select
              className="ctrl-input w-[100px] shrink-0"
              value={btn.style}
              onChange={(e) => updateButton(btn.id, { style: e.target.value as ButtonItem['style'] })}
            >
              <option value="primary">primary</option>
              <option value="secondary">secondary</option>
              <option value="text">text</option>
              <option value="accent">accent</option>
            </select>
            <select
              className="ctrl-input w-[100px] shrink-0"
              value={btn.action}
              onChange={(e) => {
                const action = e.target.value as ButtonItem['action']
                updateButton(btn.id, {
                  action,
                  ...(action === 'link' ? { style: 'text' as const } : {}),
                })
              }}
            >
              <option value="custom">custom</option>
              <option value="manage">manage</option>
              <option value="submit">submit</option>
              <option value="close">close</option>
              <option value="link">link (URL)</option>
            </select>
            <button
              onClick={() => removeButton(btn.id)}
              className="text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer text-base leading-none px-0.5 ml-auto shrink-0 mt-[-30px]"
              title="Remove button"
            >
              ×
            </button>
            {btn.action === 'link' && (
              <input
                type="url"
                className="ctrl-input flex-1 min-w-[120px]"
                value={btn.url}
                onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                placeholder="https://example.com/privacy"
              />
            )}
            {btn.action === 'custom' && (
              <>
                <select
                  className="ctrl-input w-[100px] shrink-0"
                  value={btn.cookiesMode}
                  onChange={(e) => updateButton(btn.id, { cookiesMode: e.target.value as ButtonItem['cookiesMode'] })}
                >
                  <option value="*">* grant all</option>
                  <option value="!">! deny all</option>
                  <option value="ids">specific IDs</option>
                </select>
                {btn.cookiesMode === 'ids' && (
                  <input
                    type="text"
                    className="ctrl-input flex-1 min-w-[90px]"
                    value={btn.cookiesIds}
                    onChange={(e) => updateButton(btn.id, { cookiesIds: e.target.value })}
                    placeholder="id1, id2"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addButton}
        className="mt-2 px-3 py-1.5 border-2 border-brand-500 text-brand-500 text-xs font-semibold rounded-md bg-transparent hover:bg-brand-50 cursor-pointer transition-colors"
      >
        + Add Button
      </button>
    </div>
  )
}

function buttonItemToButton(b: ButtonItem): {
  text: string
  style: 'primary' | 'secondary' | 'text' | 'accent'
  action: 'submit' | 'manage' | 'close' | 'custom' | 'link'
  cookies?: string[] | '*' | '!'
  url?: string
} {
  const base = { text: b.text, style: b.style, action: b.action }
  if (b.action === 'link') {
    return { ...base, ...(b.url ? { url: b.url } : {}) }
  }
  if (b.action !== 'custom') return base
  if (b.cookiesMode === 'ids') {
    return { ...base, cookies: b.cookiesIds.split(',').map((s) => s.trim()).filter(Boolean) }
  }
  return { ...base, cookies: b.cookiesMode }
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PlaygroundClient() {
  const widgetRef = useRef<WidgetHandle | null>(null)
  const reinitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [autoInit, setAutoInit] = useState(true)

  const [banner, setBanner] = useState<BannerState>({
    position: 'bottom',
    heading: 'We value your privacy',
    headingTag: '',
    htmlText: 'We use cookies to improve your experience and personalise content.',
    overlayOpacity: 0,
    showClose: false,
    showLocaleSwitcher: false,
  })

  const [modal, setModal] = useState<ModalState>({
    position: 'center',
    heading: 'Cookie Preferences',
    headingTag: '',
    subheading: 'Choose which cookies you allow us to use.',
    htmlText: '',
    overlayOpacity: 50,
    persistent: false,
    showClose: true,
    showLocaleSwitcher: false,
  })

  const [gpc, setGpc] = useState<GpcState>({
    mode: 'false',
    bannerPosition: 'bottom',
    bannerHeading: 'Privacy signal detected',
    bannerHtml: "Your browser's Global Privacy Control signal was detected. Ad and analytics cookies have been pre-denied.",
    showClose: false,
    showLocaleSwitcher: false,
  })

  const [themeOverride, setThemeOverride] = useState(false)

  const [theme, setTheme] = useState<ThemeState>({
    bgColor: '#ffffff',
    textColor: '#1a1a1a',
    primaryColor: '#1565c0',
    primaryTextColor: '#ffffff',
    secondaryColor: '#f0f4f8',
    secondaryTextColor: '#1a3460',
    borderColor: '#e2e8f0',
    accentColor: '#d32f2f',
    accentTextColor: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
    fontSizeBase: '14px',
    fontSizeHeading: '18px',
    fontSizeMultiplier: '1',
    borderRadius: '8px',
    buttonBorderRadius: '4px',
    toggleBgOn: '#1565c0',
    toggleBgOff: '#cccccc',
  })

  const [core, setCore] = useState<CoreState>({
    regulation: 'gdpr',
    locale: 'en',
    storage: 'cookie',
    cookieDomains: '',
    privacyPolicyUrl: '',
    allowReceipt: false,
    disableCssTemplate: false,
    signCookies: false,
    cookieSigningKey: '',
    userId: '',
  })

  const [gtm, setGtm] = useState<GtmState>({
    containerId: '',
    dataLayer: 'dataLayer',
    urlPassthrough: false,
    adsDataRedaction: false,
  })

  const [cookies, setCookies] = useState<CookieItem[]>(DEFAULT_COOKIES)
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES)
  const [bannerButtons, setBannerButtons] = useState<ButtonItem[]>(DEFAULT_BANNER_BUTTONS)
  const [gpcButtons, setGpcButtons] = useState<ButtonItem[]>(DEFAULT_GPC_BUTTONS)
  const [modalButtons, setModalButtons] = useState<ButtonItem[]>(DEFAULT_MODAL_BUTTONS)
  const [liveState, setLiveState] = useState<LiveState | null>(null)

  // New cookie form state
  const [newCookieId, setNewCookieId] = useState('')
  const [newCookieExpiry, setNewCookieExpiry] = useState(365)
  const [newCookieMandatory, setNewCookieMandatory] = useState(false)
  const [newCookieGpc, setNewCookieGpc] = useState(false)
  const [newCookieCpraCategory, setNewCookieCpraCategory] = useState<CookieItem['cpraCategory']>('')

  // ── Build config ─────────────────────────────────────────────────────────────

  const buildConfig = useCallback((): ConsentiConfig => {
    if (isDefault) {
      return { core: {}, ...(darkMode ? { darkMode: true } : {}), ...(!autoInit ? { autoInit: false } : {}) }
    }

    const autoHonorGPC =
      gpc.mode === 'true' ? true : gpc.mode === 'strict' ? ('strict' as const) : false

    const gtmConfig = gtm.containerId ? {
      containerId: gtm.containerId,
      dataLayer: gtm.dataLayer || 'dataLayer',
      urlPassthrough: gtm.urlPassthrough,
      adsDataRedaction: gtm.adsDataRedaction,
    } : undefined

    // When showLocaleSwitcher is enabled, inject a mock second locale so the widget
    // renders the switcher (it only shows when locales.length > 1).
    const needsMockLocales = banner.showLocaleSwitcher || modal.showLocaleSwitcher || gpc.showLocaleSwitcher

    return {
      ...(darkMode ? { darkMode: true } : {}),
      ...(!autoInit ? { autoInit: false } : {}),
      core: {
        ...(core.allowReceipt ? { allowReceipt: true } : {}),
        ...(core.disableCssTemplate ? { disableCssTemplate: true } : {}),
        autoHonorGPC,
        regulation: core.regulation,
        locale: core.locale || 'en',
        storage: core.storage,
        ...(core.cookieDomains ? { cookieDomains: core.cookieDomains } : {}),
        ...(core.privacyPolicyUrl ? { privacyPolicyUrl: core.privacyPolicyUrl } : {}),
        ...(core.signCookies ? { signCookies: true } : {}),
        ...(core.signCookies && core.cookieSigningKey ? { cookieSigningKey: core.cookieSigningKey } : {}),
        ...(core.userId ? { userId: core.userId } : {}),
        ...(themeOverride ? {
          theme: {
            bgColor: theme.bgColor,
            textColor: theme.textColor,
            primaryColor: theme.primaryColor,
            primaryTextColor: theme.primaryTextColor,
            secondaryColor: theme.secondaryColor,
            secondaryTextColor: theme.secondaryTextColor,
            borderColor: theme.borderColor,
            accentColor: theme.accentColor,
            accentTextColor: theme.accentTextColor,
            fontFamily: theme.fontFamily,
            fontSizeBase: theme.fontSizeBase,
            fontSizeHeading: theme.fontSizeHeading,
            fontSizeMultiplier: theme.fontSizeMultiplier,
            borderRadius: theme.borderRadius,
            buttonBorderRadius: theme.buttonBorderRadius,
            toggleBgOn: theme.toggleBgOn,
            toggleBgOff: theme.toggleBgOff,
          },
        } : {}),
      },
      ...(gtmConfig ? { utils: { gtm: gtmConfig } } : {}),
      profileOverride: {
        ...(needsMockLocales ? { locales: [core.locale || 'en', 'fr'] } : {}),
        cookies: cookies.map((c) => ({
          id: c.id,
          ...(c.mandatory ? { mandatory: true as const } : {}),
          ...(c.listenGpc ? { listenGpc: true } : {}),
          ...(c.expiry ? { expiry: c.expiry } : {}),
          ...(c.cpraCategory ? { cpraCategory: c.cpraCategory } : {}),
        })),
        mainBanner: {
          position: banner.position,
          heading: banner.heading,
          htmlText: banner.htmlText,
          overlayOpacity: banner.overlayOpacity,
          showClose: banner.showClose,
          ...(banner.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
          ...(banner.headingTag ? { headingTag: banner.headingTag } : {}),
          buttons: bannerButtons.map(buttonItemToButton),
        },
        gpcBanner: {
          position: gpc.bannerPosition,
          heading: gpc.bannerHeading,
          htmlText: gpc.bannerHtml,
          showClose: gpc.showClose,
          ...(gpc.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
          buttons: gpcButtons.map(buttonItemToButton),
        },
        preferenceModal: {
          position: modal.position,
          heading: modal.heading,
          subheading: modal.subheading,
          overlayOpacity: modal.overlayOpacity,
          persistent: modal.persistent,
          showClose: modal.showClose,
          ...(modal.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
          ...(modal.headingTag ? { headingTag: modal.headingTag } : {}),
          ...(modal.htmlText ? { htmlText: modal.htmlText } : {}),
          categories: categories.map((cat) => ({
            id: cat.id,
            heading: cat.heading,
            htmlText: cat.htmlText,
            ...(cat.mandatory ? { mandatory: true as const } : {}),
            ...(cat.type ? { type: cat.type } : {}),
            ...(cat.headingTag ? { headingTag: cat.headingTag } : {}),
            cookies: cat.cookies,
          })),
          buttons: modalButtons.map(buttonItemToButton),
        },
      },
    }
  }, [isDefault, darkMode, autoInit, banner, modal, gpc, themeOverride, theme, core, gtm, cookies, categories, bannerButtons, gpcButtons, modalButtons])

  // ── Widget lifecycle ─────────────────────────────────────────────────────────

  const refreshState = useCallback(() => {
    const w = widgetRef.current
    if (!w) { setLiveState(null); return }
    const date = w.getConsentDate()
    setLiveState({
      bannerVisibility: w.bannerVisibility(),
      modalVisibility: w.modalVisibility(),
      hasConsent: w.hasConsent(),
      consentDate: date ? (date as Date).toISOString() : null,
      consent: w.getConsent(),
      gtmConsentV2: w.getGTMConsent() as Record<string, string> | null,
    })
  }, [])

  const initWidget = useCallback(async () => {
    const { ConsentiSetup } = await import('@consenti/ui')
    await import('@consenti/ui/dist/index.css')

    widgetRef.current?.destroy()
    const w = new ConsentiSetup(buildConfig()) as unknown as WidgetHandle
    widgetRef.current = w
    w.onReady(refreshState)
    refreshState()
  }, [buildConfig, refreshState])

  const scheduleReinit = useCallback((delay: number) => {
    if (reinitTimerRef.current !== null) clearTimeout(reinitTimerRef.current)
    reinitTimerRef.current = setTimeout(() => void initWidget(), delay)
  }, [initWidget])

  // Boot on mount
  useEffect(() => {
    void initWidget()
    return () => {
      widgetRef.current?.destroy()
      widgetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-init when config changes (debounced)
  useEffect(() => {
    scheduleReinit(300)
  }, [banner, modal, gpc, themeOverride, theme, core, gtm, cookies, categories, bannerButtons, gpcButtons, modalButtons, isDefault, darkMode, autoInit, scheduleReinit])

  // Listen to consenti events
  useEffect(() => {
    const handler = () => refreshState()
    window.addEventListener('consenti:consentSubmitted', handler)
    window.addEventListener('consenti:bannerVisibility', handler)
    window.addEventListener('consenti:modalVisibility', handler)
    return () => {
      window.removeEventListener('consenti:consentSubmitted', handler)
      window.removeEventListener('consenti:bannerVisibility', handler)
      window.removeEventListener('consenti:modalVisibility', handler)
    }
  }, [refreshState])

  // ── Cookie editor helpers ────────────────────────────────────────────────────

  function addCookie() {
    const id = newCookieId.trim().replace(/\s+/g, '_')
    if (!id || cookies.some((c) => c.id === id)) return
    setCookies((prev) => [...prev, { id, mandatory: newCookieMandatory, listenGpc: newCookieGpc, expiry: newCookieExpiry, cpraCategory: newCookieCpraCategory }])
    setNewCookieId('')
    setNewCookieMandatory(false)
    setNewCookieGpc(false)
    setNewCookieCpraCategory('')
  }

  function removeCookie(id: string) {
    setCookies((prev) => prev.filter((c) => c.id !== id))
    setCategories((prev) => prev.map((cat) => ({ ...cat, cookies: cat.cookies.filter((cid) => cid !== id) })))
  }

  function addCategory() {
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, heading: 'New Category', headingTag: '', htmlText: 'Description.', mandatory: false, type: '', cookies: [] },
    ])
  }

  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function updateCategoryHeading(id: string, heading: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, heading } : c))
  }

  function updateCategoryHeadingTag(id: string, headingTag: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, headingTag } : c))
  }

  function updateCategoryHtmlText(id: string, htmlText: string) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, htmlText } : c))
  }

  function updateCategoryType(id: string, type: CategoryItem['type']) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, type } : c))
  }

  function toggleCategoryMandatory(id: string, mandatory: boolean) {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, mandatory } : c))
  }

  function toggleCategoryCookie(catId: string, cookieId: string, checked: boolean) {
    setCategories((prev) => prev.map((c) => {
      if (c.id !== catId) return c
      return {
        ...c,
        cookies: checked
          ? c.cookies.includes(cookieId) ? c.cookies : [...c.cookies, cookieId]
          : c.cookies.filter((id) => id !== cookieId),
      }
    }))
  }

  // ── API button actions ───────────────────────────────────────────────────────

  async function submitAll() {
    const consent = Object.fromEntries(cookies.map((c) => [c.id, 'granted' as const]))
    await widgetRef.current?.submitConsent(consent)
    refreshState()
  }

  async function submitNone() {
    await widgetRef.current?.submitConsent({})
    refreshState()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border-t-4 border-brand-500 py-8 px-6 pb-48">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-brand-600 mb-1">Consenti Playground</h2>
        <p className="text-sm text-slate-500 mb-1">Change any field below — the widget re-initialises automatically.</p>
        <p className="text-xs text-slate-400 mb-5">Note: the playground passes settings via <code className="bg-slate-100 px-0.5 rounded">profileOverride</code> directly. <code className="bg-slate-100 px-0.5 rounded">ConsentiProfile</code> locale fallback (<code className="bg-slate-100 px-0.5 rounded">defaultLocale</code>) is not exercised here — locale switching always resolves to the configured locale.</p>

        <div className="flex flex-wrap gap-5 mb-6 py-2 border-b border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4"
            />
            Use default banner profile (ignores settings below)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="w-4 h-4"
            />
            🌙 Dark mode (<code className="text-xs">darkMode: true</code>)
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              checked={!autoInit}
              onChange={(e) => setAutoInit(!e.target.checked)}
              className="w-4 h-4"
            />
            Defer init (<code className="text-xs">autoInit: false</code>) — use <strong>widget.init()</strong> button below
          </label>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 ${isDefault ? 'opacity-50 pointer-events-none' : ''}`}>

          {/* Banner */}
          <CtrlGroup title="Banner">
            <CtrlRow label="Position">
              <Select
                value={banner.position}
                onChange={(v) => setBanner((p) => ({ ...p, position: v }))}
                options={[
                  { value: 'bottom', label: 'bottom' },
                  { value: 'top', label: 'top' },
                  { value: 'middle', label: 'middle' },
                  { value: 'left-bottom', label: 'left-bottom' },
                  { value: 'right-bottom', label: 'right-bottom' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label="Heading">
              <TextInput value={banner.heading} onChange={(v) => setBanner((p) => ({ ...p, heading: v }))} />
            </CtrlRow>
            <CtrlRow label="Heading tag" hint="HTML tag, e.g. h2, p. Default: h2.">
              <TextInput value={banner.headingTag} onChange={(v) => setBanner((p) => ({ ...p, headingTag: v }))} placeholder="h2" />
            </CtrlRow>
            <CtrlRow label="Body text (HTML)">
              <Textarea value={banner.htmlText} onChange={(v) => setBanner((p) => ({ ...p, htmlText: v }))} />
            </CtrlRow>
            <CtrlRow label="Overlay opacity">
              <RangeInput value={banner.overlayOpacity} onChange={(v) => setBanner((p) => ({ ...p, overlayOpacity: v }))} label="%" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={banner.showClose} onChange={(v) => setBanner((p) => ({ ...p, showClose: v }))} label="Show close button" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={banner.showLocaleSwitcher} onChange={(v) => setBanner((p) => ({ ...p, showLocaleSwitcher: v }))} label="🌐 Show locale switcher" />
            </CtrlRow>
            <CtrlRow label="Buttons" hint="Add a button with action 'link (URL)' to render it as a text link below the banner body.">
              <ButtonEditor buttons={bannerButtons} onChange={setBannerButtons} />
            </CtrlRow>
          </CtrlGroup>

          {/* Preference Modal */}
          <CtrlGroup title="Preference Modal">
            <CtrlRow label="Position">
              <Select
                value={modal.position}
                onChange={(v) => setModal((p) => ({ ...p, position: v }))}
                options={[
                  { value: 'center', label: 'center' },
                  { value: 'left', label: 'left' },
                  { value: 'right', label: 'right' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label="Heading">
              <TextInput value={modal.heading} onChange={(v) => setModal((p) => ({ ...p, heading: v }))} />
            </CtrlRow>
            <CtrlRow label="Heading tag" hint="HTML tag, e.g. h2, p. Default: h2.">
              <TextInput value={modal.headingTag} onChange={(v) => setModal((p) => ({ ...p, headingTag: v }))} placeholder="h2" />
            </CtrlRow>
            <CtrlRow label="Subheading">
              <TextInput value={modal.subheading} onChange={(v) => setModal((p) => ({ ...p, subheading: v }))} />
            </CtrlRow>
            <CtrlRow label="Intro text (HTML)" hint="Optional text rendered above the category list.">
              <Textarea value={modal.htmlText} onChange={(v) => setModal((p) => ({ ...p, htmlText: v }))} />
            </CtrlRow>
            <CtrlRow label="Overlay opacity">
              <RangeInput value={modal.overlayOpacity} onChange={(v) => setModal((p) => ({ ...p, overlayOpacity: v }))} label="%" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={modal.persistent} onChange={(v) => setModal((p) => ({ ...p, persistent: v }))} label="Persistent (no outside-click close)" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={modal.showClose} onChange={(v) => setModal((p) => ({ ...p, showClose: v }))} label="Show close button" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={modal.showLocaleSwitcher} onChange={(v) => setModal((p) => ({ ...p, showLocaleSwitcher: v }))} label="🌐 Show locale switcher" />
            </CtrlRow>
            <CtrlRow label="Buttons">
              <ButtonEditor buttons={modalButtons} onChange={setModalButtons} />
            </CtrlRow>
          </CtrlGroup>

          {/* GPC */}
          <CtrlGroup title="GPC (Global Privacy Control)">
            <CtrlRow label="autoHonorGPC">
              <Select
                value={gpc.mode}
                onChange={(v) => setGpc((p) => ({ ...p, mode: v }))}
                options={[
                  { value: 'false', label: 'false — ignore GPC signal' },
                  { value: 'true', label: 'true — pre-deny + show GPC banner' },
                  { value: 'strict', label: 'strict — deny silently, no banner' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label="GPC banner position">
              <Select
                value={gpc.bannerPosition}
                onChange={(v) => setGpc((p) => ({ ...p, bannerPosition: v }))}
                options={[
                  { value: 'bottom', label: 'bottom' },
                  { value: 'top', label: 'top' },
                  { value: 'middle', label: 'middle' },
                  { value: 'left-bottom', label: 'left-bottom' },
                  { value: 'right-bottom', label: 'right-bottom' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label="GPC banner heading">
              <TextInput value={gpc.bannerHeading} onChange={(v) => setGpc((p) => ({ ...p, bannerHeading: v }))} />
            </CtrlRow>
            <CtrlRow label="GPC banner body">
              <Textarea value={gpc.bannerHtml} onChange={(v) => setGpc((p) => ({ ...p, bannerHtml: v }))} />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={gpc.showClose} onChange={(v) => setGpc((p) => ({ ...p, showClose: v }))} label="Show close button" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={gpc.showLocaleSwitcher} onChange={(v) => setGpc((p) => ({ ...p, showLocaleSwitcher: v }))} label="🌐 Show locale switcher" />
            </CtrlRow>
            <CtrlRow label="Buttons">
              <ButtonEditor buttons={gpcButtons} onChange={setGpcButtons} />
            </CtrlRow>
            <p className="ctrl-hint mt-1">
              GPC detected via <em>navigator.globalPrivacyControl</em>. Enable in Brave or Firefox+extension to test.
            </p>
          </CtrlGroup>

          {/* Theme */}
          <CtrlGroup title="Theme">
            <CtrlRow>
              <Checkbox
                checked={themeOverride}
                onChange={setThemeOverride}
                label="Override Theme"
              />
            </CtrlRow>
            <div className={themeOverride ? '' : 'opacity-40 pointer-events-none'}>
              <CtrlRow label="Background colour">
                <ColorInput value={theme.bgColor} onChange={(v) => setTheme((p) => ({ ...p, bgColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Text colour">
                <ColorInput value={theme.textColor} onChange={(v) => setTheme((p) => ({ ...p, textColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Primary accent">
                <ColorInput value={theme.primaryColor} onChange={(v) => setTheme((p) => ({ ...p, primaryColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Primary button text">
                <ColorInput value={theme.primaryTextColor} onChange={(v) => setTheme((p) => ({ ...p, primaryTextColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Secondary button bg">
                <ColorInput value={theme.secondaryColor} onChange={(v) => setTheme((p) => ({ ...p, secondaryColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Secondary button text">
                <ColorInput value={theme.secondaryTextColor} onChange={(v) => setTheme((p) => ({ ...p, secondaryTextColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Border colour">
                <ColorInput value={theme.borderColor} onChange={(v) => setTheme((p) => ({ ...p, borderColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Accent colour (destructive)">
                <ColorInput value={theme.accentColor} onChange={(v) => setTheme((p) => ({ ...p, accentColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Accent button text">
                <ColorInput value={theme.accentTextColor} onChange={(v) => setTheme((p) => ({ ...p, accentTextColor: v }))} />
              </CtrlRow>
              <CtrlRow label="Toggle ON colour">
                <ColorInput value={theme.toggleBgOn} onChange={(v) => setTheme((p) => ({ ...p, toggleBgOn: v }))} />
              </CtrlRow>
              <CtrlRow label="Toggle OFF colour">
                <ColorInput value={theme.toggleBgOff} onChange={(v) => setTheme((p) => ({ ...p, toggleBgOff: v }))} />
              </CtrlRow>
              <CtrlRow label="Border radius (container)">
                <TextInput value={theme.borderRadius} onChange={(v) => setTheme((p) => ({ ...p, borderRadius: v }))} />
              </CtrlRow>
              <CtrlRow label="Border radius (buttons)">
                <TextInput value={theme.buttonBorderRadius} onChange={(v) => setTheme((p) => ({ ...p, buttonBorderRadius: v }))} />
              </CtrlRow>
              <CtrlRow label="Font family">
                <TextInput value={theme.fontFamily} onChange={(v) => setTheme((p) => ({ ...p, fontFamily: v }))} />
              </CtrlRow>
              <CtrlRow label="Font size base (e.g. 14px)">
                <TextInput value={theme.fontSizeBase} onChange={(v) => setTheme((p) => ({ ...p, fontSizeBase: v }))} />
              </CtrlRow>
              <CtrlRow label="Font size heading (e.g. 18px)">
                <TextInput value={theme.fontSizeHeading} onChange={(v) => setTheme((p) => ({ ...p, fontSizeHeading: v }))} />
              </CtrlRow>
              <CtrlRow label="Font size multiplier (e.g. 1.1)">
                <TextInput value={theme.fontSizeMultiplier} onChange={(v) => setTheme((p) => ({ ...p, fontSizeMultiplier: v }))} />
              </CtrlRow>
            </div>
          </CtrlGroup>

          {/* Core Config */}
          <CtrlGroup title="Core Config">
            <CtrlRow label="Regulation">
              <Select
                value={core.regulation}
                onChange={(v) => setCore((p) => ({ ...p, regulation: v }))}
                options={[
                  { value: 'gdpr', label: 'gdpr — EU opt-in' },
                  { value: 'uk-gdpr', label: 'uk-gdpr — UK opt-in' },
                  { value: 'ccpa', label: 'ccpa — California opt-out' },
                  { value: 'cpra', label: 'cpra — California opt-out / opt-in' },
                  { value: 'lgpd', label: 'lgpd — Brazil opt-in' },
                  { value: 'dpdpa', label: 'dpdpa — India opt-in' },
                  { value: 'pipeda', label: 'pipeda — Canada opt-in' },
                  { value: 'popia', label: 'popia — South Africa opt-in' },
                  { value: 'pdpa-th', label: 'pdpa-th — Thailand opt-in' },
                  { value: 'appi', label: 'appi — Japan opt-in / opt-out' },
                  { value: 'kvkk', label: 'kvkk — Turkey opt-in' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label="Locale">
              <TextInput value={core.locale} onChange={(v) => setCore((p) => ({ ...p, locale: v }))} placeholder="e.g. en, fr, fr-CA" />
            </CtrlRow>
            <CtrlRow label="Storage mode">
              <Select
                value={core.storage}
                onChange={(v) => setCore((p) => ({ ...p, storage: v }))}
                options={[
                  { value: 'cookie', label: 'cookie (cross-subdomain)' },
                  { value: 'localStorage', label: 'localStorage (origin-scoped)' },
                ]}
              />
            </CtrlRow>
            <CtrlRow label="Cookie domains" hint="Comma-separated. First entry used as Domain attribute.">
              <TextInput value={core.cookieDomains} onChange={(v) => setCore((p) => ({ ...p, cookieDomains: v }))} placeholder=".example.com" />
            </CtrlRow>
            <CtrlRow label="Privacy policy URL" hint="Auto-appended as a link in the banner body.">
              <TextInput value={core.privacyPolicyUrl} onChange={(v) => setCore((p) => ({ ...p, privacyPolicyUrl: v }))} placeholder="https://example.com/privacy" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={core.signCookies} onChange={(v) => setCore((p) => ({ ...p, signCookies: v }))} label="Sign cookies (HMAC-SHA256)" />
            </CtrlRow>
            {core.signCookies && (
              <CtrlRow label="Signing key" hint="Never expose in production — use API mode to receive the key server-side.">
                <TextInput value={core.cookieSigningKey} onChange={(v) => setCore((p) => ({ ...p, cookieSigningKey: v }))} placeholder="min 32-character secret" />
              </CtrlRow>
            )}
            <CtrlRow label="User ID (authenticated users)" hint="Overrides auto-generated visitor ID. Enables cross-device sync via API.">
              <TextInput value={core.userId} onChange={(v) => setCore((p) => ({ ...p, userId: v }))} placeholder="server-assigned UUID" />
            </CtrlRow>
            <CtrlRow>
              <Checkbox checked={core.allowReceipt} onChange={(v) => setCore((p) => ({ ...p, allowReceipt: v }))} label="Allow consent receipt download (allowReceipt)" />
            </CtrlRow>
            <CtrlRow hint="Set to true when you import the CSS via your bundler to avoid duplicate styles.">
              <Checkbox checked={core.disableCssTemplate} onChange={(v) => setCore((p) => ({ ...p, disableCssTemplate: v }))} label="Disable CSS template injection (disableCssTemplate)" />
            </CtrlRow>
          </CtrlGroup>

          {/* GTM */}
          <CtrlGroup title="GTM & Integrations">
            <CtrlRow label="GTM Container ID" hint="Leave blank to skip all dataLayer pushes.">
              <TextInput value={gtm.containerId} onChange={(v) => setGtm((p) => ({ ...p, containerId: v }))} placeholder="GTM-XXXXXX" />
            </CtrlRow>
            <CtrlRow label="dataLayer variable name" hint="Override when your site uses a custom variable name.">
              <TextInput value={gtm.dataLayer} onChange={(v) => setGtm((p) => ({ ...p, dataLayer: v }))} />
            </CtrlRow>
            <CtrlRow hint="Pushes url_passthrough: true for cookieless conversion modelling. Requires gtag on page.">
              <Checkbox checked={gtm.urlPassthrough} onChange={(v) => setGtm((p) => ({ ...p, urlPassthrough: v }))} label="urlPassthrough (GCM v2)" />
            </CtrlRow>
            <CtrlRow hint="Pushes ads_data_redaction when ad_storage is denied. Requires gtag on page.">
              <Checkbox checked={gtm.adsDataRedaction} onChange={(v) => setGtm((p) => ({ ...p, adsDataRedaction: v }))} label="adsDataRedaction (GCM v2)" />
            </CtrlRow>
          </CtrlGroup>

          {/* Cookies — full width */}
          <div className="col-span-1 md:col-span-2 xl:col-span-3">
            <div className="ctrl-group">
              <h4 className="ctrl-group-title">Cookies</h4>
              <p className="ctrl-hint mb-3">
                Define the cookie purposes your site manages. Cookie IDs are referenced by modal categories and determine what consent values are stored.
              </p>

              {/* Cookie list */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                {cookies.length === 0 ? (
                  <span className="ctrl-hint italic">No cookies defined yet.</span>
                ) : (
                  cookies.map((cookie) => (
                    <div key={cookie.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-xs">
                      <code className="text-brand-500 font-mono text-[10px]">{cookie.id}</code>
                      {cookie.mandatory && <span className="badge bg-green-100 text-green-700 text-[10px]">mandatory</span>}
                      {cookie.listenGpc && <span className="badge bg-orange-100 text-orange-700 text-[10px]">GPC</span>}
                      {cookie.expiry > 0 && <span className="badge bg-slate-200 text-slate-500 text-[10px]">{cookie.expiry}d</span>}
                      {cookie.cpraCategory && <span className="badge bg-purple-100 text-purple-700 text-[10px]">cpra:{cookie.cpraCategory}</span>}
                      <button
                        onClick={() => removeCookie(cookie.id)}
                        className="text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer text-base leading-none px-0.5"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add cookie form */}
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200">
                <input
                  type="text"
                  className="ctrl-input flex-1 min-w-32"
                  placeholder="Cookie name e.g. analytics_storage"
                  value={newCookieId}
                  onChange={(e) => setNewCookieId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCookie() }}
                />
                <input
                  type="number"
                  className="ctrl-input w-36"
                  placeholder="Expiry (days)"
                  value={newCookieExpiry}
                  onChange={(e) => setNewCookieExpiry(Number(e.target.value))}
                />
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer whitespace-nowrap">
                  <input type="checkbox" checked={newCookieMandatory} onChange={(e) => setNewCookieMandatory(e.target.checked)} className="w-3.5 h-3.5" />
                  Mandatory
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer whitespace-nowrap">
                  <input type="checkbox" checked={newCookieGpc} onChange={(e) => setNewCookieGpc(e.target.checked)} className="w-3.5 h-3.5" />
                  Honor GPC
                </label>
                <select
                  className="ctrl-input text-xs"
                  value={newCookieCpraCategory}
                  onChange={(e) => setNewCookieCpraCategory(e.target.value as CookieItem['cpraCategory'])}
                >
                  <option value="">CPRA category (optional)</option>
                  <option value="sale">sale</option>
                  <option value="sharing">sharing</option>
                  <option value="sensitive">sensitive</option>
                </select>
                <button
                  onClick={addCookie}
                  className="px-3 py-1.5 border-2 border-brand-500 text-brand-500 text-xs font-semibold rounded-md bg-transparent hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  + Add Cookie
                </button>
              </div>
            </div>
          </div>

          {/* Categories — full width */}
          <div className="col-span-1 md:col-span-2 xl:col-span-3">
            <div className="ctrl-group">
              <h4 className="ctrl-group-title">Modal Categories</h4>
              <p className="ctrl-hint mb-3">
                Group cookies into categories shown in the preference modal. Edit the heading, description, type, and which cookies belong to each category.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                {categories.length === 0 ? (
                  <span className="ctrl-hint italic">No categories defined yet.</span>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          value={cat.heading}
                          onChange={(e) => updateCategoryHeading(cat.id, e.target.value)}
                          placeholder="Category name"
                        />
                        <button
                          onClick={() => removeCategory(cat.id)}
                          className="text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer text-base leading-none shrink-0"
                          title="Remove category"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="text"
                        className="ctrl-input w-full text-xs"
                        value={cat.headingTag}
                        onChange={(e) => updateCategoryHeadingTag(cat.id, e.target.value)}
                        placeholder="headingTag (e.g. h3)"
                      />
                      <textarea
                        className="ctrl-input resize-y w-full text-xs"
                        rows={2}
                        value={cat.htmlText}
                        onChange={(e) => updateCategoryHtmlText(cat.id, e.target.value)}
                        placeholder="Description HTML"
                      />
                      <div className="flex gap-2 items-center">
                        <select
                          className="ctrl-input flex-1 text-xs"
                          value={cat.type}
                          onChange={(e) => updateCategoryType(cat.id, e.target.value as CategoryItem['type'])}
                        >
                          <option value="">type (default: consent)</option>
                          <option value="consent">consent</option>
                          <option value="legitimate_interest">legitimate_interest</option>
                        </select>
                        <label className="flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer whitespace-nowrap shrink-0">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5"
                            checked={cat.mandatory}
                            onChange={(e) => toggleCategoryMandatory(cat.id, e.target.checked)}
                          />
                          Mandatory
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-400">Cookies in this category:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cookies.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No cookies defined</span>
                        ) : (
                          cookies.map((cookie) => (
                            <label
                              key={cookie.id}
                              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded cursor-pointer border transition-colors select-none ${cat.cookies.includes(cookie.id)
                                ? 'bg-brand-50 border-brand-500 text-brand-600'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="w-3 h-3"
                                checked={cat.cookies.includes(cookie.id)}
                                onChange={(e) => toggleCategoryCookie(cat.id, cookie.id, e.target.checked)}
                              />
                              {cookie.id}
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={addCategory}
                  className="px-3 py-1.5 border-2 border-brand-500 text-brand-500 text-xs font-semibold rounded-md bg-transparent hover:bg-brand-50 cursor-pointer transition-colors"
                >
                  + Add Category
                </button>
              </div>
            </div>
          </div>

        </div>{/* /grid */}

        {/* Action bar */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <button className="action-btn-primary" onClick={() => void initWidget()}>↺ Re-init</button>
          <button
            className="action-btn-primary"
            title="Manually call widget.init() — useful when autoInit: false is enabled above"
            onClick={() => { void widgetRef.current?.init().then(refreshState) }}
          >widget.init()</button>
          <button className="action-btn-secondary" onClick={() => { widgetRef.current?.showBanner(); refreshState() }}>showBanner()</button>
          <button className="action-btn-secondary" onClick={() => { widgetRef.current?.showBanner(true); refreshState() }}>showBanner(gpc)</button>
          <button className="action-btn-secondary" onClick={() => { widgetRef.current?.hideBanner(); refreshState() }}>hideBanner()</button>
          <button className="action-btn-secondary" onClick={() => { widgetRef.current?.showModal(); refreshState() }}>showModal()</button>
          <button className="action-btn-secondary" onClick={() => { widgetRef.current?.hideModal(); refreshState() }}>hideModal()</button>
          <button className="action-btn-secondary" onClick={() => void submitAll()}>submitConsent(all)</button>
          <button className="action-btn-secondary" onClick={() => void submitNone()}>submitConsent(none)</button>
          <button className="action-btn-danger" onClick={() => { void widgetRef.current?.deleteConsent(); refreshState() }}>deleteConsent()</button>
          <button className="action-btn-danger" onClick={() => { void widgetRef.current?.reConsent(); refreshState() }}>reConsent()</button>
        </div>

        {/* Live state */}
        <div className="mt-5 bg-slate-900 text-slate-400 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-auto">
          {liveState === null ? (
            <span className="text-slate-500">Initialising…</span>
          ) : (
            <pre
              className="m-0"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(liveState, null, 2)
                  .replace(/"([^"]+)":/g, '<span class="text-sky-400">"$1"</span>:')
                  .replace(/: "(.*?)"/g, ': <span class="text-green-400">"$1"</span>')
                  .replace(/: (true|false)/g, ': <span class="text-green-400">$1</span>')
                  .replace(/: null/g, ': <span class="text-red-400">null</span>'),
              }}
            />
          )}
        </div>

        {/* Backend info */}
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-blue-700 mb-2">Backend API</h3>
          <p className="text-xs text-blue-600 leading-relaxed">
            The Consenti API is running at <code className="bg-blue-100 px-1 rounded">/consenti</code> (SQLite).
            Admin credentials: <code className="bg-blue-100 px-1 rounded">user@consenti.dev</code> / <code className="bg-blue-100 px-1 rounded">Consenti@123</code>
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <a href="/consenti/" target="_blank" className="text-xs text-blue-700 font-semibold hover:underline">Admin Dashboard →</a>
            <a href="/consenti/api/docs" target="_blank" className="text-xs text-blue-500 hover:underline">API Docs (Swagger) →</a>
            <a href="/consenti/api/openapi.json" target="_blank" className="text-xs text-blue-500 hover:underline">OpenAPI JSON →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
