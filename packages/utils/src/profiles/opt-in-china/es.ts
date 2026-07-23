import type { LocaleTextContent } from '../types'

export const OPT_IN_CHINA_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Aviso de tratamiento de información personal',
    htmlText:
      'De conformidad con la Ley de Protección de Información Personal (PIPL), debemos informarle antes de tratar sus datos. Solo procesamos datos con fines específicos y con su consentimiento.',
    buttons: {
      'agree-all': 'Aceptar',
      'reject-non-necessary': 'Rechazar',
      'manage-preferences': 'Configuración',
    },
  },
  preferenceModal: {
    heading: 'Configuración de privacidad (PIPL)',
    subheading: 'Elija qué tratamientos de datos acepta.',
    buttons: {
      'agree-all': 'Aceptar',
      'disagree-all': 'Rechazar',
      'confirm-settings': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText: 'Imprescindibles para el sitio. Finalidad: seguridad y funcionalidad básica.',
      },
      'cat-functional': {
        heading: 'Funcionales',
        htmlText:
          'Finalidad: mejorar la experiencia del usuario. Se requiere consentimiento según la PIPL.',
      },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText:
          'Finalidad: guardar configuración personalizada. Se requiere consentimiento según la PIPL.',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText:
          'Finalidad: estadísticas de uso del sitio. Se requiere consentimiento según la PIPL.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Finalidad: publicidad personalizada. Se requiere consentimiento según la PIPL.',
      },
    },
  },
}
