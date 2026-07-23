import { DeepPartial, NonEmptyArray } from "./utils"
import type { ComplianceGroupId, ComplianceType } from "./compliance"
import type { ComplianceMapData, ConsentDbRecord } from "./api"
import type { COOKIE_PURPOSE_IDS } from "@consenti/utils"
// ─── Consent values ──────────────────────────────────────────────────────────

export type ConsentStatus = 'granted' | 'denied' | 'objected'

export type ConsentAction = 'accept_all' | 'reject_all' | 'custom' | 'update'

export type ConsentValue = Record<string, ConsentStatus>

/** Compact single-character representation of ConsentStatus stored in the cookie. */
export type ConsentShortValue = 'g' | 'o' | 'd'

/** How consent was collected: 0 = user click, 1 = widget API method, 2+ = external script. */
export type ConsentSource = number

/** Compact cookie data format stored in the `consenti_data` cookie. */
export interface ConsentCookieData {
  /** Stable profile id */
  s: string
  /** Profile version at the time this consent was recorded (0 when unknown, e.g. an embedded/local profile) */
  v: number
  /** Unique consent ID generated per submission */
  i: string
  /** Unix timestamp (seconds) of consent submission */
  t: number
  /** Logged-in application user ID; empty string for anonymous visitors */
  u: string
  /** Whether the browser sent a GPC signal at submission time: 0 = no, 1 = yes */
  g: 0 | 1
  /** Consent source: 0 = user click, 1 = widget method, 2+ = external script */
  p: ConsentSource
  /** Consent map: cookie ID → compact status */
  c: Record<string, ConsentShortValue>
  /**
   * Locale active at the moment consent was recorded. The widget only keeps locale in memory
   * for the current page session (resets to the configured default on refresh) — this field is
   * the sole place a visitor's locale choice is actually persisted, and only once they've
   * consented. Empty string if unknown (e.g. a migrated legacy-format cookie).
   */
  l: string
}

/**
 * Output format for getConsent(type).
 * 'default'           → raw ConsentValue (existing behaviour)
 * 'google-gtm'        → Google Consent Mode v2 keys + ads_data_redaction, url_passthrough
 * 'category'          → consent per CookiePurpose category
 * 'adobe'             → { analytics, target, manager, optimizer }
 * 'meta'              → { pixel, api, plugins, facebookLogin }
 * 'microsoft-clarity' → { session, heatmaps, performance }
 * 'twilio-segment'    → { identify, page, track, group, alias }
 */
export type ConsentType =
  | 'default'
  | 'google-gtm'
  | 'category'
  | 'adobe'
  | 'meta'
  | 'microsoft-clarity'
  | 'twilio-segment'

export type GpcMode = 'ignore' | 'honor' | 'strict'

export type LegalBasis = 'mandatory' | 'consent' | 'legitimate_interest'

// ─── Cookie / profile types ───────────────────────────────────────────────────

export type CookiePurpose = typeof COOKIE_PURPOSE_IDS[number]

/**
 * A single consent parameter (tracker/cookie definition).
 * Keyed by its own id inside `Record<string, Cookie>` — the map key IS the id,
 * there is no `id` field on the value itself.
 */
export interface Cookie {
  purpose?: CookiePurpose
  listenGpc?: boolean
  /**
   * Pre-grant this parameter's default consent to 'granted' (instead of the
   * compliance-group-driven default) when no stored decision exists yet.
   * Only meaningful when the owning category's `legalBasis === 'consent'` —
   * `mandatory`/`legitimate_interest` categories are already effectively
   * pre-granted regardless of this flag. Never overrides an active GPC signal.
   * Default: false.
   */
  preGrant?: boolean
  tcfVendorId?: number
  tcfPurposes?: number[]
  tcfSpecialFeatures?: number[]
  cpraCategory?: 'sale' | 'sharing' | 'sensitive'
}

/** `Cookie` keyed by its own id — the standard shape used everywhere a parameter list is passed around. */
export type CookieMap = Record<string, Cookie>

export type ButtonStyle = 'primary' | 'secondary' | 'text' | 'accent'

export type ButtonAction = 'submit' | 'manage' | 'close' | 'custom' | 'link'

export interface Button {
  text: string
  style: ButtonStyle
  action: ButtonAction
  cookies?: string[] | '*' | '!'
  url?: string
}

