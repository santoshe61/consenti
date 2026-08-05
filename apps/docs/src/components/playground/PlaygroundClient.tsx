'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ConsentiConfig, ConsentValue, ProfileConfig } from '@consenti/ui'
import { COOKIE_PURPOSE_IDS, COOKIE_PURPOSE_DEFAULTS } from '@consenti/utils'

type CookiePurpose = typeof COOKIE_PURPOSE_IDS[number]

type LegalBasis = 'mandatory' | 'consent' | 'legitimate_interest'
type ComplianceGroupId =
  | 'opt-in'
  | 'opt-out'
  | 'opt-out-strict'
  | 'opt-in-dpdpa'
  | 'opt-in-china'
  | 'opt-in-brazil'
  | 'general-privacy-consent'
  | 'notice-only'

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
  reConsent(resetAgeGate?: boolean): Promise<void>
}

// ── Local state types ──────────────────────────────────────────────────────────

interface CookieItem {
  id: string
  purpose: CookiePurpose | ''
  listenGpc: boolean
  /** Only meaningful when the owning category's legalBasis is 'consent' — mandatory /
   * legitimate_interest categories are already effectively pre-granted regardless. */
  preGrant: boolean
  cpraCategory: '' | 'sale' | 'sharing' | 'sensitive'
}

/** Mirrors `withPurposeDefaults` in apps/api/src/dashboard/src/components/CookieDefinitionRow.tsx —
 * selecting a purpose pre-fills GPC handling and CPRA category from COOKIE_PURPOSE_DEFAULTS. */
function applyPurposeDefaults(item: CookieItem, purpose: CookiePurpose): CookieItem {
  const defaults = COOKIE_PURPOSE_DEFAULTS[purpose]
  return { ...item, purpose, listenGpc: defaults.listenGpc, cpraCategory: defaults.cpraCategory ?? '' }
}

interface CategoryItem {
  id: string
  heading: string
  headingTag: string
  htmlText: string
  legalBasis: LegalBasis
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

interface AgeGateState {
  enabled: boolean
  minimumAge: number
  requireParentalConsent: boolean
  heading: string
  htmlText: string
  confirmButtonLabel: string
  denyButtonLabel: string
  parentalHeading: string
  parentalHtmlText: string
  parentalConfirmButtonLabel: string
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
  colorBg: string
  colorText: string
  colorPrimary: string
  colorPrimaryText: string
  colorSecondary: string
  colorSecondaryText: string
  colorBorder: string
  colorAccent: string
  colorAccentText: string
  fontFamily: string
  fontSizeBase: string
  fontSizeHeading: string
  fontSizeMultiplier: string
  borderRadius: string
  borderRadiusBtn: string
  toggleBgOn: string
  toggleBgOff: string
}

interface ComplianceState {
  type:
  | 'opt-in'
  | 'opt-out'
  | 'opt-out-strict'
  | 'opt-in-dpdpa'
  | 'opt-in-china'
  | 'opt-in-brazil'
  | 'general-privacy-consent'
  | 'notice-only'
  | ''
  | 'custom'
}

interface CoreState {
  locale: string
  storage: 'cookie' | 'localStorage'
  cookieName: string
  cookieDomains: string
  allowReceipt: boolean
  disableCssTemplate: boolean
  userId: string
}

interface ApiState {
  enabled: boolean
  baseUrl: string
  authToken: string
  complianceGroup: string
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

type SetupTab = 'core' | 'theme' | 'api' | 'gtm' | 'actions'
type ProfileTab = 'cookies' | 'mainBanner' | 'gpcBanner' | 'prefModal' | 'ageGate'
type MainTab = 'setup' | 'profile'

// ── Default values ─────────────────────────────────────────────────────────────

const DEFAULT_BANNER_BUTTONS: ButtonItem[] = [
  {
    id: 'bb1',
    text: 'Accept All',
    style: 'primary',
    action: 'custom',
    cookiesMode: '*',
    cookiesIds: '',
    url: '',
  },
  {
    id: 'bb2',
    text: 'Reject Optional',
    style: 'secondary',
    action: 'custom',
    cookiesMode: '!',
    cookiesIds: '',
    url: '',
  },
  {
    id: 'bb3',
    text: 'Customize',
    style: 'text',
    action: 'manage',
    cookiesMode: '*',
    cookiesIds: '',
    url: '',
  },
  {
    id: 'bb4',
    text: 'Privacy Policy',
    style: 'text',
    action: 'link',
    cookiesMode: '*',
    cookiesIds: '',
    url: '#',
  },
  {
    id: 'bb5',
    text: 'Usage Terms',
    style: 'text',
    action: 'link',
    cookiesMode: '*',
    cookiesIds: '',
    url: '#',
  },
]

const DEFAULT_GPC_BUTTONS: ButtonItem[] = [
  {
    id: 'gb1',
    text: 'Understood',
    style: 'primary',
    action: 'custom',
    cookiesMode: '!',
    cookiesIds: '',
    url: '',
  },
  {
    id: 'gb2',
    text: 'Customize',
    style: 'secondary',
    action: 'manage',
    cookiesMode: '*',
    cookiesIds: '',
    url: '',
  },
]

const DEFAULT_MODAL_BUTTONS: ButtonItem[] = [
  {
    id: 'mb1',
    text: 'Accept All',
    style: 'primary',
    action: 'custom',
    cookiesMode: '*',
    cookiesIds: '',
    url: '',
  },
  {
    id: 'mb2',
    text: 'Save Preferences',
    style: 'primary',
    action: 'submit',
    cookiesMode: '*',
    cookiesIds: '',
    url: '',
  },
  {
    id: 'mb3',
    text: 'Reject Optional',
    style: 'text',
    action: 'custom',
    cookiesMode: '!',
    cookiesIds: '',
    url: '',
  },
]

const DEFAULT_COOKIES: CookieItem[] = [
  { id: 'security_storage', purpose: 'necessary', listenGpc: false, preGrant: false, cpraCategory: '' },
  { id: 'functionality_storage', purpose: 'functional', listenGpc: false, preGrant: false, cpraCategory: '' },
  { id: 'analytics_storage', purpose: 'analytics', listenGpc: true, preGrant: false, cpraCategory: '' },
  { id: 'ad_storage', purpose: 'marketing', listenGpc: true, preGrant: false, cpraCategory: 'sale' },
  { id: 'ad_user_data', purpose: 'marketing', listenGpc: true, preGrant: false, cpraCategory: 'sharing' },
  { id: 'ad_personalization', purpose: 'marketing', listenGpc: true, preGrant: false, cpraCategory: '' },
]

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-necessary',
    heading: 'Strictly Necessary',
    headingTag: '',
    htmlText: 'Required for the site to function. Cannot be disabled.',
    legalBasis: 'mandatory',
    cookies: ['security_storage'],
  },
  {
    id: 'cat-functional',
    heading: 'Functional',
    headingTag: '',
    htmlText: 'Optional features that enhance functionality but aren’t essential (e.g. embedded maps, live chat).',
    legalBasis: 'legitimate_interest',
    cookies: ['functionality_storage'],
  },
  {
    id: 'cat-analytics',
    heading: 'Analytics',
    headingTag: '',
    htmlText: 'Helps us understand how visitors use our site (e.g. Google Analytics).',
    legalBasis: 'legitimate_interest',
    cookies: ['analytics_storage'],
  },
  {
    id: 'cat-advertising',
    heading: 'Advertising',
    headingTag: '',
    htmlText: 'Used to deliver relevant ads and measure campaign performance.',
    legalBasis: 'consent',
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

function CtrlRow({
  label,
  hint,
  children,
}: {
  label?: string
  hint?: string
  children: React.ReactNode
}) {
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
    <select className="ctrl-input" value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      className="ctrl-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function Textarea({
  value,
  onChange,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      className="ctrl-input resize-y"
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="color"
      className="w-full h-8 p-0.5 border border-slate-300 rounded-md cursor-pointer"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}

function RangeInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        className="flex-1"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
      {label !== undefined && <span className="ctrl-hint w-8 text-right">{value}%</span>}
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4"
      />
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
    onChange([
      ...buttons,
      {
        id: `btn-${Date.now()}`,
        text: 'Button',
        style: 'secondary',
        action: 'close',
        cookiesMode: '*',
        cookiesIds: '',
        url: '',
      },
    ])
  }
  function removeButton(id: string) {
    onChange(buttons.filter(b => b.id !== id))
  }
  function updateButton(id: string, patch: Partial<ButtonItem>) {
    onChange(buttons.map(b => (b.id === id ? { ...b, ...patch } : b)))
  }

