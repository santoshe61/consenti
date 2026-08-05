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
  /**
   * Compliance group active at the moment consent was recorded. Lets a returning visitor's next
   * `resolveProfile()` call skip the `/resolve-profile` geo round-trip and fetch
   * `/profiles/{tenantId}/{group}/{locale}` directly — the group is already known, no need to
   * re-derive it from IP/timezone/language on every load. Empty string if unknown (e.g. a
   * migrated legacy-format cookie, or a local/embedded profile with no server-resolved group).
   */
  k: string
}

/**
 * Output format for getConsent(type).
 * 'default'           → raw ConsentValue, keyed by every cookie parameter ID in the profile (existing behaviour)
 * 'google-gtm'        → Google Consent Mode v2 keys + ads_data_redaction, url_passthrough
 * 'purpose'           → consent per the fixed CookiePurpose taxonomy (necessary/functional/preferences/analytics/marketing)
 * 'category'          → consent per the tenant's own authored preference-modal category, keyed by category ID.
 *                        'granted' only when every member parameter is granted; 'denied'/'objected' otherwise
 *                        (same ConsentStatus values as everything else — see getCategoryConsent for the exact rule)
 * 'adobe'             → { analytics, target, manager, optimizer }
 * 'meta'              → { pixel, api, plugins, facebookLogin }
 * 'microsoft-clarity' → { session, heatmaps, performance }
 * 'twilio-segment'    → { identify, page, track, group, alias }
 */
export type ConsentType =
  | 'default'
  | 'google-gtm'
  | 'purpose'
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
  /**
   * Renders a "Forget me" control in the modal body, below the categories — only shown to
   * visitors who already have a stored consent decision (nothing to erase otherwise). Wired to
   * the same `DELETE /consent/:visitorId` erasure endpoint as `widget.deleteConsent()`, giving
   * visitors self-service access to GDPR Art. 17 / CCPA-CPRA / LGPD Art. 18 / UK GDPR / DPDPA /
   * KVKK / POPIA / PDPA-TH / APPI erasure-equivalent rights without the host wiring a link
   * themselves. See the "Right to erasure" guide for the full compliance mapping.
   */
  showForgetMe?: boolean
  /** Label for the "Forget me" button (shown when `showForgetMe` is true). Falls back to a default when omitted. */
  forgetMeLabel?: string
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
  /** Renders a "Forget me" control below the categories, for visitors who already have a stored
   * consent decision. See {@link PreferenceModal.showForgetMe}. */
  showForgetMe?: boolean
}

export interface LocaleTranslations {
  mainBanner: DeepPartial<MainBanner>
  gpcBanner?: DeepPartial<GpcBanner>
  preferenceModal: DeepPartial<PreferenceModal>
  /** Only meaningful when the profile's `ageGate.enabled` is true. */
  ageGateModal?: DeepPartial<AgeGateModalContent>
}

export interface ProfileTranslations {
  [locale: string]: LocaleTranslations
}

export interface DpdpaConfig {
  dataFiduciary: string
  grievanceEmail: string
  purposeDescription?: string
}

/**
 * Per-profile age gate — GDPR Art. 8's consent age varies 13–16 by EU member state and DPDPA has
 * its own child-data age rules, so one global age (the old `ConsentiServerConfig.ageGate`) was
 * wrong for a multi-region deployment. Mirrors `dpdpa` exactly: profile-scoped, not global.
 */
export interface AgeGateConfig {
  enabled: boolean
  minimumAge: number
  requireParentalConsent?: boolean
}

/** Per-locale age-gate modal text — translated the same way `mainBanner`/`preferenceModal`
 * content is, unlike the widget's own hardcoded UI chrome (close button, locale switcher). */
