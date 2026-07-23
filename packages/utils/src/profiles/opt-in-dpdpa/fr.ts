import type { LocaleTextContent } from '../types'

export const OPT_IN_DPDPA_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Avis de protection des données',
    htmlText:
      'Nous sommes le Fiduciaire de données au sens de la loi indienne sur la protection des données personnelles numériques (DPDPA). Votre consentement est requis avant que nous traitions vos données personnelles.',
    buttons: {
      'consent-all': 'Je consens',
      'deny-all': 'Je ne consens pas',
      'review-choices': 'Examiner les choix',
    },
  },
  preferenceModal: {
    heading: 'Paramètres de confidentialité (DPDPA)',
    subheading: 'Choisissez les traitements auxquels vous consentez.',
    buttons: {
      'consent-all': 'Je consens',
      'withdraw-all': 'Je ne consens pas',
      'save-choices': 'Enregistrer la sélection',
    },
    categories: {
      'cat-necessary': {
        heading: 'Strictement nécessaires',
        htmlText: 'Indispensables au fonctionnement du site. Aucun consentement requis.',
      },
      'cat-functional': {
        heading: 'Fonctionnels',
        htmlText:
          'Permettent des fonctionnalités avancées. Votre consentement est requis selon la DPDPA.',
      },
      'cat-preferences': {
        heading: 'Préférences',
        htmlText: 'Sauvegardent vos paramètres personnels. Consentement requis selon la DPDPA.',
      },
      'cat-analytics': {
        heading: 'Analytiques',
        htmlText:
          "Nous aident à comprendre l'utilisation du site. Consentement requis selon la DPDPA.",
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Permettent la publicité personnalisée. Consentement requis selon la DPDPA.',
      },
    },
  },
}
