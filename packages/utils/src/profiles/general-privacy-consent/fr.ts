import type { LocaleTextContent } from '../types'

export const GENERAL_PRIVACY_CONSENT_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Nous utilisons des cookies',
    htmlText:
      'Nous utilisons des cookies et des technologies similaires pour fournir et améliorer nos services. Les cookies marketing nécessitent votre consentement. Les autres reposent sur notre intérêt légitime.',
    buttons: {
      'accept-all': 'Tout accepter',
      'reject-marketing': 'Refuser le marketing',
      'manage-preferences': 'Gérer les préférences',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité',
    subheading: 'Choisissez vos préférences en matière de cookies.',
    buttons: {
      'accept-all': 'Tout accepter',
      'necessary-only': 'Refuser le marketing',
      'save-preferences': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText: 'Indispensables au fonctionnement du site.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText: 'Permettent des fonctionnalités avancées. Base légale : intérêt légitime.',
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText: 'Sauvegardent vos paramètres personnels. Base légale : intérêt légitime.',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText: "Nous aident à comprendre l'utilisation du site. Base légale : intérêt légitime.",
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Permettent la publicité personnalisée. Votre consentement est requis.',
      },
    },
  },
}
