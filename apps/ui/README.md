# @consenti/ui

GDPR-style cookie consent widget for any web framework — zero required runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@consenti/ui.svg)](https://www.npmjs.com/package/@consenti/ui)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)
[![Browser](https://img.shields.io/badge/browser-ES2020%2B-lightgrey.svg)](https://caniuse.com)

---

## Why Consenti?

- **Zero runtime dependencies** — browser built-ins only (`fetch`, `crypto.subtle`, `BroadcastChannel`, `CustomEvent`, `document.cookie`, `localStorage`)
- **Fully standalone or API-connected** — works offline with pre-built profiles, or connects to `@consenti/api` for dashboard-managed profiles
- **Multi-regulation** — Maintained: GDPR, CCPA, CPRA, LGPD. Partial: TCF v2.3 (real binary encoding requires the `@consenti/api` backend) — only relevant if you monetize through programmatic/RTB ad exchanges. In development: DPDPA. More via 8 built-in compliance groups — see [ECOSYSTEM.md](../../ECOSYSTEM.md) for per-regulation status

> **Registration is only needed for programmatic ad monetization.** For first-party analytics/marketing consent, Consenti is fully compliant with zero external registration. Consenti implements the IAB TCF/GPP technical specs but is **not** itself a registered CMP; if you do need TCF/GPP, you must register your own `cmpId` with IAB Europe/MSPA independently before going live — see the [TCF & GPP Registration Guide](https://consenti.dev/docs/compliance/tcf-and-gpp-registration).
- **Automatic geo-resolution** — detects visitor jurisdiction client-side (timezone + language) or server-side (`/resolve-profile`)
- **GPC aware** — Global Privacy Control signal detection with `'honor'` / `'strict'` / `'ignore'` modes per profile
- **GTM / Google Consent Mode v2** — built-in `dataLayer` integration
- **SSR-safe** — all browser API access is guarded; `new ConsentiSetup()` during SSR is a silent no-op
- **Fully typed** — ships TypeScript definitions; no `@types` needed
- **Companion CLI**: [`@consenti/scanner`](../scanner) crawls a site under none/reject-all/accept-all consent states and reports undeclared third-party trackers

---

## Browser Support

ES2020+ · Chrome 80+ · Firefox 74+ · Safari 13.1+

---

## Installation

### npm (recommended)

```bash
npm install @consenti/ui
```

Then import the class:

```ts
import { ConsentiSetup } from '@consenti/ui'
```

### CDN / UMD (no build step)

```html
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
Choose any approach to load stylesheet, by default it will be auto injected

| Approach                          | How                                                                   |
|-----------------------------------|-----------------------------------------------------------------------|
| Auto Injection (recommended)      | by default consenti will inject css                                   |
| Manual injection (avoids FOUC)    | `import '@consenti/ui/dist/index.css'` in your bundler entry or code and set `disableCssTemplate: true;` |
| Skip all CSS (bring your own)     | Set `core.disableCssTemplate: true` — no styles injected              |
| CSS custom properties only        | Import CSS, then override `--consenti-*` variables in your stylesheet |
| core.theme config in ConsentiSetup| Provide css variables for your stylesheet in the setup as js object   |

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

const widget = new ConsentiSetup({
  // ── Core (optional) ──────────────────────────────────────────────────────────
  core: {
    tenantId: 'acme',              // identifies your tenant's profiles; default: 'default'
    locale: 'en',                  // BCP 47; 'auto' = navigator.language; default: 'auto'
    dir: 'auto',                   // 'ltr' | 'rtl' | 'auto'; 'auto' derives from locale via
                                   // Intl.Locale(...).getTextInfo().direction (falls back to a
                                   // hand-maintained ar/he/fa/ur/ps/sd/ug/yi → rtl list on
                                   // engines without getTextInfo() support); default: 'auto'
    storage: 'cookie',             // 'cookie' | 'localStorage'; default: 'cookie'
    cookieName: 'consenti_data',   // cookie/localStorage key name; default: 'consenti_data'
                                   // not switched automatically by detected region — set
                                   // explicitly if you want a different name (e.g. 'euconsent-v2',
                                   // only meaningful if you're using the spec-correct binary TCF
                                   // encoder — @consenti/api + @iabtechlabtcf/core — since that
                                   // name implies IAB's binary format, not Consenti's own encoding)
    cookieDomains: '.example.com', // comma-separated; first entry used as Domain attribute
    cookieSigningKey: 'min-32-char-secret', // HMAC-SHA256 signing; implicit from presence
    allowReceipt: true,            // allow consent receipt download; default: false
    disableCssTemplate: false,     // skip all style injection; default: false
    userId: 'server-assigned-uuid', // authenticated users — enables cross-device sync
                                   // prefer widget.getUserId()/setUserId() (or the
                                   // consenti:listener:identify event) to change it after init

    // Pre-built profile fallback
    usePrebuiltProfiles: 'all',    // 'all' (default) | ['opt-in', 'opt-out', ...] (non-empty)
                                   // controls which of the 8 built-in profiles are available
                                   // as fallbacks when the API is unavailable
    cacheResolvedProfiles: true,   // cache /resolve-profile response in sessionStorage; default: true
    console: ['error'],            // log levels emitted: 'info' | 'log' | 'warning' | 'error'
                                   // default: ['error'] only — no noise in production

    // Field names mirror their --consenti-* CSS variable literally (--consenti-color-primary
    // → colorPrimary). Every field is optional and maps 1:1 to one CSS custom property — see
    // apps/ui/src/styles/_variables.scss for the full set of ~33 variables. Common ones:
    theme: {
      colorBg: '#ffffff',
      colorText: '#1a1a1a',
      colorTextMuted: '#949dab',
      colorPrimary: '#1565c0',
      colorPrimaryText: '#ffffff',
      colorSecondary: '#f0f4f8',
      colorSecondaryText: '#1a3460',
      colorBorder: '#e2e8f0',
      colorAccent: '#d32f2f',
      colorAccentText: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontSizeBase: '14px',
      fontSizeHeading: '18px',
      fontSizeMultiplier: '1',
      borderRadius: '8px',
      borderRadiusBtn: '4px',
      toggleBgOn: '#1565c0',
      toggleBgOff: '#cccccc',
      // ...plus colorSecondaryBorder, colorOverlay, fontFamilyMono, fontWeightHeading,
      // lineHeight, spacingXs/Sm/Md/Lg, shadow, toggleBgPartial, toggleKnob,
      // toggleWidth/Height, zBanner/Overlay/Modal
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

    // Only meaningful when api.enabled = false (ignored, with a warning, otherwise — the server
    // resolves the group in that mode). Only overrides country→group mapping; country/region
    // detection above always uses the embedded geo data.
    // 'default' → embedded map (default) | a URL string (fetched; the browser's own HTTP cache
    // honors whatever Cache-Control/ETag the response sends) | an inline ComplianceMapData object
    complianceMap: 'default',

    // TCF (IAB Transparency & Consent Framework) client stub (optional) — see "TCF" section below
    tcf: {
      enabled: false,
      cmpId: 0,       // must match the cmpId configured on the backend (TcfConfig)
      cmpVersion: 1,
    },

    // GPP (IAB Global Privacy Platform, US National section) client stub (optional) — see "GPP" section below
    gpp: {
      enabled: false,
      cmpId: 0,                    // must match the cmpId configured on the backend (GppConfig)
      cmpVersion: 1,
      mspaCoveredTransaction: false, // no honest default — required
      mspaOptOutOptionMode: 0,     // 0 = not applicable | 1 = yes | 2 = no
      mspaServiceProviderMode: 0,
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

### `profileOverride` — deep-merge and delete semantics

`profileOverride` (and `widget.setProfile()` at runtime) is deep-merged onto the resolved profile
— server-fetched, pre-built, or locally registered — before anything renders. Merge rules:

- Omitting a key (or setting it to `undefined`) leaves the resolved profile's value untouched.
- An object value merges recursively, key by key — you only need to specify what differs.
- An array value replaces/merges by index against the base array.
- Setting a key to `null` **deletes it** from the merged result (JSON Merge Patch / RFC 7396
  semantics). This is the way to remove a single entry from a keyed map — a cookie category, a
  parameter — without having to know or repeat the rest of that map's contents:

```ts
profileOverride: {
  preferenceModal: {
    categories: { marketing: null },   // removes the 'marketing' category entirely
  },
},
```

`{ marketing: undefined }` or `{ marketing: {} }` do **not** delete the entry — the former is a
no-op (same as omitting the key), the latter merges an empty object onto the existing category,
changing nothing. Only an explicit `null` removes it.

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
| **2B** | `api.enabled = true`, `compliance.type = ComplianceGroupId` | `GET /profiles/:tenantId/:group/:locale` |
| **Local** | `compliance.type = localKey` + registered `ConsentiProfile` | Locally registered profile |
| **Fallback** | Any fetch failure | Pre-built profile → `DEFAULT_PROFILE` |

The `/resolve-profile` response URL is cached in `sessionStorage` for 1 hour per tab (`core.cacheResolvedProfiles`). The profile JSON itself is HTTP-cached via `Cache-Control: public, max-age=3600` on the server.

### Domain allowlist

If a profile's `allowedOrigins` list is configured on the server, the widget checks `window.location.origin` against it before using the profile. A mismatch falls back to the pre-built profile for that group.

Set `api.trustDomain: true` to bypass this check (useful for localhost / dev environments where `allowedOrigins` contains only production domains).

---

## GPC — Global Privacy Control

GPC mode is set per-profile on the server (`gpcMode: 'honor' | 'strict' | 'ignore'`). Widget config profileOverrides overrides the profile value when explicitly set.

`gpcMode` only applies once the widget itself has loaded and initialized. If a tag-loading script
sits earlier in `<head>` (GTM/gtag.js, or another script), it can still fire before that. Use
`buildSyncGpcSnippet()` to close that gap — it returns a tiny, dependency-free `<script>` string to
place first in `<head>`, ahead of everything else, that checks `navigator.globalPrivacyControl`
synchronously and pre-freezes Google Consent Mode v2 to denied:

```ts
import { buildSyncGpcSnippet } from '@consenti/ui'

buildSyncGpcSnippet()                                  // default dataLayer name
buildSyncGpcSnippet({ dataLayerName: 'myDataLayer' })  // custom dataLayer name
```

Safe to run before Consenti's own `gtm` config pushes its defaults on init — same values, same
stub-queue, so the second push is a no-op rather than a conflict. Full walkthrough with the
`<head>` ordering: [Advanced Configuration → GPC](https://consenti.dev/docs/ui/advanced-configuration).

---

## Age Gate

Age gate is a **per-profile, per-locale** setting — not a widget-config option. GDPR Article 8's
consent age varies 13–16 by EU member state and DPDPA has its own child-data age rules, so one
global age doesn't fit a multi-region deployment. Enable it on a profile in the dashboard's Profile
Editor Step 1 (minimum age, optional parental-consent requirement), and author the modal's
heading/body/button text per locale in the Main Banner content step — the widget reads it off the
resolved profile (`profile.ageGate`/`profile.ageGateModal`) automatically, no widget config needed.
For a standalone/local profile (`registerProfile()`), set `ageGate`/`ageGateModal` directly on the
`EmbeddedProfile`/`EmbeddedTranslations` you register.

When enabled, it blocks every other consent UI (banner, GPC, CCPA opt-out — all of it waits behind
the age gate on first visit):

- **Confirmed** (visitor is old enough) → the normal banner/GPC/CCPA flow proceeds exactly as if
  the age gate didn't exist, and every consent submission from then on carries `ageVerified: true`.
- **Declined, `requireParentalConsent: false`** → a deny-all consent is submitted immediately
  (mandatory/strictly-necessary cookies still granted), no banner shown, `ageVerified: false`.
- **Declined, `requireParentalConsent: true`** → same deny-all submission, plus a
  `parentalConsentToken` is requested from the backend (`POST /consent/:visitorId/parental-consent-request`,
  signed with the backend's `compliance.dataSigningHash` when configured — falls back to a
  client-generated, unsigned token if `api.enabled` is false) and a
  `consenti:parentalConsentRequired` event fires carrying it. There's no email-sending pipeline
  built into this package — the event (or your backend's `eventBus.on('consent.parentalConsentRequired', ...)`
  listener, see the `@consenti/api` README's "Parental consent" section) is the hook for wiring
  your own out-of-band verification process.

When the parent later completes that process (often on a fresh page with no live widget instance —
their own device, not the child's), resolve the token with the standalone `resolveParentalConsent`
export instead of a `ConsentiSetup` method:

```ts
import { resolveParentalConsent } from '@consenti/ui'

const { visitorId, profileId } = await resolveParentalConsent(token, { baseUrl: 'https://consent.example.com' })
// dispatches consenti:parentalConsentResolved on window — a page with a live widget instance
// can listen for it and react (e.g. re-show the banner for the real consent choice); what
// "resolved" should actually do to consent state is host-defined, same as the request side.
```

This is plumbing, not verifiable parental consent by itself — see the `@consenti/api` README for
the full caveats (token replay isn't prevented, staying stateless is a deliberate tradeoff).

The prompt only asks once per visitor per profile — it doesn't re-appear once any consent record
exists (same "already decided" check the banner itself uses).

---

## TCF — IAB Transparency & Consent Framework

Set `compliance.tcf.enabled: true` to install `window.__tcfapi`, the standard IAB entry point
third-party ad-tech scripts call to read consent (`ping`, `getTCData`, `addEventListener`,
`removeEventListener`):

```ts
new ConsentiSetup({
  compliance: {
    tcf: { enabled: true, cmpId: 280, cmpVersion: 1 }, // cmpId must match the backend's TcfConfig
  },
})
```

The stub follows the standard queue-command convention, so it's safe regardless of load order
relative to third-party scripts that call `__tcfapi` before Consenti has initialized. Only one CMP
may own `window.__tcfapi` per page — if it's already set (a real CMP, or another `ConsentiSetup`
instance on a multi-profile page), this stub does not overwrite it.

This is a simplified implementation: `tcString` is a base64url-encoded JSON payload (the same
default format the backend's `tcfString` uses), not the full IAB binary bitfield encoding, and
vendor-list metadata (`gvlVersion`, `publisherCC`) is operator-supplied via `TcfWidgetConfig`
rather than fetched client-side (the GVL is multi-megabyte; IAB policy expects CMPs to cache their
own copy server-side rather than have every visitor's browser re-fetch it). `gdprApplies` is
derived automatically from the resolved profile's compliance group.

For spec-correct binary TC-string encoding, run with the `@consenti/api` backend, set
`compliance.tcf.publisherCC`, and install the optional `@iabtechlabtcf/core` peer dependency
(the actively-maintained IAB Tech Lab package — not `iabtcf-core`, which doesn't exist on npm).
See the [TCF & GPP Registration Guide](https://consenti.dev/docs/compliance/tcf-and-gpp-registration) for details.

---

## GPP — IAB Global Privacy Platform (US National)

Set `compliance.gpp.enabled: true` to install `window.__gpp`, the standard IAB entry point
scripts call for US state-privacy-law signals (`ping`, `addEventListener`, `removeEventListener`,
`getSection`, `hasSection`) — `usnat` (US National) section only:

```ts
new ConsentiSetup({
  compliance: {
    gpp: {
      enabled: true,
      cmpId: 280,                   // must match the backend's GppConfig
      cmpVersion: 1,
      mspaCoveredTransaction: true, // whether this deployment falls under MSPA signatory obligations
      mspaOptOutOptionMode: 1,      // 0 = not applicable | 1 = yes | 2 = no
      mspaServiceProviderMode: 0,
    },
  },
})
```

Sale/sharing opt-out flags are derived automatically from the resolved profile's cookies tagged
`cpraCategory: 'sale'` / `'sharing'` and the visitor's actual consent — no separate config needed.
Like TCF, only one CMP may own `window.__gpp` per page; this stub does not overwrite an existing one,
and follows the standard stub-queue convention so load order relative to third-party scripts doesn't
matter.

Unlike TCF, GPP's US National section needs no Global Vendor List, so both this stub's `gppString`
and the backend's `gppString` use the same real, spec-correct encoder when the optional
`@iabgpp/cmpapi` peer dependency is installed on `@consenti/api` — there's no "simplified fallback"
format the way TCF has. Without it, `gppString` falls back to a base64url-encoded JSON payload.

---

## RTL / Text Direction

`core.dir` controls the banner/modal's reading direction:

```ts
new ConsentiSetup({ core: { locale: 'ar', dir: 'auto' } }) // → rtl, derived from locale
new ConsentiSetup({ core: { dir: 'rtl' } })                 // explicit, independent of locale
```

`'auto'` (the default) maps a known RTL-language prefix (`ar`, `he`, `fa`, `ur`, `ps`, `sd`, `ug`,
`yi`) to `rtl`; anything else is `ltr`. The `dir` attribute is set on the widget's root element, so
browser-native mirroring (flex layout, `text-align: start/end`) and the widget's own `[dir="rtl"]`
CSS overrides (toggle switches, locale switcher, close button) apply automatically — no separate
RTL stylesheet needed. Explicit banner/modal position variants (`left-bottom`, `right-bottom`,
modal `left`/`right` slide-in) are **not** mirrored — those are screen positions you chose
deliberately, independent of text direction.

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
  cookies: {
    necessary: { purpose: 'necessary', listenGpc: false },
    analytics: { purpose: 'analytics', listenGpc: true },
    marketing: { purpose: 'marketing', listenGpc: true, cpraCategory: 'sale' },
    // cpraCategory: 'sale' | 'sharing' | 'sensitive' — used by CPRA group
  },
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
        buttons: {
          // key = machine id, rendered as the button's DOM id: `consenti-btn-{id}`, for targeting a specific button
          // cookies: '*' = grant all | '!' = deny all | ['id1','id2'] = grant specific
          'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
          'reject-optional': { text: 'Reject Optional', style: 'primary', action: 'custom', cookies: '!' }, // same weight as accept-all — CNIL requires reject not be visually subordinate
          customize: { text: 'Customize', style: 'secondary', action: 'manage' },
          'privacy-policy': { text: 'Privacy Policy', style: 'text', action: 'link', url: '/privacy' },
        },
      },
      gpcBanner: {               // shown instead of mainBanner when GPC detected
        position: 'bottom',
        heading: 'Privacy signal detected',
        headingTag: 'h2',
        showLocaleSwitcher: false,
        htmlText: "Your browser's GPC signal was detected. Ad cookies have been pre-denied.",
        buttons: {
          understood: { text: 'Understood', style: 'primary', action: 'custom', cookies: '!' },
          customize: { text: 'Customize', style: 'secondary', action: 'manage' },
        },
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
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
          'save-preferences': { text: 'Save Preferences', style: 'primary', action: 'submit' },
          'reject-optional': { text: 'Reject Optional', style: 'text', action: 'custom', cookies: '!' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            headingTag: 'h3',
            htmlText: 'Required for the site to function. <strong>Cannot be disabled.</strong>',
            legalBasis: 'mandatory',
            cookies: ['necessary'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText: 'Helps us understand how visitors use the site.',
            legalBasis: 'consent',     // 'mandatory' | 'consent' | 'legitimate_interest'
            cookies: ['analytics'],
          },
          marketing: {
            heading: 'Marketing',
            htmlText: 'Used to personalise ads and measure campaign performance.',
            legalBasis: 'consent',
            cookies: ['marketing'],
          },
        },
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

Consent is persisted as a single cookie named `consenti_data` with a compact JSON value:

```json
{"s":1,"v":2,"i":"5huf-…","u":"","t":1751692400,"g":0,"p":0,"c":{"analytics_storage":"g","ad_storage":"d"}}
```

| Field | Type | Meaning |
|---|---|---|
| `s` | number | Profile ID |
| `v` | number | Profile version |
| `i` | string | Per-submission UUID (consent receipt ID) |
| `u` | string | Logged-in user ID (`""` for anonymous) |
| `t` | number | Unix timestamp of consent |
| `g` | 0 \| 1 | GPC signal detected |
| `p` | number | Consent source: 0 = user click, 1 = widget method |
| `c` | object | Consent map: cookie ID → `"g"` (granted), `"o"` (objected), `"d"` (denied) |

When the widget is upgraded from an older version, any existing `consenti_{profileId}` cookie is automatically read, migrated to the new format, and deleted — no consent loss occurs.

The consent cookie lifetime equals the shortest `cookie.expiry` value across all profile cookies (in days, converted to `max-age` seconds). When that cookie expires the browser deletes it, the widget sees no consent, and re-shows the banner.

---

## Display Features

### Footer Metadata

When `showFooterMetadata: true` is set in the resolved profile, a metadata strip is injected inside the banner and modal after the main content. It shows the visitor's Consent ID (truncated UUID), Consent Date, Profile Version, and a "Privacy Settings" button that opens the preference modal.

Configured in the dashboard (ProfileEditor → Step 1) or via `profileOverride`:

```ts
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: { showFooterMetadata: true },
})
```

### Enhanced Accessibility

When `enhanceAccessibility: true` is set in the resolved profile, the class `.consenti--enhanced-a11y` is added to the root element. This applies:

- Minimum 44 × 44 px hit area on all buttons (WCAG 2.1 SC 2.5.5)
- 3 px solid focus ring (`outline-offset: 2px`) on all focusable elements
- No impact on default styling — opt-in only

```ts
profileOverride: { enhanceAccessibility: true }
```

### Responsive Button Stacking (`stackButtonsOnBreakpoint`)

Set `mainBanner.stackButtonsOnBreakpoint` (and/or `gpcBanner.stackButtonsOnBreakpoint`) to a pixel width. Below that breakpoint the banner's buttons stack vertically and stretch to full width — useful for narrow mobile screens where 3+ buttons overflow.

```ts
profileOverride: {
  mainBanner: { stackButtonsOnBreakpoint: 576 },  // px; 0 or undefined = disabled
}
```

A scoped `<style>` element containing a single `@media (max-width: Npx)` rule is injected into the root element — no external stylesheet required, and it's removed on `destroy()`.

### Modal Focus Trap (`trapFocus`)

When `preferenceModal.trapFocus: true`, keyboard Tab / Shift+Tab navigation is confined within the consent modal while it is open. `Escape` closes the modal and returns focus to the triggering element.

```ts
profileOverride: {
  preferenceModal: { trapFocus: true },
}
```

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
widget.getConsent('google-gtm')          // Google Consent Mode v2 format
widget.getConsent('category')            // { necessary, functional, preferences, analytics, marketing }
widget.getConsent('adobe')               // { analytics, target, manager, optimizer }
widget.getConsent('meta')                // { pixel, api, plugins, facebookLogin }
widget.getConsent('microsoft-clarity')   // { session, heatmaps, performance }
widget.getConsent('twilio-segment')      // { identify, page, track, group, alias }
widget.getGTMConsent()                   // @deprecated — use getConsent('google-gtm')
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

// Logged-in user identity
widget.getUserId()               // string | null — current application user ID
widget.setUserId('user-42')      // reconsents (by default) if it differs from the stored cookie's user
widget.setUserId(null)           // clear identity (e.g. logout)
widget.setUserId('user-42', false) // update identity without reconsenting
// Or dispatch from anywhere (e.g. right after your own login flow completes):
// window.dispatchEvent(new CustomEvent('consenti:listener:identify', { detail: { userId: 'user-42' } }))

// Runtime configuration
widget.setDarkMode()             // toggle dark mode
widget.setDarkMode(true)         // force dark on
widget.setDarkMode(false)        // force light
widget.setTheme({ colorPrimary: '#ff0000' })  // hot-swap CSS tokens (merges into current theme)
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
await widget.denyAll()    // Reject Optional non-mandatory
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
| `consenti:parentalConsentRequired` | Age gate declined with `requireParentalConsent: true` — carries `parentalConsentToken` |

The events above are **outbound** (widget → host). `consenti:listener:*` is the opposite
direction — **inbound** (host → widget), dispatched by your own code to tell the widget
something:

| Event                          | Dispatch when                                            |
|--------------------------------|----------------------------------------------------------|
| `consenti:listener:identify`   | Your own login/logout flow completes — `detail: { userId: string \| null, reConsent?: boolean }`, equivalent to calling `widget.setUserId(userId, reConsent)` |

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

Setting `utils.gtm` to any object (even `{}`) turns on real Consent Mode signalling — no gtag.js
needs to already be on the page, Consenti defines the standard stub itself.

```ts
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX', // omit if you load GTM/gtag.js yourself
      urlPassthrough: true,      // cookieless conversion modelling
      adsDataRedaction: true,    // redact ad pings when consent denied
    },
  },
})
```

**`GtmConfig` options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `containerId` | `string` | `undefined` | GTM container ID, e.g. `'GTM-XXXXXX'`. When set, Consenti injects the GTM library itself — omit if you already load GTM/gtag.js separately (Consent Mode signalling works either way). |
| `dataLayer` | `string` | `'dataLayer'` | Name of the dataLayer array on `window`. Override only for a custom variable name. |
| `verbose` | `boolean` | `false` | When `true`, additionally mirrors every `consenti:*` event onto the dataLayer as a generic `{ event, content }` push — for custom, non-Consent-Mode GTM triggers. |
| `events` | `string[]` | `[]` | Only relevant when `verbose: true` — narrows which event names get mirrored. Empty means all. Has no effect on the core `gtag('consent', …)` calls, which always fire. |
| `urlPassthrough` | `boolean` | `false` | Calls `gtag('set', 'url_passthrough', true)` alongside every consent update. |
| `adsDataRedaction` | `boolean` | `false` | Calls `gtag('set', 'ads_data_redaction', true)` when `ad_storage` is denied. |

Consenti calls the real `gtag()` consent API — via the standard stub-queue pattern, so it works
whether your own gtag.js/GTM snippet loads before or after Consenti:

```js
// On initialisation (default denied state)
gtag('consent', 'default', { analytics_storage: 'denied', ... })

