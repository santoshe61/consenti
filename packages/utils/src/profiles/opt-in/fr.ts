import type { LocaleTextContent } from '../types'

export const OPT_IN_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Nous respectons votre vie privée',
    htmlText:
      "Nous utilisons des cookies pour améliorer votre expérience de navigation, afficher des publicités ou du contenu personnalisés et analyser notre trafic. En cliquant sur <strong>Tout accepter</strong>, vous consentez à l'utilisation des cookies. Vous pouvez modifier vos préférences à tout moment.",
    buttons: {
      'accept-all': 'Tout accepter',
      'reject-optional': 'Tout refuser',
      'manage-preferences': 'Gérer les préférences',
    },
  },
  gpcBanner: {
    heading: 'Préférence de confidentialité reconnue',
    htmlText:
      'Votre navigateur a envoyé un signal Global Privacy Control (GPC). Nous avons appliqué votre préférence de confidentialité.',
    buttons: {
      'accept-all': 'Vérifier les préférences',
      'confirm-settings': 'Continuer',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité',
    subheading: 'Choisissez les cookies que vous souhaitez autoriser.',
    htmlText:
      'Nous utilisons différents types de cookies. Vous pouvez activer ou désactiver chaque catégorie. Les cookies nécessaires ne peuvent pas être désactivés.',
    buttons: {
      'accept-all': 'Tout accepter',
      'reject-optional': 'Tout refuser',
      'save-preferences': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText:
          'Ces cookies sont indispensables au fonctionnement du site web et ne peuvent pas être désactivés.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText:
          'Permettent des fonctionnalités avancées comme les préférences enregistrées et la personnalisation.',
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText: 'Sauvegardent vos paramètres personnels et préférences pour les visites futures.',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText:
          'Nous aident à comprendre comment les visiteurs interagissent avec notre site web.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Sont utilisés pour vous afficher des publicités pertinentes.',
      },
    },
  },
}
