import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'general-privacy-consent',
  gpcMode: 'honor',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'marketing', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'functional', legalBasis: 'consent', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'We value your privacy',
    htmlText:
      'We use cookies and similar technologies to enhance your browsing experience, ' +
      'personalise content and ads, and analyse our traffic. ' +
      'By clicking <strong>Accept All</strong>, you consent to our use of these technologies. ' +
      'You can change your preferences at any time. ' +
      'See our <a href="/privacy-policy">Privacy Policy</a> for more information.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject Optional', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Your Privacy Preference Has Been Recognized',
    htmlText:
      'Your browser sent a Global Privacy Control (GPC) signal indicating you prefer to ' +
      'limit data collection. We have applied your preference. ' +
      'You can review or update your choices at any time.',
    buttons: [
      { text: 'Review Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Cookie Preferences',
    subheading: 'Choose which types of cookies you allow us to use. You can change these settings at any time.',
    htmlText:
      'We use different types of cookies to optimise your experience on our website. ' +
      'Click on the different category headings to find out more and change your default settings. ' +
      'Note that blocking some types of cookies may impact your experience of the site ' +
      'and the services we are able to offer.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'These cookies are necessary for the website to function and cannot be switched off. ' +
          'They are usually only set in response to actions you have taken such as setting your ' +
          'privacy preferences, logging in, or filling in forms.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional',
        htmlText:
          'These cookies enable enhanced functionality and personalisation. They may be set ' +
          'by us or by third parties whose services we have added to our pages.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'These cookies help us understand how our website is being used, or how effective ' +
          'our marketing campaigns are. All information these cookies collect is aggregated ' +
          'and therefore anonymous.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Marketing',
        htmlText:
          'These cookies are used by our advertising partners to build a profile of your interests ' +
          'and show you relevant advertisements on other sites. They work by uniquely identifying ' +
          'your browser and device. If you do not allow these cookies, you will not experience ' +
          'targeted advertising.',
        cookies: ['marketing'],
      },
    ],
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject Optional', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Save My Choices', style: 'text', action: 'submit' },
    ],
  },
}

export default profile