// On submission
gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ... })

// Plus, when configured:
gtag('set', 'url_passthrough', true)
gtag('set', 'ads_data_redaction', true) // true when ad_storage is denied
```

Set `utils.gtm.verbose: true` to additionally mirror every `consenti:*` event onto the dataLayer
as a generic `{ event, content }` push — off by default.

`getConsent('google-gtm')` returns consent in Google Consent Mode v2 format. `getGTMConsent()` is a deprecated alias for the same call.

```ts
widget.getConsent('google-gtm')
// {
//   analytics_storage: 'granted',
//   ad_storage: 'denied',
//   ad_user_data: 'denied',
//   ad_personalization: 'denied',
//   functionality_storage: 'granted',
//   security_storage: 'granted',
//   ads_data_redaction: 'true',
//   url_passthrough: 'false',
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

### ConsentAction — run a callback on a parameter's grant status

For integrations that expose their own `sdk.optIn()`/`sdk.optOut()` API (Segment, Mixpanel,
Amplitude, Sentry, etc.) instead of a `<script>` tag — use `ConsentScript` for that case instead.

```ts
import { ConsentAction } from '@consenti/ui'

new ConsentAction({
  id: 'analytics_storage',
  widget,
  onGrant: () => analyticsSdk.optIn(),
  onDeny: () => analyticsSdk.optOut(),
  // bind: true (default) — re-fires on every future consent change
})
```