export interface AgeGateModalContent {
  heading?: string
  htmlText: string
  confirmButtonLabel: string
  denyButtonLabel: string
  parentalConsent: {
    heading?: string
    htmlText: string
    confirmButtonLabel: string
  }
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
    /** Per-locale override of `PreferenceModal.forgetMeLabel`; only meaningful when `showForgetMe` is true. */
    forgetMeLabel?: string
  }
  /** Only meaningful when the profile's `ageGate.enabled` is true. */
  ageGateModal?: AgeGateModalContent
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
  ageGate?: AgeGateConfig
  /** Default locale's age-gate modal text — mirrors `mainBanner`/`preferenceModal` (inline,
   * required-shape-when-present), not `dpdpa` (which has no locale text at all). Every other
   * locale's `ageGateModal` lives in `localeContents`/`LocaleContentInput` like the rest of
   * that locale's content. */
  ageGateModal?: AgeGateModalContent
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
  ageGate?: AgeGateConfig
  ageGateModal?: AgeGateModalContent
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
  ageGate?: AgeGateConfig
  ageGateModal?: AgeGateModalContent
  darkMode?: boolean
  gpcMode?: GpcMode
  /** One of the 8 built-in groups, or a custom group id (via `customComplianceGroup` /
   * `ComplianceType`'s string passthrough) — this is the join key `complianceGroupsOverride`
   * looks up by, so it must reflect whichever group this profile actually resolved against,
   * built-in or custom. */
  complianceGroup?: ComplianceGroupId | (string & {})
  /** Set when the geo-resolved region carries a `requiresSensitiveOptIn` carve-out (e.g.
   * Colorado under `opt-out`) — cookies tagged `cpraCategory: 'sensitive'` default to denied
   * even though the rest of `complianceGroup`'s cookies default to granted. Only ever set by
   * server-side geo resolution (`api.enabled: true` + a geoip/maxmind provider); the
   * client-only timezone heuristic never resolves a region, so this is always unset there. */
  requiresSensitiveOptIn?: boolean
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
  /** Optional escape hatch: when set, profile resolution uses this compliance group directly
   * instead of computing one from `country`/`region` — mirrors the server-side `GeoResult`'s
   * `complianceGroup` field (`@consenti/types`'s `api.ts`). `country`/`region` are still used for
   * anything that reads them independently of group selection. Optional — omitting it preserves
   * the existing timezone/language-based resolution exactly as before. */
  complianceGroup?: string
}>

// ─── Compliance widget config ─────────────────────────────────────────────────

/** Mirrors the server-side `TcfConfig` shape (`@consenti/api`) — `cmpId`/`cmpVersion` must match
 * what the backend uses to encode `tcfString`, since both feed the same simplified TC string.
 *
 * The client-side `__tcfapi` stub never fetches the Global Vendor List itself (multi-megabyte,
 * and IAB policy requires CMPs to cache their own copy rather than have every visitor's browser
 * fetch it) — `publisherCC`/`vendorListVersion`/`gvlVersion` are therefore operator-supplied
 * config here, not auto-derived. Spec-correct binary TC-string encoding happens server-side in
 * `@consenti/api` (see `compliance.tcf.publisherCC` there); this stub's `tcString` stays the
 * simplified format documented in `@consenti/utils`'s `encodeTcString`. */
export interface TcfWidgetConfig {
  enabled: boolean
  cmpId: number
  cmpVersion: number
  /** ISO 3166-1 alpha-2 publisher country code. No honest default exists — leave unset only if
   * you don't rely on this field downstream; ad-tech vendors that read it will see 'AA'
   * (an explicit "not configured" placeholder, not a real country). */
  publisherCC?: string
  /** Known Global Vendor List version, if you track it. Defaults to 0 ("unknown"). */
  vendorListVersion?: number
  /** Known GVL specification version, if you track it. Defaults to 0 ("unknown"). */
  gvlVersion?: number
}

/** Mirrors the server-side `GppConfig` shape (`@consenti/api`) — `cmpId`/`cmpVersion` must match
 * what the backend uses to encode `gppString`. Unlike TCF, the GPP US National section needs no
 * Global Vendor List, so both the widget's `window.__gpp` and the server's `gppString` use the
 * same real, spec-correct encoder (the optional `@iabgpp/cmpapi` peer dependency) — there's no
 * "simplified fallback" format the way TCF has, since a non-spec GPP string has no consumer that
 * would accept it. When `@iabgpp/cmpapi` isn't installed, `window.__gpp` is simply not exposed. */
export interface GppWidgetConfig {
  enabled: boolean
  cmpId: number
  cmpVersion: number
  /** MSPA "covered transaction" — whether this deployment's data transactions fall under MSPA
   * signatory obligations. No honest default, so it's required rather than optional. */
  mspaCoveredTransaction: boolean
  /** IAB's tri-state encoding for both MSPA fields: 0 = not applicable, 1 = yes, 2 = no. */
  mspaOptOutOptionMode: 0 | 1 | 2
  mspaServiceProviderMode: 0 | 1 | 2
}

