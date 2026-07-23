import type { LocaleTextContent } from '../types'

export const OPT_IN_ES: LocaleTextContent = {
  mainBanner: {
    heading: 'Valoramos su privacidad',
    htmlText:
      'Utilizamos cookies para mejorar su experiencia de navegación, mostrar anuncios o contenido personalizados y analizar nuestro tráfico. Al hacer clic en <strong>Aceptar todo</strong>, consiente el uso de cookies. Puede cambiar sus preferencias en cualquier momento.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'reject-optional': 'Rechazar todo',
      'manage-preferences': 'Gestionar preferencias',
    },
  },
  gpcBanner: {
    heading: 'Preferencia de privacidad reconocida',
    htmlText:
      'Su navegador ha enviado una señal Global Privacy Control (GPC). Hemos aplicado su preferencia de privacidad.',
    buttons: {
      'accept-all': 'Revisar preferencias',
      'confirm-settings': 'Continuar',
    },
  },
  preferenceModal: {
    heading: 'Preferencias de privacidad',
    subheading: 'Elija qué cookies desea permitir.',
    htmlText:
      'Utilizamos distintos tipos de cookies. Puede activar o desactivar cada categoría. Las cookies necesarias no pueden desactivarse.',
    buttons: {
      'accept-all': 'Aceptar todo',
      'reject-optional': 'Rechazar todo',
      'save-preferences': 'Guardar selección',
    },
    categories: {
      'cat-necessary': {
        heading: 'Estrictamente necesarias',
        htmlText:
          'Estas cookies son imprescindibles para el funcionamiento del sitio web y no pueden desactivarse.',
      },
      'cat-functional': {
        heading: 'Funcionales',
        htmlText: 'Permiten funciones avanzadas como preferencias guardadas y personalización.',
      },
      'cat-preferences': {
        heading: 'Preferencias',
        htmlText: 'Guardan su configuración personal y preferencias para visitas futuras.',
      },
      'cat-analytics': {
        heading: 'Analíticas',
        htmlText: 'Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.',
      },
      'cat-marketing': {
        heading: 'Marketing',
        htmlText: 'Se utilizan para mostrarle publicidad relevante.',
      },
    },
  },
}
