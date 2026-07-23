import type { LocaleTextContent } from '../types'

export const OPT_OUT_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Utilizamos cookies',
    htmlText:
      'Utilizamos cookies para mejorar nuestros servicios. Puede oponerse a la venta o al intercambio de sus datos personales en cualquier momento.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'do-not-sell-share': 'No vender ni compartir',
      'manage-preferences': 'Gestionar preferencias',
    },
  },
  gpcBanner: {
    heading: 'GPC detectado – exclusión aplicada',
    htmlText:
      'Su navegador ha enviado una señal Global Privacy Control. Le hemos excluido de la venta y el intercambio de sus datos.',
    buttons: {
      'accept-all': 'Revisar preferencias',
      'confirm-opt-out': 'Continuar',
    },
  },
  preferenceModal: {
    heading: 'Preferencias de privacidad',
    subheading: 'Elija sus opciones de privacidad.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'opt-out-all': 'No vender ni compartir',
      'save-choices': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText: 'Imprescindibles para el funcionamiento del sitio web.',
      },
      'cat-functional': {
        heading: 'Funcionales',
        htmlText: 'Permiten funciones avanzadas y personalización.',
      },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText: 'Guardan su configuración para visitas futuras.',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText: 'Nos ayudan a entender cómo los visitantes utilizan nuestro sitio.',
      },
      'cat-marketing': {
        heading: 'Publicidad / Venta',
        htmlText: 'Permiten publicidad dirigida. Puede oponerse a la venta de sus datos.',
      },
    },
  },
}
