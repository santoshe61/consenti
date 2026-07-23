import type { LocaleTextContent } from '../types'

export const NOTICE_ONLY_FR: LocaleTextContent = {
  mainBanner: {
    heading: 'Ce site utilise uniquement des cookies essentiels',
    htmlText:
      "Nous n'utilisons que des cookies techniquement nécessaires au bon fonctionnement du site. Aucun cookie de marketing ou d'analyse n'est utilisé.",
    buttons: {
      ok: 'OK',
    },
  },
  preferenceModal: {
    heading: 'Informations sur les cookies',
    buttons: {
      close: 'Fermer',
    },
    categories: {
      'cat-necessary': {
        heading: 'Cookies nécessaires',
        htmlText:
          'Cookies techniquement nécessaires au bon fonctionnement du site. Ils ne peuvent pas être désactivés.',
      },
    },
  },
}
