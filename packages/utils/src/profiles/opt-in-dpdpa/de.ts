import type { LocaleTextContent } from '../types'

export const OPT_IN_DPDPA_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Datenschutzhinweis',
    htmlText:
      'Wir sind der für die Datenverarbeitung Verantwortliche gemäß dem Digitalen Personaldatenschutzgesetz (DPDPA) Indiens. Ihre Einwilligung ist erforderlich, bevor wir Ihre personenbezogenen Daten verarbeiten.',
    buttons: {
      'consent-all': 'Ich stimme zu',
      'deny-all': 'Ich stimme nicht zu',
      'review-choices': 'Auswahl überprüfen',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen (DPDPA)',
    subheading: 'Bitte wählen Sie aus, in welche Verarbeitungen Sie einwilligen.',
    buttons: {
      'consent-all': 'Ich stimme zu',
      'withdraw-all': 'Ich stimme nicht zu',
      'save-choices': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText:
          'Für den Betrieb der Website unbedingt erforderlich. Keine Einwilligung erforderlich.',
      },
      'cat-functional': {
        heading: 'Funktional',
        htmlText:
          'Ermöglichen erweiterte Funktionen. Ihre Einwilligung ist gemäß DPDPA erforderlich.',
      },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText:
          'Speichern Ihre persönlichen Einstellungen. Einwilligung gemäß DPDPA erforderlich.',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText:
          'Helfen uns, die Website-Nutzung zu verstehen. Einwilligung gemäß DPDPA erforderlich.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Ermöglichen personalisierte Werbung. Einwilligung gemäß DPDPA erforderlich.',
      },
    },
  },
}
