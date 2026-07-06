# @consenti/ui

Zero-dependency, GDPR-compliant cookie consent widget for any web framework.

[![npm version](https://img.shields.io/npm/v/@consenti/ui.svg)](https://www.npmjs.com/package/@consenti/ui)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)
[![Browser](https://img.shields.io/badge/browser-ES2020%2B-lightgrey.svg)](https://caniuse.com)

---

## Why Consenti?

- **Zero runtime dependencies** — browser built-ins only (`fetch`, `crypto.subtle`, `BroadcastChannel`, `CustomEvent`, `document.cookie`, `localStorage`)
- **Fully standalone or API-connected** — works offline with pre-built profiles, or connects to `@consenti/api` for dashboard-managed profiles
- **Multi-regulation** — GDPR, CCPA, CPRA, LGPD, DPDPA, PIPL, and more via 8 built-in compliance groups
- **Automatic geo-resolution** — detects visitor jurisdiction client-side (timezone + language) or server-side (`/resolve-profile`)
- **GPC aware** — Global Privacy Control signal detection with `'honor'` / `'strict'` / `'ignore'` modes per profile
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
  new ConsentiSetup({ compliance: { type: 'opt-in' } })
</script>
```

### ESM in the browser (no bundler)

```html
<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({ compliance: { type: 'opt-in' } })
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
// Simplest possible — auto-detects jurisdiction from browser timezone + language
new ConsentiSetup({})

// Fixed GDPR (EU opt-in) profile, no backend required
new ConsentiSetup({ compliance: { type: 'opt-in' } })

// API-backed — server geo-resolves the right profile per visitor
new ConsentiSetup({
  api: { enabled: true, baseUrl: 'https://your-backend.com' },
})
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
  // ── Core (optional) ──────────────────────────────────────────────────────────
  core: {
    tenantId: 'acme',              // identifies your tenant's profiles; default: 'default'
    locale: 'en',                  // BCP 47; 'auto' = navigator.language; default: 'auto'
    autoHonorGPC: true,            // explicit operator override: false | true | 'strict'
                                   // overrides profile.gpcMode when set
    storage: 'cookie',             // 'cookie' | 'localStorage'; default: 'cookie'
    cookieDomains: '.example.com', // comma-separated; first entry used as Domain attribute
    cookieSigningKey: 'min-32-char-secret', // HMAC-SHA256 signing; implicit from presence
    allowReceipt: true,            // allow consent receipt download; default: false
    disableCssTemplate: false,     // skip all style injection; default: false
    userId: 'server-assigned-uuid', // authenticated users — enables cross-device sync

    // Pre-built profile fallback
    usePrebuiltProfiles: 'all',    // 'all' (default) | ['opt-in', 'opt-out', ...] (non-empty)
                                   // controls which of the 8 built-in profiles are available
                                   // as fallbacks when the API is unavailable
    cacheResolvedProfiles: true,   // cache /resolve-profile response in sessionStorage; default: true
    console: ['error'],            // log levels emitted: 'info' | 'log' | 'warning' | 'error'
                                   // default: ['error'] only — no noise in production

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

  // ── Compliance routing (optional) ─────────────────────────────────────────
  compliance: {
    // 'auto'              → geo-resolve per visitor (default)
    //                       api.enabled=true  → server resolves via /resolve-profile
    //                       api.enabled=false → resolves client-side from timezone + language
    // ComplianceGroupId   → fixed group for all visitors (skip geo)
    // localProfileType    → use a locally registered ConsentiProfile
    type: 'auto',

    // Client-side geo resolver (used only when api.enabled = false)
    // 'default' → browser timezone + navigator.language heuristic (built-in, zero deps)
    // WidgetCountryResolverFn → custom async function: () => Promise<{ country, region, confidence }>
    geoDataProvider: 'default',

    // Age gate (optional)
    ageGate: {
      enabled: false,
      minimumAge: 13,
      requireParentalConsent: false,
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
    tenantId: 'acme',                   // overrides core.tenantId for API calls
    complianceGroup: 'opt-in',          // pin a specific group on the API side (Scenario 2B)
    trustDomain: false,                 // true = bypass allowedOrigins check (use in dev only)
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

## Compliance Groups

Consenti ships 8 pre-built English profiles, one per compliance group. The active group is resolved automatically per visitor (API or client-side) or fixed globally via `compliance.type`.

| Group                      | Region / Law                  | Model      | GPC Default |
|----------------------------|-------------------------------|------------|-------------|
| `'opt-in'`                 | EU / EEA — GDPR               | Opt-in     | `'honor'`   |
| `'opt-out'`                | California — CCPA             | Opt-out    | `'honor'`   |
| `'opt-out-strict'`         | California — CPRA             | Strict opt-out | `'strict'` |
| `'opt-in-dpdpa'`           | India — DPDPA                 | Opt-in     | `'honor'`   |
| `'opt-in-china'`           | China — PIPL                  | Opt-in     | `'ignore'`  |
| `'opt-in-brazil'`          | Brazil — LGPD                 | Opt-in     | `'honor'`   |
| `'general-privacy-consent'`| Global / general              | Opt-in     | `'honor'`   |
| `'notice-only'`            | Informational                 | Notice     | `'ignore'`  |

### Fixed group (no geo-routing)

```ts
// All visitors see the GDPR opt-in banner
new ConsentiSetup({ compliance: { type: 'opt-in' } })

// All visitors see the CCPA opt-out notice
new ConsentiSetup({ compliance: { type: 'opt-out' } })
```

### Auto geo-routing (default)

```ts
// Client-side: timezone + navigator.language → compliance group
new ConsentiSetup({ compliance: { type: 'auto' } })

// Server-side: /resolve-profile → right profile per visitor country
new ConsentiSetup({
  api: { enabled: true, baseUrl: 'https://consent.example.com' },
  compliance: { type: 'auto' },
})
```

---

## Profile Resolution Scenarios

| Scenario | When | How |
|---|---|---|
| **1A** | `api.enabled = false`, `compliance.type = 'auto'` | Timezone + language → group → pre-built profile |
| **1B** | `api.enabled = false`, `compliance.type = ComplianceGroupId` | Direct pre-built profile load |
| **2A** | `api.enabled = true`, `compliance.type = 'auto'` | `GET /resolve-profile?tz&lang&locale&tenantId` → `filePath` → static JSON |
| **2B** | `api.enabled = true`, `compliance.type = ComplianceGroupId` | `GET /profiles/:tenantId/:group/:locale.json` |
| **Local** | `compliance.type = localKey` + registered `ConsentiProfile` | Locally registered profile |
| **Fallback** | Any fetch failure | Pre-built profile → `DEFAULT_PROFILE` |

The `/resolve-profile` response URL is cached in `sessionStorage` for 1 hour per tab (`core.cacheResolvedProfiles`). The profile JSON itself is HTTP-cached via `Cache-Control: public, max-age=3600` on the server.

### Domain allowlist

If a profile's `allowedOrigins` list is configured on the server, the widget checks `window.location.origin` against it before using the profile. A mismatch falls back to the pre-built profile for that group.

Set `api.trustDomain: true` to bypass this check (useful for localhost / dev environments where `allowedOrigins` contains only production domains).

---

## GPC — Global Privacy Control

GPC mode is set per-profile on the server (`gpcMode: 'honor' | 'strict' | 'ignore'`). Widget config (`core.autoHonorGPC`) overrides the profile value when explicitly set.

```ts
// Respect profile's gpcMode setting (default)
new ConsentiSetup({ compliance: { type: 'opt-in' } })

// Force honor GPC regardless of profile setting
new ConsentiSetup({ core: { autoHonorGPC: true } })

// Force strict GPC — pre-deny silently, no banner
new ConsentiSetup({ core: { autoHonorGPC: 'strict' } })
```

| `core.autoHonorGPC` | Effect |
|---|---|
| `undefined` (default) | Profile's `gpcMode` takes effect |
| `false` | GPC signal always ignored |
| `true` | `'honor'` — pre-deny GPC cookies; show GPC banner variant |
| `'strict'` | Pre-deny silently — no banner shown |

---

## Profiles

### Pre-built profiles (no backend)

The widget includes 8 pre-built English profiles as dynamic-import chunks. Only the matched chunk downloads at runtime.

```ts
// GDPR banner — no server needed
new ConsentiSetup({ compliance: { type: 'opt-in' } })

// CCPA notice — no server needed
new ConsentiSetup({ compliance: { type: 'opt-out' } })

// Restrict which pre-built profiles are available as fallbacks
new ConsentiSetup({
  core: { usePrebuiltProfiles: ['opt-in', 'opt-out'] },
})
```

### Local profile (no backend)

Define a full profile in JavaScript — no server required.

```ts
import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'

const profile = new ConsentiProfile({
  defaultLocale: 'en',
  complianceGroup: 'opt-in',
  cookies: [
    { id: 'necessary',  mandatory: true,  expiry: 365 },
    { id: 'analytics',  listenGpc: true,  expiry: 365 },
    { id: 'marketing',  listenGpc: true,  expiry: 365,  cpraCategory: 'sale' },
    // cpraCategory: 'sale' | 'sharing' | 'sensitive' — used by CPRA group
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
          { text: 'Reject Optional',    style: 'secondary', action: 'custom', cookies: '!' },
          { text: 'Customize',          style: 'secondary', action: 'manage' },
          { text: 'Privacy Policy',     style: 'text',      action: 'link',   url: '/privacy' },
        ],
      },
      gpcBanner: {               // shown instead of mainBanner when GPC detected
        position: 'bottom',
        heading: 'Privacy signal detected',
        headingTag: 'h2',
        showLocaleSwitcher: false,
        htmlText: "Your browser's GPC signal was detected. Ad cookies have been pre-denied.",
        buttons: [
          { text: 'Understood', style: 'primary',   action: 'custom', cookies: '!' },
          { text: 'Customize',  style: 'secondary', action: 'manage' },
        ],
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        headingTag: 'h2',
        subheading: 'Choose which cookies you allow.',
        htmlText: 'We use different types of cookies. You can enable or disable each category below.',
        position: 'center',       // 'left' | 'right' | 'center'
        showClose: true,
        showLocaleSwitcher: false,
        persistent: false,        // true = cannot dismiss by clicking outside
        overlayOpacity: 50,
        mobileFullScreenBreakpoint: 576,
        buttons: [
          { text: 'Accept All',       style: 'primary', action: 'custom', cookies: '*' },
          { text: 'Save Preferences', style: 'primary', action: 'submit' },
          { text: 'Reject Optional',  style: 'text',    action: 'custom', cookies: '!' },
        ],
        categories: [
          {
            id: 'cat-necessary',
            heading: 'Strictly Necessary',
            headingTag: 'h3',
            htmlText: 'Required for the site to function. <strong>Cannot be disabled.</strong>',
            mandatory: true,
            cookies: ['necessary'],
          },
          {
            id: 'cat-analytics',
            heading: 'Analytics',
            htmlText: 'Helps us understand how visitors use the site.',
            type: 'consent',     // 'consent' | 'legitimate_interest'
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
  compliance: { type: profile.getComplianceGroup() },
})
```

### API profile (with backend)

```ts
new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://consent.example.com',
    tenantId: 'acme',
  },
  // compliance.type: 'auto' resolves the right profile per visitor country
})
```

The widget calls `GET /resolve-profile?tz&lang&locale&tenantId`, receives the profile file path, then fetches that static JSON directly. Falls back to pre-built profile if the API is unavailable.

---

## Cookie Format

Consent is persisted as a single cookie named `consenti_{userId}_{profileId}`.

```
t:{unixTimestamp}::{cookieId}:{status}|{cookieId}:{status}|…[::sig:{hmac}]
```

Example:
```
t:1782133054::analytics:granted|marketing:denied|necessary:granted::sig:abc123
```

The consent cookie lifetime equals the shortest `cookie.expiry` value across all profile cookies (in days, converted to `max-age` seconds). When that cookie expires the browser deletes it, the widget sees no consent, and re-shows the banner.

---

## Debugging

```ts
new ConsentiSetup({
  core: {
    console: ['error', 'warning', 'info'],  // add 'log' for verbose output
  },
})
```

The default is `['error']` only — no noise in production. Add levels when investigating profile resolution, GPC behavior, or domain allowlist failures. All Consenti log lines are prefixed `[Consenti]`.

---

## Widget API Methods

```ts
const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })

// Consent state
widget.hasConsent()                      // boolean — true if valid consent record exists
widget.getConsent()                      // Record<string, 'granted'|'denied'|'objected'> | null
widget.getGTMConsent()                   // consent in GTM / Google Consent Mode v2 format
widget.getConsentDate()                  // Date | false — time of last submission
widget.isCookieGranted('analytics')      // boolean — true if that cookie is 'granted'
widget.isCookieGranted('analytics', true)// 'granted' | 'denied' | 'objected' | false
widget.isCategoryGranted('cat-analytics')          // boolean — true if ALL cookies in category are granted
widget.isCategoryGranted('cat-analytics', true)    // [{ analytics: 'granted' }, { pixel: 'denied' }]

// Visibility
widget.showBanner(gpc?)          // show main banner (or GPC variant)
widget.hideBanner()              // hide banner
widget.showModal()               // open preference modal
widget.hideModal()               // close preference modal
widget.bannerVisibility()        // 'main' | 'gpc' | false
widget.modalVisibility()         // 'preference' | false

// Bulk consent actions
widget.grantAll()                // grant all cookies and dismiss banner
widget.grantAll(true)            // grant only mandatory; deny everything else
widget.denyAll()                 // deny non-mandatory; mandatory stay 'granted'
widget.denyAll(true)             // deny all including mandatory (logs a warning)

// Actions
widget.init()                    // manually start init (when autoInit: false)
widget.onReady(callback)         // called once widget is fully initialised
widget.switchLocale(locale)      // switch locale and re-render (e.g. 'fr', 'de-AT')
widget.submitConsent(consent)    // programmatically submit consent values
widget.deleteConsent()           // delete consent record (cookie + backend if enabled)
widget.reConsent()               // delete consent and re-show banner
widget.destroy()                 // unmount DOM elements and remove all event listeners

// Runtime configuration
widget.setDarkMode()             // toggle dark mode
widget.setDarkMode(true)         // force dark on
widget.setDarkMode(false)        // force light
widget.setTheme({ primaryColor: '#ff0000' })  // hot-swap CSS tokens (merges into current theme)
widget.setConfig({ darkMode: true })          // deep-merge partial config (no re-init)
widget.setProfile({ mainBanner: { heading: 'Updated' } })  // re-render UI with new profile data

// Diagnostics
widget.version()                 // { package: '1.0.0', profileVersion: 2, consentVersion: 1 }
```

### Consent checks

```ts
// Gate analytics code on a single cookie
if (widget.isCookieGranted('analytics_storage')) {
  initAnalytics()
}

// Read the raw status string when you need it
const status = widget.isCookieGranted('marketing', true) // 'granted' | 'denied' | 'objected' | false

// Gate a feature on an entire category (all cookies in category must be granted)
if (widget.isCategoryGranted('cat-analytics')) {
  loadHeatmaps()
}

// Inspect each cookie's status in a category
const statuses = widget.isCategoryGranted('cat-marketing', true)
// [{ ad_storage: 'granted' }, { ad_personalization: 'denied' }]
```

### Typed event subscriptions

```ts
// Both forms are accepted — 'consenti:' prefix is optional
const handler = (data) => console.log('Consent saved:', data.consent)
widget.on('consentSubmitted', handler)

// Remove later (must pass the same function reference)
widget.off('consentSubmitted', handler)

// Available event names:
// 'bannerInitialized' | 'bannerVisibility' | 'modalVisibility'
// 'consentBeingSubmitted' | 'consentSubmitted'
```

### Manual init

```ts
const widget = new ConsentiSetup({
  compliance: { type: 'opt-in' },
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

// Or use the convenience methods:
await widget.grantAll()   // accept all
await widget.denyAll()    // reject all non-mandatory
```

---

## Events

Custom DOM events fire on `window` at every lifecycle step. All are prefixed `consenti:`.

| Event                          | Fired when                                               |
|--------------------------------|----------------------------------------------------------|
| `consenti:bannerInitialized`   | Widget initialises and determines banner visibility      |
| `consenti:bannerVisibility`    | Banner shows or hides                                    |
| `consenti:modalVisibility`     | Preference modal shows or hides                          |
| `consenti:consentBeingSubmitted` | User clicked a consent button (before API call)        |
| `consenti:consentSubmitted`    | Consent saved (cookie written + API call if configured)  |

**Recommended:** use `widget.on()` / `widget.off()` for typed subscriptions (the `consenti:` prefix is optional):

```ts
const handler = (data: ConsentEvent) => console.log(data.consent)
widget.on('consentSubmitted', handler)
widget.off('consentSubmitted', handler)  // same reference to unsubscribe
```

**Raw DOM listeners** (equivalent):

```ts
window.addEventListener('consenti:consentSubmitted', (e: Event) => {
  const detail = (e as CustomEvent<ConsentEvent>).detail
})
```

---

## GTM / Google Consent Mode v2

```ts
new ConsentiSetup({
  compliance: { type: 'opt-in' },
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
  // bind: true (default) — auto-removes script on consent revoke, re-injects on re-grant
  // bind: false          — check consent once at construction; never auto-remove
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
  compliance: { type: 'opt-in' },
  core: {
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
  compliance: { type: 'opt-in' },
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
      compliance: { type: 'opt-in' },
      core: { locale: 'en' },
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
        api: { enabled: true, baseUrl: process.env.NEXT_PUBLIC_API_URL },
        core: { autoHonorGPC: true },
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
  widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })
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
    this.widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })
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

const widget = new ConsentiSetup({ compliance: { type: 'opt-in' }, core: { locale: 'en' } })

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
  compliance: { type: 'opt-in' },
  plugins: [new MyPlugin()],
})
```

---

## SSR / Next.js / Nuxt

```ts
// Safe to call during SSR — silently no-ops, never touches the DOM:
const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })
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

mockAllGranted(['analytics', 'marketing'])   // fake-grant these cookies for unit tests
mockAllDenied(['analytics', 'marketing'])    // fake-deny these cookies
simulateConsentSubmitted({ analytics: 'granted' })
```

---

## Minimal Recipes

```ts
// Auto geo-route — no backend, client-side timezone + language heuristic
new ConsentiSetup({})

// CCPA opt-out for all visitors
new ConsentiSetup({ compliance: { type: 'opt-out' } })

// Cross-subdomain consent
new ConsentiSetup({ core: { storage: 'cookie', cookieDomains: '.example.com' } })

// Authenticated user — cross-device sync via API
new ConsentiSetup({
  core: { userId: '{{ server_user_id }}' },
  api: { enabled: true },
})

// GPC strict mode + GTM
new ConsentiSetup({
  core: { autoHonorGPC: 'strict' },
  utils: { gtm: { containerId: 'GTM-XXXXXX', adsDataRedaction: true } },
})

// Verbose debug logging during development
new ConsentiSetup({
  core: { console: ['error', 'warning', 'info', 'log'] },
})
```

---

## TypeScript

All types are exported from the main entry:

```ts
import type {
  ConsentiConfig,           // top-level config object
  CoreConfig,               // core section
  ApiConfig,                // api section
  ComplianceWidgetConfig,   // compliance section
  AgeGateWidgetConfig,      // compliance.ageGate section
  WidgetCountryResolverFn,  // custom geo resolver function type
  UtilsConfig,              // utils section
  GtmConfig,                // utils.gtm section
  ThemeConfig,              // core.theme section
  ConsentValue,             // 'granted' | 'denied' | 'objected'
  ConsentiProfile,          // local profile class
  NonEmptyArray,            // [T, ...T[]] — used by usePrebuiltProfiles
} from '@consenti/ui'
```

### Breaking changes from v0.0.x

The following `CoreConfig` fields were **removed** in v0.1.x:

| Removed field        | Replacement |
|----------------------|-------------|
| `core.profileId`     | Use `compliance.type` with a compliance group or local profile key |
| `core.regulation`    | Use `compliance.type` — compliance group is derived server-side or from pre-built profiles |
| `core.signCookies`   | Implicit: set `core.cookieSigningKey` to enable signing; no separate flag needed |
| `core.privacyPolicyUrl` | Add a link button directly in the profile banner/modal `buttons` array with `action: 'link'` |

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
