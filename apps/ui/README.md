# @consenti/ui

Zero-dependency, GDPR-compliant cookie consent widget for any web framework.

[![npm version](https://img.shields.io/npm/v/@consenti/ui.svg)](https://www.npmjs.com/package/@consenti/ui)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)
[![Browser](https://img.shields.io/badge/browser-ES2020%2B-lightgrey.svg)](https://caniuse.com)

---

## Why this package?

- **Zero runtime dependencies** — browser built-ins only (`fetch`, `crypto.subtle`, `BroadcastChannel`, `CustomEvent`, `document.cookie`, `localStorage`)
- **Fully standalone or API-connected** — works offline with a local profile, or connects to `@consenti/api` for dashboard-managed profiles
- **Multi-regulation** — GDPR, UK-GDPR, CCPA, CPRA, LGPD, DPDPA, PIPEDA, POPIA, PDPA-TH, APPI, KVKK
- **GPC aware** — Global Privacy Control signal detection with `true` / `'strict'` modes
- **GTM / Google Consent Mode v2** — built-in `dataLayer` integration
- **SSR-safe** — all browser API access is guarded; `new ConsentiSetup()` during SSR is a silent no-op
- **Fully typed** — ships TypeScript definitions; no `@types` needed

---

## Browser Support

ES2020+ · Chrome 80+ · Firefox 74+ · Safari 13.1+

---

## Installation

### npm (recommended)

```bash
npm install @consenti/ui
```

Then import CSS and the class:

```ts
import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'
```

### CDN / UMD (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.css" />
<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
<script>
  const { ConsentiSetup } = ConsentiUI
  new ConsentiSetup({ core: { regulation: 'gdpr' } })
</script>
```

### ESM in the browser (no bundler)

```html
<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({ core: { regulation: 'gdpr' } })
</script>
```

### CSS options

| Approach                          | How                                                                   |
|-----------------------------------|-----------------------------------------------------------------------|
| Import from package (recommended) | `import '@consenti/ui/dist/index.css'`                        |
| Skip all CSS (bring your own)     | Set `core.disableCssTemplate: true` — no styles injected              |
| CSS custom properties only        | Import CSS, then override `--consenti-*` variables in your stylesheet |

---

## Quick Start

```ts
// Simplest possible — built-in GDPR profile, no backend required
new ConsentiSetup({ core: { regulation: 'gdpr' } })
```

A consent banner appears on first visit. Everything below is optional.

---

## Package Exports

```
@consenti/ui             ← main entry (ConsentiSetup, ConsentiProfile, etc.)
@consenti/ui/react       ← React hook (useConsent)
@consenti/ui/vue         ← Vue composable (useConsent)
@consenti/ui/angular     ← Angular service (ConsentiService)
@consenti/ui/testing     ← Test utilities
```

---

## Full Configuration

```ts
import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

const widget = new ConsentiSetup({
  // ── Required ────────────────────────────────────────────────────────────────
  core: {
    profileId: 1,                // 0 = built-in default; >0 = local or API profile
    regulation: 'gdpr',          // controls opt-in / opt-out behaviour
    locale: 'en',                // BCP 47; falls back to language prefix, then 'en'
    autoHonorGPC: true,          // false | true | 'strict'
    storage: 'cookie',           // 'cookie' | 'localStorage'
    cookieDomains: '.example.com',
    privacyPolicyUrl: '/privacy',
    signCookies: true,
    cookieSigningKey: 'min-32-char-secret', // client-only mode; use API mode in production
    allowReceipt: true,
    disableCssTemplate: false,
    userId: 'server-assigned-uuid', // authenticated users — enables cross-device sync
    theme: {
      bgColor: '#ffffff',
      textColor: '#1a1a1a',
      primaryColor: '#1565c0',
      primaryTextColor: '#ffffff',
      secondaryColor: '#f0f4f8',
      secondaryTextColor: '#1a3460',
      borderColor: '#e2e8f0',
      accentColor: '#d32f2f',
      accentTextColor: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontSizeBase: '14px',
      fontSizeHeading: '18px',
      fontSizeMultiplier: '1',
      borderRadius: '8px',
      buttonBorderRadius: '4px',
      toggleBgOn: '#1565c0',
      toggleBgOff: '#cccccc',
    },
  },

  // ── Mount point (optional) ────────────────────────────────────────────────
  rootEl: '#my-consent-wrapper',  // CSS selector or HTMLElement; default: appends to body

  // ── Dark mode (optional) ──────────────────────────────────────────────────
  darkMode: false,                // or: window.matchMedia('(prefers-color-scheme: dark)').matches

  // ── Backend API (optional) ────────────────────────────────────────────────
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com',  // default: window.location.origin
    authToken: '',                      // sent as Authorization: Bearer <token>
  },

  // ── GTM / Google Consent Mode v2 (optional) ───────────────────────────────
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX',
      dataLayer: 'dataLayer',
      events: [],                 // [] = all events; list names to filter
      urlPassthrough: true,       // cookieless conversion modelling
      adsDataRedaction: false,    // redact ad pings when consent denied
    },
  },

  // ── Frontend plugins (optional) ───────────────────────────────────────────
  plugins: [],

  // ── Runtime profile overrides (optional) ──────────────────────────────────
  profileOverride: {
    mainBanner: { position: 'top' },
  },
})
```

---

## Regulations

| Value        | Region              | Model               | Notes                                                                  |
|--------------|---------------------|---------------------|------------------------------------------------------------------------|
| `'gdpr'`     | EU / EEA            | Opt-in              | Default. Banner on first visit; all non-mandatory cookies denied until granted. |
| `'uk-gdpr'`  | UK                  | Opt-in              | Same model as GDPR; ICO-enforced; age gate at 13.                      |
| `'ccpa'`     | California (US)     | Opt-out             | All cookies default to `'granted'`; consent written silently; no banner. |
| `'cpra'`     | California (US)     | Opt-out / Opt-in    | Supersedes CCPA. Opt-out for sale/sharing; opt-in for sensitive data. GPC triggers Do Not Sell + Do Not Share. |
| `'lgpd'`     | Brazil              | Opt-in              | 10 lawful bases; ANPD-enforced; parental consent gate under-12.        |
| `'dpdpa'`    | India               | Opt-in              | Fiduciary name + grievance officer in modal; GPC ignored.              |
| `'pipeda'`   | Canada              | Opt-in              | PIPEDA + Quebec Law 25 (GDPR-aligned).                                 |
| `'popia'`    | South Africa        | Opt-in              | 8 processing conditions; Information Regulator-enforced.               |
| `'pdpa-th'`  | Thailand            | Opt-in              | Cross-border transfer rules; PDPC-enforced.                            |
| `'appi'`     | Japan               | Opt-in / Opt-out    | Opt-in for sensitive data and overseas transfers; opt-out for general third-party sharing. |
| `'kvkk'`     | Turkey              | Opt-in              | Explicit consent for sensitive personal data; KVK Board-enforced.      |

---

## GPC — Global Privacy Control

```ts
new ConsentiSetup({
  core: {
    regulation: 'gdpr',
    autoHonorGPC: true,    // pre-deny 'listenGpc' cookies and show GPC banner variant
    // autoHonorGPC: 'strict'  // pre-deny silently — no banner shown at all
  },
})
```

Cookies with `listenGpc: true` in the profile are automatically denied when the signal is detected.

---

## Profiles

### Built-in default profile

When `core.profileId` is `0` or omitted, the widget uses a built-in English GDPR profile covering the five Google Consent Mode v2 purposes. No configuration needed.

### Local profile (no backend)

Define a full profile in JavaScript — no server required.

```ts
import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'

const profile = new ConsentiProfile({
  defaultLocale: 'en',
  cookies: [
    { id: 'necessary',  mandatory: true,  expiry: 365 },
    { id: 'analytics',  listenGpc: true,  expiry: 365 },
    { id: 'marketing',  listenGpc: true,  expiry: 365,  cpraCategory: 'sale' },
    // cpraCategory: 'sale' | 'sharing' | 'sensitive' — used when regulation: 'cpra'
  ],
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',      // 'top' | 'bottom' | 'middle' | 'left-bottom' | 'right-bottom'
        overlayOpacity: 0,       // 0–100
        showClose: false,
        showLocaleSwitcher: false, // true = show locale switcher (requires multiple locales)
        heading: 'We value your privacy',
        headingTag: 'h2',        // HTML tag for the heading; default 'h2'
        htmlText: 'We use cookies to improve your experience.',
        buttons: [
          { text: 'Accept All',         style: 'primary',   action: 'custom', cookies: '*' },
          // cookies: '*' = grant all | '!' = deny all | ['id1','id2'] = grant specific
          { text: 'Reject Optional',         style: 'secondary', action: 'custom', cookies: '!' },
          { text: 'Customize', style: 'secondary', action: 'manage' },
          { text: 'Privacy Policy',     style: 'text',      action: 'link',   url: '/privacy' },
          // action: 'link' + url — renders as a text link below the banner
        ],
      },
      gpcBanner: {               // shown instead of mainBanner when GPC detected
        position: 'bottom',
        heading: 'Privacy signal detected',
        headingTag: 'h2',
        showLocaleSwitcher: false,
        htmlText: "Your browser's GPC signal was detected. Ad cookies have been pre-denied.",
        buttons: [
          { text: 'Understood',           style: 'primary',   action: 'custom', cookies: '!' },
          { text: 'Customize',   style: 'secondary', action: 'manage' },
        ],
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        headingTag: 'h2',        // HTML tag for the modal heading; default 'h2'
        subheading: 'Choose which cookies you allow.',
        htmlText: 'We use different types of cookies. You can enable or disable each category below.',
        position: 'center',       // 'left' | 'right' | 'center'
        showClose: true,
        showLocaleSwitcher: false,
        persistent: false,        // true = cannot dismiss by clicking outside
        overlayOpacity: 50,
        mobileFullScreenBreakpoint: 576, // px — modal fills screen on viewports ≤ this width. Set to 0 to disable.
        buttons: [
          { text: 'Accept All',       style: 'primary', action: 'custom', cookies: '*' },
          { text: 'Save Preferences', style: 'primary', action: 'submit' },
          { text: 'Reject Optional',       style: 'text',    action: 'custom', cookies: '!' },
        ],
        categories: [
          {
            id: 'cat-necessary',
            heading: 'Strictly Necessary',
            headingTag: 'h3',    // HTML tag for the category heading; default 'h3'
            htmlText: 'Required for the site to function. <strong>Cannot be disabled.</strong>',
            mandatory: true,
            cookies: ['necessary'],
          },
          {
            id: 'cat-analytics',
            heading: 'Analytics',
            htmlText: 'Helps us understand how visitors use the site.',
            type: 'consent',     // 'consent' | 'legitimate_interest'
            // type: 'legitimate_interest' — refusal stored as 'objected' instead of 'denied'
            cookies: ['analytics'],
          },
          {
            id: 'cat-marketing',
            heading: 'Marketing',
            htmlText: 'Used to personalise ads and measure campaign performance.',
            cookies: ['marketing'],
          },
        ],
      },
    },
    fr: {
      // same shape — add translations for each locale
      mainBanner: { /* ... */ },
      preferenceModal: { /* ... */ },
    },
  },
})

