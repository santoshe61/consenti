import type { EmbeddedProfile } from '../types'

// India DPDPA: no legitimate_interest — all non-necessary cookies require consent.
export const OPT_IN_DPDPA_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'opt-in-dpdpa',
  gpcMode: 'ignore',
  defaultLocale: 'en',
  expiryDays: 365,
  cookies: {
    security_storage: { purpose: 'necessary', listenGpc: false },
    functionality_storage: { purpose: 'functional', listenGpc: false },
    personalization_storage: { purpose: 'preferences', listenGpc: false },
    analytics_storage: { purpose: 'analytics', listenGpc: false },
    ad_storage: { purpose: 'marketing', listenGpc: false },
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'Data Protection Notice',
        htmlText:
          "We are the Data Fiduciary under India's Digital Personal Data Protection Act (DPDPA). Your explicit consent is required before we process your personal data using non-essential cookies. You may withdraw consent at any time without affecting prior processing.",
        buttons: {
          'consent-all': { text: 'I Consent', style: 'primary', action: 'submit', cookies: '*' },
          'deny-all': {
            text: 'I Do Not Consent',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'review-choices': { text: 'Review Choices', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Consent Preferences',
        subheading:
          'Review the purposes for which we process your personal data and provide or withdraw consent for each.',
        htmlText:
          'Under the Digital Personal Data Protection Act (DPDPA) 2023, you have the right to give, manage, and withdraw consent for personal data processing. Legitimate interest is not a valid legal basis under the DPDPA — all data processing requires your explicit consent.',
        buttons: {
          'consent-all': {
            text: 'Give Consent to All',
            style: 'primary',
            action: 'submit',
            cookies: '*',
          },
          'withdraw-all': {
            text: 'Withdraw All Consent',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'save-choices': { text: 'Save Choices', style: 'secondary', action: 'submit' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            htmlText:
              'Required to deliver the core service. No personal data is shared and consent is not required for these.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functional',
            htmlText:
              'Enable enhanced features and personalisation. Your explicit consent is required under the DPDPA before we process data for these purposes.',
            legalBasis: 'consent',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText:
              'Help us understand how you interact with the site. Your consent is required before any analytics data is collected.',
            legalBasis: 'consent',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Marketing & Advertising',
            htmlText:
              'Allow personalised advertising based on your browsing activity. Requires your explicit consent under the DPDPA.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
        },
      },
    },
  },
}
