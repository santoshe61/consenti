import type { ResolvedProfile } from '../types'

const profile: ResolvedProfile = {
  id: 0,
  version: 1,
  defaultLocale: 'en',
  complianceGroup: 'opt-in-brazil',
  gpcMode: 'honor',
  cookies: [
    { id: 'necessary', legalBasis: 'mandatory' },
    { id: 'analytics', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'marketing', legalBasis: 'consent', listenGpc: true, expiry: 365 },
    { id: 'functional', legalBasis: 'consent', expiry: 365 },
  ],
  mainBanner: {
    position: 'bottom',
    heading: 'Your Privacy Matters — LGPD Notice',
    htmlText:
      'In accordance with the Lei Geral de Proteção de Dados (LGPD — Brazilian General Data ' +
      'Protection Law), we request your consent before collecting and processing personal data ' +
      'beyond what is strictly necessary. As a data subject (titular), you have the right to ' +
      'access, correct, delete, and withdraw consent at any time. ' +
      'Read our <a href="/privacy-policy">Privacy Policy</a> for full details.',
    buttons: [
      { text: 'Accept All', cookies: '*', style: 'primary', action: 'custom' },
      { text: 'Reject All', cookies: '!', style: 'secondary', action: 'custom' },
      { text: 'Manage Preferences', style: 'text', action: 'manage' },
    ],
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Your Privacy Signal Was Detected',
    htmlText:
      'A Global Privacy Control (GPC) signal was detected from your browser. We have applied ' +
      'your preference in accordance with applicable data protection law. ' +
      'You may manage your choices at any time.',
    buttons: [
      { text: 'Manage Preferences', style: 'primary', action: 'manage' },
      { text: 'Continue', style: 'secondary', action: 'submit' },
    ],
  },
  preferenceModal: {
    position: 'right',
    heading: 'Privacy Preferences — LGPD',
    subheading:
      'Under the LGPD, you have the right to give, manage, or withdraw consent for each purpose ' +
      'of personal data processing. You may update your choices at any time.',
    htmlText:
      'As a titular (data subject) under the Lei Geral de Proteção de Dados (LGPD), you have the ' +
      'right to: confirm the existence of processing, access your data, correct incomplete or ' +
      'inaccurate data, anonymise or delete unnecessary data, and withdraw consent. ' +
      'Use the controls below to set your preferences.',
    showClose: true,
    overlayOpacity: 50,
    categories: [
      {
        id: 'cat-necessary',
        heading: 'Strictly Necessary',
        htmlText:
          'Processing under this purpose is indispensable for the operation of our services. ' +
          'This is based on the legal bases of contract performance and legal obligation under ' +
          'Article 7 of the LGPD.',
        mandatory: true,
        cookies: ['necessary'],
      },
      {
        id: 'cat-functional',
        heading: 'Functional',
        htmlText:
          'These cookies allow us to remember your preferences and provide a personalised experience. ' +
          'Your consent enables this functionality.',
        cookies: ['functional'],
      },
      {
        id: 'cat-analytics',
        heading: 'Analytics',
        htmlText:
          'With your consent, we collect statistical data about your use of our services to ' +
          'improve our offering. Data is anonymised where possible and is not used to identify you.',
        cookies: ['analytics'],
      },
      {
        id: 'cat-marketing',
        heading: 'Marketing',
        htmlText:
          'With your consent, we and our partners process your personal data to deliver ' +
          'personalised advertising content. You may withdraw this consent at any time, ' +
          'and withdrawal will not affect the lawfulness of prior processing.',
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
