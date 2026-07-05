import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'notice-only',
  gpcMode: 'ignore',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'legitimate_interest', expiry: 365 },
    { id: 'functional', legalBasis: 'legitimate_interest', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'Cookie Notice',
    htmlText:
      'This website uses cookies and similar technologies to ensure it works correctly and to ' +
      'improve your experience. By continuing to browse this site, you acknowledge the use of ' +
      'these technologies. For more information, please read our ' +
      '<a href="/privacy-policy">Privacy Policy</a> and <a href="/cookie-policy">Cookie Policy</a>.',
    buttons: [
      { text: 'Got It', style: 'primary', action: 'submit' },
      { text: 'Learn More', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Cookie Notice',
    htmlText:
      'This site uses cookies necessary for its operation and for improving your experience. ' +
      'No consent is required in this jurisdiction. ' +
      'See our <a href="/privacy-policy">Privacy Policy</a> for details.',
    buttons: [
      { text: 'Acknowledge', style: 'primary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Cookie Information',
    subheading: 'This notice explains how and why we use cookies on this website.',
    htmlText:
      'This website uses cookies to function correctly and to improve your experience. ' +
      'In the jurisdiction where you are located, explicit consent for cookies may not be required. ' +
      'However, we believe in transparency and provide this information so you understand how we ' +
      'use cookies. Some cookies are strictly necessary for the site to work.',
    showClose: true,
    overlayOpacity: 40,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are required for the website to function correctly. Without these cookies, ' +
          'some parts of the website will not work as intended. They cannot be disabled.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional and Analytics',
        htmlText:
          'These cookies help us deliver a better experience by remembering your preferences ' +
          'and measuring how the site is used. They are used under a legitimate interest basis ' +
          'and do not require your consent in this jurisdiction.',
        type: 'legitimate_interest',
        legitimateInterest: {
          enabled: true,
          description:
            'We use functional and analytics cookies under a legitimate interest basis to ' +
            'improve our service and to understand how users interact with our website. ' +
            'This data is anonymised and does not identify you personally.',
        },
        cookies: ['functional', 'analytics'],
      },
    ],
    buttons: [
      { text: 'Acknowledge', style: 'primary', action: 'submit' },
      { text: 'Close', style: 'text', action: 'close' },
    ],
  },
}

export default profile
