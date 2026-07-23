import type { LocaleTextContent } from '../types'

export const GENERAL_PRIVACY_CONSENT_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Usamos cookies',
    htmlText:
      'Utilizamos cookies y tecnologías similares para ofrecer y mejorar nuestros servicios. Las cookies de marketing requieren su consentimiento. Las demás se basan en interés legítimo.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'reject-marketing': 'Rechazar marketing',
      'manage-preferences': 'Gestionar preferencias',
    },
  },
  preferenceModal: {
    heading: 'Configuración de privacidad',
    subheading: 'Elija sus preferencias de cookies.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'necessary-only': 'Rechazar marketing',
      'save-preferences': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText: 'Imprescindibles para el funcionamiento del sitio.',
      },
      'cat-functional': {
        heading: 'Funcionales',
        htmlText: 'Permiten funciones avanzadas. Base legal: interés legítimo.',
      },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText: 'Guardan su configuración personal. Base legal: interés legítimo.',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText: 'Nos ayudan a entender el uso del sitio. Base legal: interés legítimo.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Permiten publicidad personalizada. Se requiere su consentimiento.',
      },
    },
  },
}
