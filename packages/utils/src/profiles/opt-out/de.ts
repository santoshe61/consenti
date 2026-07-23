import type { LocaleTextContent } from '../types'

export const OPT_OUT_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Wir verwenden Cookies',
    htmlText:
      'Wir verwenden Cookies, um unsere Dienste zu verbessern. Sie können dem Verkauf oder der Weitergabe Ihrer persönlichen Daten jederzeit widersprechen.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'do-not-sell-share': 'Nicht verkaufen oder weitergeben',
      'manage-preferences': 'Einstellungen verwalten',
    },
  },
  gpcBanner: {
    heading: 'GPC erkannt – Opt-out angewendet',
    htmlText:
      'Ihr Browser hat ein Global Privacy Control Signal gesendet. Wir haben Sie vom Verkauf und der Weitergabe Ihrer Daten abgemeldet.',
    buttons: {
      'accept-all': 'Einstellungen überprüfen',
      'confirm-opt-out': 'Weiter',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen',
    subheading: 'Wählen Sie Ihre Datenschutzoptionen.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'opt-out-all': 'Nicht verkaufen oder weitergeben',
      'save-choices': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText: 'Diese Cookies sind für das Funktionieren der Website unbedingt erforderlich.',
      },
      'cat-functional': {
        heading: 'Funktional',
        htmlText: 'Ermöglichen erweiterte Funktionen und Personalisierung.',
      },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText: 'Speichern Ihre Einstellungen für zukünftige Besuche.',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText: 'Helfen uns zu verstehen, wie Besucher unsere Website nutzen.',
      },
      'cat-marketing': {
        heading: 'Werbung / Verkauf',
        htmlText: 'Ermöglichen gezielte Werbung. Sie können dem Verkauf Ihrer Daten widersprechen.',
      },
    },
  },
}
