import { DeepPartial, NonEmptyArray } from "./utils"
import type { ComplianceGroupId } from "./compliance"
import type { ComplianceMapData } from "./api"
// ─── Consent values ──────────────────────────────────────────────────────────

export type ConsentStatus = 'granted' | 'denied' | 'objected'

export type ConsentAction = 'accept_all' | 'reject_all' | 'custom' | 'update'

export type ConsentValue = Record<string, ConsentStatus>

// ─── Cookie / profile types ───────────────────────────────────────────────────

export interface Cookie {
  id: string
  legalBasis?: 'mandatory' | 'consent' | 'legitimate_interest'
  /** @deprecated use legalBasis: 'mandatory' */
  mandatory?: boolean
  /** @deprecated use legalBasis */
  type?: 'consent' | 'legitimate_interest'
  listenGpc?: boolean
  expiry?: number
  tcfVendorId?: number
  tcfPurposes?: number[]
  tcfSpecialFeatures?: number[]
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
  type?: string
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

export interface PreferenceModal extends Omit<MainBanner, "position"> {
  position?: 'left' | 'right' | 'center'
  subheading?: string
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
  mainBanner: {
    heading?: string
    htmlText: string
    buttonLabels?: string[]
  }
  gpcBanner: {
    heading?: string
    htmlText: string
    buttonLabels?: string[]
  }
  preferenceModal: {
    heading: string
    subheading?: string
    htmlText?: string
    buttonLabels?: string[]
    categories: { id: string; heading: string; htmlText: string }[]
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
  complianceGroup?: string
  /** @deprecated use gpcMode */
  gpcCompliance?: 'strict' | 'honor' | 'ignore'
  gpcMode?: 'ignore' | 'honor' | 'strict'
  isActive?: boolean
  hidePoweredBy?: boolean
  allowReceipt?: boolean
  /** Per-compliance extra config (e.g. DPDPA data fiduciary name). */
  complianceConfig?: Record<string, string>
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface ServerUITemplate {
  id: string
  tenantId: string
  name: string
  mainBanner: MainBanner
  gpcBanner: GpcBanner
  preferenceModal: PreferenceModal
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
  mainBanner: MainBanner
  gpcBanner: MainBanner
  preferenceModal: PreferenceModal
}
export interface UpdateUITemplateInput {
  name?: string
  mainBanner?: MainBanner
  gpcBanner?: MainBanner
  preferenceModal?: PreferenceModal
}

// ─── Resolved profile ─────────────────────────────────────────────────────────

export interface PublicProfileResponse {
  id: string
  name?: string
  tenantId?: string
  version: number
  defaultLocale: string
  currentLocale: string
  locales: string[]
  cookies: Cookie[]
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
  resolvedComplianceGroup?: string
  complianceGroup?: string
  compliances?: string[]
  complianceConfig?: Record<string, string>
  allowedOrigins?: string[]
  gpcMode?: boolean | 'ignore' | 'honor' | 'strict'
  hidePoweredBy?: boolean
  allowReceipt?: boolean
  darkMode?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ResolvedProfile {
  id: number
  profileUuid?: string
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
  gpcMode?: 'ignore' | 'honor' | 'strict'
  complianceGroup?: string
  complianceConfig?: Record<string, string>
}

// ─── Widget geo resolver ──────────────────────────────────────────────────────

export type WidgetCountryResolverFn = () => Promise<{
  country: string | null
  region: string | null
  confidence: number
}>

// ─── Compliance widget config ─────────────────────────────────────────────────

export interface AgeGateWidgetConfig {
  enabled: boolean
  minimumAge: number
  requireParentalConsent?: boolean
}

export interface ComplianceWidgetConfig {
  type?: 'auto' | ComplianceGroupId | string
  geoDataProvider?: 'default' | WidgetCountryResolverFn
  autoComplianceMap?: 'default' | ComplianceMapData | 'auto'
  complianceMapUrl?: string
  ageGate?: AgeGateWidgetConfig
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
  tenantId?: string
  complianceGroup?: string
  trustDomain?: boolean
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
  tenantId?: string
  autoHonorGPC?: boolean | 'strict'
  locale?: string
  disableCssTemplate?: boolean
  cookieSigningKey?: string
  allowReceipt?: boolean
  cookieDomains?: string
  storage?: 'cookie' | 'localStorage'
  theme?: ThemeConfig
  userId?: string
  usePrebuiltProfiles?: 'all' | NonEmptyArray<ComplianceGroupId>
  cacheResolvedProfiles?: boolean
  console?: Array<'info' | 'log' | 'warning' | 'error'>
}

export interface ConsentiConfig {
  core: CoreConfig
  compliance?: ComplianceWidgetConfig
  rootEl?: string | HTMLElement
  darkMode?: boolean
  autoInit?: boolean
  api?: ApiConfig
  utils?: UtilsConfig
  plugins?: ConsentiPlugin[]
  profileOverride?: DeepPartial<ResolvedProfile>
  /** When true, suppresses the "Powered by Consenti" footer link in the banner and modal. */
  hidePoweredBy?: boolean
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export type ConsentiEventName =
  | 'bannerInitialized'
  | 'consenti:bannerInitialized'
  | 'bannerVisibility'
  | 'consenti:bannerVisibility'
  | 'modalVisibility'
  | 'consenti:modalVisibility'
  | 'consentBeingSubmitted'
  | 'consenti:consentBeingSubmitted'
  | 'consentSubmitted'
  | 'consenti:consentSubmitted'

export interface ConsentiWidgetAPI {
  hasConsent(): boolean
  getConsent(): ConsentValue | null
  getConsentDate(): Date | false
  getGTMConsent(): Record<string, string> | null
  isCookieGranted(cookieId: string, requestValue?: boolean): boolean | ConsentStatus
  isCategoryGranted(categoryId: string, requestValue?: boolean): boolean | { [cookieId: string]: ConsentStatus }[]
  grantAll(onlyMandatory?: boolean): Promise<void>
  denyAll(includingMandatory?: boolean): Promise<void>
  on(event: ConsentiEventName, handler: (data: ConsentEvent) => void): void
  off(event: ConsentiEventName, handler: (data: ConsentEvent) => void): void
  version(): { package: string; profileVersion: number | null; consentVersion: number }
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
  setDarkMode(enable?: boolean): void
  setTheme(theme: Partial<ThemeConfig>): void
  setConfig(config: DeepPartial<ConsentiConfig>): void
  setProfile(override: DeepPartial<ResolvedProfile>): void
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
