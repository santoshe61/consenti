import type {
  ComplianceGroupId,
  EmbeddedProfile,
  EmbeddedTranslations,
  EmbeddedButton,
  EmbeddedCategory,
  LocaleTextContent,
} from './types'

import { OPT_IN_EN_PROFILE } from './opt-in/en'
import { OPT_OUT_EN_PROFILE } from './opt-out/en'
import { OPT_OUT_STRICT_EN_PROFILE } from './opt-out-strict/en'
import { OPT_IN_DPDPA_EN_PROFILE } from './opt-in-dpdpa/en'
import { OPT_IN_CHINA_EN_PROFILE } from './opt-in-china/en'
import { OPT_IN_BRAZIL_EN_PROFILE } from './opt-in-brazil/en'
import { GENERAL_PRIVACY_CONSENT_EN_PROFILE } from './general-privacy-consent/en'
import { NOTICE_ONLY_EN_PROFILE } from './notice-only/en'

import { OPT_IN_DE } from './opt-in/de'
import { OPT_IN_ES } from './opt-in/es'
import { OPT_IN_FR } from './opt-in/fr'
import { OPT_IN_JA } from './opt-in/ja'
import { OPT_OUT_DE } from './opt-out/de'
import { OPT_OUT_ES } from './opt-out/es'
import { OPT_OUT_FR } from './opt-out/fr'
import { OPT_OUT_JA } from './opt-out/ja'
import { OPT_OUT_STRICT_DE } from './opt-out-strict/de'
import { OPT_OUT_STRICT_ES } from './opt-out-strict/es'
import { OPT_OUT_STRICT_FR } from './opt-out-strict/fr'
import { OPT_OUT_STRICT_JA } from './opt-out-strict/ja'
import { OPT_IN_DPDPA_DE } from './opt-in-dpdpa/de'
import { OPT_IN_DPDPA_ES } from './opt-in-dpdpa/es'
import { OPT_IN_DPDPA_FR } from './opt-in-dpdpa/fr'
import { OPT_IN_DPDPA_JA } from './opt-in-dpdpa/ja'
import { OPT_IN_CHINA_DE } from './opt-in-china/de'
import { OPT_IN_CHINA_ES } from './opt-in-china/es'
import { OPT_IN_CHINA_FR } from './opt-in-china/fr'
import { OPT_IN_CHINA_JA } from './opt-in-china/ja'
import { OPT_IN_BRAZIL_DE } from './opt-in-brazil/de'
import { OPT_IN_BRAZIL_ES } from './opt-in-brazil/es'
import { OPT_IN_BRAZIL_FR } from './opt-in-brazil/fr'
import { OPT_IN_BRAZIL_JA } from './opt-in-brazil/ja'
import { GENERAL_PRIVACY_CONSENT_DE } from './general-privacy-consent/de'
import { GENERAL_PRIVACY_CONSENT_ES } from './general-privacy-consent/es'
import { GENERAL_PRIVACY_CONSENT_FR } from './general-privacy-consent/fr'
import { GENERAL_PRIVACY_CONSENT_JA } from './general-privacy-consent/ja'
import { NOTICE_ONLY_DE } from './notice-only/de'
import { NOTICE_ONLY_ES } from './notice-only/es'
import { NOTICE_ONLY_FR } from './notice-only/fr'
import { NOTICE_ONLY_JA } from './notice-only/ja'

export { OPT_IN_EN_PROFILE } from './opt-in/en'
export { OPT_OUT_EN_PROFILE } from './opt-out/en'
export { OPT_OUT_STRICT_EN_PROFILE } from './opt-out-strict/en'
export { OPT_IN_DPDPA_EN_PROFILE } from './opt-in-dpdpa/en'
export { OPT_IN_CHINA_EN_PROFILE } from './opt-in-china/en'
export { OPT_IN_BRAZIL_EN_PROFILE } from './opt-in-brazil/en'
export { GENERAL_PRIVACY_CONSENT_EN_PROFILE } from './general-privacy-consent/en'
export { NOTICE_ONLY_EN_PROFILE } from './notice-only/en'

export type {
  EmbeddedProfile,
  EmbeddedCookie,
  EmbeddedBanner,
  EmbeddedModal,
  EmbeddedTranslations,
  EmbeddedButton,
  EmbeddedCategory,
  LocaleTextContent,
} from './types'

export const DEFAULT_PROFILES: Record<ComplianceGroupId, EmbeddedProfile> = {
  'opt-in': OPT_IN_EN_PROFILE,
  'opt-out': OPT_OUT_EN_PROFILE,
  'opt-out-strict': OPT_OUT_STRICT_EN_PROFILE,
  'opt-in-dpdpa': OPT_IN_DPDPA_EN_PROFILE,
  'opt-in-china': OPT_IN_CHINA_EN_PROFILE,
  'opt-in-brazil': OPT_IN_BRAZIL_EN_PROFILE,
  'general-privacy-consent': GENERAL_PRIVACY_CONSENT_EN_PROFILE,
  'notice-only': NOTICE_ONLY_EN_PROFILE,
}

