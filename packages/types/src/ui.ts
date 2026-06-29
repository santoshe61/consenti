// ─── Consent values ──────────────────────────────────────────────────────────

export type ConsentStatus = 'granted' | 'denied' | 'objected'

export type ConsentAction = 'accept_all' | 'reject_all' | 'custom' | 'update'

export type ConsentValue = Record<string, ConsentStatus>

// ─── Cookie / profile types ───────────────────────────────────────────────────

export interface Cookie {
  id: string
  type?: 'consent' | 'legitimate_interest'
  mandatory?: boolean
  listenGpc?: boolean
  expiry?: number
  tcfVendorId?: number
  tcfPurposes?: number[]
  cpraCategory?: 'sale' | 'sharing' | 'sensitive'
}

export type ButtonStyle = 'primary' | 'secondary' | 'text' | 'accent'

export type ButtonAction = 'submit' | 'manage' | 'close' | 'custom' | 'link'

export interface Button {
  text: string
  style: ButtonStyle
  action: ButtonAction
  cookies?: string[] | '*' | '!'
  url?: string
}

export interface MainBanner {
  position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
  overlayOpacity?: number
  showClose?: boolean
  showLocaleSwitcher?: boolean
  heading?: string
  headingTag?: string
  htmlText: string
  buttons: Button[]
}

export type GpcBanner = MainBanner

export interface Category {
  id: string
  heading: string
  headingTag?: string
  htmlText: string
  mandatory?: boolean
  type?: 'consent' | 'legitimate_interest'
  legitimateInterest?: {
    enabled?: boolean
    description?: string
  }
  cookies: string[]
}

export interface PreferenceModal {
  position?: 'left' | 'right' | 'center'
  overlayOpacity?: number
  showClose?: boolean
  showLocaleSwitcher?: boolean
  heading?: string
  headingTag?: string
  subheading?: string
  htmlText?: string
  buttons: Button[]
  categories: Category[]
  persistent?: boolean
  /** Screen width in px below which the modal expands to full screen. Default: 576. Set to 0 to disable. */
  mobileFullScreenBreakpoint?: number
}

export interface LocaleTranslations {
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
}

export interface ProfileTranslations {
  [locale: string]: LocaleTranslations
}

export interface DpdpaConfig {
  dataFiduciary: string
  grievanceEmail: string
  purposeDescription?: string
}

export interface LocaleTextContent {
  mainBanner: { heading: string; htmlText: string; buttonLabels: string[] }
  gpcBanner: { heading: string; htmlText: string; buttonLabels: string[] }
  preferenceModal: {
    heading: string
    subheading?: string
    htmlText?: string
    buttonLabels: string[]
    categories: Array<{ id: string; heading: string; htmlText: string }>
  }
}