new ConsentiSetup({
  core: {
    profileId: profile.getId(), // always use .getId() — never hardcode the ID
    regulation: 'gdpr',
    locale: 'fr',
  },
})
```

> **Note:** Local profile IDs are auto-assigned starting from `1000` to avoid collisions with API profile IDs (which start from `1`). Always call `profile.getId()`.

### API profile (with backend)

```ts
new ConsentiSetup({
  core: { profileId: 3, regulation: 'gdpr', locale: 'de' },
  api: {
    enabled: true,
    baseUrl: 'https://consent.example.com',
  },
})
```

The widget fetches the profile from the API and falls back to a local profile (or the built-in default) if the request fails.

---

## Cookie Format

Consent is persisted as a single cookie named `consenti_{profileId}`.

```
t:{unixTimestamp}::{cookieId}:{status}|{cookieId}:{status}|…[::sig:{hmac}]
```

Example:
```
t:1782133054::analytics:granted|marketing:denied|necessary:granted::sig:abc123
```

---

## Widget API Methods

```ts
const widget = new ConsentiSetup({ core: { regulation: 'gdpr' } })

// Consent state
widget.hasConsent()              // boolean — true if valid consent record exists
widget.getConsent()              // Record<string, 'granted'|'denied'|'objected'> | null
widget.getGTMConsent()           // consent in GTM / Google Consent Mode v2 format
widget.getConsentDate()          // Date | false — time of last submission

