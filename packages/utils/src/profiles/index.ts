import type {
  ComplianceGroupId,
  EmbeddedProfile,
  EmbeddedTranslations,
  EmbeddedButton,
  EmbeddedCategory,
  LocaleTextContent,
} from './types.js'

import { OPT_IN_EN_PROFILE } from './opt-in/en.js'
import { OPT_OUT_EN_PROFILE } from './opt-out/en.js'
import { OPT_OUT_STRICT_EN_PROFILE } from './opt-out-strict/en.js'
import { OPT_IN_DPDPA_EN_PROFILE } from './opt-in-dpdpa/en.js'
import { OPT_IN_CHINA_EN_PROFILE } from './opt-in-china/en.js'
import { OPT_IN_BRAZIL_EN_PROFILE } from './opt-in-brazil/en.js'
import { GENERAL_PRIVACY_CONSENT_EN_PROFILE } from './general-privacy-consent/en.js'
import { NOTICE_ONLY_EN_PROFILE } from './notice-only/en.js'

import { OPT_IN_DE } from './opt-in/de.js'
import { OPT_IN_ES } from './opt-in/es.js'
import { OPT_IN_FR } from './opt-in/fr.js'
import { OPT_IN_JA } from './opt-in/ja.js'
import { OPT_OUT_DE } from './opt-out/de.js'
import { OPT_OUT_ES } from './opt-out/es.js'
import { OPT_OUT_FR } from './opt-out/fr.js'
import { OPT_OUT_JA } from './opt-out/ja.js'
import { OPT_OUT_STRICT_DE } from './opt-out-strict/de.js'
import { OPT_OUT_STRICT_ES } from './opt-out-strict/es.js'
import { OPT_OUT_STRICT_FR } from './opt-out-strict/fr.js'
import { OPT_OUT_STRICT_JA } from './opt-out-strict/ja.js'
import { OPT_IN_DPDPA_DE } from './opt-in-dpdpa/de.js'
import { OPT_IN_DPDPA_ES } from './opt-in-dpdpa/es.js'
import { OPT_IN_DPDPA_FR } from './opt-in-dpdpa/fr.js'
import { OPT_IN_DPDPA_JA } from './opt-in-dpdpa/ja.js'
import { OPT_IN_CHINA_DE } from './opt-in-china/de.js'
import { OPT_IN_CHINA_ES } from './opt-in-china/es.js'
import { OPT_IN_CHINA_FR } from './opt-in-china/fr.js'
import { OPT_IN_CHINA_JA } from './opt-in-china/ja.js'
import { OPT_IN_BRAZIL_DE } from './opt-in-brazil/de.js'
import { OPT_IN_BRAZIL_ES } from './opt-in-brazil/es.js'
import { OPT_IN_BRAZIL_FR } from './opt-in-brazil/fr.js'
import { OPT_IN_BRAZIL_JA } from './opt-in-brazil/ja.js'
import { GENERAL_PRIVACY_CONSENT_DE } from './general-privacy-consent/de.js'
import { GENERAL_PRIVACY_CONSENT_ES } from './general-privacy-consent/es.js'
import { GENERAL_PRIVACY_CONSENT_FR } from './general-privacy-consent/fr.js'
import { GENERAL_PRIVACY_CONSENT_JA } from './general-privacy-consent/ja.js'
import { NOTICE_ONLY_DE } from './notice-only/de.js'
import { NOTICE_ONLY_ES } from './notice-only/es.js'
import { NOTICE_ONLY_FR } from './notice-only/fr.js'
import { NOTICE_ONLY_JA } from './notice-only/ja.js'

export { OPT_IN_EN_PROFILE } from './opt-in/en.js'
export { OPT_OUT_EN_PROFILE } from './opt-out/en.js'
export { OPT_OUT_STRICT_EN_PROFILE } from './opt-out-strict/en.js'
export { OPT_IN_DPDPA_EN_PROFILE } from './opt-in-dpdpa/en.js'
export { OPT_IN_CHINA_EN_PROFILE } from './opt-in-china/en.js'
export { OPT_IN_BRAZIL_EN_PROFILE } from './opt-in-brazil/en.js'
export { GENERAL_PRIVACY_CONSENT_EN_PROFILE } from './general-privacy-consent/en.js'
export { NOTICE_ONLY_EN_PROFILE } from './notice-only/en.js'

export type {
  EmbeddedProfile,
  EmbeddedCookie,
  EmbeddedBanner,
  EmbeddedModal,
  EmbeddedTranslations,
  EmbeddedButton,
  EmbeddedCategory,
  LocaleTextContent,
} from './types.js'

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