export interface ProfileConfig {
  cookies?: Cookie[]
  defaultLocale: string
  translations?: ProfileTranslations
  gpcBanner?: boolean
  darkMode?: boolean
  allowedOrigins?: string[]
  dpdpa?: DpdpaConfig
  regulation?: 'gdpr' | 'ccpa' | 'cpra' | 'dpdpa' | 'uk-gdpr' | 'lgpd' | 'pipeda' | 'popia' | 'pdpa-th' | 'appi' | 'kvkk'
  regulations?: string[]
  cookieTemplateId?: string
  uiTemplateId?: string
  localeContents?: Record<string, LocaleTextContent>
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface UITemplateButton {
  text: string
  type: string
  action: 'submit' | 'custom' | 'manage' | 'close' | 'link'
  cookies?: string | string[]
  url?: string
}

export interface UITemplateBanner {
  position: string
  overlayOpacity: number
  showClose: boolean
  showLocaleSwitcher?: boolean
  headingTag: string
  buttons: UITemplateButton[]
}

export interface UITemplateCategory {
  id: string
  headingTag: string
  mandatory: boolean
  type: 'consent' | 'legitimate_interest'
  liEnabled: boolean
  cookies: string[]
}

export interface UITemplateModal extends UITemplateBanner {
  hasSubheading: boolean
  persistent: boolean
  showLocaleSwitcher?: boolean
  categories: UITemplateCategory[]
}

export interface ServerUITemplate {
  id: string
  tenantId: string
  name: string
  mainBanner: UITemplateBanner
  gpcBanner: UITemplateBanner
  preferenceModal: UITemplateModal
  createdAt: string
  updatedAt: string
}

export interface ServerCookieTemplate {
  id: string
  tenantId: string
  name: string
  cookies: Cookie[]
  createdAt: string
  updatedAt: string
}

export interface CreateCookieTemplateInput {
  tenantId: string
  name: string
  cookies: Cookie[]
}
export interface UpdateCookieTemplateInput {
  name?: string
  cookies?: Cookie[]
}
export interface CreateUITemplateInput {
  tenantId: string
  name: string
  mainBanner: UITemplateBanner
  gpcBanner: UITemplateBanner
  preferenceModal: UITemplateModal
}
export interface UpdateUITemplateInput {
  name?: string
  mainBanner?: UITemplateBanner
  gpcBanner?: UITemplateBanner
  preferenceModal?: UITemplateModal
}

// ─── Resolved profile ─────────────────────────────────────────────────────────

export interface PublicProfileResponse {
  id: string
  version: number
  defaultLocale: string
  currentLocale: string
  locales: string[]
  cookies: Cookie[]
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
}

export interface ResolvedProfile {
  id: number
  version: number
  defaultLocale: string
  locales?: string[]
  cookies: Cookie[]
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
  cookieSigningKey?: string
  dpdpa?: DpdpaConfig
  darkMode?: boolean
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface GtmConfig {
  containerId?: string
  events?: string[]
  dataLayer?: string
  urlPassthrough?: boolean
  adsDataRedaction?: boolean
}

export interface UtilsConfig {
  gtm?: GtmConfig
}

export interface ApiConfig {
  enabled?: boolean
  baseUrl?: string
  authToken?: string
}

export interface ThemeConfig {
  bgColor?: string
  textColor?: string
  primaryColor?: string
  primaryTextColor?: string
  secondaryColor?: string
  secondaryTextColor?: string
  borderColor?: string
  fontFamily?: string
  fontSizeBase?: string
  fontSizeHeading?: string
  fontSizeMultiplier?: string
  borderRadius?: string
  buttonBorderRadius?: string
  toggleBgOn?: string
  toggleBgOff?: string
  accentColor?: string
  accentTextColor?: string
}

export interface CoreConfig {
  profileId?: number
  autoHonorGPC?: boolean | 'strict'
  locale?: string
  disableCssTemplate?: boolean
  signCookies?: boolean
  cookieSigningKey?: string
  allowReceipt?: boolean
  cookieDomains?: string
  storage?: 'cookie' | 'localStorage'
  theme?: ThemeConfig
  privacyPolicyUrl?: string
  regulation?: 'gdpr' | 'ccpa' | 'cpra' | 'dpdpa' | 'uk-gdpr' | 'lgpd' | 'pipeda' | 'popia' | 'pdpa-th' | 'appi' | 'kvkk'
  userId?: string
}

export interface ConsentiConfig {
  core: CoreConfig
  rootEl?: string | HTMLElement
  darkMode?: boolean
  autoInit?: boolean
  api?: ApiConfig
  utils?: UtilsConfig
  plugins?: ConsentiPlugin[]
  profileOverride?: Partial<ResolvedProfile>
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export interface ConsentiWidgetAPI {
  hasConsent(): boolean
  getConsent(): ConsentValue | null
  getConsentDate(): Date | false
  getGTMConsent(): Record<string, string> | null
  bannerVisibility(): 'main' | 'gpc' | false
  modalVisibility(): 'preference' | false
  getProfile(): ResolvedProfile | null
  showBanner(gpc?: boolean): void
  hideBanner(): void
  showModal(triggerEl?: HTMLElement): void
  hideModal(): void
  submitConsent(consent: Partial<ConsentValue>): Promise<void>
  deleteConsent(): Promise<void>
  reConsent(): Promise<void>
  getRootElement(): HTMLElement | null
  getBannerElement(): HTMLElement | null
  getModalElement(): HTMLElement | null
  switchLocale(locale: string): void
  init(): Promise<void>
  onReady(callback: () => void): void
  destroy(): void
}

export abstract class ConsentiPlugin {
  abstract initialize(widget: ConsentiWidgetAPI): void | Promise<void>
  abstract destroy(): void
  onConsentSubmit?(consent: ConsentValue): void | Promise<void>
  onBannerShow?(): void | Promise<void>
  onBannerHide?(): void | Promise<void>
  onModalShow?(): void | Promise<void>
  onModalHide?(): void | Promise<void>
}

// ─── Cookie storage ───────────────────────────────────────────────────────────

export interface CookieOptions {
  maxAge?: number
  path?: string
  sameSite?: 'Lax' | 'Strict' | 'None'
  secure?: boolean
  domain?: string
}

export interface ParsedConsent {
  timestamp: string
  consent: ConsentValue
  signature?: string
}

// ─── Consent record (API response) ───────────────────────────────────────────

export interface ConsentRecord {
  visitorId: string
  consentId?: string
  profileId: number
  profileVersion: number
  consent: ConsentValue
  timestamp: string
  gpc?: boolean
  action?: ConsentAction
  pageUrl?: string
}

// ─── Consent receipt ──────────────────────────────────────────────────────────

export interface ConsentReceipt {
  version: '1.0'
  issuedAt: string
  visitorId: string
  profileId: number
  profileVersion: number
  locale: string
  consent: ConsentValue
  signature?: string
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface ConsentEvent {
  profileId?: number
  consent?: ConsentValue
  hasExistingConsent?: boolean
  show?: boolean
  action?: boolean
  consentAction?: ConsentAction
  consentId?: string
  pageUrl?: string
  apiResponse?: unknown
  fromBroadcast?: boolean
  gpcDetected?: boolean
}

// ─── Cross-tab broadcast ──────────────────────────────────────────────────────

export type ConsentiMessage =
  | { type: 'consentUpdated'; consent: ConsentValue; profileId: number }
  | { type: 'bannerClosed' }
  | { type: 'consentDeleted' }