// Visibility
widget.showBanner(gpc?)          // show main banner (or GPC variant)
widget.hideBanner()              // hide banner
widget.showModal()               // open preference modal
widget.hideModal()               // close preference modal
widget.bannerVisibility()        // 'main' | 'gpc' | false
widget.modalVisibility()         // 'preference' | false

// Actions
widget.init()                    // manually start init (when autoInit: false)
widget.onReady(callback)         // called once widget is fully initialised
widget.switchLocale(locale)      // switch locale and re-render (e.g. 'fr', 'de-AT')
widget.submitConsent(consent)    // programmatically submit consent values
widget.deleteConsent()           // delete consent record (cookie + backend if enabled)
widget.reConsent()               // delete consent and re-show banner
widget.downloadReceipt()         // trigger JSON consent receipt download
widget.destroy()                 // unmount DOM elements and remove all event listeners
```

### Manual init

```ts
const widget = new ConsentiSetup({
  core: {},
  rootEl: '#consent-mount',
  autoInit: false,
})

// Later, once mount point is in the DOM:
await widget.init()
widget.onReady(() => console.log('Ready:', widget.hasConsent()))
```

### Programmatic consent

```ts
await widget.submitConsent({
  analytics: 'granted',
  marketing: 'denied',
  necessary: 'granted',  // mandatory cookies are always 'granted' regardless
})
```

---

## Events

Custom DOM events fire on `document` at every lifecycle step. All are prefixed `consenti:`.

| Event                          | Fired when                                               | Detail type                    |
|--------------------------------|----------------------------------------------------------|--------------------------------|
| `consenti:bannerInitialized`   | Widget initialises and determines banner visibility      | `BannerInitializedDetail`      |
| `consenti:bannerVisibility`    | Banner shows or hides                                    | `BannerVisibilityDetail`       |
| `consenti:modalVisibility`     | Preference modal shows or hides                          | `ModalVisibilityDetail`        |
| `consenti:consentBeingSubmitted` | User clicked a consent button (before API call)        | `ConsentBeingSubmittedDetail`  |
| `consenti:consentSubmitted`    | Consent saved (cookie written + API call if configured)  | `ConsentSubmittedDetail`       |

```ts
document.addEventListener('consenti:consentSubmitted', (e: Event) => {
  const detail = (e as CustomEvent<ConsentSubmittedDetail>).detail
  // detail.consentAction — 'accept_all' | 'reject_all' | 'custom' | 'update'
  // detail.consentJson   — { analytics: 'granted', marketing: 'denied', ... }
  // detail.visitorId     — stable UUID
  // detail.pageUrl       — window.location.href at submission time
  // detail.gpcDetected   — boolean
  // detail.timestamp     — ISO 8601
  // detail.apiResponse   — backend response (if api.enabled: true)
})
```

---

## GTM / Google Consent Mode v2

```ts
new ConsentiSetup({
  core: { regulation: 'gdpr' },
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX',
      urlPassthrough: true,    // cookieless conversion modelling
      adsDataRedaction: true,  // redact ad pings when consent denied
    },
  },
})
```

Consenti pushes to `window.dataLayer` in the standard Google Consent Mode v2 format:

```js
// On initialisation (default denied state)
dataLayer.push({ 'event': 'consent_default', 'analytics_storage': 'denied', ... })

