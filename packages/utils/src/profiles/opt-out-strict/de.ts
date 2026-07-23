import type { LocaleTextContent } from '../types'

export const OPT_OUT_STRICT_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Datenschutzrechte in Kalifornien',
    htmlText:
      'Gemäß dem California Privacy Rights Act (CPRA) haben Sie das Recht, dem Verkauf, der Weitergabe und der Verwendung Ihrer persönlichen Daten zu widersprechen.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'opt-out-sale-sharing-sensitive': 'Meine Daten nicht verkaufen oder teilen',
      manage: 'Einstellungen verwalten',
    },
  },
  gpcBanner: {
    heading: 'GPC erkannt – CPRA-Opt-out angewendet',
    htmlText:
      'Ihr Global Privacy Control Signal wurde erkannt. Ihr Recht auf Opt-out gemäß CPRA wurde automatisch angewendet.',
    buttons: {
      'accept-all': 'Einstellungen überprüfen',
      'confirm-opt-out': 'Weiter',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen (CPRA)',
    subheading: 'Verwalten Sie Ihre Datenschutzrechte.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'opt-out-sale-sharing-sensitive': 'Meine Daten nicht verkaufen oder teilen',
      'save-choices': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText: 'Für den Betrieb der Website unbedingt erforderlich.',
      },
      'cat-functional': { heading: 'Funktional', htmlText: 'Ermöglichen erweiterte Funktionen.' },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText: 'Speichern Ihre persönlichen Einstellungen.',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText: 'Helfen uns, die Website-Nutzung zu verstehen.',
      },
      'cat-marketing': {
        heading: 'Verkauf / Weitergabe (CPRA)',
        htmlText: 'Verkauf und Weitergabe persönlicher Daten gemäß CPRA. Sie können widersprechen.',
      },
    },
  },
}