### CategoryScript / CategoryAction — gate on a whole category

Same as `ConsentScript`/`ConsentAction`, but keyed on a preference-modal category instead of a
single parameter — "granted" only when *every* parameter in the category is `'granted'`.

```ts
import { CategoryScript, CategoryAction } from '@consenti/ui'

new CategoryScript({ categoryId: 'marketing', widget, src: 'https://example.com/ad-pixel.js' })

new CategoryAction({
  id: 'marketing',
  widget,
  onGrant: () => adSdk.enableAll(),
  onDeny: () => adSdk.disableAll(),
})
```

### scanConsentScripts — declarative `data-*` script gating

Zero-JS integration path: mark `<script>` tags with `data-consenti-consent-script` /
`data-consenti-category-script` and Consenti scans and wires them up automatically at the end of
every `init()` cycle (call `scanConsentScripts(widget)` again manually after adding tags at runtime).

```html
<script type="text/plain" data-consenti-consent-script="analytics_storage" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
<script type="text/plain" data-consenti-category-script="marketing" src="https://example.com/pixel.js"></script>
<script type="text/plain" data-consenti-consent-script="ad_storage" data-consenti-bind="false">/* inline snippet, evaluated once */</script>
```

### BannerTrigger — open banner or modal from any element

```ts
import { BannerTrigger } from '@consenti/ui'

// Attach to existing element
new BannerTrigger({ widget, el: '#cookie-settings', action: 'modal' })

// Auto-create a button
const trigger = new BannerTrigger({ widget, action: 'modal', label: 'Manage Cookies' })
document.querySelector('#footer')?.appendChild(trigger.getElement())
```

