import type { LocaleTextContent } from '../types'

export const NOTICE_ONLY_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Este sitio solo usa cookies esenciales',
    htmlText:
      'Únicamente utilizamos cookies técnicamente necesarias para el funcionamiento del sitio. No utilizamos cookies de marketing ni analíticas.',
    buttons: {
      ok: 'Aceptar',
    },
  },
  preferenceModal: {
    heading: 'Información sobre cookies',
    buttons: {
      close: 'Cerrar',
    },
    categories: {
      'cat-necessary': {
        heading: 'Cookies necesarias',
        htmlText:
          'Cookies técnicamente necesarias para el correcto funcionamiento del sitio. No pueden desactivarse.',
      },
    },
  },
}
