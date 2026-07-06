import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'opt-in-china',
  gpcMode: 'ignore',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', expiry: 365 },
    { id: 'marketing', legalBasis: 'consent', expiry: 365 },
    { id: 'functional', legalBasis: 'consent', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'Personal Information Processing Notice',
    htmlText:
      'In accordance with the Personal Information Protection Law of the People\'s Republic of ' +
      'China (PIPL), we hereby inform you of the types of personal information we collect, ' +
      'the purposes for which it is used, and your rights as a personal information subject. ' +
      'Your consent is required before we may process your personal information beyond what is ' +
      'strictly necessary. Please read our <a href="/privacy-policy">Privacy Policy</a> carefully.',
    buttons: [
      { text: 'Agree to All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject Non-Necessary', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Privacy Notice',
    htmlText:
      'We have detected a privacy preference signal. We have applied your preferences for ' +
      'the processing of your personal information. You may review and update your choices at any time.',
    buttons: [
      { text: 'Manage Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Personal Information Processing Preferences',
    subheading:
      'Under the PIPL, you have the right to know, decide, access, copy, correct, delete, and ' +
      'withdraw consent for the processing of your personal information. Please select your preferences.',
    htmlText:
      'We process personal information lawfully, legitimately, and necessarily in accordance ' +
      'with the PIPL. Your personal information is stored and processed within the territory of ' +
      'China. Cross-border transfer of your data, if any, is handled in accordance with Chapter III ' +
      'of the PIPL. You may withdraw your consent at any time by updating these settings.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'Processing under this purpose is required for the normal functioning of our services ' +
          'as requested by you. This is processed under the legitimate basis of contract ' +
          'performance and legal obligation under the PIPL.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional',
        htmlText:
          'These cookies allow us to remember your preferences and settings to provide you with ' +
          'an enhanced experience. Your consent allows us to personalise our service for you.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Statistical Analysis',
        htmlText:
          'With your consent, we collect usage data to analyse how our services are used, ' +
          'enabling us to improve performance and user experience. Data is anonymised where possible.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Marketing and Commercial Purposes',
        htmlText:
          'With your consent, we use your personal information to deliver personalised ' +
          'commercial information and advertisements. You may withdraw this consent at any time.',
        cookies: ['marketing'],
      },
    ],
    buttons: [
      { text: 'Agree and Continue', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Only Necessary', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Save My Choices', style: 'text', action: 'submit' },
    ],
  },
}

export default profile
