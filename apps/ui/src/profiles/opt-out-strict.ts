import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'opt-out-strict',
  gpcMode: 'strict',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    {
      id: 'marketing',
      legalBasis: 'consent',
      listenGpc: true,
      expiry: 365,
      cpraCategory: 'sale',
    },
    {
      id: 'sensitive',
      legalBasis: 'consent',
      listenGpc: true,
      expiry: 365,
      cpraCategory: 'sensitive',
    },
    { id: 'functional', legalBasis: 'consent', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'Your Privacy Rights (CPRA)',
    htmlText:
      'Under the California Privacy Rights Act (CPRA), you have the right to opt out of the ' +
      'sale, sharing, and use of your sensitive personal information. ' +
      'We also honor Global Privacy Control (GPC) signals automatically. ' +
      'See our <a href="/privacy-policy">Privacy Policy</a> and ' +
      '<a href="/do-not-sell">Do Not Sell or Share My Personal Information</a> page.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Opt Out of Sale, Sharing & Sensitive Use', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'GPC Signal Detected — Opt-Out Applied',
    htmlText:
      'A Global Privacy Control (GPC) opt-out signal was detected. As required by CPRA, ' +
      'we have automatically applied your opt-out of the sale and sharing of your personal ' +
      'information and the use of your sensitive personal information. ' +
      'Your preference has been saved.',
    buttons: [
      { text: 'Manage Preferences', style: 'primary', action: 'manage' },
      { text: 'Acknowledge', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Privacy Preferences (CPRA)',
    subheading:
      'Manage your privacy choices. You may opt out of the sale, sharing, and sensitive use ' +
      'of your personal information at any time.',
    htmlText:
      'The California Privacy Rights Act (CPRA) provides you with additional rights over your ' +
      'personal information. GPC signals are honored automatically. You can update your choices below.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are essential for the website to function and are always active. ' +
          'They are exempt from CPRA opt-out requirements.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional',
        htmlText:
          'These cookies personalise your experience (e.g. language, region preferences). ' +
          'They do not involve the sale or sharing of personal information.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'These cookies measure site performance and visitor behaviour. Data is used internally ' +
          'to improve our services. Opting out stops this collection.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Sale and Sharing of Personal Information',
        htmlText:
          'These technologies may constitute a "sale" or "sharing" of your personal information ' +
          'under CPRA, including cross-context behavioural advertising. ' +
          'You have the right to opt out.',
        cookies: ['marketing'],
      },
      {
        id: 'cat-sensitive',
        heading: 'Use of Sensitive Personal Information',
        htmlText:
          'Some technologies may use sensitive personal information as defined by CPRA ' +
          '(e.g. precise geolocation, health data). You have the right to limit such use.',
        cookies: ['sensitive'],
      },
    ],
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Opt Out of All Non-Necessary', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Save My Choices', style: 'text', action: 'submit' },
    ],
  },
}

export default profile
