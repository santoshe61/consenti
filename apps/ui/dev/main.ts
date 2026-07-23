// Import SCSS directly so Vite handles HMR for style changes.
// disableCssTemplate: true on the widget prevents injecting the precompiled
// CSS string alongside, avoiding duplicate styles in the dev server.
import { ConsentiSetup, ConsentiProfile, type ConsentiConfig, type ProfileConfig } from '../src/index'
import '../src/styles/index.scss'

declare global {
  interface Window {
    widget: ConsentiSetup;
  }
}

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
  'consenti:closeRequest'
] as const

for (const name of events) {
  window.addEventListener(name, (e) => log(name, (e as CustomEvent).detail))
}

// ── Profile ───────────────────────────────────────────────────────────────────
const profileConfig: ProfileConfig = {
  id: "special-profile",
  // gpcMode: "strict",
  defaultLocale: 'en',
  allowReceipt: true,
  cookies: {
    essential: { listenGpc: false },
    analytics: {},
    marketing: {},
  },
  gpcBanner: {
    heading: "Your Privacy Preference Has Been Recognized",
    headingTag: "h3",
    overlayOpacity: 90,
    position: 'bottom',
    showLocaleSwitcher: true,
    showClose: true,
    htmlText: "Your browser has sent a Global Privacy Control (GPC) signal.We've applied your privacy preference where required by applicable law.You can review or update your cookie choices at any time.",
    buttons: {
      buttonA: { text: 'Review Preferences', style: 'primary', action: 'manage' },
      buttonB: { text: 'Continue', style: 'secondary', action: 'close' },
    },
  },
  mainBanner: {
    position: 'left-bottom',
    showLocaleSwitcher: true,
    overlayOpacity: 60,
    showClose: true,
    heading: "We value your privacy",
    htmlText: '<b>We use cookies</b> to improve your experience and analyse traffic. <a href="#">Learn more</a>',
    buttons: {
      buttonD: { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
      buttonE: { text: 'Reject Optional', style: 'secondary', action: 'submit', cookies: '!' },
      buttonF: { text: 'Preferences', style: 'text', action: 'manage' },
    },
  },
  preferenceModal: {
    showLocaleSwitcher: true,
    showClose: true,
    persistent: true,
    position: 'center',
    heading: 'Privacy Preferences',
    subheading: 'Choose which cookies to allow. Essential cookies cannot be disabled.',
    htmlText: "We use different types of cookies to optimise your experience. You can choose to enable or disable each category below. Necessary cookies cannot be disabled as they are required for core site functionality.",
    buttons: {
      buttonG: { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
      buttonH: { text: 'Save Preferences', style: 'secondary', action: 'submit' },
      buttonI: { text: 'Reject Optional', style: 'accent', action: 'submit', cookies: '!' },
    },
    categories: {
      essential: {
        heading: 'Essential',
        htmlText: 'Required for the site to function correctly.',
        legalBasis: 'mandatory',
        cookies: ['essential'],
      },
      analytics: {
        heading: 'Analytics',
        htmlText: 'Help us understand how visitors interact with our site by collecting anonymised usage statistics. This includes page views, session duration, click paths, and device information. We use this data to improve site performance, fix bugs, and understand which features are most valuable to our users. No data collected here is ever sold to third parties.',
        cookies: ['analytics', 'marketing'],
        legalBasis: "legitimate_interest",
        legitimateInterestDescription: "We use these cookies to provide you with the best possible experience on our website. They are essential for the site to function correctly and cannot be disabled."
      },
      // marketing: {
      //   heading: 'Marketing',
      //   htmlText: 'Used to deliver personalised advertisements.',
      //   cookies: ['marketing', 'analytics'],
      //   legalBasis: 'consent',
      // },
    },
  },
  translations: {
    hi: {
      gpcBanner: {
        heading: "आपकी गोपनीयता प्राथमिकता को पहचान लिया गया है",
        htmlText:
          "आपके ब्राउज़र ने Global Privacy Control (GPC) सिग्नल भेजा है। लागू कानूनों के अनुसार हमने आपकी गोपनीयता प्राथमिकता लागू कर दी है। आप किसी भी समय अपनी कुकी प्राथमिकताओं की समीक्षा या उन्हें अपडेट कर सकते हैं।",
        buttons: {
          buttonA: { text: "प्राथमिकताओं की समीक्षा करें" },
          buttonB: { text: "जारी रखें" },
        },
      },
      mainBanner: {
        heading: "हम आपकी गोपनीयता का सम्मान करते हैं",
        htmlText:
          "<b>हम कुकीज़ का उपयोग</b> आपके अनुभव को बेहतर बनाने और ट्रैफ़िक का विश्लेषण करने के लिए करते हैं। <a href='#'>और जानें</a>",
        buttons: {
          buttonD: { text: "सभी स्वीकार करें" },
          buttonE: { text: "वैकल्पिक अस्वीकार करें" },
          buttonF: { text: "प्राथमिकताएँ" },
        },
      },
      preferenceModal: {
        heading: "गोपनीयता प्राथमिकताएँ",
        subheading:
          "चुनें कि आप किन कुकीज़ की अनुमति देना चाहते हैं। आवश्यक कुकीज़ को अक्षम नहीं किया जा सकता।",
        htmlText:
          "हम आपके अनुभव को बेहतर बनाने के लिए विभिन्न प्रकार की कुकीज़ का उपयोग करते हैं। आप नीचे प्रत्येक श्रेणी को सक्षम या अक्षम करना चुन सकते हैं। आवश्यक कुकीज़ को अक्षम नहीं किया जा सकता क्योंकि वे वेबसाइट की मूल कार्यक्षमता के लिए आवश्यक हैं।",
        buttons: {
          buttonG: { text: "सभी स्वीकार करें" },
          buttonH: { text: "प्राथमिकताएँ सहेजें" },
          buttonI: { text: "वैकल्पिक अस्वीकार करें" },
        },
        categories: {
          essential: {
            heading: "आवश्यक",
            htmlText: "वेबसाइट के सही ढंग से कार्य करने के लिए आवश्यक।",
          },
          analytics: {
            heading: "विश्लेषण",
            htmlText:
              "ये कुकीज़ गुमनाम उपयोग आँकड़े एकत्र करके यह समझने में हमारी सहायता करती हैं कि आगंतुक हमारी वेबसाइट के साथ कैसे इंटरैक्ट करते हैं। इसमें पृष्ठ दृश्य, सत्र की अवधि, क्लिक पथ और डिवाइस संबंधी जानकारी शामिल होती है। हम इस डेटा का उपयोग वेबसाइट के प्रदर्शन में सुधार करने, त्रुटियों को ठीक करने और यह समझने के लिए करते हैं कि कौन-सी सुविधाएँ उपयोगकर्ताओं के लिए सबसे अधिक उपयोगी हैं। यहाँ एकत्र किया गया कोई भी डेटा कभी भी तीसरे पक्ष को बेचा नहीं जाता।",
          },
          marketing: {
            heading: "मार्केटिंग",
            htmlText: "व्यक्तिगत विज्ञापन प्रदान करने के लिए उपयोग किया जाता है।",
          },
        },
      },
    }
  }
}
const consentiProfile = new ConsentiProfile(profileConfig)

// ── Widget ───────────────────────────────────────────────────────────────────

const fullConfig: ConsentiConfig = {
  verbose: true,
  hidePoweredBy: false,
  compliance: {
    type: 'general-privacy-consent',// consentiProfile.getType() // 'auto' | 'opt-in' | 'opt-out' | 'opt-out-strict' | 'opt-in-dpdpa' | 'opt-in-china' | 'opt-in-brazil' | 'general-privacy-consent' | 'notice-only' | local profile Symbol
  },
  core: {
    disableCssTemplate: true,
  },
  api: {
    enabled: true,
    baseUrl: "http://localhost:5173",
    // authToken?: string
    // tenantId?: string
    // complianceGroup?: ComplianceGroupId
    // trustDomain?: boolean
  },
  profileOverride: {
    // mainBanner: {
    //   position: "middle",
    //   showLocaleSwitcher: true,
    //   showClose: true,
    //   buttons: [
    //     { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
    //     { text: 'Reject Optional', style: 'secondary', action: 'submit', cookies: '!' },
    //     { text: 'Reject All', style: 'accent', action: 'submit', cookies: '!' },
    //     { text: 'Preferences', style: 'text', action: 'manage' },
    //     { text: 'Primary', style: 'primary', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Secondary', style: 'secondary', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Accent', style: 'accent', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Privacy Policy', style: 'text', action: 'link', url: 'https://www.google.com' },
    //   ],
    // },
    // gpcBanner: {
    //   position: 'bottom',
    //   heading: 'GPC opt-out applied automatically',
    //   htmlText:
    //     'Your browser sent a Global Privacy Control signal. Under the CPRA, we are required to honor this as a Do Not Sell or Share My Personal Information request. Your opt-out has been applied automatically.',
    //   buttons: [
    //     { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
    //     { text: 'Reject Optional', style: 'secondary', action: 'submit', cookies: '!' },
    //     { text: 'Reject All', style: 'accent', action: 'submit', cookies: '!' },
    //     { text: 'Preferences', style: 'text', action: 'manage' },
    //     { text: 'Primary', style: 'primary', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Secondary', style: 'secondary', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Accent', style: 'accent', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Privacy Policy', style: 'text', action: 'link', url: 'https://www.google.com' },
    //   ],
    // },
    // preferenceModal: {
    //   showLocaleSwitcher: true,
    //   showClose: true,
    //   position: "center",
    //   buttons: [
    //     { text: 'Accept All', style: 'primary', action: 'submit', cookies: '*' },
    //     { text: 'Reject Optional', style: 'secondary', action: 'submit', cookies: '!' },
    //     { text: 'Reject All', style: 'accent', action: 'submit', cookies: '!' },
    //     { text: 'Close', style: 'text', action: 'close' },
    //     { text: 'Primary', style: 'primary', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Secondary', style: 'secondary', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Accent', style: 'accent', action: 'link', url: 'https://www.google.com' },
    //     { text: 'Privacy Policy', style: 'text', action: 'link', url: 'https://www.google.com' },
    //   ],
    //   categories: {
    //     necessary: {
    //       heading: 'Strictly Necessary',
    //       htmlText:
    //         'Required to deliver the core service. No personal data is shared and consent is not required for these.',
    //       legalBasis: 'mandatory',
    //       cookies: ['security_storage'],
    //     },
    //     functional: {
    //       heading: 'Functional',
    //       htmlText:
    //         'Enable enhanced features and personalisation. Your explicit consent is required under the DPDPA before we process data for these purposes. Enable enhanced features and personalisation. Your explicit consent is required under the DPDPA before we process data for these purposes. Enable enhanced features and personalisation. Your explicit consent is required under the DPDPA before we process data for these purposes. Enable enhanced features and personalisation. Your explicit consent is required under the DPDPA before we process data for these purposes.',
    //       legalBasis: 'consent',
    //       cookies: ['functionality_storage', 'personalization_storage'],
    //     },
    //     analytics: {
    //       heading: 'Analytics',
    //       htmlText:
    //         'Help us understand how you interact with the site. Your consent is required before any analytics data is collected.',
    //       legalBasis: 'consent',
    //       cookies: ['analytics_storage'],
    //     },
    //     marketing: {
    //       heading: 'Marketing & Advertising',
    //       htmlText:
    //         'Allow personalised advertising based on your browsing activity. Requires your explicit consent under the DPDPA.',
    //       legalBasis: 'consent',
    //       cookies: ['ad_storage'],
    //     },
    //   }
    // }
  },
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
window.widget = widget;
await widget.ready
log('widget.ready')

// ── Controls ─────────────────────────────────────────────────────────────────

document.getElementById('show-main-banner')?.addEventListener('click', () => widget.showBanner())
document.getElementById('show-gpc-banner')?.addEventListener('click', () => widget.showBanner(true))
document.getElementById('show-modal')?.addEventListener('click', () => widget.showModal())
document.getElementById('reset')?.addEventListener('click', async () => {
  await widget.reConsent()
  log('consent reset')
})

let dark = false
document.getElementById('toggle-dark')?.addEventListener('click', () => {
  dark = !dark
  document.documentElement.classList.toggle('consenti-root--dark', dark)
  log('dark mode', dark)
})
