import type { EmbeddedProfile } from '../types'

// Brazil LGPD: opt-in consent required. Legitimate interest is a valid legal
// basis (one of ten under LGPD) and is appropriate for functional/preference cookies.
export const OPT_IN_BRAZIL_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'opt-in-brazil',
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
        heading: 'We value your privacy',
        htmlText:
          "In accordance with Brazil's Lei Geral de Proteção de Dados (LGPD), we process personal data only with a valid legal basis. Non-essential cookies require your prior consent. You may withdraw consent at any time. Legitimate interest applies where noted.",
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'reject-optional': {
            text: 'Reject Optional',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          manage: { text: 'Manage', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Privacy Preferences',
        subheading: 'Review and manage your data processing preferences under the LGPD.',
        htmlText:
          'You have rights under the LGPD including: access, correction, deletion, portability, and withdrawal of consent. Categories based on legitimate interest are indicated below — you may object to these at any time.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'reject-optional': {
            text: 'Reject Optional',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'save-preferences': { text: 'Save My Preferences', style: 'primary', action: 'submit' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            htmlText:
              'Essential for the service to function. Legal basis: fulfillment of a contract or legal obligation. Cannot be disabled.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functional',
            htmlText:
              'Enhance site functionality and remember your settings. Legal basis: legitimate interest (LGPD Art. 7, X). You may object to this processing at any time.',
            legalBasis: 'legitimate_interest',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText:
              'Help us understand how visitors use the site so we can improve it. Legal basis: your consent.',
            legalBasis: 'consent',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Marketing & Advertising',
            htmlText:
              'Personalise ads and measure campaign effectiveness. Legal basis: your consent. You may withdraw consent at any time without affecting the lawfulness of prior processing.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
        },
      },
    },
  },
}
