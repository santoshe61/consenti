import type { LocaleTextContent } from '../types'

export const OPT_IN_CHINA_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Avis de traitement des informations personnelles',
    htmlText:
      'Conformément à la loi sur la protection des informations personnelles (PIPL), nous devons vous informer avant tout traitement. Nous traitons les données à des fins spécifiques uniquement, avec votre consentement.',
    buttons: {
      'agree-all': 'Accepter',
      'reject-non-necessary': 'Refuser',
      'manage-preferences': 'Paramètres',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité (PIPL)',
    subheading: 'Choisissez les traitements de données que vous acceptez.',
    buttons: {
      'agree-all': 'Accepter',
      'disagree-all': 'Refuser',
      'confirm-settings': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText: 'Indispensables au site. Finalité : sécurité et fonctionnalité de base.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText:
          "Finalité : améliorer l'expérience utilisateur. Consentement requis selon la PIPL.",
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText:
          'Finalité : sauvegarder les paramètres personnalisés. Consentement requis selon la PIPL.',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText:
          "Finalité : statistiques d'utilisation du site. Consentement requis selon la PIPL.",
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Finalité : publicité personnalisée. Consentement requis selon la PIPL.',
      },
    },
  },
}
