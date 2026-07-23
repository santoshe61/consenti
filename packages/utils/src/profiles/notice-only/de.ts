import type { LocaleTextContent } from '../types'

export const NOTICE_ONLY_DE: LocaleTextContent = {
  mainBanner: {
    heading: 'Diese Website verwendet nur notwendige Cookies',
    htmlText:
      'Wir verwenden ausschließlich technisch notwendige Cookies, die für den Betrieb der Website erforderlich sind. Es werden keine Marketing- oder Analyse-Cookies eingesetzt.',
    buttons: {
      ok: 'OK',
    },
  },
  preferenceModal: {
    heading: 'Cookie-Informationen',
    buttons: {
      close: 'Schließen',
    },
    categories: {
      'cat-necessary': {
        heading: 'Notwendige Cookies',
        htmlText:
          'Technisch notwendige Cookies, die für den ordnungsgemäßen Betrieb der Website erforderlich sind. Sie können nicht deaktiviert werden.',
      },
    },
  },
}