/** `Button` keyed by its own id — e.g. `'accept-all'`. The map key IS the id, rendered as the DOM
 * `id` (`consenti-btn-{id}`) so integrators can target specific buttons, and is what
 * `profileOverride`'s `deepMerge` deletes by (`{ 'reject-optional': null }` removes one button). */
export type ButtonMap = Record<string, Button>

export interface MainBanner {
  position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
  overlayOpacity?: number
  showClose?: boolean
  showLocaleSwitcher?: boolean
  heading?: string
  headingTag?: string
  htmlText: string
  buttons: ButtonMap
  /** Stack buttons vertically below this viewport width in px. 0 or undefined = disabled. Default: 576. */
  stackButtonsOnBreakpoint?: number
  /** Trap keyboard Tab focus within the consent root while this banner is visible. */
  trapFocus?: boolean
}

export type GpcBanner = MainBanner

/**
 * A consent category — the single source of legal basis for every parameter
 * it lists in `cookies`. Keyed by its own id inside `Record<string, Category>` —
 * the map key IS the id, there is no `id` field on the value itself.
 *
 * A parameter must belong to exactly one category (enforced at authoring time,
 * not by this type) — that relationship is what `getCookieLegalBasis`/
 * `isMandatoryCookie` (`@consenti/utils`) resolve at runtime.
 */
export interface Category {
  heading: string
  headingTag?: string
  htmlText: string
  legalBasis: LegalBasis
  /** Only meaningful when legalBasis === 'legitimate_interest' — the GDPR balancing-test justification shown to visitors. */
  legitimateInterestDescription?: string
  /** IDs of the parameters (from the profile's `cookies` map) that belong to this category. */
  cookies: string[]
}

/** `Category` keyed by its own id — the standard shape used everywhere a category list is passed around. */
export type CategoryMap = Record<string, Category>

export interface PreferenceModal extends Omit<MainBanner, "position"> {
  position?: 'left' | 'right' | 'center'
  subheading?: string
  categories: CategoryMap
  persistent?: boolean
  /** Screen width in px below which the modal expands to full screen. Default: 576. Set to 0 to disable. */
  mobileFullScreenBreakpoint?: number
  /** Label for the optional consent-receipt download checkbox (shown when `allowReceipt` is true). Falls back to a default when omitted. */
  receiptLabel?: string
  /** Description shown beneath the consent-receipt checkbox. Falls back to a default when omitted. */
  receiptDescription?: string
}

/**
 * A UI-template button definition. Keyed by its own machine id (e.g. `'accept-all'`) inside
 * `TemplateButtonMap` — the map key IS the id, not display text. UI templates own layout/behavior
 * only, never text. The visitor-facing label is authored per-locale on the profile instead
 * (`LocaleTextContent.*.buttonLabels`, keyed by the same button id) and composed into a resolved
 * `Button.text` at profile-build time. Distinct from `Button` (the resolved-profile shape), which
 * always carries real `text`.
 */
export interface TemplateButtonDef {
  type?: ButtonStyle
  action: ButtonAction
  cookies?: string[] | '*' | '!'
  url?: string
}

/** `TemplateButtonDef` keyed by its own id — the standard shape everywhere a UI template's
 * button set is passed around. */
export type TemplateButtonMap = Record<string, TemplateButtonDef>

export interface TemplateBannerDef {
  position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
  overlayOpacity?: number
  showClose?: boolean
  showLocaleSwitcher?: boolean
  headingTag?: string
  buttons: TemplateButtonMap
  stackButtonsOnBreakpoint?: number
  trapFocus?: boolean
}

export type TemplateGpcBannerDef = TemplateBannerDef

export interface TemplateModalDef extends Omit<TemplateBannerDef, 'position'> {
  position?: 'left' | 'right' | 'center'
  persistent?: boolean
  hasSubheading?: boolean
  mobileFullScreenBreakpoint?: number
}

