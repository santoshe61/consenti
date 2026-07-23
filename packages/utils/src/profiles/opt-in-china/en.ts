import type { EmbeddedProfile } from '../types'

// China PIPL + DSL + CSL: strict opt-in. LI is very narrowly scoped; all
// non-essential processing should use consent as the legal basis.
export const OPT_IN_CHINA_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'opt-in-china',
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
        heading: 'Personal Information Processing Notice',
        htmlText:
          "In accordance with China's Personal Information Protection Law (PIPL), Data Security Law (DSL), and Cybersecurity Law (CSL), we process personal information only for specified, explicit, and legitimate purposes with minimum data collection. Your consent is required for non-essential cookies.",
        buttons: {
          'agree-all': { text: 'Agree to All', style: 'primary', action: 'submit', cookies: '*' },
          'reject-non-necessary': {
            text: 'Reject Non-Necessary',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'manage-preferences': { text: 'Manage Preferences', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Personal Information Processing Settings',
        subheading:
          'Review the purpose and scope of each category of personal information processing.',
        htmlText:
          'Under the PIPL, you have the right to know, decide, and restrict the processing of your personal information. Processing is limited to the stated purposes. Cross-border transfers of your data, if any, are handled in accordance with Chapter III of the PIPL, including security assessments or standard contracts where applicable.',
        buttons: {
          'agree-all': { text: 'Agree to All', style: 'primary', action: 'submit', cookies: '*' },
          'disagree-all': {
            text: 'Disagree to All',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'confirm-settings': { text: 'Confirm Settings', style: 'primary', action: 'submit' },
        },
        categories: {
          necessary: {
            heading: 'Necessary for Service',
            htmlText:
              'Required to deliver the core service and ensure network security under the CSL. Cannot be disabled.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functionality & Personalisation',
            htmlText:
              'Enable enhanced features. Personal information is processed only for the stated purposes and retained for no longer than necessary.',
            legalBasis: 'consent',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Statistical Analysis',
            htmlText:
              'Collect and analyse usage data to improve the service. Data is processed within China unless cross-border transfer requirements are satisfied.',
            legalBasis: 'consent',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Targeted Advertising',
            htmlText:
              'Personalise advertisements based on your interactions. Requires explicit consent under PIPL. You may withdraw consent and object to personalised advertising at any time.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
        },
      },
    },
  },
}
