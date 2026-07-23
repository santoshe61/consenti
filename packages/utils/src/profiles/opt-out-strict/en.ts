import type { EmbeddedProfile } from '../types'

// California CPRA: gpcMode 'honor' applies GPC opt-out silently on detection
// (no banner) per CPRA's requirement to honor GPC as a valid opt-out request
// without added friction. Sensitive personal information gets its own
// cpraCategory:'sensitive' cookie/category per 11 CCR §7027's "Limit the Use
// of My Sensitive Personal Information" requirement, distinct from sale/share.
export const OPT_OUT_STRICT_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'opt-out-strict',
  gpcMode: 'honor',
  defaultLocale: 'en',
  expiryDays: 365,
  cookies: {
    security_storage: { purpose: 'necessary', listenGpc: false },
    functionality_storage: { purpose: 'functional', listenGpc: true },
    personalization_storage: { purpose: 'preferences', listenGpc: true },
    analytics_storage: { purpose: 'analytics', listenGpc: true, cpraCategory: 'sharing' },
    ad_storage: { purpose: 'marketing', listenGpc: true, cpraCategory: 'sharing' },
    sensitive_info_storage: { purpose: 'marketing', listenGpc: true, cpraCategory: 'sensitive' },
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'Your California Privacy Rights',
        htmlText:
          'Under the California Privacy Rights Act (CPRA), you have the right to opt out of the sale, sharing, and use of sensitive personal information. We use cookies and tracking technologies that may involve the sale or sharing of your data with third parties.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'opt-out-sale-sharing-sensitive': {
            text: 'Opt Out of Sale, Sharing & Sensitive Use',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          manage: { text: 'Manage', style: 'text', action: 'manage' },
        },
      },
      gpcBanner: {
        position: 'bottom',
        heading: 'GPC opt-out applied automatically',
        htmlText:
          'Your browser sent a Global Privacy Control signal. Under the CPRA, we are required to honor this as a Do Not Sell or Share My Personal Information request. Your opt-out has been applied automatically.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'confirm-opt-out': {
            text: 'Confirm Opt-Out',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'review-choices': { text: 'Review Choices', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Privacy Rights Center',
        subheading:
          'Manage your CPRA rights: opt out of sale, sharing, and limit the use of sensitive personal information.',
        htmlText:
          'As a California resident, you have the right under CPRA to opt out of the sale and sharing of your personal information, including for cross-context behavioral advertising, and to limit the use of your sensitive personal information. Toggle each category below to exercise your rights.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'opt-out-sale-sharing-sensitive': {
            text: 'Opt Out of Sale, Sharing & Sensitive Use',
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
              'Essential to deliver the service. These cookies are not sold or shared and cannot be disabled.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functional & Personalisation',
            htmlText:
              'Improve site functionality and remember your preferences. May involve sharing of browsing data.',
            legalBasis: 'consent',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Analytics (Sharing)',
            htmlText:
              'Measure site performance. Analytics data may be shared with third-party providers, which constitutes "sharing" under CPRA.',
            legalBasis: 'consent',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Sale & Sharing of Personal Data',
            htmlText:
              'Advertising and retargeting cookies that involve the sale or sharing of your personal data with third-party advertisers for cross-context behavioural advertising.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
          sensitive: {
            heading: 'Sensitive Personal Information',
            htmlText:
              'Some technologies may use sensitive personal information as defined by CPRA (e.g. precise geolocation, health data). You have the right to limit such use.',
            legalBasis: 'consent',
            cookies: ['sensitive_info_storage'],
          },
        },
      },
    },
  },
}