export interface LocaleTranslations {
  mainBanner: DeepPartial<MainBanner>
  gpcBanner?: DeepPartial<GpcBanner>
  preferenceModal: DeepPartial<PreferenceModal>
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
    /** Keyed by the linked UI template's button id — was a positional array matched to
     * `buttons[i]` by index; now matched by key, robust against button reordering. */
    buttonLabels?: Record<string, string>
  }
  gpcBanner: {
    heading?: string
    htmlText: string
    buttonLabels?: Record<string, string>
  }
  preferenceModal: {
    heading: string
    subheading?: string
    htmlText?: string
    buttonLabels?: Record<string, string>
    /** `legitimateInterestDescription` is only meaningful for categories whose legalBasis is 'legitimate_interest'; optional GDPR balancing-test text, translated per locale like heading/htmlText. */
    categories: Record<string, { heading: string; htmlText: string; legitimateInterestDescription?: string }>
    receiptLabel?: string
    receiptDescription?: string
  }
}

export interface ProfileConfig {
  id: string // profile uuid
  cookies?: CookieMap
  defaultLocale: string
  /** Days until consent expires and the visitor is asked again (profile-wide). Default: 365. */
  expiryDays?: number
  translations?: ProfileTranslations
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
  darkMode?: boolean
  allowedOrigins?: string[]
  dpdpa?: DpdpaConfig
  regulation?: 'gdpr' | 'ccpa' | 'cpra' | 'dpdpa' | 'uk-gdpr' | 'lgpd' | 'pipeda' | 'popia' | 'pdpa-th' | 'appi' | 'kvkk'
  regulations?: string[]
  consentTemplateId?: string
  uiTemplateId?: string
  localeContents?: Record<string, LocaleTextContent>
  complianceGroup?: ComplianceGroupId
  /**
   * Free-form identifier (lower-kebab-case) for profiles that don't map to one of the
   * built-in `complianceGroup` values — the identifier the widget's `compliance.type`
   * config targets to fetch this profile. Participates in activation, deactivation, and
   * "one active profile per group" conflict detection the same way `complianceGroup` does;
   * no `COMPLIANCE_GROUPS` validation rules or GPC defaults apply to it, since none exist
   * for a free-form name.
   */
  customComplianceGroup?: string
  /**
   * Per-profile deltas applied on top of the consent template's authored `Cookie` values
   * (e.g. an overridden `preGrant`) when resolving this profile — see the dashboard's Step 2
   * pre-grant override UX. Keyed by cookie id; only the overridden fields need to be present.
   */
  cookiesOverride?: Record<string, Partial<Cookie>>
  /**
   * Reserved for a future phase — stored but not yet applied when resolving a profile.
   * Intended to mirror `cookiesOverride` for per-category deltas.
   */
  categoriesOverride?: Record<string, Partial<Category>>
  /**
   * Reserved for a future phase — stored but not yet applied when resolving a profile.
   * Intended to hold per-profile UI-template deltas.
   */
  uiOverride?: Record<string, unknown>
  /**
   * When registered via `registerProfile()` and `complianceGroup` matches one of
   * Consenti's built-in groups: `false` (default) fully replaces the built-in
   * embedded profile for that group; `true` deep-merges this config onto the
   * built-in profile instead (only meaningful together with `complianceGroup`).
   */
  deepMerge?: boolean
  gpcMode?: GpcMode
  isActive?: boolean
  hidePoweredBy?: boolean
  allowReceipt?: boolean
  /** Per-compliance extra config (e.g. DPDPA data fiduciary name). */
  complianceConfig?: Record<string, string>
  /** Show a metadata footer strip in the banner/modal with Consent ID, Date, Version, Privacy Settings link. */
  showFooterMetadata?: boolean
  /** Apply WCAG 2.1 AA button sizing (44px min-height), visible focus rings, and screen-reader labels. */
  enhanceAccessibility?: boolean
}

/**
 * Input accepted by `registerProfile()`. Either a complete `ProfileConfig`
 * (used as-is or, if `complianceGroup` matches a built-in group, fully replaces
 * it), or a partial overlay explicitly opted into `deepMerge: true` — merged
 * onto the built-in embedded profile for `complianceGroup` at resolution time.
 */
export type RegisterableProfileConfig =
  | ProfileConfig
  | (DeepPartial<ProfileConfig> & { complianceGroup: ComplianceGroupId; deepMerge: true })

// ─── Templates ────────────────────────────────────────────────────────────────

export interface ServerUITemplate {
  id: string
  tenantId: string
  name: string
  mainBanner: TemplateBannerDef
  gpcBanner: TemplateGpcBannerDef
  preferenceModal: TemplateModalDef
  createdAt: string
  updatedAt: string
}

