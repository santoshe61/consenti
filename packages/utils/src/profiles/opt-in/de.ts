import type { LocaleTextContent } from '../types'

export const OPT_IN_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Wir schätzen Ihre Privatsphäre',
    htmlText:
      'Wir verwenden Cookies, um Ihre Browser-Erfahrung zu verbessern, personalisierte Inhalte oder Anzeigen bereitzustellen und unseren Datenverkehr zu analysieren. Mit dem Klicken auf <strong>Alle akzeptieren</strong> stimmen Sie der Verwendung von Cookies zu. Sie können Ihre Einstellungen jederzeit ändern.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'reject-optional': 'Alle ablehnen',
      'manage-preferences': 'Einstellungen verwalten',
    },
  },
  gpcBanner: {
    heading: 'Datenschutzpräferenz erkannt',
    htmlText:
      'Ihr Browser hat ein Global Privacy Control (GPC) Signal gesendet. Wir haben Ihre Datenschutzpräferenz berücksichtigt.',
    buttons: {
      'accept-all': 'Einstellungen überprüfen',
      'confirm-settings': 'Weiter',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen',
    subheading: 'Wählen Sie aus, welche Cookies Sie erlauben.',
    htmlText:
      'Wir verwenden verschiedene Cookie-Typen. Sie können die einzelnen Kategorien aktivieren oder deaktivieren. Notwendige Cookies können nicht deaktiviert werden.',
    buttons: {
      'accept-all': 'Alle akzeptieren',
      'reject-optional': 'Alle ablehnen',
      'save-preferences': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText:
          'Diese Cookies sind für das Funktionieren der Website unbedingt erforderlich und können nicht deaktiviert werden.',
      },
      'cat-functional': {
        heading: 'Funktional',
        htmlText:
          'Ermöglichen erweiterte Funktionen wie gespeicherte Präferenzen und Personalisierung.',
      },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText:
          'Speichern Ihre persönlichen Einstellungen und Präferenzen für zukünftige Besuche.',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText: 'Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Werden verwendet, um Ihnen relevante Werbung anzuzeigen.',
      },
    },
  },
}
