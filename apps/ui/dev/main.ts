// Import SCSS directly so Vite handles HMR for style changes.
// disableCssTemplate: true on the widget prevents injecting the precompiled
// CSS string alongside, avoiding duplicate styles in the dev server.
import '../src/styles/index.scss'
import { ConsentiSetup, ConsentiProfile, type ConsentiConfig, type ProfileConfig } from '../src/index'

// ── Event log ────────────────────────────────────────────────────────────────

const logEl = document.getElementById('log')!
let first = true

function log(event: string, detail?: unknown) {
  const ts = new Date().toLocaleTimeString()
  const line = `<span class="ts">${ts}</span>  <span class="ev">${event}</span>${detail !== undefined ? '  ' + JSON.stringify(detail) : ''}`
  if (first) { logEl.innerHTML = line; first = false } else { logEl.innerHTML += '\n' + line }
  logEl.scrollTop = logEl.scrollHeight
}

const events = [
  'consenti:bannerInitialized',
  'consenti:bannerVisibility',
  'consenti:modalVisibility',
  'consenti:consentBeingSubmitted',
  'consenti:consentSubmitted',
] as const

for (const name of events) {
  document.addEventListener(name, (e) => log(name, (e as CustomEvent).detail))
}

// ── Profile ───────────────────────────────────────────────────────────────────
const profileConfig: ProfileConfig = {
  defaultLocale: 'en',
  cookies: [
    { id: 'essential', mandatory: true },
    { id: 'analytics' },
    { id: 'marketing' },
  ],
  translations: {
    en: {
      gpcBanner: {
        heading: "Your Privacy Preference Has Been Recognized",
        headingTag: "h3",
        position: 'bottom',
        showLocaleSwitcher: true,
        showClose: true,
        htmlText: "Your browser has sent a Global Privacy Control (GPC) signal.We've applied your privacy preference where required by applicable law.You can review or update your cookie choices at any time.",
        buttons: [
          { text: 'Review Preferences', style: 'primary', action: 'manage' },
          { text: 'Continue', style: 'secondary', action: 'submit' },
        ],
      },
      mainBanner: {
        position: 'bottom',
        showLocaleSwitcher: true,
        showClose: true,
        heading: "We value your privacy",
        htmlText: '<b>We use cookies</b> to improve your experience and analyse traffic. <a href="#">Learn more</a>',
        buttons: [
          { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          { text: 'Reject All', style: 'secondary', action: 'submit', cookies: '!' },
          { text: 'Preferences', style: 'text', action: 'manage' },
        ],
      },
      preferenceModal: {
        showLocaleSwitcher: true,
        showClose: true,
        position: 'center',
        heading: 'Privacy Preferences',
        subheading: 'Choose which cookies to allow. Essential cookies cannot be disabled.',
        htmlText: "We use different types of cookies to optimise your experience. You can choose to enable or disable each category below. Necessary cookies cannot be disabled as they are required for core site functionality.",
        buttons: [
          { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          { text: 'Save Preferences', style: 'secondary', action: 'submit' },
          { text: 'Reject All', style: 'accent', action: 'submit', cookies: '!' },
        ],
        categories: [
          {
            id: 'essential',
            heading: 'Essential',
            htmlText: 'Required for the site to function correctly.',
            mandatory: true,
            cookies: ['essential'],
          },
          {
            id: 'analytics',
            heading: 'Analytics',
            htmlText: 'Help us understand how visitors interact with our site.',
            cookies: ['analytics'],
          },
          {
            id: 'marketing',
            heading: 'Marketing',
            htmlText: 'Used to deliver personalised advertisements.',
            cookies: ['marketing'],
          },
        ],
      },
    },
    hi: {
      gpcBanner: {
        heading: "HI: Your Privacy Preference Has Been Recognized",
        headingTag: "h3",
        position: 'bottom',
        htmlText: "Your browser has sent a Global Privacy Control (GPC) signal.We've applied your privacy preference where required by applicable law.You can review or update your cookie choices at any time.",
        buttons: [
          { text: 'Review Preferences', style: 'primary', action: 'manage' },
          { text: 'Continue', style: 'secondary', action: 'submit' },
        ],
      },
      mainBanner: {
        position: 'bottom',
        heading: "HI: We value your privacy",
        htmlText: '<b>We use cookies</b> to improve your experience and analyse traffic. <a href="#">Learn more</a>',
        buttons: [
          { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          { text: 'Reject All', style: 'secondary', action: 'submit', cookies: '!' },
          { text: 'Preferences', style: 'text', action: 'manage' },
        ],
      },
      preferenceModal: {
        position: 'center',
        heading: 'HI: Privacy Preferences',
        subheading: 'Choose which cookies to allow. Essential cookies cannot be disabled.',
        htmlText: "We use different types of cookies to optimise your experience. You can choose to enable or disable each category below. Necessary cookies cannot be disabled as they are required for core site functionality.",
        buttons: [
          { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
          { text: 'Save Preferences', style: 'secondary', action: 'submit' },
          { text: 'Reject All', style: 'accent', action: 'submit', cookies: '!' },
        ],
        categories: [
          {
            id: 'essential',
            heading: 'Essential',
            htmlText: 'Required for the site to function correctly.',
            mandatory: true,
            cookies: ['essential'],
          },
          {
            id: 'analytics',
            heading: 'Analytics',
            htmlText: 'Help us understand how visitors interact with our site.',
            cookies: ['analytics'],
          },
          {
            id: 'marketing',
            heading: 'Marketing',
            htmlText: 'Used to deliver personalised advertisements.',
            cookies: ['marketing'],
          },
        ],
      },
    }
  }
}
const consentiProfile = new ConsentiProfile(profileConfig)

// ── Widget ───────────────────────────────────────────────────────────────────

const fullConfig: ConsentiConfig = {
  // hidePoweredBy: true,
  core: {
    profileId: consentiProfile.getId(),
    disableCssTemplate: true,
    autoHonorGPC: true,
  },
  // profileOverride: {
  //   id: 0,
  //   version: 1,
  //   defaultLocale: 'en',
  //   locales: ['en'],
  //   cookies: [
  //     { id: 'essential', mandatory: true },
  //     { id: 'analytics' },
  //     { id: 'marketing' },
  //   ],
  //   mainBanner: {
  //     position: 'bottom',
  //     htmlText: '<b>We use cookies</b> to improve your experience and analyse traffic. <a href="#">Learn more</a>',
  //     buttons: [
  //       { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
  //       { text: 'Reject All', style: 'secondary', action: 'submit', cookies: '!' },
  //       { text: 'Preferences', style: 'text', action: 'manage' },
  //     ],
  //   },
  //   preferenceModal: {
  //     position: 'center',
  //     heading: 'Privacy Preferences',
  //     subheading: 'Choose which cookies to allow. Essential cookies cannot be disabled.',
  //     buttons: [
  //       { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
  //       { text: 'Save Preferences', style: 'secondary', action: 'submit' },
  //       { text: 'Reject All', style: 'text', action: 'submit', cookies: '!' },
  //     ],
  //     categories: [
  //       {
  //         id: 'essential',
  //         heading: 'Essential',
  //         htmlText: 'Required for the site to function correctly.',
  //         mandatory: true,
  //         cookies: ['essential'],
  //       },
  //       {
  //         id: 'analytics',
  //         heading: 'Analytics',
  //         htmlText: 'Help us understand how visitors interact with our site.',
  //         cookies: ['analytics'],
  //       },
  //       {
  //         id: 'marketing',
  //         heading: 'Marketing',
  //         htmlText: 'Used to deliver personalised advertisements.',
  //         cookies: ['marketing'],
  //       },
  //     ],
  //   },
  // },
};

const minimalConfig: ConsentiConfig = {
  core: {
    disableCssTemplate: true,
    allowReceipt: true
  },
  profileOverride: {
    preferenceModal: {
      showLocaleSwitcher: true
    },
  }
}

const widget = new ConsentiSetup(fullConfig)

await widget.ready
log('widget.ready')

// ── Controls ─────────────────────────────────────────────────────────────────

document.getElementById('show-main-banner')?.addEventListener('click', () => widget.showBanner())
document.getElementById('show-gpc-banner')?.addEventListener('click', () => widget.showBanner(true))
document.getElementById('show-modal')?.addEventListener('click', () => widget.showModal())
document.getElementById('reset')?.addEventListener('click', async () => {
  await widget.deleteConsent()
  widget.showBanner()
  log('consent reset')
})

let dark = false
document.getElementById('toggle-dark')?.addEventListener('click', () => {
  dark = !dark
  document.documentElement.classList.toggle('consenti-root--dark', dark)
  log('dark mode', dark)
})