export interface ServerConsentTemplate {
  id: string
  tenantId: string
  name: string
  cookies: CookieMap
  categories: CategoryMap
  createdAt: string
  updatedAt: string
}

export interface CreateConsentTemplateInput {
  tenantId: string
  name: string
  cookies: CookieMap
  categories: CategoryMap
}
export interface UpdateConsentTemplateInput {
  name?: string
  cookies?: CookieMap
  categories?: CategoryMap
}
export interface CreateUITemplateInput {
  tenantId: string
  name: string
  mainBanner: TemplateBannerDef
  gpcBanner: TemplateGpcBannerDef
  preferenceModal: TemplateModalDef
}
export interface UpdateUITemplateInput {
  name?: string
  mainBanner?: TemplateBannerDef
  gpcBanner?: TemplateGpcBannerDef
  preferenceModal?: TemplateModalDef
}

// ─── Resolved profile ─────────────────────────────────────────────────────────

export interface PublicProfileResponse {
  id: string // stable profile uuid — unchanged across edits, see `version` for the edit counter
  /** Incremented in place on every save of this profile. */
  version: number
  name?: string
  tenantId?: string
  defaultLocale: string
  currentLocale: string
  locales: string[]
  cookies: CookieMap
  /** Days until consent expires and the visitor is asked again (profile-wide). */
  expiryDays?: number
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
  resolvedComplianceGroup?: string
  complianceGroup?: ComplianceGroupId
  compliances?: string[]
  complianceConfig?: Record<string, string>
  allowedOrigins?: string[]
  gpcMode?: GpcMode
  hidePoweredBy?: boolean
  allowReceipt?: boolean
  darkMode?: boolean
  dpdpa?: DpdpaConfig
  showFooterMetadata?: boolean
  enhanceAccessibility?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ResolvedProfile {
  id: string // stable profile uuid — unchanged across edits, see `version` for the edit counter
  /** Incremented in place on every save of this profile. Absent for embedded/local profiles that have no server-side version counter. */
  version?: number
  defaultLocale: string
  locales?: string[]
  cookies: CookieMap
  /** Days until consent expires and the visitor is asked again (profile-wide). Default: 365. */
  expiryDays?: number
  allowReceipt?: boolean
  mainBanner: MainBanner
  gpcBanner?: GpcBanner
  preferenceModal: PreferenceModal
  cookieSigningKey?: string
  dpdpa?: DpdpaConfig
  darkMode?: boolean
  gpcMode?: GpcMode
  complianceGroup?: ComplianceGroupId
  complianceConfig?: Record<string, string>
  /** Falls back to `true` (hidden) if neither the widget config nor the profile set it. */
  hidePoweredBy?: boolean
  /** Show metadata footer strip (Consent ID, Date, Version, Privacy Settings link). */
  showFooterMetadata?: boolean
  /** Apply WCAG 2.1 AA accessibility enhancements to the widget. */
  enhanceAccessibility?: boolean
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

/** Mirrors the server-side `TcfConfig` shape (`@consenti/api`) — `cmpId`/`cmpVersion` must match
 * what the backend uses to encode `tcfString`, since both feed the same simplified TC string. */
export interface TcfWidgetConfig {
  enabled: boolean
  cmpId: number
  cmpVersion: number
}

export interface ComplianceWidgetConfig {
  type?: ComplianceType
  geoDataProvider?: 'default' | WidgetCountryResolverFn
  autoComplianceMap?: 'default' | ComplianceMapData | 'auto'
  complianceMapUrl?: string
  ageGate?: AgeGateWidgetConfig
  tcf?: TcfWidgetConfig
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface GtmConfig {
  containerId?: string
  events?: string[]
  dataLayer?: string
  urlPassthrough?: boolean
  adsDataRedaction?: boolean
  verbose?: boolean // if true, it will send all consenti events to GTM | false = only consent updates
}

export interface UtilsConfig {
  gtm?: GtmConfig
}

export interface ApiConfig {
  enabled?: boolean
  baseUrl?: string
  authToken?: string
  tenantId?: string
  complianceGroup?: ComplianceGroupId
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
  locale?: string
  /** Text direction for the banner/modal root. `'auto'` (default) derives it from `locale`
   * (Arabic, Hebrew, Persian, Urdu, ... → `rtl`); set explicitly to override. */
  dir?: 'ltr' | 'rtl' | 'auto'
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
  verbose?: boolean
  /** Optional — every field of `CoreConfig` is itself optional, so `new ConsentiSetup({})` and
   * `new ConsentiSetup({ compliance: { type: 'opt-in' } })` (omitting `core` entirely) both work,
   * matching the widget's own "Minimal config" documentation. */
  core?: CoreConfig
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
  | 'parentalConsentRequired'
  | 'consenti:parentalConsentRequired'

export interface ConsentiWidgetAPI {
  hasConsent(): boolean
  getConsent(): ConsentValue | null
  getConsent(type: ConsentType): Record<string, string> | null
  getConsent(type?: ConsentType): ConsentValue | Record<string, string> | null
  getConsentDate(): Date | false
  getGTMConsent(): Record<string, string> | null
  isCookieGranted(cookieId: string, requestValue?: boolean): boolean | ConsentStatus
  isCategoryGranted(categoryId: string, requestValue?: boolean): boolean | { [cookieId: string]: ConsentStatus }[]
  grantAll(onlyMandatory?: boolean): Promise<void>
  denyAll(includingMandatory?: boolean): Promise<void>
  on(event: ConsentiEventName, handler: (data: ConsentEvent) => void): void
  off(event: ConsentiEventName, handler: (data: ConsentEvent) => void): void
  version(): { package: string; profileVersion: string | null; consentVersion: string | null }
  bannerVisibility(): 'main' | 'gpc' | false
  modalVisibility(): 'preference' | false
  getProfile(): ResolvedProfile | null
  showBanner(gpc?: boolean): void
  hideBanner(): void
  showModal(triggerEl?: HTMLElement): void
  hideModal(): void
  submitConsent(consent: Partial<ConsentValue>): Promise<ConsentDbRecord | void>
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
  profileId: string
  consent: ConsentValue
  timestamp: string
  gpc?: boolean
  action?: ConsentAction
  pageUrl?: string
}

// ─── Consent receipt ──────────────────────────────────────────────────────────

export interface ConsentReceipt {
  version: string
  issuedAt: string
  visitorId: string
  profileId: string
  locale: string
  consent: ConsentValue
  signature?: string
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface BannerInitializedDetail {
  profileId: string
  complianceGroup?: ComplianceType
  hasExistingConsent: boolean  // true if valid consent cookie exists
  gpcDetected: boolean
  willShow: boolean            // true if banner will be rendered
}

export interface BannerVisibilityDetail {
  visible: boolean               // true = banner appeared; false = banner hidden
  variant: 'main' | 'gpc' // which banner
  action: boolean             // true = triggered by user button click
}

export interface ModalVisibilityDetail {
  visible: boolean               // true = modal opened; false = modal closed
  action: boolean             // true = triggered by user button click
}

export interface ConsentBeingSubmitted {
  consentId: string                        // UUID per submission
  visitorId: string                        // visitor UUID (stable across sessions)
  profileId: string
  consentJson: ConsentValue  // { analytics: 'granted', ... }
  consentAction: ConsentAction
  gpcDetected: boolean
  pageUrl: string                          // window.location.href at submission time
  timestamp: number                        // Unix timestamp trimmed till seconds
  fromBroadcast?: boolean
}

export interface ConsentSubmittedDetail extends ConsentBeingSubmitted {
  apiResponse: ConsentDbRecord                    // backend response if api.enabled: true
}

/** Dispatched when the age gate is declined and `requireParentalConsent` is set — see
 * `AgeGateWidgetConfig`. A deny-all consent (mandatory cookies only) has already been
 * submitted with `parentalConsentToken` attached; this event is the hook for the site
 * owner to run their own out-of-band parental-consent verification. */
export interface ParentalConsentRequiredDetail {
  parentalConsentToken: string
  profileId: string
  visitorId: string
  timestamp: number
}

export type ConsentEvent =
  | BannerInitializedDetail
  | BannerVisibilityDetail
  | ModalVisibilityDetail
  | ConsentBeingSubmitted
  | ConsentSubmittedDetail
  | ParentalConsentRequiredDetail;

// ─── Cross-tab broadcast ──────────────────────────────────────────────────────

export type ConsentiMessage =
  | { type: 'consentUpdated'; consent: ConsentValue; profileId: string }
  | { type: 'bannerClosed' }
  | { type: 'consentDeleted' }
