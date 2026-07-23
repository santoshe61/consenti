import type { LocaleTextContent } from '../types'

export const OPT_IN_CHINA_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Hinweis zur Verarbeitung personenbezogener Daten',
    htmlText:
      'Gemäß dem Gesetz zum Schutz personenbezogener Daten (PIPL) müssen wir Sie vor der Verarbeitung Ihrer Daten informieren. Wir verarbeiten Daten nur zu den angegebenen Zwecken auf Grundlage Ihrer Einwilligung.',
    buttons: {
      'agree-all': 'Zustimmen',
      'reject-non-necessary': 'Ablehnen',
      'manage-preferences': 'Einstellungen',
    },
  },
  preferenceModal: {
    heading: 'Datenschutzeinstellungen (PIPL)',
    subheading: 'Bitte wählen Sie, welcher Datenverarbeitung Sie zustimmen.',
    buttons: {
      'agree-all': 'Zustimmen',
      'disagree-all': 'Ablehnen',
      'confirm-settings': 'Auswahl speichern',
    },
    categories: {
      'cat-necessary': {
        heading: 'Unbedingt erforderlich',
        htmlText:
          'Für den Betrieb der Website unbedingt erforderlich. Zweck: Sicherheit und grundlegende Funktionalität.',
      },
      'cat-functional': {
        heading: 'Funktional',
        htmlText:
          'Zweck: Verbesserung der Benutzererfahrung. Einwilligung gemäß PIPL erforderlich.',
      },
      'cat-preferences': {
        heading: 'Präferenzen',
        htmlText:
          'Zweck: Speicherung personalisierter Einstellungen. Einwilligung gemäß PIPL erforderlich.',
      },
      'cat-analytics': {
        heading: 'Analyse',
        htmlText: 'Zweck: Statistiken zur Website-Nutzung. Einwilligung gemäß PIPL erforderlich.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Zweck: Personalisierte Werbung. Einwilligung gemäß PIPL erforderlich.',
      },
    },
  },
}