// ─── Generic, non-compliance-specific default text ───────────────────────────
// Used by the dashboard's "Load Defaults" for content no compliance group authors:
// - GPC banner, for a group whose regulation doesn't involve GPC at all (dpdpa/china/brazil/
//   general-privacy-consent/notice-only never set `translations.en.gpcBanner`) — falling back to
//   the main banner's marketing copy would be actively wrong once GPC is manually turned on for
//   such a profile, since that copy doesn't mention GPC at all.
// - Age-gate modal — regulated age-verification chrome, not marketing/consent copy, so no group
//   authors a version of it either.
// Translated into the same locale set as the `PROFILE_LOCALES` overlays above; any other locale
// falls back to English, the same rule those overlays already follow.

export const GENERIC_GPC_BANNER_TEXT: Record<string, { heading: string; htmlText: string }> = {
  en: {
    heading: 'Global Privacy Control detected',
    htmlText: 'Your browser sent a Global Privacy Control signal. We have applied your privacy preference accordingly — you can review or change your choices below.',
  },
  de: {
    heading: 'Global Privacy Control erkannt',
    htmlText: 'Ihr Browser hat ein Global-Privacy-Control-Signal gesendet. Wir haben Ihre Datenschutzeinstellung entsprechend angewendet — Sie können Ihre Auswahl unten überprüfen oder ändern.',
  },
  es: {
    heading: 'Control de privacidad global detectado',
    htmlText: 'Su navegador envió una señal de Global Privacy Control. Hemos aplicado su preferencia de privacidad en consecuencia; puede revisar o cambiar sus opciones a continuación.',
  },
  fr: {
    heading: 'Contrôle de confidentialité global détecté',
    htmlText: 'Votre navigateur a envoyé un signal Global Privacy Control. Nous avons appliqué votre préférence de confidentialité en conséquence — vous pouvez vérifier ou modifier vos choix ci-dessous.',
  },
  ja: {
    heading: 'グローバル・プライバシー・コントロールを検出しました',
    htmlText: 'お使いのブラウザからGlobal Privacy Control信号が送信されました。これに応じてお客様のプライバシー設定を適用しました。以下で選択内容を確認・変更いただけます。',
  },
}

export const GENERIC_AGE_GATE_TEXT: Record<string, {
  heading: string
  htmlText: string
  confirmButtonLabel: string
  denyButtonLabel: string
  parentalConsent: { heading: string; htmlText: string; confirmButtonLabel: string }
}> = {
  en: {
    heading: 'Are you 16 or older?',
    htmlText: 'Please confirm your age before we show you cookie preferences.',
    confirmButtonLabel: 'Yes',
    denyButtonLabel: 'No',
    parentalConsent: {
      heading: 'Parental consent required',
      htmlText: 'Only strictly necessary cookies will be used until a parent or guardian verifies consent on your behalf.',
      confirmButtonLabel: 'OK',
    },
  },
  de: {
    heading: 'Bist du 16 Jahre oder älter?',
    htmlText: 'Bitte bestätige dein Alter, bevor wir dir die Cookie-Einstellungen anzeigen.',
    confirmButtonLabel: 'Ja',
    denyButtonLabel: 'Nein',
    parentalConsent: {
      heading: 'Elterliche Zustimmung erforderlich',
      htmlText: 'Bis ein Elternteil oder Erziehungsberechtigter die Zustimmung in deinem Namen bestätigt, werden nur unbedingt erforderliche Cookies verwendet.',
      confirmButtonLabel: 'OK',
    },
  },
  es: {
    heading: '¿Tienes 16 años o más?',
    htmlText: 'Confirma tu edad antes de mostrarte las preferencias de cookies.',
    confirmButtonLabel: 'Sí',
    denyButtonLabel: 'No',
    parentalConsent: {
      heading: 'Se requiere consentimiento parental',
      htmlText: 'Solo se utilizarán las cookies estrictamente necesarias hasta que un padre, madre o tutor confirme el consentimiento en tu nombre.',
      confirmButtonLabel: 'Aceptar',
    },
  },
  fr: {
    heading: 'Avez-vous 16 ans ou plus ?',
    htmlText: 'Merci de confirmer votre âge avant que nous vous montrions les préférences de cookies.',
    confirmButtonLabel: 'Oui',
    denyButtonLabel: 'Non',
    parentalConsent: {
      heading: 'Consentement parental requis',
      htmlText: 'Seuls les cookies strictement nécessaires seront utilisés jusqu’à ce qu’un parent ou tuteur confirme son consentement en votre nom.',
      confirmButtonLabel: 'OK',
    },
  },
  ja: {
    heading: '16歳以上ですか?',
    htmlText: 'Cookieの設定を表示する前に、年齢をご確認ください。',
    confirmButtonLabel: 'はい',
    denyButtonLabel: 'いいえ',
    parentalConsent: {
      heading: '保護者の同意が必要です',
      htmlText: '保護者が同意を確認するまで、必要最小限のCookieのみが使用されます。',
      confirmButtonLabel: 'OK',
    },
  },
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
