import type { LocaleTextContent } from '../types'

export const OPT_IN_BRAZIL_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Wir schätzen Ihre Privatsphäre',
    htmlText:
      'Gemäß dem brasilianischen Datenschutzgesetz (LGPD) verarbeiten wir Ihre personenbezogenen Daten auf Grundlage Ihrer Einwilligung oder unseres berechtigten Interesses, sofern anwendbar. Sie können Ihre Wahl jederzeit ändern.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'reject-optional': 'Alle ablehnen',
      manage: 'Verwalten',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen (LGPD)',
    subheading: 'Wählen Sie Ihre Datenschutzoptionen.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'reject-optional': 'Alle ablehnen',
      'save-preferences': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText: 'Für den Betrieb der Website unbedingt erforderlich.',
      },
      'cat-functional': {
        heading: 'Funktional',
        htmlText:
          'Ermöglichen erweiterte Funktionen. Rechtsgrundlage: berechtigtes Interesse (LGPD Art. 10).',
      },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText:
          'Speichern Ihre Einstellungen. Rechtsgrundlage: berechtigtes Interesse (LGPD Art. 10).',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText:
          'Helfen uns, die Website-Nutzung zu verstehen. Einwilligung gemäß LGPD erforderlich.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Ermöglichen personalisierte Werbung. Einwilligung gemäß LGPD erforderlich.',
      },
    },
  },
}
