import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'opt-out',
  gpcMode: 'honor',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'marketing', legalBasis: 'consent', listenGpc: true, expiry: 365, cpraCategory: 'sale' },
    { id: 'functional', legalBasis: 'consent', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'Your Privacy Choices',
    htmlText:
      'We use cookies and similar technologies on this site. Some help us operate the site, ' +
      'while others are used for analytics and advertising purposes. ' +
      'You may opt out of the sale or sharing of your personal information at any time. ' +
      'See our <a href="/privacy-policy">Privacy Policy</a> for more information.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Do Not Sell or Share My Personal Information', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Your Opt-Out Preference Has Been Applied',
    htmlText:
      'We detected a Global Privacy Control (GPC) signal from your browser. ' +
      'In compliance with applicable privacy law, we have opted you out of the sale ' +
      'and sharing of your personal information. You can review or update your preferences below.',
    buttons: [
      { text: 'Manage Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Privacy Preferences',
    subheading:
      'You have the right to opt out of the sale and sharing of your personal information. ' +
      'Toggle the categories below to set your preferences.',
    htmlText:
      'We use different types of cookies and tracking technologies. Strictly necessary cookies ' +
      'are always active. For all other categories, you can choose to opt out at any time.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are required for the website to operate. They include cookies that ' +
          'enable you to log in, use shopping carts, and access secure areas of the website.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional',
        htmlText:
          'These cookies allow the website to remember choices you make (such as your user name, ' +
          'language, or the region you are in) and provide enhanced, more personal features.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'These cookies collect information about how visitors use our website, such as which ' +
          'pages they visit most often. This data helps us improve the site and your experience.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Sale / Sharing of Personal Information',
        htmlText:
          'These cookies and trackers are used to deliver targeted advertising to you, and may ' +
          'constitute a "sale" or "sharing" of personal information under the California Consumer ' +
          'Privacy Act (CCPA). You have the right to opt out of this activity.',
        cookies: ['marketing'],
      },
    ],
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Opt Out of Sale/Sharing', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Save My Choices', style: 'text', action: 'submit' },
    ],
  },
}

export default profile