  return (
    <div className="">
      <p className="ctrl-hint mb-2">Buttons rendered in the footer, in order.</p>
      <div className="space-y-2">
        {buttons.length === 0 && (
          <span className="ctrl-hint italic">No buttons. Add at least one.</span>
        )}
        {buttons.map((btn, i) => (
          <div
            key={btn.id}
            className="flex flex-wrap gap-1.5 items-center p-2 bg-slate-50 rounded-lg border border-slate-200 relative"
          >
            <span className="text-[11px] text-slate-400 w-4 shrink-0 absolute top-[-8px]">
              {i + 1}
            </span>
            <input
              type="text"
              className="ctrl-input flex-1 min-w-[90px]"
              value={btn.text}
              onChange={e => updateButton(btn.id, { text: e.target.value })}
              placeholder="Label"
            />
            <select
              className="ctrl-input w-[100px] shrink-0"
              value={btn.style}
              onChange={e => updateButton(btn.id, { style: e.target.value as ButtonItem['style'] })}
            >
              <option value="primary">primary</option>
              <option value="secondary">secondary</option>
              <option value="text">text</option>
              <option value="accent">accent</option>
            </select>
            <select
              className="ctrl-input w-[100px] shrink-0"
              value={btn.action}
              onChange={e => {
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
                onChange={e => updateButton(btn.id, { url: e.target.value })}
                placeholder="https://example.com/privacy"
              />
            )}
            {btn.action === 'custom' && (
              <>
                <select
                  className="ctrl-input w-[100px] shrink-0"
                  value={btn.cookiesMode}
                  onChange={e =>
                    updateButton(btn.id, {
                      cookiesMode: e.target.value as ButtonItem['cookiesMode'],
                    })
                  }
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
                    onChange={e => updateButton(btn.id, { cookiesIds: e.target.value })}
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
    return {
      ...base,
      cookies: b.cookiesIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    }
  }
  return { ...base, cookies: b.cookiesMode }
}

/** Widget-facing `ButtonMap` (keyed by id) built from the playground's editable button rows. */
function buttonItemsToMap(
  items: ButtonItem[]
): Record<string, ReturnType<typeof buttonItemToButton>> {
  return Object.fromEntries(items.map(b => [b.id, buttonItemToButton(b)]))
}

// ── Vertical tab nav helper ────────────────────────────────────────────────────

function VTabNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <nav className="w-44 shrink-0 border-r border-slate-200 py-2 bg-slate-50">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`w-full text-left px-4 py-2.5 text-sm font-medium border-l-2 transition-colors ${active === t.id
            ? 'border-brand-500 bg-white text-brand-700'
            : 'border-transparent text-slate-600 hover:bg-white hover:text-slate-800'
            }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PlaygroundClient() {
  const widgetRef = useRef<WidgetHandle | null>(null)
  const reinitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [autoInit, setAutoInit] = useState(true)

  // Navigation state
  const [mainTab, setMainTab] = useState<MainTab>('setup')
  const [setupTab, setSetupTab] = useState<SetupTab>('core')
  const [profileTab, setProfileTab] = useState<ProfileTab>('mainBanner')

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
    bannerHtml:
      "Your browser's Global Privacy Control signal was detected. Ad and analytics cookies have been pre-denied.",
    showClose: false,
    showLocaleSwitcher: false,
  })

  const [ageGate, setAgeGate] = useState<AgeGateState>({
    enabled: false,
    minimumAge: 16,
    requireParentalConsent: false,
    heading: 'Age verification',
    htmlText: 'Please confirm you meet the minimum age requirement to continue.',
    confirmButtonLabel: 'I am old enough',
    denyButtonLabel: "I'm not old enough",
    parentalHeading: 'Parental consent required',
    parentalHtmlText: 'A parent or guardian must provide consent before you can continue.',
    parentalConfirmButtonLabel: 'Continue',
  })

  const [themeOverride, setThemeOverride] = useState(false)

  const [theme, setTheme] = useState<ThemeState>({
    colorBg: '#ffffff',
    colorText: '#1a1a1a',
    colorPrimary: '#1565c0',
    colorPrimaryText: '#ffffff',
    colorSecondary: '#f0f4f8',
    colorSecondaryText: '#1a3460',
    colorBorder: '#e2e8f0',
    colorAccent: '#d32f2f',
    colorAccentText: '#ffffff',
    fontFamily: 'system-ui, sans-serif',
    fontSizeBase: '14px',
    fontSizeHeading: '18px',
    fontSizeMultiplier: '1',
    borderRadius: '8px',
    borderRadiusBtn: '4px',
    toggleBgOn: '#1565c0',
    toggleBgOff: '#cccccc',
  })

  const [compliance, setCompliance] = useState<ComplianceState>({ type: 'opt-in' })

  const [core, setCore] = useState<CoreState>({
    locale: 'en',
    storage: 'cookie',
    cookieName: '',
    cookieDomains: '',
    allowReceipt: false,
    disableCssTemplate: false,
    userId: '',
  })

  const [api, setApi] = useState<ApiState>({
    enabled: false,
    baseUrl: '',
    authToken: '',
    complianceGroup: '',
  })

  const [gtm, setGtm] = useState<GtmState>({
    containerId: '',
    dataLayer: 'dataLayer',
    urlPassthrough: false,
    adsDataRedaction: false,
  })

  const [cookies, setCookies] = useState<CookieItem[]>(DEFAULT_COOKIES)
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES)
  const [expiryDays, setExpiryDays] = useState(365)
  const [bannerButtons, setBannerButtons] = useState<ButtonItem[]>(DEFAULT_BANNER_BUTTONS)
  const [gpcButtons, setGpcButtons] = useState<ButtonItem[]>(DEFAULT_GPC_BUTTONS)
  const [modalButtons, setModalButtons] = useState<ButtonItem[]>(DEFAULT_MODAL_BUTTONS)
  const [liveState, setLiveState] = useState<LiveState | null>(null)

  // Mirrors the hard-error / warning split from handleSave() in
  // apps/api/src/dashboard/src/pages/ConsentTemplateEditor.tsx: a non-necessary purpose sitting
  // in a mandatory category grants a tracking parameter with no consent gate (error); a
  // necessary purpose sitting outside the mandatory category only risks breaking functionality
  // if denied (warning, not blocking — this playground has no save step to block).
  const cookieValidation = useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []

    const categoryByCookieId = new Map<string, CategoryItem>()
    for (const cat of categories) {
      for (const id of cat.cookies) categoryByCookieId.set(id, cat)
    }

    for (const c of cookies) {
      if (!c.purpose) errors.push(`"${c.id}" has no purpose selected.`)
    }

    const membership = new Map<string, number>()
    for (const c of cookies) membership.set(c.id, 0)
    for (const cat of categories) {
      for (const id of cat.cookies) membership.set(id, (membership.get(id) ?? 0) + 1)
    }
    for (const [id, count] of membership) {
      if (count === 0) errors.push(`"${id}" isn't assigned to any category.`)
      if (count > 1) errors.push(`"${id}" is assigned to more than one category.`)
    }

    for (const c of cookies) {
      if (!c.purpose) continue
      const cat = categoryByCookieId.get(c.id)
      if (!cat) continue
      if (cat.legalBasis === 'mandatory' && c.purpose !== 'necessary') {
        errors.push(
          `"${c.id}" has purpose "${c.purpose}" but sits in the mandatory category "${cat.heading}" — it would be granted with no consent gate.`
        )
      }
      if (cat.legalBasis !== 'mandatory' && c.purpose === 'necessary') {
        warnings.push(
          `"${c.id}" has purpose "necessary" but its category "${cat.heading}" isn't Mandatory — functionality may break if a visitor denies it.`
        )
      }
    }

    return { errors, warnings }
  }, [cookies, categories])

  // New cookie form state
  const [newCookieId, setNewCookieId] = useState('')

  // ── Build config ─────────────────────────────────────────────────────────────

  const isCustomCompliance = compliance.type === 'custom'

  /**
   * Setup-tab config: applies universally, regardless of which compliance.type is
   * selected. `compliance.type: 'custom'` is never sent here — 'custom' isn't a real
   * ComplianceGroupId (resolveProfile() throws "No embedded profile found" for it) —
   * initWidget() swaps in a Symbol from a registered ConsentiProfile instead.
   */
  const buildConfig = useCallback((): ConsentiConfig => {
    const complianceConfig =
      compliance.type && !isCustomCompliance ? { type: compliance.type } : undefined

    if (isDefault) {
      return {
        core: {},
        ...(complianceConfig ? { compliance: complianceConfig } : {}),
        ...(darkMode ? { darkMode: true } : {}),
        ...(!autoInit ? { autoInit: false } : {}),
      }
    }

    const gpcMode = gpc.mode === 'true' ? 'honor' : gpc.mode === 'strict' ? 'strict' : 'ignore'

    const gtmConfig = gtm.containerId
      ? {
        containerId: gtm.containerId,
        dataLayer: gtm.dataLayer || 'dataLayer',
        urlPassthrough: gtm.urlPassthrough,
        adsDataRedaction: gtm.adsDataRedaction,
      }
      : undefined

    const apiConfig = api.enabled
      ? {
        enabled: true as const,
        ...(api.baseUrl ? { baseUrl: api.baseUrl } : {}),
        ...(api.authToken ? { authToken: api.authToken } : {}),
        ...(api.complianceGroup
          ? { complianceGroup: api.complianceGroup as ComplianceGroupId }
          : {}),
      }
      : undefined

    return {
      ...(darkMode ? { darkMode: true } : {}),
      ...(!autoInit ? { autoInit: false } : {}),
      ...(apiConfig ? { api: apiConfig } : {}),
      ...(complianceConfig ? { compliance: complianceConfig } : {}),
      core: {
        ...(core.allowReceipt ? { allowReceipt: true } : {}),
        ...(core.disableCssTemplate ? { disableCssTemplate: true } : {}),
        locale: core.locale || 'en',
        storage: core.storage,
        ...(core.cookieName ? { cookieName: core.cookieName } : {}),
        ...(core.cookieDomains ? { cookieDomains: core.cookieDomains } : {}),
        ...(core.userId ? { userId: core.userId } : {}),
        ...(themeOverride
          ? {
            theme: {
              colorBg: theme.colorBg,
              colorText: theme.colorText,
              colorPrimary: theme.colorPrimary,
              colorPrimaryText: theme.colorPrimaryText,
              colorSecondary: theme.colorSecondary,
              colorSecondaryText: theme.colorSecondaryText,
              colorBorder: theme.colorBorder,
              colorAccent: theme.colorAccent,
              colorAccentText: theme.colorAccentText,
              fontFamily: theme.fontFamily,
              fontSizeBase: theme.fontSizeBase,
              fontSizeHeading: theme.fontSizeHeading,
              fontSizeMultiplier: theme.fontSizeMultiplier,
              borderRadius: theme.borderRadius,
              borderRadiusBtn: theme.borderRadiusBtn,
              toggleBgOn: theme.toggleBgOn,
              toggleBgOff: theme.toggleBgOff,
            },
          }
          : {}),
      },
      ...(gtmConfig ? { utils: { gtm: gtmConfig } } : {}),
      // gpcMode is a Setup-tab (runtime behavior) toggle, not Local Profile content — it
      // applies on top of whichever profile resolves, built-in or the custom local one.
      ...(gpcMode !== 'ignore' ? { profileOverride: { gpcMode } } : {}),
    }
  }, [
    isDefault,
    darkMode,
    autoInit,
    gpc.mode,
    themeOverride,
    theme,
    compliance,
    isCustomCompliance,
    core,
    api,
    gtm,
  ])

  /**
   * Local Profile tab content — only meaningful (and only sent) when compliance.type is
   * 'custom'. Registered via ConsentiProfile so it stands entirely on its own, with no
   * built-in compliance-group defaults merged underneath.
   */
  const buildLocalProfileConfig = useCallback((): ProfileConfig => {
    return {
      id: 'playground-custom-profile',
      defaultLocale: core.locale || 'en',
      ...(expiryDays ? { expiryDays } : {}),
      cookies: Object.fromEntries(
        cookies.map(c => [
          c.id,
          {
            ...(c.purpose ? { purpose: c.purpose } : {}),
            ...(c.listenGpc ? { listenGpc: true } : {}),
            ...(c.preGrant ? { preGrant: true } : {}),
            ...(c.cpraCategory ? { cpraCategory: c.cpraCategory } : {}),
          },
        ])
      ),
      mainBanner: {
        position: banner.position,
        heading: banner.heading,
        htmlText: banner.htmlText,
        overlayOpacity: banner.overlayOpacity,
        showClose: banner.showClose,
        ...(banner.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
        ...(banner.headingTag ? { headingTag: banner.headingTag } : {}),
        buttons: buttonItemsToMap(bannerButtons),
      },
      gpcBanner: {
        position: gpc.bannerPosition,
        heading: gpc.bannerHeading,
        htmlText: gpc.bannerHtml,
        showClose: gpc.showClose,
        ...(gpc.showLocaleSwitcher ? { showLocaleSwitcher: true } : {}),
        buttons: buttonItemsToMap(gpcButtons),
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
        htmlText: modal.htmlText,
        categories: Object.fromEntries(
          categories.map(cat => [
            cat.id,
            {
              heading: cat.heading,
              htmlText: cat.htmlText,
              legalBasis: cat.legalBasis,
              ...(cat.headingTag ? { headingTag: cat.headingTag } : {}),
              cookies: cat.cookies,
            },
          ])
        ),
        buttons: buttonItemsToMap(modalButtons),
      },
      ...(ageGate.enabled
        ? {
          ageGate: {
            enabled: true,
            minimumAge: ageGate.minimumAge,
            ...(ageGate.requireParentalConsent ? { requireParentalConsent: true } : {}),
          },
          ageGateModal: {
            ...(ageGate.heading ? { heading: ageGate.heading } : {}),
            htmlText: ageGate.htmlText,
            confirmButtonLabel: ageGate.confirmButtonLabel,
            denyButtonLabel: ageGate.denyButtonLabel,
            parentalConsent: {
              ...(ageGate.parentalHeading ? { heading: ageGate.parentalHeading } : {}),
              htmlText: ageGate.parentalHtmlText,
              confirmButtonLabel: ageGate.parentalConfirmButtonLabel,
            },
          },
        }
        : {}),
    }
  }, [
    core.locale,
    expiryDays,
    cookies,
    categories,
    banner,
    gpc,
    modal,
    bannerButtons,
    gpcButtons,
    modalButtons,
    ageGate,
  ])

  // ── Widget lifecycle ─────────────────────────────────────────────────────────

  const refreshState = useCallback(() => {
    const w = widgetRef.current
    if (!w) {
      setLiveState(null)
      return
    }
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
    const { ConsentiSetup, ConsentiProfile } = await import('@consenti/ui')

    widgetRef.current?.destroy()

    let config = buildConfig()

    // 'custom' has no built-in embedded profile — register the Local Profile tab's
    // content as a standalone ConsentiProfile and target it via its Symbol, so it
    // never depends on (or falls back to) any of the 8 built-in compliance groups.
    if (!isDefault && isCustomCompliance) {
      const profile = new ConsentiProfile(buildLocalProfileConfig())
      const needsMockLocales =
        banner.showLocaleSwitcher || modal.showLocaleSwitcher || gpc.showLocaleSwitcher
      config = {
        ...config,
        compliance: { type: profile.getType() },
        ...(needsMockLocales
          ? {
            profileOverride: {
              ...config.profileOverride,
              locales: [core.locale || 'en', 'fr'],
            },
          }
          : {}),
      }
    }

    const w = new ConsentiSetup(config) as unknown as WidgetHandle
    widgetRef.current = w
    w.onReady(refreshState)
    refreshState()
  }, [
    buildConfig,
    buildLocalProfileConfig,
    isDefault,
    isCustomCompliance,
    banner.showLocaleSwitcher,
    modal.showLocaleSwitcher,
    gpc.showLocaleSwitcher,
    core.locale,
    refreshState,
  ])

  const scheduleReinit = useCallback(
    (delay: number) => {
      if (reinitTimerRef.current !== null) clearTimeout(reinitTimerRef.current)
      reinitTimerRef.current = setTimeout(() => void initWidget(), delay)
    },
    [initWidget]
  )

  // Boot on mount
  useEffect(() => {
    void initWidget()
    return () => {
      widgetRef.current?.destroy()
      widgetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The Local Profile tab only exists for compliance.type: 'custom' — if the user
  // switches away while it's open, fall back to Setup rather than leaving it stranded.
  useEffect(() => {
    if (compliance.type !== 'custom' && mainTab === 'profile') setMainTab('setup')
  }, [compliance.type, mainTab])

  // Re-init when config changes (debounced)
  useEffect(() => {
    scheduleReinit(300)
  }, [
    banner,
    modal,
    gpc,
    themeOverride,
    theme,
    compliance,
    core,
    api,
    gtm,
    cookies,
    categories,
    expiryDays,
    bannerButtons,
    gpcButtons,
    modalButtons,
    ageGate,
    isDefault,
    darkMode,
    autoInit,
    scheduleReinit,
  ])

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
    if (!id || cookies.some(c => c.id === id)) return
    setCookies(prev => [
      ...prev,
      { id, purpose: '', listenGpc: false, preGrant: false, cpraCategory: '' },
    ])
    setNewCookieId('')
  }

  function removeCookie(id: string) {
    setCookies(prev => prev.filter(c => c.id !== id))
    setCategories(prev =>
      prev.map(cat => ({ ...cat, cookies: cat.cookies.filter(cid => cid !== id) }))
    )
  }

  function updateCookie(id: string, patch: Partial<CookieItem>) {
    setCookies(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  function setCookiePurpose(id: string, purpose: CookiePurpose) {
    setCookies(prev => prev.map(c => (c.id === id ? applyPurposeDefaults(c, purpose) : c)))
  }

  function addCategory() {
    setCategories(prev => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        heading: 'New Category',
        headingTag: '',
        htmlText: 'Description.',
        legalBasis: 'consent',
        cookies: [],
      },
    ])
  }

  function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  function updateCategoryHeading(id: string, heading: string) {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, heading } : c)))
  }

