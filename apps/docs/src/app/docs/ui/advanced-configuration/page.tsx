import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'UI Widget — Advanced Configuration',
  description:
    'Advanced configuration options for the Consenti UI widget ConsentiSetup(config) — every field is optional.',
  alternates: { canonical: 'https://consenti.dev/docs/ui/advanced-configuration' },
  openGraph: {
    title: 'UI Widget — Advanced Configuration',
    description:
      'Advanced configuration options for the Consenti UI widget ConsentiSetup(config) — every field is optional.',
    url: 'https://consenti.dev/docs/ui/advanced-configuration',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI Widget — Advanced Configuration',
    description:
      'Advanced configuration options for the Consenti UI widget ConsentiSetup(config) — every field is optional.',
    images: ['/og-image.jpg'],
  },
}

export default function UIAdvancedConfigurationPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Advanced Configuration</h1>
      <p>
        <code>new ConsentiSetup(config)</code> accepts a single <code>ConsentiConfig</code> object.
        All top-level keys are optional — the widget works with an empty config object,
        auto-detecting the compliance group from the browser. New here? Start with the{' '}
        <a href="/docs/ui/configuration/">Configuration quick start</a> instead — this page is the
        complete reference, every field with its default value.
      </p>

      <h2>Full configuration reference</h2>
      <p>Every available option shown with its default value.</p>

      <CodeBlock
        lang="ts"
        filename="Full config — every field shown"
        code={`import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({
  // ── Compliance group (optional) ──────────────────────────────────────────────
  compliance: {
    type: 'opt-in',              // see Compliance groups table below
    geoDataProvider: undefined,  // custom function to resolve visitor country
    // Age gate is a per-profile dashboard setting now, not a widget config option —
    // see "UI Widget — Age Gate" guide. The widget reads it off the resolved profile automatically.
    tcf: {                       // see "TCF v2.3 Implementation Guide"; cmpId/cmpVersion
      enabled: false,            // must match the backend's tcf config
      cmpId: 0,
      cmpVersion: 1,
    },
    gpp: {                       // IAB GPP (US National section); must match the backend's gpp config
      enabled: false,
      cmpId: 0,
      cmpVersion: 1,
      mspaCoveredTransaction: false,
      mspaOptOutOptionMode: 0,   // 0 = not applicable | 1 = yes | 2 = no
      mspaServiceProviderMode: 0,
    },
  },

  // ── Core behaviour (optional) ───────────────────────────────────────────────
  core: {
    tenantId: 'my-site',         // logical identifier for this installation
    locale: 'en',                // BCP 47; falls back to language prefix, then 'en'
    dir: 'auto',                 // 'ltr' | 'rtl' | 'auto' — 'auto' derives from locale
    storage: 'cookie',           // 'cookie' | 'localStorage'
    cookieName: 'consenti_data', // cookie/localStorage key name; default: 'consenti_data'
    cookieDomains: '.example.com',
    cookieSigningKey: undefined, // set to HMAC-sign the consent cookie; unset = unsigned
    allowReceipt: true,
    disableCssTemplate: false,
    userId: 'server-assigned-uuid', // authenticated users only
    usePrebuiltProfiles: 'all',  // 'all' | [ComplianceGroupId, ...] — load pre-built profiles instead of resolving via the API
    cacheResolvedProfiles: true, // cache resolved profile in sessionStorage (1h TTL)
    console: ['error', 'warn'],  // log levels to emit; 'error' | 'warn' | 'info' | 'debug'
    theme: {
      colorBg: '#ffffff',
      colorText: '#1a1a1a',
      colorTextMuted: '#6b7280',
      colorPrimary: '#1565c0',
      colorPrimaryText: '#ffffff',
      colorSecondary: '#f0f4f8',
      colorSecondaryText: '#1a3460',
      colorBorder: '#e2e8f0',
      colorSecondaryBorder: '#1a3460',
      colorOverlay: '#04111f',
      colorAccent: '#d32f2f',
      colorAccentText: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontFamilyMono: 'ui-monospace, monospace',
      fontSizeBase: '14px',
      fontSizeHeading: '18px',
      fontSizeMultiplier: '1',
      fontWeightHeading: '600',
      lineHeight: '1.5',
      spacingXs: '5px',
      spacingSm: '8px',
      spacingMd: '16px',
      spacingLg: '24px',
      borderRadius: '8px',
      borderRadiusBtn: '4px',
      shadow: '0 4px 24px rgba(21, 101, 192, 0.14)',
      toggleBgOn: '#1565c0',
      toggleBgPartial: '#97c098',
      toggleBgOff: '#cccccc',
      toggleKnob: '#ffffff',
      toggleWidth: '52px',
      toggleHeight: '28px',
      zBanner: '9999',
      zOverlay: '9998',
      zModal: '10000',
    },
  },

  // ── Mount point (optional) ───────────────────────────────────────────────────
  rootEl: '#consenti-root', // CSS selector or HTMLElement; omit to use document.body

  // ── Dark mode (optional) ─────────────────────────────────────────────────────
  darkMode: false,               // true = apply dark colour tokens to the widget

  // ── Auto Initialize widget (optional) ────────────────────────────────────────
  autoInit: true,

  // ── Hide Powered By Consenti text from banner/modal (optional) ───────────────
  hidePoweredBy: true,

  // ── Backend API (optional) ──────────────────────────────────────────────────
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com',
    authToken: '',
    tenantId: 'my-site',         // tenant identifier sent with API requests
    complianceGroup: 'opt-in',   // skip auto-resolution; always fetch this group's profile
    trustDomain: false,          // bypass domain allowlist check (dev/test only)
  },

  // ── Integrations (optional) ─────────────────────────────────────────────────
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX',
      dataLayer: 'dataLayer',
      events: [],             // [] = all events
      urlPassthrough: true,
      adsDataRedaction: false,
    },
  },

  // ── Frontend plugins (optional) ─────────────────────────────────────────────
  plugins: [],

  // ── Runtime profile overrides (optional) ────────────────────────────────────
  profileOverride: {
    mainBanner: { position: 'top' },
  },
})`}
      />

      <hr />

      <h2>compliance</h2>
      <p>
        Selects which Compliance Group the widget applies. When omitted, Consenti auto-detects the
        appropriate group from the browser's <code>navigator.language</code> and optional geo data.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>type</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>auto-detected</td>
            <td>
              Compliance group key. Either one of the 8 built-in groups (see the table below), or an
              arbitrary string matching a profile authored in the dashboard against a{' '}
              <code>customComplianceGroup</code> instead of a built-in group — resolved the same way
              as a fixed built-in group (api mode required; no pre-built fallback exists for a
              custom group).
            </td>
          </tr>
          <tr>
            <td>
              <code>geoDataProvider</code>
            </td>
            <td>
              <code>WidgetCountryResolverFn</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Custom async function returning{' '}
              <code>
                {'{ country: string | null, region: string | null, confidence: number }'}
              </code>
              , plus an optional <code>complianceGroup?: string</code> — when set, that group is
              used directly and the country/region jurisdiction-map lookup (including any{' '}
              <code>overriddenRegions</code> carve-out) is skipped entirely. Used to improve
              auto-detection when the default timezone/locale-based heuristic is not accurate
              enough, or to route into an operator-defined custom group. Called once per session.
              Standalone mode only (no <code>api.enabled</code>) — ignored, with a warning, when
              the API is enabled, since the server resolves the compliance group in that mode
              (configure a server-side <code>compliance.geoDataProvider</code> instead).
            </td>
          </tr>
          <tr>
            <td>
              <code>complianceMap</code>
            </td>
            <td>
              <code>{"'default' | string | ComplianceMapData"}</code>
            </td>
            <td>
              <code>&apos;default&apos;</code>
            </td>
            <td>
              Overrides the country→compliance-group mapping. Only meaningful in standalone mode
              (no <code>api.enabled</code>) — ignored, with a warning, when{' '}
              <code>api.enabled: true</code>, since the server resolves the group in that mode.{' '}
              <code>&apos;default&apos;</code> keeps the embedded map; a URL string is fetched and
              used as the map (the browser&apos;s own HTTP cache honors whatever{' '}
              <code>Cache-Control</code>/<code>ETag</code> the response sends); an inline object
              overrides specific countries directly. Invalid data from either source logs a warning
              and falls back to <code>&apos;default&apos;</code>. Does not affect country/region
              detection itself — only the final group lookup.
            </td>
          </tr>
          <tr>
            <td>
              <code>tcf</code>
            </td>
            <td>
              <code>TcfWidgetConfig</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              IAB TCF v2.3 client stub configuration —{' '}
              <code>{'{ enabled, cmpId, cmpVersion }'}</code>, must match the backend&apos;s{' '}
              <code>tcf</code> config. When enabled, installs
              <code>window.__tcfapi</code>. See the &quot;TCF v2.3 Implementation Guide&quot;.
            </td>
          </tr>
          <tr>
            <td>
              <code>gpp</code>
            </td>
            <td>
              <code>GppWidgetConfig</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              IAB GPP (US National section) client stub configuration —{' '}
              <code>
                {
                  '{ enabled, cmpId, cmpVersion, mspaCoveredTransaction, mspaOptOutOptionMode, mspaServiceProviderMode }'
                }
              </code>
              , must match the backend&apos;s <code>gpp</code> config. Sale/sharing opt-out flags
              are derived automatically from the resolved profile&apos;s <code>cpraCategory</code>
              -tagged cookies and the visitor&apos;s actual consent. When enabled, installs{' '}
              <code>window.__gpp</code>. See the{' '}
              <a href="/docs/compliance/tcf-and-gpp-registration">
                TCF &amp; GPP Registration Guide
              </a>
              .
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Compliance groups</h3>
      <table>
        <thead>
          <tr>
            <th>type</th>
            <th>Model</th>
            <th>Covered regulations</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code className="whitespace-nowrap">opt-in</code>
            </td>
            <td>Opt-in</td>
            <td>GDPR, ePrivacy, UK GDPR, PECR, Switzerland revFADP, KVKK, PDPA-TH, Quebec Law 25, Saudi/UAE/Qatar/Bahrain/Oman PDPL</td>
            <td>
              Banner on first visit; all non-mandatory cookies denied until granted. Default when no
              type given and browser locale maps to EU/EEA.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">opt-out</code>
            </td>
            <td>Opt-out</td>
            <td>CCPA, US state laws</td>
            <td>
              All cookies default to <code>granted</code>; consent written silently; no banner
              unless user visits a "Do Not Sell" page.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">opt-out-strict</code>
            </td>
            <td>Strict Opt-out</td>
            <td>CPRA (California 2023)</td>
            <td>
              Supersedes CCPA. Opt-out for sale/sharing; opt-in required for sensitive data. GPC
              triggers both Do Not Sell and Do Not Share.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">opt-in-dpdpa</code>
            </td>
            <td>Opt-in (DPDPA)</td>
            <td>DPDPA (India 2023)</td>
            <td>
              Fiduciary name + grievance officer rendered in modal. Age gate required for children
              under 18. GPC signal ignored.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">opt-in-china</code>
            </td>
            <td>Opt-in (China)</td>
            <td>PIPL (China 2021)</td>
            <td>
              Separate consent required for each processing purpose. Cross-border transfer rules
              enforced.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">opt-in-brazil</code>
            </td>
            <td>Opt-in (Brazil)</td>
            <td>LGPD</td>
            <td>10 lawful bases; ANPD-enforced; parental consent gate for under-12.</td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">general-privacy-consent</code>
            </td>
            <td>General consent</td>
            <td>PIPEDA (Canada), POPIA (South Africa), APPI (Japan), South Korea PIPA, and 30+ other jurisdictions with no strict cookie-banner law</td>
            <td>
              Full-flexibility mode: no region-specific behaviours enforced. Configure the banner
              entirely via your profile.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">notice-only</code>
            </td>
            <td>Notice only</td>
            <td>Informational / no opt-in law applies</td>
            <td>
              Consent written automatically as <code>granted</code> for all cookies. Banner shown
              once as a notice, no action required.
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        This is the summary. For the full list of every country/region mapped to a group, the
        regulations behind each one, and how <code>customComplianceGroup</code> profiles work, see
        the <a href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</a>.
      </Callout>

      <CodeBlock
        lang="ts"
        filename="Using a custom geo resolver"
        code={`import type { WidgetCountryResolverFn } from '@consenti/ui'

// geoDataProvider only runs for compliance.type: 'auto' — a fixed type (e.g. 'opt-in')
// never calls it, since there's no group to detect.
const geoResolver: WidgetCountryResolverFn = async () => {
  const res = await fetch('/api/geo')
  const data = await res.json()
  return { country: data.country, region: data.region ?? null, confidence: data.confidence ?? 1 }
}

new ConsentiSetup({
  compliance: {
    type: 'auto',
    geoDataProvider: geoResolver,
  },
})

// Or skip the jurisdiction-map lookup entirely when your source already knows the group:
const consentModelResolver: WidgetCountryResolverFn = async () => {
  const res = await fetch('/api/geo')
  const data = await res.json()
  return {
    country: data.country,
    region: data.region ?? null,
    confidence: 1,
    complianceGroup: data.consentModel, // e.g. an operator-defined custom group id
  }
}`}
      />

      <hr />

      <h2>core</h2>
      <p>Controls widget behaviour, consent storage, and theming. All keys are optional.</p>

      <h3>Tenant &amp; locale</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>tenantId</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Logical identifier for this installation. Sent with API requests and used to namespace
              consent records when multiple Consenti instances share the same backend.
            </td>
          </tr>
          <tr>
            <td>
              <code>locale</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'en'</code>
            </td>
            <td>
              BCP 47 locale code, e.g. <code>'fr'</code>, <code>'fr-CA'</code>. Resolution order:
              exact match → language prefix → <code>defaultLocale</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="gpc">GPC</h3>
      <p>
        There is no top-level widget config key for GPC — it's a per-profile setting,{' '}
        <code>gpcMode</code>, defaulted by the resolved compliance group and overridable via{' '}
        <code>profileOverride</code> or the dashboard's Profile Editor.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>gpcMode</code> (per-profile)
            </td>
            <td>
              <code>'ignore' | 'honor' | 'strict'</code>
            </td>
            <td>compliance-group dependent</td>
            <td>
              How to handle the browser's Global Privacy Control signal.
              <code>'ignore'</code> = do nothing. <code>'honor'</code> = deny{' '}
              <code>listenGpc</code> cookies and show the GPC banner variant once.
              <code>'strict'</code> = deny and write consent silently — no banner shown.
              <code>opt-out</code> and <code>opt-out-strict</code> default to{' '}
              <code>'honor'</code>; every other built-in group defaults to <code>'ignore'</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-out-strict' },
  profileOverride: {
    gpcMode: 'strict', // deny silently, no banner shown
  },
})`}
      />

      <h4>Freezing trackers before the SDK loads</h4>
      <p>
        <code>gpcMode</code> is applied once the widget initializes — after its bundle has been
        fetched, parsed, and executed. On a page where GTM/gtag.js or another tag-loading script
        sits earlier in <code>&lt;head&gt;</code>, that script can still fire before Consenti gets a
        chance to deny it. <code>buildSyncGpcSnippet()</code> closes that window: it returns a tiny,
        dependency-free <code>&lt;script&gt;</code> string you place <strong>first</strong> in{' '}
        <code>&lt;head&gt;</code>, ahead of GTM/gtag.js and the Consenti bundle itself. It checks{' '}
        <code>navigator.globalPrivacyControl</code> synchronously and, if set, pushes the same
        denied-by-default Google Consent Mode v2 defaults Consenti's own <code>gtm</code> config
        pushes on init — so there's no gap for a GPC-flagged visitor.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { buildSyncGpcSnippet } from '@consenti/ui'

// Server-side (e.g. a Next.js layout, or any template that renders <head>):
buildSyncGpcSnippet() // default dataLayer name
buildSyncGpcSnippet({ dataLayerName: 'myDataLayer' }) // custom dataLayer name`}
      />
      <CodeBlock
        lang="html"
        code={`<head>
  <!-- 1. Sync GPC freeze — first, before anything else that loads tags -->
  <script>(function(){if(typeof navigator!=="undefined"&&navigator.globalPrivacyControl===true){window.dataLayer=window.dataLayer||[];if(typeof window.gtag!=="function"){window.gtag=function(){window.dataLayer.push(arguments)}}window.gtag("consent","default",{ad_storage:"denied",analytics_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",functionality_storage:"granted",personalization_storage:"denied",security_storage:"granted",ads_data_redaction:"true",url_passthrough:"false"});window.__consentiGpcPreFrozen=true}})();</script>

  <!-- 2. GTM / gtag.js -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>

  <!-- 3. Consenti's own bundle, loaded normally -->
  <script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
</head>`}
      />
      <Callout type="info">
        Harmless to run twice: Consenti's own <code>gtm</code> config pushes the identical defaults
        again once it initializes — Google's consent API just takes the latest value per key, so
        the second push is a no-op, not a conflict. This snippet only ever narrows the window
        between page load and Consenti initializing; it does not replace configuring{' '}
        <code>gpcMode</code>.
      </Callout>

      <h3>Profile resolution</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>usePrebuiltProfiles</code>
            </td>
            <td>
              <code>{"'all' | [ComplianceGroupId, ...]"}</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              <code>'all'</code> lazy-loads the pre-built profile chunk for any resolved compliance
              group; an array restricts pre-built loading to just those groups (others fall through
              to the API or <code>profileOverride</code>). Leave unset when <code>api.enabled</code>{' '}
              is your source of truth.
            </td>
          </tr>
          <tr>
            <td>
              <code>cacheResolvedProfiles</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>true</code>
            </td>
            <td>
              When <code>true</code>, the resolved profile URL from the API's{' '}
              <code>/resolve-profile</code> endpoint is cached in <code>sessionStorage</code> with a
              1-hour TTL, avoiding redundant network requests on every page load.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Storage</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>storage</code>
            </td>
            <td>
              <code>'cookie' | 'localStorage'</code>
            </td>
            <td>
              <code>'cookie'</code>
            </td>
            <td>
              Where consent is persisted in the browser.
              <code>cookie</code> works across subdomains when <code>cookieDomains</code> is set.
              <code>localStorage</code> is scoped to the exact origin and cannot be shared across
              subdomains. In API mode the server always issues its own cookie regardless.
            </td>
          </tr>
          <tr>
            <td>
              <code>cookieName</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'consenti_data'</code>
            </td>
            <td>
              Name of the consent cookie/localStorage key. Not switched automatically by detected
              region — set it explicitly if you want a different name, e.g.{' '}
              <code>'euconsent-v2'</code> (the IAB TCF convention). That name is only meaningful
              for operators using the spec-correct binary TCF encoder (<code>@consenti/api</code>{' '}
              + the optional <code>@iabtechlabtcf/core</code> peer dependency) — it implies IAB's
              binary encoding, not Consenti's own simplified format.
            </td>
          </tr>
          <tr>
            <td>
              <code>cookieDomains</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Comma-separated domain list, e.g. <code>'.example.com,.sub.example.com'</code>. The
              first entry is used as the <code>Domain</code> attribute on the consent cookie, making
              it readable on all subdomains of that domain.
            </td>
          </tr>
          <tr>
            <td>
              <code>cookieSigningKey</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              HMAC-signs the local consent cookie so tampering is detectable client-side. Unset =
              unsigned. Independent of the backend's own <code>compliance.dataSigningHash</code>,
              which signs server-stored consent records.
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="warning">
        <strong>Client-side verification is inherently spoofable in standalone mode.</strong>{' '}
        <code>cookieSigningKey</code> ships inside the browser bundle for any deployment that uses{' '}
        <code>@consenti/ui</code> without the <code>@consenti/api</code> backend — that's the only
        place the key can live if there's no server to hold it. Anyone can read it out of your
        shipped JS and re-sign a forged cookie with it, so this check only detects accidental
        tampering (e.g. a stale value from an older config), not a motivated attacker. If you need
        consent records that hold up as evidence, sign them server-side instead with
        <code>compliance.dataSigningHash</code> (<code>@consenti/api</code>), where the key never
        reaches the browser.
      </Callout>

      <h3>Visitors &amp; receipts</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>userId</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Server-assigned UUID for authenticated users. When set, replaces the browser-generated
              visitor ID. Combined with API mode, this enables cross-device consent synchronisation
              — consent granted on mobile is recognised on desktop.
            </td>
          </tr>
          <tr>
            <td>
              <code>allowReceipt</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              When <code>true</code>, a &quot;Download consent receipt&quot; checkbox appears in the
              preference modal footer. Checking it before saving triggers a JSON download containing
              a timestamped record of the user's choices.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>CSS &amp; logging</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>disableCssTemplate</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              When <code>true</code>, no <code>&lt;style&gt;</code> tag is injected at all. Use this
              when you provide your own stylesheet and want full control over every rule. All BEM
              class names still apply.
            </td>
          </tr>
          <tr>
            <td>
              <code>console</code>
            </td>
            <td>
              <code>Array&lt;'error' | 'warn' | 'info' | 'debug'&gt;</code>
            </td>
            <td>
              <code>['error']</code>
            </td>
            <td>
              Log levels to emit to the browser console. Pass an empty array to suppress all output.
              Add <code>'debug'</code> during development to trace profile resolution and consent
              storage.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>core.theme</h3>
      <p>
        Inline CSS token overrides. Each key maps directly to a <code>--consenti-*</code> CSS custom
        property injected on the widget root element at runtime. You only need to set the values you
        want to change — unset keys keep their stylesheet default. For full CSS control, see the{' '}
        <a href="/docs/ui/themes/">Themes &amp; CSS guide</a>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>CSS variable</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>colorBg</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-bg</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#ffffff</code>
            </td>
            <td>Background colour for banners and modals.</td>
          </tr>
          <tr>
            <td>
              <code>colorText</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-text</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#1a1a1a</code>
            </td>
            <td>Primary body text colour.</td>
          </tr>
          <tr>
            <td>
              <code>colorPrimary</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-primary</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#1565c0</code>
            </td>
            <td>Primary button background and interactive accent colour.</td>
          </tr>
          <tr>
            <td>
              <code>colorPrimaryText</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-primary-text</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#ffffff</code>
            </td>
            <td>
              Text colour rendered on top of <code>colorPrimary</code> backgrounds.
            </td>
          </tr>
          <tr>
            <td>
              <code>colorSecondary</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-secondary</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#f0f4f8</code>
            </td>
            <td>Secondary / ghost button background.</td>
          </tr>
          <tr>
            <td>
              <code>colorSecondaryText</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-secondary-text</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#1a3460</code>
            </td>
            <td>Text colour for secondary buttons.</td>
          </tr>
          <tr>
            <td>
              <code>colorBorder</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-border</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#e2e8f0</code>
            </td>
            <td>Borders and dividers.</td>
          </tr>
          <tr>
            <td>
              <code>colorAccent</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-accent</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#d32f2f</code>
            </td>
            <td>
              Background for <code>accent</code>-style buttons (destructive actions).
            </td>
          </tr>
          <tr>
            <td>
              <code>colorAccentText</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-accent-text</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#ffffff</code>
            </td>
            <td>
              Text colour on top of <code>colorAccent</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>fontFamily</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-font-family</code>
            </td>
            <td>
              <code className="whitespace-nowrap">system-ui, sans-serif</code>
            </td>
            <td>Font stack applied to all widget text.</td>
          </tr>
          <tr>
            <td>
              <code>fontSizeBase</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-font-size-base</code>
            </td>
            <td>
              <code className="whitespace-nowrap">14px</code>
            </td>
            <td>Base font size for body content.</td>
          </tr>
          <tr>
            <td>
              <code>fontSizeHeading</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-font-size-heading</code>
            </td>
            <td>
              <code className="whitespace-nowrap">inherit</code>
            </td>
            <td>Font size for banner and modal headings.</td>
          </tr>
          <tr>
            <td>
              <code>fontSizeMultiplier</code>
            </td>
            <td>
              <em>none — computed</em>
            </td>
            <td>
              <code className="whitespace-nowrap">unset</code>
            </td>
            <td>
              Not a passthrough CSS var — read once at init and used to multiply the computed{' '}
              <code>--consenti-font-size-base</code>/<code>--consenti-font-size-heading</code>{' '}
              pixel values in place. <code>'1.1'</code> = 10% larger throughout.
            </td>
          </tr>
          <tr>
            <td>
              <code>borderRadius</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-border-radius</code>
            </td>
            <td>
              <code className="whitespace-nowrap">8px</code>
            </td>
            <td>Border-radius for banner and modal containers.</td>
          </tr>
          <tr>
            <td>
              <code>borderRadiusBtn</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-border-radius-btn</code>
            </td>
            <td>
              <code className="whitespace-nowrap">4px</code>
            </td>
            <td>Border-radius applied to all button elements.</td>
          </tr>
          <tr>
            <td>
              <code>toggleBgOn</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-toggle-bg-on</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#1565c0</code>
            </td>
            <td>Background of toggle switches in the ON (granted) state.</td>
          </tr>
          <tr>
            <td>
              <code>toggleBgOff</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-toggle-bg-off</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#cccccc</code>
            </td>
            <td>Background of toggle switches in the OFF (denied) state.</td>
          </tr>
          <tr>
            <td>
              <code>colorTextMuted</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-text-muted</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#949dab</code>
            </td>
            <td>Secondary/de-emphasised text colour (footer metadata, helper text).</td>
          </tr>
          <tr>
            <td>
              <code>colorSecondaryBorder</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-secondary-border</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#1a2e4a</code>
            </td>
            <td>Border colour for elements on the secondary background.</td>
          </tr>
          <tr>
            <td>
              <code>colorOverlay</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-overlay</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#04111f</code>
            </td>
            <td>Backdrop colour behind the preference modal.</td>
          </tr>
          <tr>
            <td>
              <code>fontFamilyMono</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-font-family-mono</code>
            </td>
            <td>
              <code className="whitespace-nowrap">ui-monospace, monospace</code>
            </td>
            <td>Monospace font (e.g. the metadata footer&apos;s consent ID).</td>
          </tr>
          <tr>
            <td>
              <code>fontWeightHeading</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-font-weight-heading</code>
            </td>
            <td>
              <code className="whitespace-nowrap">600</code>
            </td>
            <td>Font weight for banner/modal headings.</td>
          </tr>
          <tr>
            <td>
              <code>lineHeight</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-line-height</code>
            </td>
            <td>
              <code className="whitespace-nowrap">1.5</code>
            </td>
            <td>Base line height for body text.</td>
          </tr>
          <tr>
            <td>
              <code>spacingXs</code> / <code>spacingSm</code> / <code>spacingMd</code> /{' '}
              <code>spacingLg</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-spacing-{'{xs,sm,md,lg}'}</code>
            </td>
            <td>
              <code className="whitespace-nowrap">5px / 8px / 16px / 24px</code>
            </td>
            <td>Spacing scale used throughout the banner/modal layout.</td>
          </tr>
          <tr>
            <td>
              <code>shadow</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-shadow</code>
            </td>
            <td>
              <code className="whitespace-nowrap">0 4px 24px rgba(21,101,192,.14)</code>
            </td>
            <td>Box shadow on the banner/modal container.</td>
          </tr>
          <tr>
            <td>
              <code>toggleBgPartial</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-toggle-bg-partial</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#97c098</code>
            </td>
            <td>Background of toggle switches in a partial/mixed-consent state.</td>
          </tr>
          <tr>
            <td>
              <code>toggleKnob</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-toggle-knob</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#ffffff</code>
            </td>
            <td>Toggle switch knob colour.</td>
          </tr>
          <tr>
            <td>
              <code>toggleWidth</code> / <code>toggleHeight</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-toggle-{'{width,height}'}</code>
            </td>
            <td>
              <code className="whitespace-nowrap">52px / 28px</code>
            </td>
            <td>Toggle switch dimensions.</td>
          </tr>
          <tr>
            <td>
              <code>zBanner</code> / <code>zOverlay</code> / <code>zModal</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-z-{'{banner,overlay,modal}'}</code>
            </td>
            <td>
              <code className="whitespace-nowrap">9999 / 9998 / 10000</code>
            </td>
            <td>Stacking order for the banner, its overlay, and the preference modal.</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="Minimal theme override"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  core: {
    theme: {
      colorPrimary: '#7c3aed',      // purple accent
      colorPrimaryText: '#ffffff',
      borderRadius: '12px',
      borderRadiusBtn: '999px',  // pill buttons
      fontFamily: 'Inter, sans-serif',
    },
  },
})`}
      />

      <hr />

      <h2 id="api">api</h2>
      <p>
        Connects the widget to the Consenti backend. When enabled, consent records are posted to the
        API and the active profile is resolved via <code>/resolve-profile</code>. Disabled by
        default — the widget works fully offline without it.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>enabled</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              When <code>true</code>, the widget calls <code>/resolve-profile</code> to find the
              best profile for the visitor and posts consent records to the API. Falls back to a
              pre-built profile if the API request fails.
            </td>
          </tr>
          <tr>
            <td>
              <code>baseUrl</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>window.location.origin</code>
            </td>
            <td>
              Root URL where <code>@consenti/api</code> is mounted. The widget appends{' '}
              <code>/consenti/api/v1/...</code> to this value. Set explicitly when the API is on a
              different domain. Always point this at the origin server — not a CDN domain. Every
              request under this base is dynamic (<code>/resolve-profile</code> geo-resolves per
              visitor, <code>/consent</code> writes records) and can&apos;t be served from a CDN or
              cached at the edge. A CDN (CloudFront, etc.) can still front the resolved profile
              JSON itself when the backend&apos;s <code>s3Api</code> is enabled — see{' '}
              <a href="/docs/api/advanced-configuration/#s3Api">
                s3Api and the CloudFront worked example
              </a>{' '}
              — but that&apos;s a separate path from this <code>baseUrl</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>authToken</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>''</code>
            </td>
            <td>
              Sent as <code>Authorization: Bearer &lt;token&gt;</code> on every API request. Leave
              empty for public / unauthenticated access.
            </td>
          </tr>
          <tr>
            <td>
              <code>tenantId</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Tenant identifier sent with API requests. Required when the backend serves multiple
              tenants. Must match the tenant configured in the dashboard.
            </td>
          </tr>
          <tr>
            <td>
              <code>complianceGroup</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              When set, skips the <code>/resolve-profile</code> auto-resolution call and always
              fetches the profile for this specific compliance group. Useful for regional
              deployments or A/B testing.
            </td>
          </tr>
          <tr>
            <td>
              <code>trustDomain</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Bypasses the domain allowlist check on the resolved profile. Only use during local
              development or trusted server-side rendering. Never set to <code>true</code> in
              production.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="API mode — auto-resolve"
        code={`new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://consent.example.com', // API is on a subdomain
  },
  // compliance group resolved automatically per-visitor via /resolve-profile
})`}
      />

      <CodeBlock
        lang="ts"
        filename="API mode — fixed compliance group"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  api: {
    enabled: true,
    baseUrl: 'https://consent.example.com',
    complianceGroup: 'opt-in', // always fetch the GDPR-model profile
  },
})`}
      />

      <Callout type="info">
        When <code>api.enabled</code> is <code>true</code> and the network request fails (offline,
        server error), the widget silently falls back to the pre-built profile for the detected
        compliance group, then to the built-in default. Consent submission retries are not automatic
        — use the <a href="/docs/ui/events/">events</a> API to implement your own retry logic.
      </Callout>

      <hr />

      <h2>utils.gtm</h2>
      <p>
        Google Tag Manager / Google Consent Mode v2 integration. Setting <code>utils.gtm</code> to
        any object (even <code>{'{}'}</code>) turns on real Consent Mode signalling: a{' '}
        <code>gtag(&apos;consent&apos;, &apos;default&apos;, …)</code> call as soon as the widget
        initializes — before any tag can fire — and{' '}
        <code>gtag(&apos;consent&apos;, &apos;update&apos;, …)</code> on every consent submission.
        This uses the standard <code>gtag</code> stub-queue pattern, so it works whether your own
        gtag.js/GTM snippet loads before or after Consenti — you do <em>not</em> need gtag.js
        already on the page.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>containerId</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              GTM container ID, e.g. <code>'GTM-XXXXXX'</code>. When set, Consenti injects the GTM
              library itself — omit if you already load GTM/gtag.js separately (Consent Mode
              signalling still works either way, since it only depends on <code>utils.gtm</code>{' '}
              being configured, not on this field).
            </td>
          </tr>
          <tr>
            <td>
              <code>dataLayer</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'dataLayer'</code>
            </td>
            <td>
              Name of the dataLayer array on <code>window</code>. Override only when your site uses
              a custom variable name (rare).
            </td>
          </tr>
          <tr>
            <td>
              <code>verbose</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              When <code>true</code>, additionally mirrors every <code>consenti:*</code> event
              (banner shown, modal opened, etc.) onto the dataLayer as a generic{' '}
              <code>{'{ event, content }'}</code> push — for custom, non-Consent-Mode GTM triggers.
              Off by default, so the dataLayer only carries real consent signals.
            </td>
          </tr>
          <tr>
            <td>
              <code>events</code>
            </td>
            <td>
              <code>string[]</code>
            </td>
            <td>
              <code>[]</code>
            </td>
            <td>
              Only relevant when <code>verbose: true</code> — narrows which event names get
              mirrored. An empty array (default) means all events. Has no effect on the core Consent
              Mode <code>gtag('consent', …)</code> calls, which always fire regardless.
            </td>
          </tr>
          <tr>
            <td>
              <code>urlPassthrough</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Calls <code>gtag('set', 'url_passthrough', true)</code> alongside every consent
              update. Enables Google Consent Mode v2 &quot;cookieless pings&quot; — Google can model
              conversions even when <code>ad_storage</code> is denied.
            </td>
          </tr>
          <tr>
            <td>
              <code>adsDataRedaction</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Calls <code>gtag('set', 'ads_data_redaction', true)</code> when{' '}
              <code>ad_storage</code> is denied, causing Google to redact identifying fields from ad
              pings.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="GTM + Consent Mode v2"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX', // omit if you load GTM/gtag.js yourself
      urlPassthrough: true,      // cookieless conversion modelling
      adsDataRedaction: true,    // redact ad pings when consent denied
    },
  },
})`}
      />

      <hr />

      <h2>plugins</h2>
      <p>
        An array of frontend plugin instances to initialise alongside the widget. Each plugin
        receives the widget&apos;s public API surface via its <code>initialize(widget)</code> method
        and can hook into consent events, inject DOM, or forward consent signals to third-party
        services.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { SegmentPlugin } from '@consenti/ui-plugin-segment'

new ConsentiSetup({
  compliance: { type: 'opt-in' },
  plugins: [
    new SegmentPlugin({ writeKey: 'YOUR_WRITE_KEY' }),
  ],
})`}
      />
      <p>
        See the <a href="/docs/ui/plugins/">Plugins guide</a> for the full plugin API and available
        first-party plugins.
      </p>

      <hr />

      <h2>profileOverride</h2>
      <p>
        Accepts a <code>Partial&lt;ResolvedProfile&gt;</code> that is deep-merged on top of the
        resolved profile after it has been loaded (from the API, a pre-built profile, a local{' '}
        <code>ConsentiProfile</code>, or the built-in default). Only the keys you supply are applied
        — everything else is left unchanged.
      </p>
      <p>
        This is a runtime override only. It does not affect the stored profile. See the{' '}
        <a href="/docs/ui/advanced-profiles/">Advanced Profile reference</a> for a full reference
        and examples.
      </p>
      <CodeBlock
        lang="ts"
        filename="Override banner position per page"
        code={`// Checkout page — move banner out of the way
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    mainBanner: { position: 'right-bottom' },
  },
})`}
      />
      <CodeBlock
        lang="ts"
        filename="Override buttons only"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    mainBanner: {
      buttons: {
        'accept': { text: 'Accept',  style: 'primary',   action: 'custom', cookies: '*' },
        'decline': { text: 'Decline', style: 'primary', action: 'custom', cookies: '!' },
      },
    },
  },
})`}
      />

      <h3>
        Deleting a key with <code>null</code>
      </h3>
      <p>
        Setting a key to <code>null</code> removes it from the merged result instead of leaving the
        base value in place (<a href="https://www.rfc-editor.org/rfc/rfc7396">JSON Merge Patch</a>{' '}
        semantics). This is how you remove a single entry from a keyed map — a cookie category, a
        parameter — without repeating the rest of that map&apos;s contents. Omitting a key (or
        setting it to <code>undefined</code>) still means &quot;leave the base value alone&quot; —
        only an explicit <code>null</code> deletes.
      </p>
      <CodeBlock
        lang="ts"
        filename="Remove the marketing category"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    preferenceModal: {
      categories: { marketing: null },   // deletes the 'marketing' category entirely
    },
  },
})`}
      />
      <p>
        To <em>replace</em> a whole map (say, swap every built-in button for your own), put{' '}
        <code>{"'*': null"}</code> in it: every base key your override doesn&apos;t name is deleted,
        and named keys are kept and merged. See{' '}
        <a href="/docs/ui/advanced-profiles/#replacing-a-map">Replacing a whole map</a>.
      </p>

      <hr />

      <h2>rootEl</h2>
      <p>
        By default the widget appends a <code>&lt;div id=&quot;consenti-root&quot;&gt;</code> to{' '}
        <code>document.body</code> and mounts banners and modals inside it. Use <code>rootEl</code>{' '}
        to mount into your own container instead.
      </p>
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Behaviour</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>string</code> (CSS selector)
            </td>
            <td>
              Resolved via <code>document.querySelector()</code>. Throws if the element is not
              found.
            </td>
          </tr>
          <tr>
            <td>
              <code>HTMLElement</code>
            </td>
            <td>Used directly. Throws if the element is not attached to the document.</td>
          </tr>
          <tr>
            <td>omitted</td>
            <td>
              Creates <code>#consenti-root</code> and appends it to <code>document.body</code>{' '}
              (default).
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="Mount into a specific wrapper"
        code={`// HTML: <div id="consent-wrapper"></div>
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  rootEl: '#consent-wrapper',   // CSS selector
  // rootEl: document.getElementById('consent-wrapper')!,  // or HTMLElement directly
})`}
      />

      <hr />

      <h2>darkMode</h2>
      <p>
        Enables dark colour tokens for the widget. Setting <code>darkMode: true</code> adds the{' '}
        <code>consenti-root--dark</code> class to the root element, which overrides all CSS custom
        properties to their dark equivalents.
      </p>
      <CodeBlock
        lang="ts"
        filename="Dark mode"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  darkMode: true,
})

