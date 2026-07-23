import type { LocaleTextContent } from '../types'

export const OPT_IN_BRAZIL_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Nous respectons votre vie privée',
    htmlText:
      "Conformément à la loi brésilienne sur la protection des données (LGPD), nous traitons vos données personnelles sur la base de votre consentement ou d'un intérêt légitime, selon le cas. Vous pouvez modifier vos préférences à tout moment.",
    buttons: {
      'accept-all': 'Tout accepter',
      'reject-optional': 'Tout refuser',
      manage: 'Gérer',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité (LGPD)',
    subheading: 'Choisissez vos options de confidentialité.',
    buttons: {
      'accept-all': 'Tout accepter',
      'reject-optional': 'Tout refuser',
      'save-preferences': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText: 'Indispensables au fonctionnement du site.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText:
          'Permettent des fonctionnalités avancées. Base légale : intérêt légitime (LGPD Art. 10).',
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText: 'Sauvegardent vos paramètres. Base légale : intérêt légitime (LGPD Art. 10).',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText:
          "Nous aident à comprendre l'utilisation du site. Consentement requis selon la LGPD.",
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Permettent la publicité personnalisée. Consentement requis selon la LGPD.',
      },
    },
  },
}