// ─── Non-English locale overlays ─────────────────────────────────────────────
// Single source of truth for every consumer that needs translated default-profile text:
// the setup wizard's profile seeding (apps/api), the ProfileEditor's "Load Defaults"
// (apps/api dashboard), and — English only for now — the widget's embedded-profile
// fallback (apps/ui). No other place should hold this content.

type LocaleOverlayMap = Record<string, LocaleTextContent>

const PROFILE_LOCALES: Record<ComplianceGroupId, LocaleOverlayMap> = {
  'opt-in': { de: OPT_IN_DE, es: OPT_IN_ES, fr: OPT_IN_FR, ja: OPT_IN_JA },
  'opt-out': { de: OPT_OUT_DE, es: OPT_OUT_ES, fr: OPT_OUT_FR, ja: OPT_OUT_JA },
  'opt-out-strict': {
    de: OPT_OUT_STRICT_DE,
    es: OPT_OUT_STRICT_ES,
    fr: OPT_OUT_STRICT_FR,
    ja: OPT_OUT_STRICT_JA,
  },
  'opt-in-dpdpa': {
    de: OPT_IN_DPDPA_DE,
    es: OPT_IN_DPDPA_ES,
    fr: OPT_IN_DPDPA_FR,
    ja: OPT_IN_DPDPA_JA,
  },
  'opt-in-china': {
    de: OPT_IN_CHINA_DE,
    es: OPT_IN_CHINA_ES,
    fr: OPT_IN_CHINA_FR,
    ja: OPT_IN_CHINA_JA,
  },
  'opt-in-brazil': {
    de: OPT_IN_BRAZIL_DE,
    es: OPT_IN_BRAZIL_ES,
    fr: OPT_IN_BRAZIL_FR,
    ja: OPT_IN_BRAZIL_JA,
  },
  'general-privacy-consent': {
    de: GENERAL_PRIVACY_CONSENT_DE,
    es: GENERAL_PRIVACY_CONSENT_ES,
    fr: GENERAL_PRIVACY_CONSENT_FR,
    ja: GENERAL_PRIVACY_CONSENT_JA,
  },
  'notice-only': { de: NOTICE_ONLY_DE, es: NOTICE_ONLY_ES, fr: NOTICE_ONLY_FR, ja: NOTICE_ONLY_JA },
}

function mapButtons(
  base: Record<string, EmbeddedButton>,
  overlay: Record<string, string>
): Record<string, EmbeddedButton> {
  const result: Record<string, EmbeddedButton> = {}
  for (const [id, btn] of Object.entries(base)) {
    result[id] = overlay[id] !== undefined ? { ...btn, text: overlay[id] } : btn
  }
  return result
}

/**
 * Resolves the full translation for one locale of one compliance group, merging the canonical
 * English structure (button id/style/action, category legalBasis/cookies) with that locale's
 * overlay text. Returns `undefined` if the group is unknown or has no overlay for `locale` —
 * callers fall back to the group's English translation themselves (see `DEFAULT_PROFILES`).
 */
export function resolveLocaleTranslation(
  complianceGroup: string,
  locale: string
): EmbeddedTranslations | undefined {
  const embedded = DEFAULT_PROFILES[complianceGroup as ComplianceGroupId]
  const base = embedded?.translations['en']
  if (!base) return undefined
  if (locale === 'en') return base

  const overlay = PROFILE_LOCALES[complianceGroup as ComplianceGroupId]?.[locale]
  if (!overlay) return undefined

  const categories: Record<string, EmbeddedCategory> = {}
  for (const [key, cat] of Object.entries(base.preferenceModal.categories)) {
    const overlayCat = overlay.preferenceModal.categories[`cat-${key}`]
    categories[key] = overlayCat
      ? { ...cat, heading: overlayCat.heading, htmlText: overlayCat.htmlText }
      : cat
  }

  return {
    mainBanner: {
      ...base.mainBanner,
      heading: overlay.mainBanner.heading,
      htmlText: overlay.mainBanner.htmlText,
      buttons: mapButtons(base.mainBanner.buttons, overlay.mainBanner.buttons),
    },
    ...(base.gpcBanner
      ? {
          gpcBanner: overlay.gpcBanner
            ? {
                ...base.gpcBanner,
                heading: overlay.gpcBanner.heading,
                htmlText: overlay.gpcBanner.htmlText,
                buttons: mapButtons(base.gpcBanner.buttons, overlay.gpcBanner.buttons),
              }
            : base.gpcBanner,
        }
      : {}),
    preferenceModal: {
      ...base.preferenceModal,
      heading: overlay.preferenceModal.heading,
      ...(overlay.preferenceModal.subheading
        ? { subheading: overlay.preferenceModal.subheading }
        : {}),
      ...(overlay.preferenceModal.htmlText ? { htmlText: overlay.preferenceModal.htmlText } : {}),
      buttons: mapButtons(base.preferenceModal.buttons, overlay.preferenceModal.buttons),
      categories,
    },
  }
}