// Or detect the user's OS preference:
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
})`}
      />

      <hr />

      <h2>autoInit</h2>
      <p>
        By default the widget begins initialising immediately when the constructor runs. Set{' '}
        <code>autoInit: false</code> to prevent this — the widget will not touch the DOM until you
        explicitly call <code>widget.init()</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>autoInit</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>true</code>
            </td>
            <td>
              When <code>false</code>, the constructor returns without initialising. Call{' '}
              <code>await widget.init()</code> manually to start the widget. After{' '}
              <code>destroy()</code> you can also call <code>init()</code> again to re-initialise
              the same instance.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="Deferred initialisation"
        code={`const widget = new ConsentiSetup({
  compliance: { type: 'opt-in' },
  rootEl: '#consent-mount',
  autoInit: false,
})

// Later, once the mount point exists in the DOM:
await widget.init()
widget.onReady(() => console.log('Ready:', widget.hasConsent()))`}
      />

      <hr />

      <h2>Minimal configs by use case</h2>

      <h3>Simplest possible — auto-detect compliance</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({ })`} />

      <h3>Explicit GDPR opt-in</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({ compliance: { type: 'opt-in' } })`} />

      <h3>CCPA opt-out (no banner)</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({ compliance: { type: 'opt-out' } })`} />

      <h3>Cross-subdomain consent</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  core: {
    storage: 'cookie',
    cookieDomains: '.example.com', // shared across app.example.com, www.example.com, etc.
  },
})`}
      />

      <h3>Authenticated user — cross-device sync</h3>
      <CodeBlock
        lang="ts"
        code={`// Server renders the page with the authenticated user's UUID
new ConsentiSetup({
  core: {
    userId: '{{ server_user_id }}',
  },
  api: { enabled: true },
})`}
      />

      <h3>GPC strict mode + GTM</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    gpcMode: 'strict', // deny silently, no banner shown
  },
  utils: {
    gtm: { containerId: 'GTM-XXXXXX', adsDataRedaction: true },
  },
})`}
      />

      <hr />

      <h2>TypeScript imports</h2>
      <CodeBlock
        lang="ts"
        code={`import type {
  ConsentiConfig,          // top-level config object
  ComplianceWidgetConfig,  // compliance section
  TcfWidgetConfig,         // compliance.tcf section
  WidgetCountryResolverFn, // custom geo resolver function type
  CoreConfig,              // core section
  ApiConfig,               // api section
  UtilsConfig,             // utils section
  GtmConfig,               // utils.gtm section
  ThemeConfig,             // core.theme section
} from '@consenti/ui'`}
      />
    </div>
  )
}
