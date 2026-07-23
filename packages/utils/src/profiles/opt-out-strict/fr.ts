import type { LocaleTextContent } from '../types'

export const OPT_OUT_STRICT_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Droits à la vie privée en Californie',
    htmlText:
      "Conformément au California Privacy Rights Act (CPRA), vous avez le droit de vous opposer à la vente, au partage et à l'utilisation de vos données personnelles.",
    buttons: {
      'accept-all': 'Tout accepter',
      'opt-out-sale-sharing-sensitive': 'Ne pas vendre ni partager mes données',
      manage: 'Gérer les préférences',
    },
  },
  gpcBanner: {
    heading: 'GPC détecté – exclusion CPRA appliquée',
    htmlText:
      "Votre signal Global Privacy Control a été détecté. Votre droit d'exclusion selon la CPRA a été appliqué automatiquement.",
    buttons: {
      'accept-all': 'Vérifier les préférences',
      'confirm-opt-out': 'Continuer',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité (CPRA)',
    subheading: 'Gérez vos droits à la vie privée.',
    buttons: {
      'accept-all': 'Tout accepter',
      'opt-out-sale-sharing-sensitive': 'Ne pas vendre ni partager mes données',
      'save-choices': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText: 'Indispensables au fonctionnement du site.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText: 'Permettent des fonctionnalités avancées.',
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText: 'Sauvegardent vos paramètres personnels.',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText: "Nous aident à comprendre l'utilisation du site.",
      },
      'cat-marketing': {
        heading: 'Vente / Partage (CPRA)',
        htmlText:
          'Vente et partage de données personnelles selon la CPRA. Vous pouvez vous y opposer.',
      },
    },
  },
}