  function updateCategoryHeadingTag(id: string, headingTag: string) {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, headingTag } : c)))
  }

  function updateCategoryHtmlText(id: string, htmlText: string) {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, htmlText } : c)))
  }

  function updateCategoryLegalBasis(id: string, legalBasis: LegalBasis) {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, legalBasis } : c)))
  }

  function toggleCategoryCookie(catId: string, cookieId: string, checked: boolean) {
    setCategories(prev =>
      prev.map(c => {
        if (c.id !== catId) return c
        return {
          ...c,
          cookies: checked
            ? c.cookies.includes(cookieId)
              ? c.cookies
              : [...c.cookies, cookieId]
            : c.cookies.filter(id => id !== cookieId),
        }
      })
    )
  }

  // ── API button actions ───────────────────────────────────────────────────────

  async function submitAll() {
    const consent = Object.fromEntries(cookies.map(c => [c.id, 'granted' as const]))
    await widgetRef.current?.submitConsent(consent)
    refreshState()
  }

  async function submitNone() {
    await widgetRef.current?.submitConsent({})
    refreshState()
  }

  // ── Tab content renderers ────────────────────────────────────────────────────

  function renderSetupCore() {
    return (
      <div className="space-y-0">
        <CtrlGroup title="Compliance Group">
          <CtrlRow
            label="compliance.type"
            hint="Every option except Custom renders Consenti's actual built-in profile for that group — the Local Profile tab is hidden and has no effect. Custom registers the Local Profile tab's content as a standalone ConsentiProfile instead. Leave empty for auto-detection."
          >
            <Select
              value={compliance.type}
              onChange={v => setCompliance({ type: v })}
              options={[
                { value: '', label: '(auto-detect from browser locale)' },
                { value: 'custom', label: 'Custom (Consenti Local Profile)' },
                {
                  value: 'opt-in',
                  label: 'opt-in — GDPR, UK GDPR, PIPEDA, POPIA, PDPA-TH, APPI, KVKK',
                },
                { value: 'opt-out', label: 'opt-out — CCPA / US States' },
                { value: 'opt-out-strict', label: 'opt-out-strict — CPRA (California 2023)' },
                { value: 'opt-in-dpdpa', label: 'opt-in-dpdpa — DPDPA (India 2023)' },
                { value: 'opt-in-china', label: 'opt-in-china — PIPL (China 2021)' },
                { value: 'opt-in-brazil', label: 'opt-in-brazil — LGPD (Brazil)' },
                {
                  value: 'general-privacy-consent',
                  label: 'general-privacy-consent — TCF v2.3, COPPA',
                },
                {
                  value: 'notice-only',
                  label: 'notice-only — informational notice, no opt-in required',
                },
              ]}
            />
          </CtrlRow>
        </CtrlGroup>
        <CtrlGroup title="Core Config">
          <CtrlRow label="Locale">
            <TextInput
              value={core.locale}
              onChange={v => setCore(p => ({ ...p, locale: v }))}
              placeholder="e.g. en, fr, fr-CA"
            />
          </CtrlRow>
          <CtrlRow label="Storage mode">
            <Select
              value={core.storage}
              onChange={v => setCore(p => ({ ...p, storage: v }))}
              options={[
                { value: 'cookie', label: 'cookie (cross-subdomain)' },
                { value: 'localStorage', label: 'localStorage (origin-scoped)' },
              ]}
            />
          </CtrlRow>
          <CtrlRow
            label="Cookie name"
            hint="Cookie/localStorage key name. Default: consenti_data."
          >
            <TextInput
              value={core.cookieName}
              onChange={v => setCore(p => ({ ...p, cookieName: v }))}
              placeholder="consenti_data"
            />
          </CtrlRow>
          <CtrlRow
            label="Cookie domains"
            hint="Comma-separated. First entry used as Domain attribute."
          >
            <TextInput
              value={core.cookieDomains}
              onChange={v => setCore(p => ({ ...p, cookieDomains: v }))}
              placeholder=".example.com"
            />
          </CtrlRow>
          <CtrlRow label="GPC mode (profileOverride.gpcMode)">
            <Select
              value={gpc.mode}
              onChange={v => setGpc(p => ({ ...p, mode: v }))}
              options={[
                { value: 'false', label: "ignore — don't check the GPC signal" },
                { value: 'true', label: 'honor — deny + show GPC banner' },
                { value: 'strict', label: 'strict — deny silently, no banner' },
              ]}
            />
          </CtrlRow>
          <CtrlRow
            label="User ID (authenticated users)"
            hint="Overrides auto-generated visitor ID. Enables cross-device sync via API."
          >
            <TextInput
              value={core.userId}
              onChange={v => setCore(p => ({ ...p, userId: v }))}
              placeholder="server-assigned UUID"
            />
          </CtrlRow>
          <CtrlRow>
            <Checkbox
              checked={core.allowReceipt}
              onChange={v => setCore(p => ({ ...p, allowReceipt: v }))}
              label="Allow consent receipt download (allowReceipt)"
            />
          </CtrlRow>
          <CtrlRow hint="Set to true when you import the CSS via your bundler to avoid duplicate styles.">
            <Checkbox
              checked={core.disableCssTemplate}
              onChange={v => setCore(p => ({ ...p, disableCssTemplate: v }))}
              label="Disable CSS template injection (disableCssTemplate)"
            />
          </CtrlRow>
        </CtrlGroup>
      </div>
    )
  }

  function renderSetupApi() {
    return (
      <div className="space-y-0">
        <CtrlGroup title="API Config">
          <CtrlRow>
            <Checkbox
              checked={api.enabled}
              onChange={v => setApi(p => ({ ...p, enabled: v }))}
              label="Enable API mode"
            />
          </CtrlRow>
          <div className={api.enabled ? '' : 'opacity-40 pointer-events-none'}>
            <CtrlRow label="Base URL" hint="Backend API base URL. Defaults to /consenti/api.">
              <TextInput
                value={api.baseUrl}
                onChange={v => setApi(p => ({ ...p, baseUrl: v }))}
                placeholder="https://example.com/consenti/api"
              />
            </CtrlRow>
            <CtrlRow label="Auth token" hint="Bearer token for authenticated requests.">
              <TextInput
                value={api.authToken}
                onChange={v => setApi(p => ({ ...p, authToken: v }))}
                placeholder="Bearer token"
              />
            </CtrlRow>
            <CtrlRow
              label="Compliance group"
              hint="When set, skips /resolve-profile auto-resolution and always fetches this group's profile. Leave empty for auto-resolve."
            >
              <TextInput
                value={api.complianceGroup}
                onChange={v => setApi(p => ({ ...p, complianceGroup: v }))}
                placeholder="opt-in"
              />
            </CtrlRow>
          </div>
        </CtrlGroup>
      </div>
    )
  }

  function renderSetupGtm() {
    return (
      <CtrlGroup title="GTM & Integrations">
        <CtrlRow label="GTM Container ID" hint="Leave blank to skip all dataLayer pushes.">
          <TextInput
            value={gtm.containerId}
            onChange={v => setGtm(p => ({ ...p, containerId: v }))}
            placeholder="GTM-XXXXXX"
          />
        </CtrlRow>
        <CtrlRow
          label="dataLayer variable name"
          hint="Override when your site uses a custom variable name."
        >
          <TextInput value={gtm.dataLayer} onChange={v => setGtm(p => ({ ...p, dataLayer: v }))} />
        </CtrlRow>
        <CtrlRow hint="Pushes url_passthrough: true for cookieless conversion modelling. Requires gtag on page.">
          <Checkbox
            checked={gtm.urlPassthrough}
            onChange={v => setGtm(p => ({ ...p, urlPassthrough: v }))}
            label="urlPassthrough (GCM v2)"
          />
        </CtrlRow>
        <CtrlRow hint="Pushes ads_data_redaction when ad_storage is denied. Requires gtag on page.">
          <Checkbox
            checked={gtm.adsDataRedaction}
            onChange={v => setGtm(p => ({ ...p, adsDataRedaction: v }))}
            label="adsDataRedaction (GCM v2)"
          />
        </CtrlRow>
      </CtrlGroup>
    )
  }

  function renderSetupActions() {
    return (
      <CtrlGroup title="Behavior Flags">
        <CtrlRow>
          <Checkbox
            checked={isDefault}
            onChange={setIsDefault}
            label="Use default banner profile (ignores Local Profile settings)"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox checked={darkMode} onChange={setDarkMode} label="Dark mode (darkMode: true)" />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={!autoInit}
            onChange={v => setAutoInit(!v)}
            label="Defer init (autoInit: false) — use widget.init() button below"
          />
        </CtrlRow>
      </CtrlGroup>
    )
  }

  function renderProfileCookies() {
    return (
      <div className="space-y-0">
        <CtrlGroup title="Cookies">
          <p className="ctrl-hint mb-3">
            Define the cookie purposes your site manages. A cookie&apos;s legal basis isn&apos;t set
            here — it&apos;s derived from whichever category below lists its ID.
          </p>

          <div className="mb-3 px-3 py-2 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-700">
            Per-cookie TCF vendor/purpose signaling (<code className="bg-sky-100 px-0.5 rounded">tcfVendorId</code>,{' '}
            <code className="bg-sky-100 px-0.5 rounded">tcfPurposes</code>) and spec-correct TC-string
            encoding are a server-profile feature (<code className="bg-sky-100 px-0.5 rounded">api.enabled: true</code>,{' '}
            <code className="bg-sky-100 px-0.5 rounded">@consenti/api</code>) — this playground&apos;s
            local Custom profile doesn&apos;t expose those fields. See the TCF guide for the full setup.
          </div>

          {(cookieValidation.errors.length > 0 || cookieValidation.warnings.length > 0) && (
            <div className="mb-3 space-y-1.5">
              {cookieValidation.errors.map((msg, i) => (
                <div
                  key={`err-${i}`}
                  className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
                >
                  {msg}
                </div>
              ))}
              {cookieValidation.warnings.map((msg, i) => (
                <div
                  key={`warn-${i}`}
                  className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"
                >
                  {msg}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center mb-3">
            <label className="text-xs text-slate-700 whitespace-nowrap">
              Consent expiry (days, profile-wide):
            </label>
            <input
              type="number"
              className="ctrl-input w-24"
              value={expiryDays}
              onChange={e => setExpiryDays(Number(e.target.value))}
            />
          </div>

          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-3 font-medium">ID</th>
                  <th className="pb-2 pr-3 font-medium">Purpose</th>
                  <th className="pb-2 pr-3 font-medium text-center">GPC</th>
                  <th className="pb-2 pr-3 font-medium text-center">Pre-Grant</th>
                  <th className="pb-2 pr-3 font-medium">CPRA</th>
                  <th className="pb-2 font-medium w-6" />
                </tr>
              </thead>
              <tbody>
                {cookies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-2 ctrl-hint italic">
                      No cookies defined yet.
                    </td>
                  </tr>
                ) : (
                  cookies.map(cookie => {
                    const owningCategory = categories.find(cat => cat.cookies.includes(cookie.id))
                    const isMandatory = cookie.purpose === 'necessary' || owningCategory?.legalBasis === 'mandatory'
                    const preGrantLocked = owningCategory?.legalBasis !== 'consent'
                    return (
                      <tr key={cookie.id} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-3">
                          <code className="text-brand-500 font-mono text-[10px]">{cookie.id}</code>
                          {!owningCategory && (
                            <p className="text-[10px] text-red-500 mt-0.5">Uncategorized</p>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            className={`ctrl-input text-xs w-32 ${!cookie.purpose ? 'border-red-400 bg-red-50' : ''}`}
                            value={cookie.purpose}
                            onChange={e => setCookiePurpose(cookie.id, e.target.value as CookiePurpose)}
                          >
                            <option value="" disabled>
                              Select purpose
                            </option>
                            {COOKIE_PURPOSE_IDS.map(p => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          {!cookie.purpose && <p className="text-[10px] text-red-500 mt-0.5">Required</p>}
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5"
                            checked={cookie.listenGpc}
                            disabled={isMandatory}
                            onChange={e => updateCookie(cookie.id, { listenGpc: e.target.checked })}
                            title={isMandatory ? 'Mandatory cookies are never denied by GPC' : ''}
                          />
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5"
                            checked={preGrantLocked ? true : cookie.preGrant}
                            disabled={preGrantLocked}
                            onChange={e => updateCookie(cookie.id, { preGrant: e.target.checked })}
                            title={
                              preGrantLocked
                                ? 'Already effectively pre-granted — only editable when the category legal basis is Consent'
                                : ''
                            }
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            className="ctrl-input text-xs w-28"
                            value={cookie.cpraCategory}
                            onChange={e =>
                              updateCookie(cookie.id, {
                                cpraCategory: e.target.value as CookieItem['cpraCategory'],
                              })
                            }
                          >
                            <option value="">—</option>
                            <option value="sale">sale</option>
                            <option value="sharing">sharing</option>
                            <option value="sensitive">sensitive</option>
                          </select>
                        </td>
                        <td className="py-2 text-center">
                          <button
                            onClick={() => removeCookie(cookie.id)}
                            className="text-slate-400 hover:text-red-500 bg-transparent border-0 cursor-pointer text-base leading-none px-0.5"
                            title="Remove"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200">
            <input
              type="text"
              className="ctrl-input flex-1 min-w-32"
              placeholder="Cookie name e.g. analytics_storage"
              value={newCookieId}
              onChange={e => setNewCookieId(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addCookie()
              }}
            />
            <button
              onClick={addCookie}
              className="px-3 py-1.5 border-2 border-brand-500 text-brand-500 text-xs font-semibold rounded-md bg-transparent hover:bg-brand-50 cursor-pointer transition-colors"
            >
              + Add Cookie
            </button>
          </div>
          <p className="ctrl-hint mt-1">
            New cookies start with no purpose selected — set one in the table above (and assign it to
            a category below) before it&apos;s usable.
          </p>
        </CtrlGroup>

        <CtrlGroup title="Modal Categories">
          <p className="ctrl-hint mb-3">
            Group cookies into categories shown in the preference modal — each category owns the
            legal basis for every cookie it lists. A cookie should belong to exactly one category.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {categories.length === 0 ? (
              <span className="ctrl-hint italic">No categories defined yet.</span>
            ) : (
              categories.map(cat => (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      value={cat.heading}
                      onChange={e => updateCategoryHeading(cat.id, e.target.value)}
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
                    onChange={e => updateCategoryHeadingTag(cat.id, e.target.value)}
                    placeholder="headingTag (e.g. h3)"
                  />
                  <textarea
                    className="ctrl-input resize-y w-full text-xs"
                    rows={2}
                    value={cat.htmlText}
                    onChange={e => updateCategoryHtmlText(cat.id, e.target.value)}
                    placeholder="Description HTML"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      className="ctrl-input flex-1 text-xs"
                      value={cat.legalBasis}
                      onChange={e => updateCategoryLegalBasis(cat.id, e.target.value as LegalBasis)}
                    >
                      <option value="consent">consent</option>
                      <option value="legitimate_interest">legitimate_interest</option>
                      <option value="mandatory">mandatory</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400">Cookies in this category:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cookies.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No cookies defined</span>
                    ) : (
                      cookies.map(cookie => (
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
                            onChange={e =>
                              toggleCategoryCookie(cat.id, cookie.id, e.target.checked)
                            }
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
        </CtrlGroup>
      </div>
    )
  }

  function renderProfileMainBanner() {
    return (
      <CtrlGroup title="Main Banner">
        <CtrlRow label="Position">
          <Select
            value={banner.position}
            onChange={v => setBanner(p => ({ ...p, position: v }))}
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
          <TextInput
            value={banner.heading}
            onChange={v => setBanner(p => ({ ...p, heading: v }))}
          />
        </CtrlRow>
        <CtrlRow label="Heading tag" hint="HTML tag, e.g. h2, p. Default: h2.">
          <TextInput
            value={banner.headingTag}
            onChange={v => setBanner(p => ({ ...p, headingTag: v }))}
            placeholder="h2"
          />
        </CtrlRow>
        <CtrlRow label="Body text (HTML)">
          <Textarea
            value={banner.htmlText}
            onChange={v => setBanner(p => ({ ...p, htmlText: v }))}
          />
        </CtrlRow>
        <CtrlRow label="Overlay opacity">
          <RangeInput
            value={banner.overlayOpacity}
            onChange={v => setBanner(p => ({ ...p, overlayOpacity: v }))}
            label="%"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={banner.showClose}
            onChange={v => setBanner(p => ({ ...p, showClose: v }))}
            label="Show close button"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={banner.showLocaleSwitcher}
            onChange={v => setBanner(p => ({ ...p, showLocaleSwitcher: v }))}
            label="Show locale switcher"
          />
        </CtrlRow>
        <CtrlRow
          label="Buttons"
          hint="Add a button with action 'link (URL)' to render it as a text link below the banner body."
        >
          <ButtonEditor buttons={bannerButtons} onChange={setBannerButtons} />
        </CtrlRow>
      </CtrlGroup>
    )
  }

  function renderProfileGpcBanner() {
    return (
      <CtrlGroup title="GPC Banner">
        <p className="ctrl-hint mb-3">
          Content for the GPC notification banner. Shown when{' '}
          <code className="bg-slate-100 px-0.5 rounded">gpcMode: 'honor'</code> and a GPC signal is
          detected. GPC is detected via <em>navigator.globalPrivacyControl</em> — enable in Brave
          or Firefox+extension to test.
        </p>
        <CtrlRow label="Position">
          <Select
            value={gpc.bannerPosition}
            onChange={v => setGpc(p => ({ ...p, bannerPosition: v }))}
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
          <TextInput
            value={gpc.bannerHeading}
            onChange={v => setGpc(p => ({ ...p, bannerHeading: v }))}
          />
        </CtrlRow>
        <CtrlRow label="Body (HTML)">
          <Textarea value={gpc.bannerHtml} onChange={v => setGpc(p => ({ ...p, bannerHtml: v }))} />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={gpc.showClose}
            onChange={v => setGpc(p => ({ ...p, showClose: v }))}
            label="Show close button"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={gpc.showLocaleSwitcher}
            onChange={v => setGpc(p => ({ ...p, showLocaleSwitcher: v }))}
            label="Show locale switcher"
          />
        </CtrlRow>
        <CtrlRow label="Buttons">
          <ButtonEditor buttons={gpcButtons} onChange={setGpcButtons} />
        </CtrlRow>
      </CtrlGroup>
    )
  }

  function renderProfilePrefModal() {
    return (
      <CtrlGroup title="Preference Modal">
        <CtrlRow label="Position">
          <Select
            value={modal.position}
            onChange={v => setModal(p => ({ ...p, position: v }))}
            options={[
              { value: 'center', label: 'center' },
              { value: 'left', label: 'left' },
              { value: 'right', label: 'right' },
            ]}
          />
        </CtrlRow>
        <CtrlRow label="Heading">
          <TextInput value={modal.heading} onChange={v => setModal(p => ({ ...p, heading: v }))} />
        </CtrlRow>
        <CtrlRow label="Heading tag" hint="HTML tag, e.g. h2, p. Default: h2.">
          <TextInput
            value={modal.headingTag}
            onChange={v => setModal(p => ({ ...p, headingTag: v }))}
            placeholder="h2"
          />
        </CtrlRow>
        <CtrlRow label="Subheading">
          <TextInput
            value={modal.subheading}
            onChange={v => setModal(p => ({ ...p, subheading: v }))}
          />
        </CtrlRow>
        <CtrlRow label="Intro text (HTML)" hint="Optional text rendered above the category list.">
          <Textarea value={modal.htmlText} onChange={v => setModal(p => ({ ...p, htmlText: v }))} />
        </CtrlRow>
        <CtrlRow label="Overlay opacity">
          <RangeInput
            value={modal.overlayOpacity}
            onChange={v => setModal(p => ({ ...p, overlayOpacity: v }))}
            label="%"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={modal.persistent}
            onChange={v => setModal(p => ({ ...p, persistent: v }))}
            label="Persistent (no outside-click close)"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={modal.showClose}
            onChange={v => setModal(p => ({ ...p, showClose: v }))}
            label="Show close button"
          />
        </CtrlRow>
        <CtrlRow>
          <Checkbox
            checked={modal.showLocaleSwitcher}
            onChange={v => setModal(p => ({ ...p, showLocaleSwitcher: v }))}
            label="Show locale switcher"
          />
        </CtrlRow>
        <CtrlRow label="Buttons">
          <ButtonEditor buttons={modalButtons} onChange={setModalButtons} />
        </CtrlRow>
      </CtrlGroup>
    )
  }

  function renderProfileAgeGate() {
    return (
      <CtrlGroup title="Age Gate">
        <p className="ctrl-hint mb-3">
          Prompts a first-time visitor (no stored consent yet) to confirm their age before the
          banner shows — see <code className="bg-slate-100 px-0.5 rounded">ageGate</code> /{' '}
          <code className="bg-slate-100 px-0.5 rounded">ageGateModal</code> on the profile. Use{' '}
          <code className="bg-slate-100 px-0.5 rounded">reConsent()</code> in the action bar below
          to re-trigger it after testing.
        </p>
        <CtrlRow>
          <Checkbox
            checked={ageGate.enabled}
            onChange={v => setAgeGate(p => ({ ...p, enabled: v }))}
            label="Enable age gate (ageGate.enabled)"
          />
        </CtrlRow>
        <div className={ageGate.enabled ? '' : 'opacity-40 pointer-events-none'}>
          <CtrlRow label="Minimum age">
            <input
              type="number"
              className="ctrl-input w-24"
              value={ageGate.minimumAge}
              onChange={e => setAgeGate(p => ({ ...p, minimumAge: Number(e.target.value) }))}
            />
          </CtrlRow>
          <CtrlRow>
            <Checkbox
              checked={ageGate.requireParentalConsent}
              onChange={v => setAgeGate(p => ({ ...p, requireParentalConsent: v }))}
              label="Require parental consent when declined"
            />
          </CtrlRow>
          <CtrlRow label="Heading">
            <TextInput
              value={ageGate.heading}
              onChange={v => setAgeGate(p => ({ ...p, heading: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Body text (HTML)">
            <Textarea
              value={ageGate.htmlText}
              onChange={v => setAgeGate(p => ({ ...p, htmlText: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Confirm button label">
            <TextInput
              value={ageGate.confirmButtonLabel}
              onChange={v => setAgeGate(p => ({ ...p, confirmButtonLabel: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Deny button label">
            <TextInput
              value={ageGate.denyButtonLabel}
              onChange={v => setAgeGate(p => ({ ...p, denyButtonLabel: v }))}
            />
          </CtrlRow>
          <div className={ageGate.requireParentalConsent ? '' : 'opacity-40 pointer-events-none'}>
            <CtrlRow label="Parental consent heading">
              <TextInput
                value={ageGate.parentalHeading}
                onChange={v => setAgeGate(p => ({ ...p, parentalHeading: v }))}
              />
            </CtrlRow>
            <CtrlRow label="Parental consent body (HTML)">
              <Textarea
                value={ageGate.parentalHtmlText}
                onChange={v => setAgeGate(p => ({ ...p, parentalHtmlText: v }))}
              />
            </CtrlRow>
            <CtrlRow label="Parental consent confirm label">
              <TextInput
                value={ageGate.parentalConfirmButtonLabel}
                onChange={v => setAgeGate(p => ({ ...p, parentalConfirmButtonLabel: v }))}
              />
            </CtrlRow>
          </div>
        </div>
      </CtrlGroup>
    )
  }

  function renderSetupTheme() {
    return (
      <CtrlGroup title="Theme">
        <CtrlRow>
          <Checkbox checked={themeOverride} onChange={setThemeOverride} label="Override Theme" />
        </CtrlRow>
        <div className={themeOverride ? '' : 'opacity-40 pointer-events-none'}>
          <CtrlRow label="Background colour">
            <ColorInput
              value={theme.colorBg}
              onChange={v => setTheme(p => ({ ...p, colorBg: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Text colour">
            <ColorInput
              value={theme.colorText}
              onChange={v => setTheme(p => ({ ...p, colorText: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Primary accent">
            <ColorInput
              value={theme.colorPrimary}
              onChange={v => setTheme(p => ({ ...p, colorPrimary: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Primary button text">
            <ColorInput
              value={theme.colorPrimaryText}
              onChange={v => setTheme(p => ({ ...p, colorPrimaryText: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Secondary button bg">
            <ColorInput
              value={theme.colorSecondary}
              onChange={v => setTheme(p => ({ ...p, colorSecondary: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Secondary button text">
            <ColorInput
              value={theme.colorSecondaryText}
              onChange={v => setTheme(p => ({ ...p, colorSecondaryText: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Border colour">
            <ColorInput
              value={theme.colorBorder}
              onChange={v => setTheme(p => ({ ...p, colorBorder: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Accent colour (destructive)">
            <ColorInput
              value={theme.colorAccent}
              onChange={v => setTheme(p => ({ ...p, colorAccent: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Accent button text">
            <ColorInput
              value={theme.colorAccentText}
              onChange={v => setTheme(p => ({ ...p, colorAccentText: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Toggle ON colour">
            <ColorInput
              value={theme.toggleBgOn}
              onChange={v => setTheme(p => ({ ...p, toggleBgOn: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Toggle OFF colour">
            <ColorInput
              value={theme.toggleBgOff}
              onChange={v => setTheme(p => ({ ...p, toggleBgOff: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Border radius (container)">
            <TextInput
              value={theme.borderRadius}
              onChange={v => setTheme(p => ({ ...p, borderRadius: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Border radius (buttons)">
            <TextInput
              value={theme.borderRadiusBtn}
              onChange={v => setTheme(p => ({ ...p, borderRadiusBtn: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Font family">
            <TextInput
              value={theme.fontFamily}
              onChange={v => setTheme(p => ({ ...p, fontFamily: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Font size base (e.g. 14px)">
            <TextInput
              value={theme.fontSizeBase}
              onChange={v => setTheme(p => ({ ...p, fontSizeBase: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Font size heading (e.g. 18px)">
            <TextInput
              value={theme.fontSizeHeading}
              onChange={v => setTheme(p => ({ ...p, fontSizeHeading: v }))}
            />
          </CtrlRow>
          <CtrlRow label="Font size multiplier (e.g. 1.1)">
            <TextInput
              value={theme.fontSizeMultiplier}
              onChange={v => setTheme(p => ({ ...p, fontSizeMultiplier: v }))}
            />
          </CtrlRow>
        </div>
      </CtrlGroup>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const setupTabs = [
    { id: 'core' as SetupTab, label: 'Core Config' },
    { id: 'theme' as SetupTab, label: 'Theme' },
    { id: 'api' as SetupTab, label: 'API Config' },
    { id: 'gtm' as SetupTab, label: 'GTM & Integrations' },
    { id: 'actions' as SetupTab, label: 'Actions' },
  ]

  const profileTabs = [
    { id: 'mainBanner' as ProfileTab, label: 'Main Banner' },
    { id: 'gpcBanner' as ProfileTab, label: 'GPC Banner' },
    { id: 'prefModal' as ProfileTab, label: 'Pref Modal' },
    { id: 'cookies' as ProfileTab, label: 'Cookies' },
    { id: 'ageGate' as ProfileTab, label: 'Age Gate' },
  ]

  return (
    <div className="max-w-7xl mx-auto bg-white border-t-4 border-brand-500 py-8 px-4 pb-48">
      <h2 className="text-xl font-bold text-brand-600 mb-1">Consenti Playground</h2>
      <p className="text-sm text-slate-500 mb-1">
        Change any field below — the widget re-initialises automatically.
      </p>
      <p className="text-xs text-slate-400 mb-5">
        Note: built-in <code className="bg-slate-100 px-0.5 rounded">compliance.type</code> groups
        render Consenti's real pre-built profile as-is — Setup-tab toggles (GPC mode, theme, API,
        GTM) still apply on top, but the Local Profile tab has no effect. Selecting{' '}
        <strong>Custom</strong> registers the Local Profile tab's content as a standalone{' '}
        <code className="bg-slate-100 px-0.5 rounded">ConsentiProfile</code> via{' '}
        <code className="bg-slate-100 px-0.5 rounded">compliance.type</code> (a{' '}
        <code className="bg-slate-100 px-0.5 rounded">Symbol</code>) — locale fallback (
        <code className="bg-slate-100 px-0.5 rounded">defaultLocale</code>) is not exercised here —
        locale switching always resolves to the configured locale.
      </p>

      {/* ── Horizontal main tabs ─────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
        {/* Tab header */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setMainTab('setup')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${mainTab === 'setup'
              ? 'border-brand-500 text-brand-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
          >
            Consenti Setup
          </button>
          {
            compliance.type === 'custom'
            &&
            <button
              onClick={() => setMainTab('profile')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${mainTab === 'profile'
                ? 'border-brand-500 text-brand-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
            >
              Consenti Local Profile
            </button>
          }
        </div>

        {/* Tab body: sidebar + content */}
        <div className="flex min-h-[520px]">
          {mainTab === 'setup' ? (
            <>
              <VTabNav tabs={setupTabs} active={setupTab} onChange={setSetupTab} />
              <div className="flex-1 p-5 overflow-y-auto max-h-[700px]">
                {setupTab === 'core' && renderSetupCore()}
                {setupTab === 'theme' && renderSetupTheme()}
                {setupTab === 'api' && renderSetupApi()}
                {setupTab === 'gtm' && renderSetupGtm()}
                {setupTab === 'actions' && renderSetupActions()}
              </div>
            </>
          ) : (
            <>
              <VTabNav tabs={profileTabs} active={profileTab} onChange={setProfileTab} />
              <div
                className={`flex-1 p-5 overflow-y-auto max-h-[700px] ${isDefault ? 'opacity-50 pointer-events-none' : ''
                  }`}
              >
                {isDefault && (
                  <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    Profile settings are ignored — "Use default banner profile" is enabled in Setup
                    › Actions.
                  </div>
                )}
                {profileTab === 'mainBanner' && renderProfileMainBanner()}
                {profileTab === 'gpcBanner' && renderProfileGpcBanner()}
                {profileTab === 'prefModal' && renderProfilePrefModal()}
                {profileTab === 'cookies' && renderProfileCookies()}
                {profileTab === 'ageGate' && renderProfileAgeGate()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <button className="action-btn-primary" onClick={() => void initWidget()}>
          ↺ Re-init
        </button>
        <button
          className="action-btn-primary"
          title="Manually call widget.init() — useful when autoInit: false is enabled in Actions"
          onClick={() => {
            void widgetRef.current?.init().then(refreshState)
          }}
        >
          widget.init()
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => {
            widgetRef.current?.showBanner()
            refreshState()
          }}
        >
          showBanner()
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => {
            widgetRef.current?.showBanner(true)
            refreshState()
          }}
        >
          showBanner(gpc)
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => {
            widgetRef.current?.hideBanner()
            refreshState()
          }}
        >
          hideBanner()
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => {
            widgetRef.current?.showModal()
            refreshState()
          }}
        >
          showModal()
        </button>
        <button
          className="action-btn-secondary"
          onClick={() => {
            widgetRef.current?.hideModal()
            refreshState()
          }}
        >
          hideModal()
        </button>
        <button className="action-btn-secondary" onClick={() => void submitAll()}>
          submitConsent(all)
        </button>
        <button className="action-btn-secondary" onClick={() => void submitNone()}>
          submitConsent(none)
        </button>
        <button
          className="action-btn-danger"
          onClick={() => {
            void widgetRef.current?.deleteConsent()
            refreshState()
          }}
        >
          deleteConsent()
        </button>
        <button
          className="action-btn-danger"
          onClick={() => {
            void widgetRef.current?.reConsent()
            refreshState()
          }}
        >
          reConsent()
        </button>
      </div>

      {/* ── Live state ───────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-slate-400 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-auto mb-5">
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

      {/* ── Backend API ──────────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-blue-700 mb-2">Backend API</h3>
        <p className="text-xs text-blue-600 leading-relaxed">
          The Consenti API is running at <code className="bg-blue-100 px-1 rounded">/consenti</code>{' '}
          (SQLite). Admin credentials:{' '}
          <code className="bg-blue-100 px-1 rounded">user@consenti.dev</code> /{' '}
          <code className="bg-blue-100 px-1 rounded">Consenti@123</code>
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <a
            href="/consenti/"
            target="_blank"
            className="text-xs text-blue-700 font-semibold hover:underline"
          >
            Admin Dashboard →
          </a>
          <a
            href="/consenti/api/docs"
            target="_blank"
            className="text-xs text-blue-500 hover:underline"
          >
            API Docs (Swagger) →
          </a>
          <a
            href="/consenti/api/openapi.json"
            target="_blank"
            className="text-xs text-blue-500 hover:underline"
          >
            OpenAPI JSON →
          </a>
        </div>
      </div>
    </div>
  )
}
