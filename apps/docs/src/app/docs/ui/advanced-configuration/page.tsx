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
    ageGate: {                   // see "UI Widget — Age Gate" guide
      enabled: false,
      minimumAge: 13,            // COPPA = 13; GDPR Article 8 = 16
      requireParentalConsent: false,
    },
    tcf: {                       // see "TCF v2.2 Implementation Guide"; cmpId/cmpVersion
      enabled: false,            // must match the backend's tcf config
      cmpId: 0,
      cmpVersion: 1,
    },
  },

  // ── Core behaviour (optional) ───────────────────────────────────────────────
  core: {
    tenantId: 'my-site',         // logical identifier for this installation
    locale: 'en',                // BCP 47; falls back to language prefix, then 'en'
    dir: 'auto',                 // 'ltr' | 'rtl' | 'auto' — 'auto' derives from locale
    autoHonorGPC: true,          // false | true | 'strict'
    storage: 'cookie',           // 'cookie' | 'localStorage'
    cookieDomains: '.example.com',
    allowReceipt: true,
    disableCssTemplate: false,
    userId: 'server-assigned-uuid', // authenticated users only
    usePrebuiltProfiles: true,   // load pre-built profiles instead of constructing from config
    cacheResolvedProfiles: true, // cache resolved profile in sessionStorage (1h TTL)
    console: ['error', 'warn'],  // log levels to emit; 'error' | 'warn' | 'info' | 'debug'
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
        Selects which consent model the widget applies. When omitted, Consenti auto-detects the
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
              Custom async function that returns the visitor's ISO 3166-1 alpha-2 country code. Used
              to improve auto-detection when the default locale-based heuristic is not accurate
              enough. Called once per session.
            </td>
          </tr>
          <tr>
            <td>
              <code>ageGate</code>
            </td>
            <td>
              <code>AgeGateWidgetConfig</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Age gate configuration —{' '}
              <code>{'{ enabled, minimumAge, requireParentalConsent }'}</code>. When{' '}
              <code>enabled: true</code>, the widget shows a Yes/No age-confirmation prompt before
              anything else (banner, GPC, CCPA opt-out). Declining denies all non-mandatory cookies
              immediately; with <code>requireParentalConsent: true</code> it also fires a
              <code>consenti:parentalConsentRequired</code> event carrying a token for your own
              out-of-band verification flow. See the &quot;Age Gate&quot; section of the{' '}
              <code>@consenti/ui</code> README for the full behavior.
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
              IAB TCF v2.2 client stub configuration —{' '}
              <code>{'{ enabled, cmpId, cmpVersion }'}</code>, must match the backend&apos;s{' '}
              <code>tcf</code> config. When enabled, installs
              <code>window.__tcfapi</code>. See the &quot;TCF v2.2 Implementation Guide&quot;.
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
            <td>GDPR, UK GDPR, PIPEDA, POPIA, PDPA-TH, APPI, KVKK</td>
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
            <td>TCF v2.2, COPPA, general privacy notices</td>
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

const geoResolver: WidgetCountryResolverFn = async () => {
  const res = await fetch('/api/geo')
  const { country } = await res.json()
  return country // e.g. 'DE', 'US', 'IN'
}

new ConsentiSetup({
  compliance: {
    type: 'opt-in',
    geoDataProvider: geoResolver,
  },
})`}
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

      <h3>GPC</h3>
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
              <code>autoHonorGPC</code>
            </td>
            <td>
              <code>boolean | 'strict'</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              How to handle the browser's Global Privacy Control signal.
              <code>false</code> = ignore. <code>true</code> = pre-deny <code>listenGpc</code>{' '}
              cookies and show the GPC banner variant.
              <code>'strict'</code> = pre-deny and write consent silently — no banner shown.
              Individual profiles can also set <code>gpcMode</code> per-profile; this field
              overrides that when explicitly set.
            </td>
          </tr>
        </tbody>
      </table>

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
              <code>boolean</code>
            </td>
            <td>
              <code>true</code>
            </td>
            <td>
              When <code>true</code>, Consenti lazy-loads the pre-built profile chunk for the
              resolved compliance group. Set to <code>false</code> to use only profiles defined via{' '}
              <code>ConsentiProfile</code> or <code>profileOverride</code>.
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
        </tbody>
      </table>

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
              <code>bgColor</code>
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
              <code>textColor</code>
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
              <code>primaryColor</code>
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
              <code>primaryTextColor</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-primary-text</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#ffffff</code>
            </td>
            <td>
              Text colour rendered on top of <code>primaryColor</code> backgrounds.
            </td>
          </tr>
          <tr>
            <td>
              <code>secondaryColor</code>
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
              <code>secondaryTextColor</code>
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
              <code>borderColor</code>
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
              <code>accentColor</code>
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
              <code>accentTextColor</code>
            </td>
            <td>
              <code className="whitespace-nowrap">--consenti-color-accent-text</code>
            </td>
            <td>
              <code className="whitespace-nowrap">#ffffff</code>
            </td>
            <td>
              Text colour on top of <code>accentColor</code>.
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
              <code className="whitespace-nowrap">--consenti-font-size-mult</code>
            </td>
            <td>
              <code className="whitespace-nowrap">1</code>
            </td>
            <td>
              Scale multiplier applied to all font sizes. <code>'1.1'</code> = 10% larger
              throughout.
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
              <code>buttonBorderRadius</code>
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
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="Minimal theme override"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  core: {
    theme: {
      primaryColor: '#7c3aed',      // purple accent
      primaryTextColor: '#ffffff',
      borderRadius: '12px',
      buttonBorderRadius: '999px',  // pill buttons
      fontFamily: 'Inter, sans-serif',
    },
  },
})`}
      />

      <hr />

      <h2>api</h2>
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
              different domain.
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
        'decline': { text: 'Decline', style: 'secondary', action: 'custom', cookies: '!' },
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
  core: {
    autoHonorGPC: 'strict', // deny silently, no banner shown
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
  AgeGateWidgetConfig,     // compliance.ageGate section
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
