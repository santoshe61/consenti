import type { COMPLIANCE_GROUP_IDS, COOKIE_PURPOSE_IDS } from '../compliance'

export type ComplianceGroupId = (typeof COMPLIANCE_GROUP_IDS)[number]
type CookiePurpose = (typeof COOKIE_PURPOSE_IDS)[number]

// ─── Cookie ───────────────────────────────────────────────────────────────────
// Keyed by its own id inside `Record<string, EmbeddedCookie>` on `EmbeddedProfile`
// — no `id` field on the value itself. Legal basis lives on `EmbeddedCategory`.

export interface EmbeddedCookie {
  purpose: CookiePurpose
  listenGpc: boolean
  /** Pre-grant this parameter by default (only meaningful when its category's legalBasis is 'consent'). Default: false. */
  preGrant?: boolean
  cpraCategory?: 'sale' | 'sharing' | 'sensitive'
}

// ─── Banner / Modal building blocks ──────────────────────────────────────────

export type ButtonStyle = 'primary' | 'secondary' | 'text' | 'accent'
export type ButtonAction = 'submit' | 'manage' | 'close' | 'custom' | 'link'

export interface EmbeddedButton {
  text: string
  style: ButtonStyle
  action: ButtonAction
  /** For action:'submit' — which cookies to grant. '*' = all, '!' = necessary only (deny all). */
  cookies?: string[] | '*' | '!'
}

/** Keyed by its own machine id (e.g. `'accept-all'`), rendered as the button's DOM id
 * (`consenti-btn-{id}`) once mapped to the runtime `Button` type. */
export type EmbeddedButtonMap = Record<string, EmbeddedButton>

/** Keyed by its own id inside `Record<string, EmbeddedCategory>` — no `id` field on the value itself. */
export interface EmbeddedCategory {
  heading: string
  htmlText: string
  /** Single source of legal basis for every parameter listed in `cookies`. */
  legalBasis: 'mandatory' | 'consent' | 'legitimate_interest'
  legitimateInterestDescription?: string
  cookies: string[]
}

export interface EmbeddedBanner {
  position: 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
  heading?: string
  htmlText: string
  buttons: EmbeddedButtonMap
  showClose?: boolean
  showLocaleSwitcher?: boolean
}

export interface EmbeddedModal {
  position?: 'left' | 'right' | 'center'
  heading: string
  subheading?: string
  htmlText?: string
  buttons: EmbeddedButtonMap
  categories: Record<string, EmbeddedCategory>
  persistent?: boolean
}

// ─── Locale translations ──────────────────────────────────────────────────────

export interface EmbeddedTranslations {
  mainBanner: EmbeddedBanner
  gpcBanner?: EmbeddedBanner
  preferenceModal: EmbeddedModal
}

// ─── Top-level profile ────────────────────────────────────────────────────────

export interface EmbeddedProfile {
  complianceGroup: ComplianceGroupId
  gpcMode: 'ignore' | 'honor' | 'strict'
  defaultLocale: string
  cookies: Record<string, EmbeddedCookie>
  /** Days until consent expires and the visitor is asked again (profile-wide). Default: 365. */
  expiryDays?: number
  translations: Record<string, EmbeddedTranslations>
}

// ─── Non-English locale overlays ─────────────────────────────────────────────
// Each group's `en.ts` above is the full source of truth (structure + legal-basis mapping);
// `de`/`es`/`fr`/`ja` files only carry translated display text layered onto that structure.

/** Locale-specific text content that overlays a group's English `EmbeddedProfile`. */
export interface LocaleTextContent {
  mainBanner: {
    heading: string
    htmlText: string
    /** Keyed by the base English profile's button id — was a positional array matched by
     * index; a locale may translate fewer buttons than the base has (the rest fall back to
     * the base/English text), but never keys one that doesn't exist in the base. */
    buttons: Record<string, string>
  }
  gpcBanner?: {
    heading: string
    htmlText: string
    buttons: Record<string, string>
  }
  preferenceModal: {
    heading: string
    subheading?: string
    htmlText?: string
    buttons: Record<string, string>
    /**
     * Keyed `cat-<name>` (e.g. `cat-necessary`) — a fixed scheme independent of each group's
     * actual category keys, which vary (opt-out-strict adds `sensitive`; no group has a
     * standalone `preferences` category since it's folded into `functional`). Matched against
     * the base English category keys by stripping the `cat-` prefix in `resolveLocaleTranslation`
     * — an overlay entry with no matching base key is simply unused.
     */
    categories: Record<
      string,
      {
        heading: string
        htmlText: string
      }
    >
  }
}