export interface ComplianceWidgetConfig {
  type?: ComplianceType
  geoDataProvider?: 'default' | WidgetCountryResolverFn
  /** Only meaningful in standalone mode (no `api.enabled`) — ignored (with a warning) when
   * `api.enabled: true`, since the server resolves the compliance group in that mode.
   * `'default'` (embedded map, the default), a URL to fetch a JSON `ComplianceMapData`
   * document from (the browser's own HTTP cache honors whatever `Cache-Control`/`ETag` the
   * response sends — no custom caching here), or an inline operator-supplied `ComplianceMapData`
   * object. Invalid data from either a URL or an object logs a warning and falls back to
   * `'default'`. Only overrides the country→group mapping — country/region detection itself
   * always uses the embedded geo data. */
  complianceMap?: 'default' | string | ComplianceMapData
  tcf?: TcfWidgetConfig
  gpp?: GppWidgetConfig
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

/** Field names mirror their `--consenti-*` CSS variable literally (`--consenti-color-primary`
 * → `colorPrimary`) — see `applyTheme()` in `consenti-setup.ts` for the full mapping. */
export interface ThemeConfig {
  colorBg?: string
  colorText?: string
  colorTextMuted?: string
  colorPrimary?: string
  colorPrimaryText?: string
  colorSecondary?: string
  colorSecondaryText?: string
  colorBorder?: string
  colorSecondaryBorder?: string
  colorOverlay?: string
  colorAccent?: string
  colorAccentText?: string
  fontFamily?: string
  fontFamilyMono?: string
  fontSizeBase?: string
  fontSizeHeading?: string
  fontSizeMultiplier?: string
  fontWeightHeading?: string
  lineHeight?: string
  spacingXs?: string
  spacingSm?: string
  spacingMd?: string
  spacingLg?: string
  borderRadius?: string
  borderRadiusBtn?: string
  shadow?: string
  toggleBgOn?: string
  toggleBgPartial?: string
  toggleBgOff?: string
  toggleKnob?: string
  toggleWidth?: string
  toggleHeight?: string
  zBanner?: string
  zOverlay?: string
  zModal?: string
}

export interface CoreConfig {
  tenantId?: string
  locale?: string
  /** Text direction for the banner/modal root. `'auto'` (default) derives it from `locale` via
   * `Intl.Locale(...).getTextInfo().direction` (falling back to a hand-maintained RTL-language
   * list on engines without `getTextInfo()` support); set explicitly to override. */
  dir?: 'ltr' | 'rtl' | 'auto'
  disableCssTemplate?: boolean
  cookieSigningKey?: string
  allowReceipt?: boolean
  cookieDomains?: string
  /** Name of the consent cookie/localStorage key. Default: `'consenti_data'`. Not switched
   * automatically by detected region — set explicitly if you want a different name (e.g.
   * `'euconsent-v2'`, the IAB TCF convention, but only meaningful for operators using the
   * spec-correct binary encoder — `@consenti/api` + the optional `@iabtechlabtcf/core` peer
   * dependency — since the IAB name implies IAB's binary format, not Consenti's own encoding). */
  cookieName?: string
  storage?: 'cookie' | 'localStorage'
  theme?: ThemeConfig
  /** Initial logged-in application user ID; empty/anonymous when unset. Prefer `getUserId()`/
   * `setUserId()` (or the `consenti:listener:identify` event) to change it after init — those
   * also handle reconsent when the identity changes on a shared device. */
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
  /** Per-compliance-group text/button/cookie overrides — applied on top of whichever profile the
   * visitor's resolved group loads, keyed by that group's id (one of the 8 built-in
   * `ComplianceGroupId`s, or any custom group id). Lets you author different copy per country
   * without creating a separate profile (and separate `compliance.type` wiring) for each one —
   * e.g. `{ 'opt-in': { mainBanner: { htmlText: '...' } }, 'my-custom-group': { ... } }`.
   * Applied before `profileOverride`, which still always applies last as the universal catch-all.
   * Works identically in standalone and server (`api.enabled`) mode. */
  complianceGroupsOverride?: Partial<Record<ComplianceGroupId | (string & {}), DeepPartial<ResolvedProfile>>>
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
  | 'forgetMeRequested'
  | 'consenti:forgetMeRequested'
  | 'forgotten'
  | 'consenti:forgotten'

/** Snapshot of the current visitor's identity. `visitorId` is `null` until a consent decision
 * has actually happened — it's never minted just to answer this call, see `getVisitor()`. */
export interface VisitorIdentity {
  visitorId: string | null
  type: 'authenticated' | 'anonymous'
  userId: string | null
}

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
  /** Erases the stored consent record (same underlying call as `deleteConsent()`) and
   * re-prompts, dispatching `consenti:forgetMeRequested` / `consenti:forgotten` around it so a
   * host app can hook its own identity-verified erasure workflow. Powers the preference modal's
   * "Forget me" button; also callable directly for a custom placement of the same action. */
  forgetMe(resetAgeGate?: boolean): Promise<void>
  getRootElement(): HTMLElement | null
  getBannerElement(): HTMLElement | null
  getModalElement(): HTMLElement | null
  switchLocale(locale: string): void
  getUserId(): string | null
  /** Sets the logged-in application user ID (`null` for anonymous/logout). When the stored
   * consent record's user differs from the new value, reconsents by default — pass
   * `reConsent: false` to just update the identity without prompting again. No-ops (no
   * reconsent, no warning) when there's no prior consent record to compare against. */
  setUserId(userId: string | null, reConsent?: boolean): Promise<void>
  /** Snapshot of the current visitor's identity: the stable per-browser `visitorId` (`null` if
   * no consent decision has happened yet — this never creates one), whether they're
   * `authenticated` or `anonymous`, and the app `userId` (same as `getUserId()`). */
  getVisitor(): VisitorIdentity
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

/** Dispatched when the age gate is declined and `requireParentalConsent` is set — see the
 * profile's `AgeGateConfig`. A deny-all consent (mandatory cookies only) has already been
 * submitted with `parentalConsentToken` attached; this event is the hook for the site
 * owner to run their own out-of-band parental-consent verification. `parentalConsentToken` is
 * server-issued (and signed, when `compliance.dataSigningHash` is configured) when `api.enabled`,
 * otherwise a client-generated, unsigned fallback — see `POST /consent/:visitorId/parental-consent-request`. */
export interface ParentalConsentRequiredDetail {
  parentalConsentToken: string
  profileId: string
  visitorId: string
  timestamp: number
}

/** Dispatched by the standalone `resolveParentalConsent()` util (`apps/ui/src/utils/parental-consent.ts`)
 * after `POST /consent/parental-consent-resolve` succeeds — typically from a fresh page/session
 * with no live `ConsentiSetup` instance (the parent's own device, not the child's). A page that
 * does have a live widget instance can listen for this to react (e.g. re-show the banner/modal for
 * the real consent choice); what "resolved" should actually do to consent state is host-defined. */
export interface ParentalConsentGrantedDetail {
  visitorId: string
  profileId: string
}

/** Detail payload for the inbound `consenti:listener:identify` event — dispatched by the *host*
 * page (not the widget) to tell the widget which application user is logged in, equivalent to
 * calling `setUserId(userId, reConsent)`. `reConsent` defaults to `true`. */
export interface IdentifyEventDetail {
  userId: string | null
  reConsent?: boolean
}

/** Dispatched by `forgetMe()` right before the erasure call goes out — the hook for a host app
 * to kick off its own identity-verified erasure workflow across other systems (CRM, DMP,
 * analytics). The CMP itself only ever erases its own consent record; see the server-side
 * `consent.erased` eventBus event (fired by `DELETE /consent/:visitorId`) for the same hook on
 * the backend. See the "Right to erasure" guide for the full picture. */
export interface ForgetMeRequestedDetail {
  visitorId: string
  profileId: string
  timestamp: number
}

/** Dispatched by `forgetMe()` after the consent record has been erased and the banner/age-gate
 * has been re-prompted (see `reConsent()`, which `forgetMe()` wraps). */
export interface ForgottenDetail {
  visitorId: string
  profileId: string
  timestamp: number
}

export type ConsentEvent =
  | BannerInitializedDetail
  | BannerVisibilityDetail
  | ModalVisibilityDetail
  | ConsentBeingSubmitted
  | ConsentSubmittedDetail
  | ParentalConsentRequiredDetail
  | ParentalConsentGrantedDetail
  | ForgetMeRequestedDetail
  | ForgottenDetail;

// ─── Cross-tab broadcast ──────────────────────────────────────────────────────

export type ConsentiMessage =
  | { type: 'consentUpdated'; consent: ConsentValue; profileId: string }
  | { type: 'bannerClosed' }
  | { type: 'consentDeleted' }
