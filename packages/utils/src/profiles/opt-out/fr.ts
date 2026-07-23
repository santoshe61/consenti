import type { LocaleTextContent } from '../types'

export const OPT_OUT_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Nous utilisons des cookies',
    htmlText:
      'Nous utilisons des cookies pour améliorer nos services. Vous pouvez vous opposer à la vente ou au partage de vos données personnelles à tout moment.',
    buttons: {
      'accept-all': 'Tout accepter',
      'do-not-sell-share': 'Ne pas vendre ni partager',
      'manage-preferences': 'Gérer les préférences',
    },
  },
  gpcBanner: {
    heading: 'GPC détecté – exclusion appliquée',
    htmlText:
      'Votre navigateur a envoyé un signal Global Privacy Control. Nous avons appliqué votre demande de ne pas vendre ni partager vos données.',
    buttons: {
      'accept-all': 'Vérifier les préférences',
      'confirm-opt-out': 'Continuer',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité',
    subheading: 'Choisissez vos options de confidentialité.',
    buttons: {
      'accept-all': 'Tout accepter',
      'opt-out-all': 'Ne pas vendre ni partager',
      'save-choices': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText: 'Indispensables au fonctionnement du site web.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText: 'Permettent des fonctionnalités avancées et la personnalisation.',
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText: 'Sauvegardent vos paramètres pour les visites futures.',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText: 'Nous aident à comprendre comment les visiteurs utilisent notre site.',
      },
      'cat-marketing': {
        heading: 'Publicité / Vente',
        htmlText:
          'Permettent la publicité ciblée. Vous pouvez vous opposer à la vente de vos données.',
      },
    },
  },
}