---

## Themes & CSS

### CSS custom properties

Override any token in your own stylesheet:

```css
:root {
  /* Colors */
  --consenti-color-bg: #ffffff;
  --consenti-color-text: #1a2e4a;
  --consenti-color-text-muted: #949dab;
  --consenti-color-primary: #04111f;
  --consenti-color-primary-text: #ffffff;
  --consenti-color-secondary: #f0f4f8;
  --consenti-color-secondary-text: #1a2e4a;
  --consenti-color-border: #dbe4ee;
  --consenti-color-secondary-border: #1a2e4a;
  --consenti-color-overlay: #04111f;
  --consenti-color-accent: #d32f2f;
  --consenti-color-accent-text: #ffffff;

  /* Typography */
  --consenti-font-family: system-ui, -apple-system, sans-serif;
  --consenti-font-family-mono: ui-monospace, monospace;
  --consenti-font-size-base: 14px;
  --consenti-font-size-heading: 16px;
  --consenti-font-weight-heading: 600;
  --consenti-line-height: 1.5;

  /* Spacing */
  --consenti-spacing-xs: 5px;
  --consenti-spacing-sm: 8px;
  --consenti-spacing-md: 16px;
  --consenti-spacing-lg: 24px;

  /* Shape */
  --consenti-border-radius: 8px;
  --consenti-border-radius-btn: 0;
  --consenti-shadow: 0 4px 24px rgba(21, 101, 192, 0.14);

  /* Toggle (preference modal) */
  --consenti-toggle-bg-on: #43a047;
  --consenti-toggle-bg-partial: #97c098;
  --consenti-toggle-bg-off: #9ca3af;
  --consenti-toggle-knob: #ffffff;
  --consenti-toggle-width: 52px;
  --consenti-toggle-height: 28px;

  /* Stacking */
  --consenti-z-banner: 9999;
  --consenti-z-overlay: 9998;
  --consenti-z-modal: 10000;
}
```

