import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'opt-in',
  gpcMode: 'honor',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', listenGpc: true, expiry: 395 },
    { id: 'marketing', legalBasis: 'consent', listenGpc: true, expiry: 395 },
    { id: 'functional', legalBasis: 'consent', expiry: 395 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'We use cookies',
    htmlText:
      'We and our partners use cookies and similar technologies to provide you with a better browsing experience, ' +
      'to analyse site traffic, and to personalise content and advertisements. ' +
      'Please give your consent to our use of cookies as described in our ' +
      '<a href="/privacy-policy">Privacy Policy</a>. ' +
      'You may withdraw your consent at any time.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject All', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Your Privacy Preference Has Been Detected',
    htmlText:
      'Your browser or device has sent a Global Privacy Control (GPC) signal indicating you prefer ' +
      'to limit the sale or sharing of your personal data. As required under applicable law, ' +
      'we have applied your preference. You can review or update your choices at any time.',
    buttons: [
      { text: 'Manage Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Privacy Preferences',
    subheading: 'Manage your cookie preferences below. Strictly necessary cookies cannot be disabled.',
    htmlText:
      'We use different types of cookies to optimise your experience on our website. ' +
      'You can choose which categories to allow. Your choices are saved for the duration indicated ' +
      'for each category and can be changed at any time.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are essential for the website to function and cannot be disabled. ' +
          'They are set in response to actions you take such as logging in, filling in forms, or ' +
          'setting privacy preferences. They do not store personally identifiable information.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional',
        htmlText:
          'These cookies enable enhanced functionality and personalisation, such as remembering ' +
          'your language preference or region. They may be set by us or by third-party providers ' +
          'whose services we have added to our pages.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'These cookies help us understand how visitors interact with our site by collecting and ' +
          'reporting information anonymously. This data helps us improve our content and navigation. ' +
          'No personally identifiable information is collected.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Marketing',
        htmlText:
          'These cookies track your online activity to help advertisers deliver more relevant ' +
          'advertising to you, or to limit how many times you see an advertisement. They may be ' +
          'shared with other organisations or advertisers. Declining these cookies will not reduce ' +
          'the number of advertisements you see.',
        cookies: ['marketing'],
      },
    ],
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject All', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Save My Choices', style: 'text', action: 'submit' },
    ],
  },
}

export default profile
