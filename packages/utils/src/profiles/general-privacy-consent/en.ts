import type { EmbeddedProfile } from '../types.js'

// General Privacy Consent: jurisdictions with privacy laws that do not mandate
// a GDPR-style cookie banner but where documenting legal basis is best practice.
export const GENERAL_PRIVACY_CONSENT_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'general-privacy-consent',
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
        heading: 'We use cookies',
        htmlText:
          'We use cookies to improve your browsing experience, analyse site traffic, and show you relevant content. By continuing to use this site, you accept our use of cookies. You can manage your preferences at any time.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
          'reject-marketing': {
            text: 'Reject Marketing',
            style: 'secondary',
            action: 'custom',
            cookies: [
              'security_storage',
              'functionality_storage',
              'personalization_storage',
              'analytics_storage',
            ],
          },
          'manage-preferences': { text: 'Manage Preferences', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Cookie Settings',
        subheading: 'We document the legal basis for each category of cookie we use.',
        htmlText:
          'A privacy notice or consent framework applies in your jurisdiction. While a strict cookie consent banner may not be legally required, we document our legal basis for processing to follow privacy best practices.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
          'necessary-only': {
            text: 'Necessary Only',
            style: 'secondary',
            action: 'custom',
            cookies: '!',
          },
          'save-preferences': { text: 'Save My Settings', style: 'primary', action: 'submit' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            htmlText:
              'Required to deliver the service. No optional data processing takes place. Cannot be disabled.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functional',
            htmlText:
              'Improve how the site works and remember your preferences. Legal basis: legitimate interest.',
            legalBasis: 'legitimate_interest',
            legitimateInterestDescription:
              'Remembering a visitor\'s in-session preferences (e.g. layout, saved settings) is a low-privacy-impact processing activity that a visitor would reasonably expect from using the site, and is necessary to deliver the functionality they engaged with — our interest in providing it is not overridden by the visitor\'s privacy interest, since no data leaves the site and nothing is used for profiling or advertising.',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText:
              'Help us understand usage patterns to improve the site. Legal basis: legitimate interest. Data is aggregated and anonymised where possible.',
            legalBasis: 'legitimate_interest',
            legitimateInterestDescription:
              'Measuring aggregate, anonymised site usage to improve performance and content is a reasonable, low-risk business interest that does not identify individual visitors or feed advertising/profiling, and is proportionate to the minimal impact on visitor privacy.',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Marketing',
            htmlText:
              'Personalise advertising and measure campaign reach. Legal basis: your consent. You may withdraw consent at any time.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
        },
      },
    },
  },
}