// On submission
dataLayer.push({ 'event': 'consent_update', 'analytics_storage': 'granted', 'ad_storage': 'denied', ... })
```

`getGTMConsent()` returns consent in GTM format:

```ts
widget.getGTMConsent()
// {
//   analytics_storage: 'granted',
//   ad_storage: 'denied',
//   ad_user_data: 'denied',
//   ad_personalization: 'denied',
//   functionality_storage: 'granted',
// }
```

---

## Utilities

### ConsentScript — load scripts on consent

```ts
import { ConsentScript } from '@consenti/ui'

new ConsentScript({
  cookieId: 'analytics',
  src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXX',
  onLoad: () => console.log('Analytics loaded'),
  onRevoke: () => console.log('Analytics removed'),
})
```

### CookieTrigger — open banner or modal from any element

```ts
import { CookieTrigger } from '@consenti/ui'

// Attach to existing element
new CookieTrigger({ selector: '#cookie-settings', action: 'modal' })

// Auto-create a button
new CookieTrigger({
  action: 'modal',
  label: 'Manage Cookies',
  appendTo: document.querySelector('#footer'),
})
```

---

## Themes & CSS

### CSS custom properties

Override any token in your own stylesheet:

```css
:root {
  /* Colors */
  --consenti-primary-text: #1a3460;
  --consenti-secondary-text: #555555;
  --consenti-primary-bg: #ffffff;
  --consenti-secondary-bg: #f5f5f5;
  --consenti-overlay-bg: rgba(0, 0, 0, 0.5);

  /* Buttons */
  --consenti-btn-primary-bg: #1565c0;
  --consenti-btn-primary-text: #ffffff;
  --consenti-btn-secondary-bg: #f5f5f5;
  --consenti-btn-secondary-text: #1a3460;
  --consenti-btn-radius: 6px;
  --consenti-btn-padding: 0.5rem 1.25rem;
  --consenti-btn-font-weight: 600;

  /* Banner */
  --consenti-banner-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  --consenti-banner-radius: 0;
  --consenti-banner-padding: 1.5rem;
  --consenti-banner-max-width: 960px;

  /* Modal */
  --consenti-modal-radius: 12px;
  --consenti-modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  --consenti-modal-width: 560px;
  --consenti-modal-max-height: 80vh;

  /* Toggle */
  --consenti-toggle-on: #1565c0;
  --consenti-toggle-off: #ccc;

  /* Typography */
  --consenti-font-size-base: 14px;
  --consenti-font-size-mult: 1;
  --consenti-font-family: system-ui, -apple-system, sans-serif;
}
```

### Via JS theme config

```ts
new ConsentiSetup({
  core: {
    regulation: 'gdpr',
    theme: {
      primaryColor: '#7c3aed',       // purple brand
      primaryTextColor: '#ffffff',
      borderRadius: '12px',
      buttonBorderRadius: '999px',   // pill buttons
      fontFamily: 'Inter, sans-serif',
    },
  },
})
```

### Dark mode

```ts
new ConsentiSetup({
  core: { profileId: 1 },
  darkMode: true,  // or: window.matchMedia('(prefers-color-scheme: dark)').matches
})
```

### BEM class reference

**Banner:**

| Class                              | Element                                      |
|------------------------------------|----------------------------------------------|
| `.consenti-banner`                 | Banner root element                          |
| `.consenti-banner--top`            | Position modifier (`top` / `middle` / `left-bottom` / `right-bottom`) |
| `.consenti-banner--gpc`            | GPC banner modifier                          |
| `.consenti-banner__heading`        | Banner heading                               |
| `.consenti-banner__text`           | Banner HTML text                             |
| `.consenti-banner__buttons`        | Button row                                   |
| `.consenti-banner__close`          | Close × button                               |

**Modal:**

| Class                              | Element                                      |
|------------------------------------|----------------------------------------------|
| `.consenti-overlay`                | Full-screen overlay backdrop                 |
| `.consenti-modal`                  | Modal root                                   |
| `.consenti-modal__heading`         | Modal heading                                |
| `.consenti-modal__categories`      | Category list                                |
| `.consenti-category`               | Single category block                        |
| `.consenti-category__toggle`       | Category enable/disable toggle               |
| `.consenti-category__toggle--mandatory` | Disabled toggle for mandatory categories |
| `.consenti-modal__buttons`         | Button row                                   |

**Buttons:**

| Class                    | Description              |
|--------------------------|--------------------------|
| `.consenti-btn`          | Base button              |
| `.consenti-btn--primary` | Primary CTA (filled)     |
| `.consenti-btn--secondary` | Secondary (outlined)   |
| `.consenti-btn--text`    | Text/link style          |
| `.consenti-btn--submit`  | Save in modal            |
| `.consenti-btn--manage`  | Opens preference modal   |

---

## Framework Guides

### React

```tsx
'use client'  // Next.js App Router