### Via JS theme config

```ts
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  core: {
    theme: {
      colorPrimary: '#7c3aed',       // purple brand
      colorPrimaryText: '#ffffff',
      borderRadius: '12px',
      borderRadiusBtn: '999px',   // pill buttons
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

export function ConsentSetup() {
  const widgetRef = useRef<WidgetType | null>(null)

  useEffect(() => {
    let widget: WidgetType
    import('@consenti/ui').then(({ ConsentiSetup }) => {
      widget = new ConsentiSetup({
        api: { enabled: true, baseUrl: process.env.NEXT_PUBLIC_API_URL },
        core: {  },
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

Or use the built-in Angular integration (`setConsentiWidget()` once at app root, then
`injectConsent()` in any component/service):

```ts
import { injectConsent } from '@consenti/ui/angular'

@Component({ /* ... */ })
export class MyComponent {
  consent = injectConsent()
  // consent.hasConsent() | consent.showModal() | consent.getConsent()
  // consent.onConsentChange(cb) / onBannerChange(cb) / onModalChange(cb) — call in
  // ngOnInit, unsubscribe with the returned function in ngOnDestroy
}
```

### Vanilla JS

```js
import { ConsentiSetup } from '@consenti/ui'

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

// GTM
new ConsentiSetup({
  core: {},
  utils: { gtm: { containerId: 'GTM-XXXXXX', adsDataRedaction: true } },
})

