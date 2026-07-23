import type { LocaleTextContent } from '../types'

export const OPT_IN_BRAZIL_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Valoramos su privacidad',
    htmlText:
      'De acuerdo con la Ley General de Protección de Datos (LGPD) de Brasil, tratamos sus datos personales con su consentimiento o con base en interés legítimo cuando corresponda. Puede cambiar sus preferencias en cualquier momento.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'reject-optional': 'Rechazar todo',
      manage: 'Gestionar',
    },
  },
  preferenceModal: {
    heading: 'Configuración de privacidad (LGPD)',
    subheading: 'Elija sus opciones de privacidad.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'reject-optional': 'Rechazar todo',
      'save-preferences': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText: 'Imprescindibles para el funcionamiento del sitio.',
      },
      'cat-functional': {
        heading: 'Funcionales',
        htmlText: 'Permiten funciones avanzadas. Base legal: interés legítimo (LGPD Art. 10).',
      },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText: 'Guardan su configuración. Base legal: interés legítimo (LGPD Art. 10).',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText:
          'Nos ayudan a comprender el uso del sitio. Se requiere consentimiento según la LGPD.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Permiten publicidad personalizada. Se requiere consentimiento según la LGPD.',
      },
    },
  },
}