import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({
      core: { regulation: 'gdpr', locale: 'en' },
    })
    return () => widget.destroy()
  }, [])

  return null
}
```

#### `useConsent` hook

```tsx
import { useConsent } from '@consenti/ui/react'

export function AnalyticsButton() {
  const { hasConsent, consent, showModal } = useConsent()

  if (!hasConsent) return <button onClick={showModal}>Enable Analytics</button>

  return <span>{consent?.analytics === 'granted' ? 'Analytics on' : 'Analytics off'}</span>
}
```

### Next.js App Router

```tsx
// app/layout.tsx
import { ConsentSetup } from '@/components/ConsentSetup'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConsentSetup />
        {children}
      </body>
    </html>
  )
}
```

```tsx
// components/ConsentSetup.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { ConsentiSetup as WidgetType } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

export function ConsentSetup() {
  const widgetRef = useRef<WidgetType | null>(null)

  useEffect(() => {
    let widget: WidgetType
    import('@consenti/ui').then(({ ConsentiSetup }) => {
      widget = new ConsentiSetup({
        core: { regulation: 'gdpr', locale: 'en', autoHonorGPC: true },
        api: { enabled: true, baseUrl: process.env.NEXT_PUBLIC_API_URL },
      })
      widgetRef.current = widget
    })
    return () => widgetRef.current?.destroy()
  }, [])

  return null
}
```

### Vue 3 / Nuxt

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

let widget: unknown = null

onMounted(async () => {
  const { ConsentiSetup } = await import('@consenti/ui')
  await import('@consenti/ui/dist/index.css')
  widget = new ConsentiSetup({ core: { regulation: 'gdpr' } })
})

onBeforeUnmount(() => (widget as { destroy?: () => void })?.destroy?.())
</script>
```

