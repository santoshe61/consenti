import type { EmbeddedProfile } from '../types'

// EU GDPR + ePrivacy Directive: Art. 5(3) ePrivacy requires consent for any
// non-strictly-necessary cookie storage regardless of GDPR Art. 6 legal basis,
// so functional/preference cookies use consent, not legitimate_interest.
export const OPT_IN_EN_PROFILE: EmbeddedProfile = {
  complianceGroup: 'opt-in',
  gpcMode: 'ignore',
  defaultLocale: 'en',
  expiryDays: 365,
  cookies: {
    security_storage: { purpose: 'necessary', listenGpc: false },
    functionality_storage: { purpose: 'functional', listenGpc: false },
    personalization_storage: { purpose: 'preferences', listenGpc: false },
    analytics_storage: { purpose: 'analytics', listenGpc: true },
    ad_storage: { purpose: 'marketing', listenGpc: true, cpraCategory: 'sharing' },
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'We value your privacy',
        htmlText:
          'We use cookies and similar technologies to enhance your browsing experience, analyse site traffic, and show you personalised content. Non-essential cookies require your consent under the GDPR and ePrivacy Directive.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'reject-optional': {
            text: 'Reject Optional',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'manage-preferences': { text: 'Manage Preferences', style: 'text', action: 'manage' },
        },
      },
      gpcBanner: {
        position: 'bottom',
        heading: 'Global Privacy Control detected',
        htmlText:
          'Your browser is sending a Global Privacy Control signal. We have applied your preference and will not set non-essential cookies unless you change your settings below.',
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          'confirm-settings': {
            text: 'Confirm Settings',
            style: 'secondary',
            action: 'submit',
            cookies: '!',
          },
          'manage-preferences': { text: 'Manage Preferences', style: 'text', action: 'manage' },
        },
      },
      preferenceModal: {
        position: 'right',
        heading: 'Privacy Preferences',
        subheading: 'Manage your consent settings for each category below.',
        htmlText:
          'You can choose which cookie categories you allow. Your choices apply to this site only. Essential cookies cannot be disabled as they are required for the site to function correctly.',
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
              'These cookies are required for the website to function and cannot be disabled. They are usually set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms.',
            legalBasis: 'mandatory',
            cookies: ['security_storage'],
          },
          functional: {
            heading: 'Functional',
            htmlText:
              'These cookies enable enhanced functionality and personalisation. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, some or all of these features may not function properly.',
            legalBasis: 'consent',
            cookies: ['functionality_storage', 'personalization_storage'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText:
              'These cookies allow us to count visits and traffic sources so we can measure and improve site performance. They help us understand which pages are most and least popular. All information collected is aggregated and therefore anonymous.',
            legalBasis: 'consent',
            cookies: ['analytics_storage'],
          },
          marketing: {
            heading: 'Marketing',
            htmlText:
              'These cookies may be set through our site by advertising partners to build a profile of your interests and show you relevant adverts on other sites. They do not store personal information directly but identify your browser and device uniquely.',
            legalBasis: 'consent',
            cookies: ['ad_storage'],
          },
        },
      },
    },
  },
}
