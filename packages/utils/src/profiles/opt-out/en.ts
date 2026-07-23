import type { EmbeddedProfile } from '../types'

export const OPT_OUT_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'opt-out',
  gpcMode: 'honor',
  defaultLocale: 'en',
  expiryDays: 365,
  cookies: {
    security_storage: { purpose: 'necessary', listenGpc: false },
    functionality_storage: { purpose: 'functional', listenGpc: true },
    personalization_storage: { purpose: 'preferences', listenGpc: true },
    analytics_storage: { purpose: 'analytics', listenGpc: true },
    ad_storage: { purpose: 'marketing', listenGpc: true, cpraCategory: 'sharing' },
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'We use cookies',
        htmlText:
          'We and our partners use cookies and similar tracking technologies to improve your experience, analyse site usage, and show relevant advertising. You may opt out of the sale or sharing of your personal data at any time.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'do-not-sell-share': {
            text: 'Do Not Sell or Share My Personal Information',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'manage-preferences': { text: 'Manage Preferences', style: 'text', action: 'manage' },
        },
      },
      gpcBanner: {
        position: 'bottom',
        heading: 'Your opt-out has been applied',
        htmlText:
          'Your browser sent a Global Privacy Control signal. We have automatically opted you out of the sale and sharing of your personal data as required by applicable US state privacy laws.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'confirm-opt-out': {
            text: 'Confirm Opt-Out',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'manage-preferences': { text: 'Manage Preferences', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Cookie Preferences',
        subheading:
          'Manage your data preferences. You may opt out of non-essential uses at any time.',
        htmlText:
          'Under applicable US state privacy laws, you have the right to opt out of the sale and sharing of your personal data. Toggle the categories below to exercise your rights.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'opt-out-all': {
            text: 'Opt Out of All',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'save-choices': { text: 'Save My Choices', style: 'primary', action: 'submit' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            htmlText:
              'These cookies are required for the website to operate and cannot be disabled. They do not involve the sale or sharing of personal data.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functional',
            htmlText:
              'These cookies improve the functionality of the site. Disabling them may affect how the site operates. You may opt out at any time.',
            legalBasis: 'consent',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText:
              'Analytics cookies help us understand how visitors interact with the site. Opting out prevents your data from being included in usage statistics.',
            legalBasis: 'consent',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Sale / Sharing of Personal Data',
            htmlText:
              'These cookies involve the sale or sharing of your personal data with advertising partners for targeted advertising. You have the right to opt out of this under applicable US state privacy laws.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
        },
      },
    },
  },
}