#### Vue composable

```ts
import { useConsent } from '@consenti/ui/vue'
const { hasConsent, consent, showModal } = useConsent()
```

### Angular

```ts
// consent.service.ts
import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({ providedIn: 'root' })
export class ConsentService implements OnDestroy {
  private platformId = inject(PLATFORM_ID)
  private widget: unknown = null

  async init() {
    if (!isPlatformBrowser(this.platformId)) return
    const { ConsentiSetup } = await import('@consenti/ui')
    this.widget = new ConsentiSetup({ core: { regulation: 'gdpr' } })
  }

  ngOnDestroy() {
    (this.widget as { destroy?: () => void })?.destroy?.()
  }
}
```

Or use the built-in Angular service:

```ts
import { ConsentiService } from '@consenti/ui/angular'

@Component({ /* ... */ })
export class MyComponent {
  consent = inject(ConsentiService)
  // consent.hasConsent() | consent.showModal() | consent.getConsent()
}
```

### Vanilla JS

```js
import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

const widget = new ConsentiSetup({ core: { regulation: 'gdpr', locale: 'en' } })

document.querySelector('#cookie-settings')?.addEventListener('click', () => {
  widget.showModal()
})
```

---

## Plugins

```ts
import { ConsentiPlugin, ConsentiSetup } from '@consenti/ui'

class MyPlugin extends ConsentiPlugin {
  initialize(widget: ConsentiSetup) {
    console.log('Consenti ready')
  }

  destroy() {}

  onConsentSubmit(consent: Record<string, string>) {
    fetch('/my-api/consent', { method: 'POST', body: JSON.stringify(consent) })
  }

  onBannerShow() {}
  onBannerHide() {}
  onModalShow() {}
  onModalHide() {}
}

new ConsentiSetup({
  core: { regulation: 'gdpr' },
  plugins: [new MyPlugin()],
})
```

---

## SSR / Next.js / Nuxt

```ts
// Safe to call during SSR — silently no-ops, never touches the DOM:
const widget = new ConsentiSetup({ core: { regulation: 'gdpr' } })
// All browser API access is guarded by isClient() internally.
```

```ts
// SSR-safe React hook:
import { useConsent } from '@consenti/ui/react'
const { hasConsent } = useConsent()  // returns false during SSR
```

---

## Testing Utilities

```ts
import {
  mockAllGranted,
  mockAllDenied,
  simulateConsentSubmitted,
} from '@consenti/ui/testing'

mockAllGranted()   // fake-grant all cookies for unit tests
mockAllDenied()    // fake-deny all
simulateConsentSubmitted({ analytics: 'granted' })
```

---

## Minimal Recipes

```ts
// CCPA opt-out (no banner shown)
new ConsentiSetup({ core: { regulation: 'ccpa' } })

// Cross-subdomain consent
new ConsentiSetup({ core: { regulation: 'gdpr', storage: 'cookie', cookieDomains: '.example.com' } })

// Authenticated user — cross-device sync via API
new ConsentiSetup({ core: { regulation: 'gdpr', userId: '{{ server_user_id }}' }, api: { enabled: true } })

// GPC strict mode + GTM
new ConsentiSetup({
  core: { regulation: 'gdpr', autoHonorGPC: 'strict' },
  utils: { gtm: { containerId: 'GTM-XXXXXX', adsDataRedaction: true } },
})
```

---

## TypeScript

All types are exported from the main entry:

```ts
import type {
  ConsentiConfig,       // top-level config object
  CoreConfig,           // core section
  ApiConfig,            // api section
  UtilsConfig,          // utils section
  GtmConfig,            // utils.gtm section
  ThemeConfig,          // core.theme section
  ConsentValue,         // 'granted' | 'denied' | 'objected'
  ConsentiProfile,      // local profile class
} from '@consenti/ui'
```

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
