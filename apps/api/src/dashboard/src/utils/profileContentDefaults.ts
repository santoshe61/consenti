import type { ServerUITemplate } from '@consenti/types'
import type { LocaleContent } from './templates'

function buttonLabel(
  btn: { action: string; cookies?: string[] | '*' | '!' | undefined },
  group: string,
): string {
  const isOptOut = group === 'opt-out' || group === 'opt-out-strict'
  if (btn.action === 'custom') {
    if (btn.cookies === '*') return isOptOut ? 'Allow All' : 'Accept All'
    if (btn.cookies === '!') return isOptOut ? 'Opt Out' : 'Reject All'
    return 'Select'
  }
  if (btn.action === 'submit') return 'Save Preferences'
  if (btn.action === 'manage') return 'Manage Preferences'
  if (btn.action === 'close') return 'Close'
  if (btn.action === 'link') return 'Learn More'
  return btn.action
}

const CATEGORY_DEFAULTS: Record<string, { heading: string; htmlText: string }> = {
  necessary: { heading: 'Strictly Necessary', htmlText: 'Essential cookies required for core website functionality. Cannot be disabled.' },
  essential: { heading: 'Essential', htmlText: 'Required for the website to function properly. Cannot be disabled.' },
  functional: { heading: 'Functional', htmlText: 'Remember your preferences and settings to enhance your experience.' },
  preferences: { heading: 'Preferences', htmlText: 'Store your personalisation choices and settings.' },
  analytics: { heading: 'Analytics', htmlText: 'Help us understand how visitors interact with our site using anonymous statistics.' },
  statistics: { heading: 'Statistics', htmlText: 'Collect anonymous data on how visitors use our website.' },
  marketing: { heading: 'Marketing', htmlText: 'Deliver relevant advertisements and measure campaign effectiveness.' },
  advertising: { heading: 'Advertising', htmlText: 'Show personalised ads based on your browsing interests.' },
  social: { heading: 'Social Media', htmlText: 'Enable sharing content and interacting with social media platforms.' },
  performance: { heading: 'Performance', htmlText: 'Help us measure and improve the performance and speed of our website.' },
}

