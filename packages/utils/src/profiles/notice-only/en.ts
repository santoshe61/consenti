import type { EmbeddedProfile } from '../types'

// Notice Only: jurisdictions with no dedicated cookie banner law.
// A simple notice informing the user is sufficient. Only essential cookies are used.
export const NOTICE_ONLY_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'notice-only',
  gpcMode: 'ignore',
  defaultLocale: 'en',
  expiryDays: 365,
  cookies: {
    security_storage: { purpose: 'necessary', listenGpc: false },
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'This site uses essential cookies only',
        htmlText:
          'We use strictly necessary cookies to ensure this website functions correctly. No tracking, advertising, or analytics cookies are used. No specific cookie consent law applies in your jurisdiction.',
        buttons: {
          ok: { text: 'OK', style: 'primary', action: 'close' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Cookie Information',
        subheading: 'We only use cookies that are strictly necessary for this site to work.',
        htmlText:
          'This site does not use optional cookies. The only cookie set is required to maintain basic security and session integrity. You cannot disable it without affecting site functionality.',
        buttons: {
          close: { text: 'Close', style: 'primary', action: 'close' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            htmlText:
              'Required for the site to function. These cookies do not track you and cannot be disabled.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
        },
      },
    },
  },
}
