import type { LocaleTextContent } from '../types'

export const OPT_IN_DPDPA_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Aviso de protección de datos',
    htmlText:
      'Somos el Fiduciario de Datos según la Ley de Protección de Datos Digitales Personales (DPDPA) de India. Su consentimiento es necesario antes de que procesemos sus datos personales.',
    buttons: {
      'consent-all': 'Doy mi consentimiento',
      'deny-all': 'No doy mi consentimiento',
      'review-choices': 'Revisar opciones',
    },
  },
  preferenceModal: {
    heading: 'Configuración de privacidad (DPDPA)',
    subheading: 'Elija en qué procesamientos desea dar su consentimiento.',
    buttons: {
      'consent-all': 'Doy mi consentimiento',
      'withdraw-all': 'No doy mi consentimiento',
      'save-choices': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText: 'Imprescindibles para el funcionamiento del sitio. No requieren consentimiento.',
      },
      'cat-functional': {
        heading: 'Funcionales',
        htmlText: 'Permiten funciones avanzadas. Su consentimiento es requerido según la DPDPA.',
      },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText: 'Guardan su configuración personal. Se requiere consentimiento según la DPDPA.',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText:
          'Nos ayudan a entender el uso del sitio. Se requiere consentimiento según la DPDPA.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Permiten publicidad personalizada. Se requiere consentimiento según la DPDPA.',
      },
    },
  },
}
