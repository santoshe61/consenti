import type { LocaleTextContent } from '../types'

export const OPT_OUT_STRICT_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Derechos de privacidad en California',
    htmlText:
      'De acuerdo con la Ley de Derechos de Privacidad de California (CPRA), tiene derecho a oponerse a la venta, el intercambio y el uso de sus datos personales.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'opt-out-sale-sharing-sensitive': 'No vender ni compartir mis datos',
      manage: 'Gestionar preferencias',
    },
  },
  gpcBanner: {
    heading: 'GPC detectado – exclusión CPRA aplicada',
    htmlText:
      'Se ha detectado su señal Global Privacy Control. Su derecho de exclusión según la CPRA se ha aplicado automáticamente.',
    buttons: {
      'accept-all': 'Revisar preferencias',
      'confirm-opt-out': 'Continuar',
    },
  },
  preferenceModal: {
    heading: 'Configuración de privacidad (CPRA)',
    subheading: 'Administre sus derechos de privacidad.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'opt-out-sale-sharing-sensitive': 'No vender ni compartir mis datos',
      'save-choices': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText: 'Imprescindibles para el funcionamiento del sitio.',
      },
      'cat-functional': { heading: 'Funcionales', htmlText: 'Permiten funciones avanzadas.' },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText: 'Guardan su configuración personal.',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText: 'Nos ayudan a entender el uso del sitio.',
      },
      'cat-marketing': {
        heading: 'Venta / Intercambio (CPRA)',
        htmlText: 'Venta e intercambio de datos personales según la CPRA. Puede oponerse.',
      },
    },
  },
}