// Verbose debug logging during development
new ConsentiSetup({
  core: { console: ['error', 'warning', 'info', 'log'] },
})

// Arabic site — RTL derived automatically from locale
new ConsentiSetup({ core: { locale: 'ar' } })

// COPPA — block under-13s, require parental consent: set on the profile in the dashboard
// (Profile Editor Step 1 → Enable age gate → minimum age 13, require parental consent), not here.

// TCF — install the __tcfapi stub for ad-tech scripts (cmpId must match the backend's tcf config)
new ConsentiSetup({
  compliance: { tcf: { enabled: true, cmpId: 280, cmpVersion: 1 } },
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
  WidgetCountryResolverFn,  // custom geo resolver function type
  UtilsConfig,              // utils section
  GtmConfig,                // utils.gtm section
  ThemeConfig,              // core.theme section
  IdentifyEventDetail,      // consenti:listener:identify event detail
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
| `core.privacyPolicyUrl` | Add a link button directly in the profile banner/modal `buttons` map with `action: 'link'` |

---

## Security notes

**`core.cookieSigningKey` is spoofable in standalone mode.** Without a `@consenti/api` backend,
this key has nowhere to live but the shipped browser bundle — so anyone can read it out of your JS
and re-sign a forged cookie with it. It still catches accidental tampering (e.g. a stale value from
an older config), but it is not tamper-*proof* against a motivated attacker. If you need consent
records that hold up as evidence, sign them server-side instead with `compliance.dataSigningHash`
(`@consenti/api`), where the key never reaches the browser.

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