function categoryContent(id: string): { heading: string; htmlText: string } {
  const key = id.toLowerCase().replace(/[^a-z]/g, '')
  for (const [k, v] of Object.entries(CATEGORY_DEFAULTS)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return { heading: id, htmlText: 'Used to enable specific functionality on this website.' }
}

type BannerSpec = { heading: string; htmlText: string }
type GroupSpec = {
  mainBanner: BannerSpec
  gpcBanner: BannerSpec
  preferenceModal: { heading: string; subheading: string; htmlText: string }
}

const GROUP_CONTENT: Record<string, GroupSpec> = {
  'opt-in': {
    mainBanner: {
      heading: 'We use cookies',
      htmlText: 'We and our partners use cookies and similar technologies to personalise content, analyse traffic, and show targeted advertising. You can accept all, reject non-essential cookies, or manage your preferences.',
    },
    gpcBanner: {
      heading: 'Global Privacy Control Detected',
      htmlText: 'We have recognised your Global Privacy Control (GPC) signal and applied your opt-out preference. You can review your settings at any time.',
    },
    preferenceModal: {
      heading: 'Privacy Preferences',
      subheading: 'Manage your cookie settings',
      htmlText: 'Choose which types of cookies you allow. You can change your settings at any time by revisiting this panel.',
    },
  },
  'opt-out': {
    mainBanner: {
      heading: 'Privacy Notice',
      htmlText: 'We use cookies and similar technologies on this site. Under applicable US state privacy laws, you have the right to opt out of the sale or sharing of your personal data. Review our Privacy Policy or manage your preferences below.',
    },
    gpcBanner: {
      heading: 'Your Privacy Preference Recognised',
      htmlText: 'We detected a Global Privacy Control (GPC) signal from your browser and applied your opt-out of sale and sharing, as required under applicable US state privacy laws.',
    },
    preferenceModal: {
      heading: 'Privacy Preferences',
      subheading: 'Your US privacy rights',
      htmlText: 'Manage your choices under US state privacy laws. You may opt out of the sale or sharing of your personal data at any time.',
    },
  },
  'opt-out-strict': {
    mainBanner: {
      heading: 'Your California Privacy Rights',
      htmlText: 'Under the California Privacy Rights Act (CPRA), you have the right to opt out of the sale, sharing, and use of sensitive personal information. Manage your choices below.',
    },
    gpcBanner: {
      heading: 'California Privacy Rights — GPC Recognised',
      htmlText: 'We have recognised your Global Privacy Control (GPC) signal and applied your opt-out of sale and sharing as required under the California Privacy Rights Act (CPRA).',
    },
    preferenceModal: {
      heading: 'California Privacy Preferences',
      subheading: 'Manage your CPRA rights',
      htmlText: 'Exercise your CPRA rights: opt out of the sale of personal data, sharing for targeted advertising, and use of sensitive personal information.',
    },
  },
  'opt-in-dpdpa': {
    mainBanner: {
      heading: 'We request your consent',
      htmlText: "Under India's Digital Personal Data Protection Act (DPDPA), we ask for your consent before processing your personal data. You may withdraw consent at any time.",
    },
    gpcBanner: {
      heading: 'Privacy Preference Noted',
      htmlText: 'Your privacy preference has been noted. Under the DPDPA, you have the right to withdraw consent for data processing at any time.',
    },
    preferenceModal: {
      heading: 'Consent Preferences',
      subheading: 'Manage your data processing choices',
      htmlText: 'Review and provide consent for each purpose below. You have the right to withdraw consent at any time by contacting our Data Fiduciary.',
    },
  },
  'opt-in-china': {
    mainBanner: {
      heading: 'We need your consent',
      htmlText: "In accordance with China's Personal Information Protection Law (PIPL), Data Security Law (DSL), and Cybersecurity Law (CSL), we ask for your explicit consent before collecting and processing personal information.",
    },
    gpcBanner: {
      heading: 'Privacy Preference Noted',
      htmlText: 'Your privacy preference has been recorded. You can review and manage your consent choices at any time.',
    },
    preferenceModal: {
      heading: 'Personal Information Preferences',
      subheading: 'Manage your processing choices',
      htmlText: 'Please review the purposes for which we process your personal information and provide or withdraw consent as you see fit.',
    },
  },
  'opt-in-brazil': {
    mainBanner: {
      heading: 'We use cookies',
      htmlText: "In accordance with Brazil's Lei Geral de Proteção de Dados (LGPD), we ask for your consent to use non-essential cookies and process your personal data for the purposes below.",
    },
    gpcBanner: {
      heading: 'Privacy Signal Recognised',
      htmlText: "Your privacy preference signal has been recognised. Your choices will be applied in accordance with the LGPD.",
    },
    preferenceModal: {
      heading: 'Privacy Preferences',
      subheading: 'Manage your LGPD rights',
      htmlText: "Manage your data processing preferences. You have the right to withdraw consent at any time under Brazil's LGPD.",
    },
  },
  'general-privacy-consent': {
    mainBanner: {
      heading: 'We use cookies',
      htmlText: 'We use cookies and similar tracking technologies to improve your browsing experience. By continuing to use this site, you acknowledge our use of cookies as described in our Privacy Policy.',
    },
    gpcBanner: {
      heading: 'Privacy Signal Noted',
      htmlText: 'We have noted your privacy preference signal. You can manage your cookie choices at any time.',
    },
    preferenceModal: {
      heading: 'Cookie Preferences',
      subheading: 'Manage your settings',
      htmlText: 'Manage your cookie preferences below. You may change your choices at any time.',
    },
  },
  'notice-only': {
    mainBanner: {
      heading: 'Cookie Notice',
      htmlText: 'This website uses cookies to ensure you get the best experience. By continuing to browse, you agree to our use of cookies as described in our Privacy Policy.',
    },
    gpcBanner: {
      heading: 'Privacy Preference Noted',
      htmlText: 'Your privacy preference has been noted. You can review our cookie settings below.',
    },
    preferenceModal: {
      heading: 'Cookie Settings',
      subheading: 'Cookie information',
      htmlText: 'This site uses cookies. You can review details about the cookies we use below.',
    },
  },
}

const GENERIC_CONTENT: GroupSpec = {
  mainBanner: {
    heading: 'We use cookies',
    htmlText: 'We use cookies to improve your experience on our website. Please review your privacy preferences below.',
  },
  gpcBanner: {
    heading: 'Global Privacy Control Detected',
    htmlText: 'We have recognised your Global Privacy Control (GPC) signal and applied your preference.',
  },
  preferenceModal: {
    heading: 'Privacy Preferences',
    subheading: 'Manage your cookie settings',
    htmlText: 'Choose which cookies you want to allow. You can change your settings at any time.',
  },
}

export function buildDefaultContent(complianceGroup: string, uiTemplate: ServerUITemplate): LocaleContent {
  const spec = GROUP_CONTENT[complianceGroup] ?? GENERIC_CONTENT

  return {
    mainBanner: {
      heading: spec.mainBanner.heading,
      htmlText: spec.mainBanner.htmlText,
      buttonLabels: uiTemplate.mainBanner.buttons.map(b => buttonLabel(b, complianceGroup)),
    },
    gpcBanner: {
      heading: spec.gpcBanner.heading,
      htmlText: spec.gpcBanner.htmlText,
      buttonLabels: uiTemplate.gpcBanner.buttons.map(b => buttonLabel(b, complianceGroup)),
    },
    preferenceModal: {
      heading: spec.preferenceModal.heading,
      subheading: spec.preferenceModal.subheading,
      htmlText: spec.preferenceModal.htmlText,
      buttonLabels: uiTemplate.preferenceModal.buttons.map(b => buttonLabel(b, complianceGroup)),
      categories: uiTemplate.preferenceModal.categories.map(c => ({
        id: c.id,
        ...categoryContent(c.id),
      })),
    },
  }
}
