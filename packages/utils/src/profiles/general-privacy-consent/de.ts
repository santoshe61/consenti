import type { LocaleTextContent } from '../types'

export const GENERAL_PRIVACY_CONSENT_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Wir verwenden Cookies',
    htmlText:
      'Wir verwenden Cookies und ähnliche Technologien, um unsere Dienste bereitzustellen und zu verbessern. Für Marketing-Cookies ist Ihre Einwilligung erforderlich. Andere Cookies basieren auf unserem berechtigten Interesse.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'reject-marketing': 'Marketing ablehnen',
      'manage-preferences': 'Einstellungen verwalten',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen',
    subheading: 'Wählen Sie Ihre Cookie-Präferenzen.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'necessary-only': 'Marketing ablehnen',
      'save-preferences': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText: 'Für den Betrieb der Website unbedingt erforderlich.',
      },
      'cat-functional': {
        heading: 'Funktional',
        htmlText: 'Ermöglichen erweiterte Funktionen. Rechtsgrundlage: berechtigtes Interesse.',
      },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText:
          'Speichern Ihre persönlichen Einstellungen. Rechtsgrundlage: berechtigtes Interesse.',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText:
          'Helfen uns, die Website-Nutzung zu verstehen. Rechtsgrundlage: berechtigtes Interesse.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Ermöglichen personalisierte Werbung. Ihre Einwilligung ist erforderlich.',
      },
    },
  },
}
