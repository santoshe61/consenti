import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'opt-in-dpdpa',
  gpcMode: 'honor',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'marketing', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'functional', legalBasis: 'consent', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'We Need Your Consent',
    htmlText:
      'In accordance with the Digital Personal Data Protection Act, 2023 (DPDPA) of India, ' +
      'we require your explicit consent before collecting and processing your personal data. ' +
      'You have the right to withdraw consent at any time and to access, correct, or erase your data. ' +
      'Please review our <a href="/privacy-policy">Privacy Policy</a> for details.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject All', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Privacy Preference Detected',
    htmlText:
      'A privacy preference signal was detected from your browser. We have applied your opt-out ' +
      'preference in accordance with applicable privacy regulations. You may review and update ' +
      'your consent choices at any time.',
    buttons: [
      { text: 'Manage Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Consent Preferences — DPDPA',
    subheading:
      'Under the Digital Personal Data Protection Act (DPDPA), you have the right to give, ' +
      'withdraw, or manage your consent for each purpose of data processing. Please select ' +
      'your preferences below.',
    htmlText:
      'As a Data Principal under the DPDPA, you have the right to access, correct, erase, and ' +
      'withdraw consent for your personal data. This notice is provided by the Data Fiduciary ' +
      'as required under Section 5 of the DPDPA. You can update your preferences at any time.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Necessary Processing',
        htmlText:
          'Processing your personal data under this purpose is necessary for the delivery of ' +
          'the service you have requested. This processing is exempt from consent requirements ' +
          'under Section 7(a) of the DPDPA.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional Enhancements',
        htmlText:
          'We process limited personal data to remember your preferences and settings, ' +
          'improving your experience on return visits. Your consent enables this personalisation.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics and Improvement',
        htmlText:
          'With your consent, we collect data about how you use our services in order to ' +
          'improve them. The data is anonymised where possible and is not shared with third parties ' +
          'for commercial purposes.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Marketing and Personalised Advertising',
        htmlText:
          'With your consent, we and our advertising partners process your personal data to ' +
          'deliver advertisements tailored to your interests. You may withdraw this consent ' +
          'at any time without affecting the lawfulness of prior processing.',
        cookies: ['marketing'],
      },
    ],
    buttons: [
      { text: 'Give Consent to All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Withdraw All Consent', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Save My Choices', style: 'text', action: 'submit' },
    ],
  },
}

export default profile
