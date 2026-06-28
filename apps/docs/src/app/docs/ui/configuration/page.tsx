import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'UI Widget — Configuration' }

export default function UIConfigurationPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Configuration</h1>
      <p>
        <code>new ConsentiSetup(config)</code> accepts a single{' '}
        <code>ConsentiConfig</code> object. Only <code>core</code> is required — every other
        top-level key is optional and can be omitted entirely.
      </p>

      <CodeBlock
        lang="ts"
        filename="Full config — every field shown"
        code={`import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

const widget = new ConsentiSetup({
  // ── Required ────────────────────────────────────────────────────────────────
  core: {
    profileId: 1,               // 0 = built-in default; >0 = local or API profile
    regulation: 'gdpr',         // controls opt-in/opt-out behaviour
    locale: 'en',               // BCP 47; falls back to language prefix, then 'en'
    autoHonorGPC: true,         // false | true | 'strict'
    storage: 'cookie',          // 'cookie' | 'localStorage'
    cookieDomains: '.example.com',
    privacyPolicyUrl: '/privacy',
    signCookies: true,
    cookieSigningKey: 'min-32-char-secret',
    allowReceipt: true,
    disableCssTemplate: false,
    userId: 'server-assigned-uuid', // authenticated users only
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

  // ── Backend API (optional) ──────────────────────────────────────────────────
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com',
    authToken: '',
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

      <h2>core</h2>
      <p>
        Controls widget behaviour, consent storage, compliance regulation, and theming.
        The only truly required field is <code>core</code> itself — all keys within it have
        sensible defaults.
      </p>

      <h3>Profile &amp; locale</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>profileId</code></td>
            <td><code>number</code></td>
            <td><code>0</code></td>
            <td>
              Which profile to load. <code>0</code> = built-in GDPR default.
              Any other value requires a <a href="/docs/ui/profiles/">local ConsentiProfile</a> or
              API mode to be configured. See the{' '}
              <a href="/docs/ui/profiles/">Profiles guide</a> for details.
            </td>
          </tr>
          <tr>
            <td><code>locale</code></td>
            <td><code>string</code></td>
            <td><code>&apos;en&apos;</code></td>
            <td>
              BCP 47 locale code, e.g. <code>&apos;fr&apos;</code>, <code>&apos;fr-CA&apos;</code>.
              Resolution order: exact match → language prefix → <code>defaultLocale</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Compliance</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>regulation</code></td>
            <td><code>string</code></td>
            <td><code>&apos;gdpr&apos;</code></td>
            <td>
              Controls opt-in vs opt-out behaviour and what is shown. See full list below.
            </td>
          </tr>
          <tr>
            <td><code>autoHonorGPC</code></td>
            <td><code>boolean | &apos;strict&apos;</code></td>
            <td><code>false</code></td>
            <td>
              How to handle the browser&apos;s Global Privacy Control signal.
              <code>false</code> = ignore. <code>true</code> = pre-deny{' '}
              <code>listenGpc</code> cookies and show the GPC banner variant.
              <code>&apos;strict&apos;</code> = pre-deny and write consent silently — no banner shown.
            </td>
          </tr>
        </tbody>
      </table>

      <h4>Supported regulations</h4>
      <table>
        <thead>
          <tr><th>Value</th><th>Region</th><th>Model</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code className='whitespace-nowrap'>gdpr</code></td><td>EU / EEA</td><td>Opt-in</td><td>Default. Banner on first visit; all non-mandatory cookies denied until granted.</td></tr>
          <tr><td><code className='whitespace-nowrap'>uk-gdpr</code></td><td>UK</td><td>Opt-in</td><td>Same model as GDPR; ICO-enforced; age gate at 13.</td></tr>
          <tr><td><code className='whitespace-nowrap'>ccpa</code></td><td>California (US)</td><td>Opt-out</td><td>All cookies default to <code>granted</code>; consent written silently; no banner.</td></tr>
          <tr><td><code className='whitespace-nowrap'>cpra</code></td><td>California (US)</td><td>Opt-out / Opt-in</td><td>Supersedes CCPA from Jan 2023. Opt-out for sale/sharing; opt-in required for sensitive data. GPC triggers both Do Not Sell and Do Not Share.</td></tr>
          <tr><td><code className='whitespace-nowrap'>lgpd</code></td><td>Brazil</td><td>Opt-in</td><td>10 lawful bases; ANPD-enforced; parental consent gate at under-12.</td></tr>
          <tr><td><code className='whitespace-nowrap'>dpdpa</code></td><td>India</td><td>Opt-in</td><td>Fiduciary name + grievance officer rendered in modal; GPC signal ignored. Requires <code>profileConfig.dpdpa</code>.</td></tr>
          <tr><td><code className='whitespace-nowrap'>pipeda</code></td><td>Canada</td><td>Opt-in</td><td>PIPEDA + Quebec Law 25 (GDPR-aligned).</td></tr>
          <tr><td><code className='whitespace-nowrap'>popia</code></td><td>South Africa</td><td>Opt-in</td><td>8 processing conditions; Information Regulator-enforced.</td></tr>
          <tr><td><code className='whitespace-nowrap'>pdpa-th</code></td><td>Thailand</td><td>Opt-in</td><td>Cross-border transfer rules enforced; PDPC-enforced.</td></tr>
          <tr><td><code className='whitespace-nowrap'>appi</code></td><td>Japan</td><td>Opt-in / Opt-out</td><td>Opt-in for sensitive data and overseas transfers; opt-out for general third-party sharing.</td></tr>
          <tr><td><code className='whitespace-nowrap'>kvkk</code></td><td>Turkey</td><td>Opt-in</td><td>Explicit consent for sensitive personal data; KVK Board-enforced.</td></tr>
        </tbody>
      </table>

      <h3>Storage</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>storage</code></td>
            <td><code>&apos;cookie&apos; | &apos;localStorage&apos;</code></td>
            <td><code>&apos;cookie&apos;</code></td>
            <td>
              Where consent is persisted in the browser.
              <code>cookie</code> works across subdomains when <code>cookieDomains</code> is set.
              <code>localStorage</code> is scoped to the exact origin and cannot be shared
              across subdomains. In API mode the server always issues its own cookie regardless.
            </td>
          </tr>
          <tr>
            <td><code>cookieDomains</code></td>
            <td><code>string</code></td>
            <td><code>undefined</code></td>
            <td>
              Comma-separated domain list, e.g. <code>&apos;.example.com,.sub.example.com&apos;</code>.
              The first entry is used as the <code>Domain</code> attribute on the consent cookie,
              making it readable on all subdomains of that domain.
            </td>
          </tr>
          <tr>
            <td><code>signCookies</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>
              Sign the consent cookie with HMAC-SHA256 to detect tampering.
              Requires <code>cookieSigningKey</code> when API mode is disabled.
              In API mode the server supplies the key — never expose it in client config.
            </td>
          </tr>
          <tr>
            <td><code>cookieSigningKey</code></td>
            <td><code>string</code></td>
            <td><code>undefined</code></td>
            <td>
              HMAC signing secret used with <code>signCookies: true</code> in frontend-only
              mode. Minimum 32 characters. Rotate this key to invalidate all existing signed
              consent records.
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="warning">
        Never expose <code>cookieSigningKey</code> in public client-side bundles on production
        sites that handle real user data. Use API mode instead — the server returns the signing
        key securely so it never appears in the browser.
      </Callout>

      <h3>Visitors &amp; receipts</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>userId</code></td>
            <td><code>string</code></td>
            <td><code>undefined</code></td>
            <td>
              Server-assigned UUID for authenticated users. When set, replaces the
              browser-generated visitor ID. Combined with API mode, this enables
              cross-device consent synchronisation — consent granted on mobile is
              recognised on desktop.
            </td>
          </tr>
          <tr>
            <td><code>allowReceipt</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>
              When <code>true</code>, a &quot;Download consent receipt&quot; checkbox appears
              in the preference modal footer. Checking it before saving triggers a JSON
              download containing a timestamped record of the user&apos;s choices.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>CSS &amp; privacy link</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>disableCssTemplate</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>
              When <code>true</code>, no <code>&lt;style&gt;</code> tag is injected at all.
              Use this when you import{' '}
              <code>@consenti/ui/dist/index.css</code> via your bundler to avoid
              duplicate styles. All BEM class names still apply.
            </td>
          </tr>
          <tr>
            <td><code>privacyPolicyUrl</code></td>
            <td><code>string</code></td>
            <td><code>undefined</code></td>
            <td>
              When set, a &quot;Privacy Policy&quot; link is automatically appended to the banner
              body text and opens in a new tab. No need to include it manually in
              <code>htmlText</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>core.theme</h3>
      <p>
        Inline CSS token overrides. Each key maps directly to a{' '}
        <code>--consenti-*</code> CSS custom property injected on the widget root element at
        runtime. You only need to set the values you want to change — unset keys keep their
        stylesheet default. For full CSS control, see the{' '}
        <a href="/docs/ui/themes/">Themes &amp; CSS guide</a>.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>CSS variable</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>bgColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-bg</code></td><td><code className='whitespace-nowrap'>#ffffff</code></td><td>Background colour for banners and modals.</td></tr>
          <tr><td><code>textColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-text</code></td><td><code className='whitespace-nowrap'>#1a1a1a</code></td><td>Primary body text colour.</td></tr>
          <tr><td><code>primaryColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-primary</code></td><td><code className='whitespace-nowrap'>#1565c0</code></td><td>Primary button background and interactive accent colour.</td></tr>
          <tr><td><code>primaryTextColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-primary-text</code></td><td><code className='whitespace-nowrap'>#ffffff</code></td><td>Text colour rendered on top of <code>primaryColor</code> backgrounds.</td></tr>
          <tr><td><code>secondaryColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-secondary</code></td><td><code className='whitespace-nowrap'>#f0f4f8</code></td><td>Secondary / ghost button background.</td></tr>
          <tr><td><code>secondaryTextColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-secondary-text</code></td><td><code className='whitespace-nowrap'>#1a3460</code></td><td>Text colour for secondary buttons.</td></tr>
          <tr><td><code>borderColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-border</code></td><td><code className='whitespace-nowrap'>#e2e8f0</code></td><td>Borders and dividers.</td></tr>
          <tr><td><code>accentColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-accent</code></td><td><code className='whitespace-nowrap'>#d32f2f</code></td><td>Background for <code>accent</code>-style buttons (destructive actions).</td></tr>
          <tr><td><code>accentTextColor</code></td><td><code className='whitespace-nowrap'>--consenti-color-accent-text</code></td><td><code className='whitespace-nowrap'>#ffffff</code></td><td>Text colour on top of <code>accentColor</code>.</td></tr>
          <tr><td><code>fontFamily</code></td><td><code className='whitespace-nowrap'>--consenti-font-family</code></td><td><code className='whitespace-nowrap'>system-ui, sans-serif</code></td><td>Font stack applied to all widget text.</td></tr>
          <tr><td><code>fontSizeBase</code></td><td><code className='whitespace-nowrap'>--consenti-font-size-base</code></td><td><code className='whitespace-nowrap'>14px</code></td><td>Base font size for body content.</td></tr>
          <tr><td><code>fontSizeHeading</code></td><td><code className='whitespace-nowrap'>--consenti-font-size-heading</code></td><td><code className='whitespace-nowrap'>inherit</code></td><td>Font size for banner and modal headings.</td></tr>
          <tr><td><code>fontSizeMultiplier</code></td><td><code className='whitespace-nowrap'>--consenti-font-size-mult</code></td><td><code className='whitespace-nowrap'>1</code></td><td>Scale multiplier applied to all font sizes. <code>&apos;1.1&apos;</code> = 10% larger throughout.</td></tr>
          <tr><td><code>borderRadius</code></td><td><code className='whitespace-nowrap'>--consenti-border-radius</code></td><td><code className='whitespace-nowrap'>8px</code></td><td>Border-radius for banner and modal containers.</td></tr>
          <tr><td><code>buttonBorderRadius</code></td><td><code className='whitespace-nowrap'>--consenti-border-radius-btn</code></td><td><code className='whitespace-nowrap'>4px</code></td><td>Border-radius applied to all button elements.</td></tr>
          <tr><td><code>toggleBgOn</code></td><td><code className='whitespace-nowrap'>--consenti-toggle-bg-on</code></td><td><code className='whitespace-nowrap'>#1565c0</code></td><td>Background of toggle switches in the ON (granted) state.</td></tr>
          <tr><td><code>toggleBgOff</code></td><td><code className='whitespace-nowrap'>--consenti-toggle-bg-off</code></td><td><code className='whitespace-nowrap'>#cccccc</code></td><td>Background of toggle switches in the OFF (denied) state.</td></tr>
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="Minimal theme override"
        code={`new ConsentiSetup({
  core: {
    regulation: 'gdpr',
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
        Connects the widget to the Consenti backend. When enabled, consent records are posted to
        the API and the active profile is fetched from it. Disabled by default — the widget works
        fully offline without it.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>enabled</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>
              When <code>true</code>, the widget fetches the profile from the API and posts
              consent records to it. Falls back to a local profile if the API request fails.
            </td>
          </tr>
          <tr>
            <td><code>baseUrl</code></td>
            <td><code>string</code></td>
            <td><code>window.location.origin</code></td>
            <td>
              Root URL where <code>@consenti/api</code> is mounted.
              The widget appends <code>/consenti/api/v1/...</code> to this value.
              Set explicitly when the API is on a different domain.
            </td>
          </tr>
          <tr>
            <td><code>authToken</code></td>
            <td><code>string</code></td>
            <td><code>&apos;&apos;</code></td>
            <td>
              Sent as <code>Authorization: Bearer &lt;token&gt;</code> on every API request.
              Leave empty for public / unauthenticated access.
              Only needed when the API profile requires authentication.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="API mode"
        code={`new ConsentiSetup({
  core: { profileId: 3, regulation: 'gdpr', locale: 'de' },
  api: {
    enabled: true,
    baseUrl: 'https://consent.example.com', // API is on a subdomain
  },
})`}
      />

      <Callout type="info">
        When <code>api.enabled</code> is <code>true</code> and the network request fails (offline,
        server error), the widget silently falls back to the local profile registry, then to the
        built-in default. Consent submission retries are not automatic — use the{' '}
        <a href="/docs/ui/events/">events</a> API to implement your own retry logic.
      </Callout>

      <hr />

      <h2>utils.gtm</h2>
      <p>
        Google Tag Manager / Google Consent Mode v2 integration. When a{' '}
        <code>containerId</code> is provided, Consenti pushes consent state to the{' '}
        <code>dataLayer</code> on every consent update.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>containerId</code></td>
            <td><code>string</code></td>
            <td><code>undefined</code></td>
            <td>
              GTM container ID, e.g. <code>&apos;GTM-XXXXXX&apos;</code>.
              Required to enable any dataLayer pushes. Omit to skip GTM entirely.
            </td>
          </tr>
          <tr>
            <td><code>dataLayer</code></td>
            <td><code>string</code></td>
            <td><code>&apos;dataLayer&apos;</code></td>
            <td>
              Name of the dataLayer array on <code>window</code>. Override only when your
              site uses a custom variable name (rare).
            </td>
          </tr>
          <tr>
            <td><code>events</code></td>
            <td><code>string[]</code></td>
            <td><code>[]</code></td>
            <td>
              Allowlist of Consenti event names to push. An empty array (default) means
              push all consent events. Pass specific names to filter, e.g.{' '}
              <code>[&apos;consentSubmitted&apos;]</code>.
            </td>
          </tr>
          <tr>
            <td><code>urlPassthrough</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>
              Pushes <code>{'{ url_passthrough: true }'}</code> to the dataLayer alongside
              consent events. Enables Google Consent Mode v2 &quot;cookieless pings&quot; — Google
              can model conversions even when <code>ad_storage</code> is denied.
              Requires <code>gtag.js</code> on the page.
            </td>
          </tr>
          <tr>
            <td><code>adsDataRedaction</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>
              Pushes <code>ads_data_redaction: true</code> when <code>ad_storage</code> is
              denied, causing Google to redact identifying fields from ad pings.
              Requires <code>gtag.js</code> on the page.
            </td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        lang="ts"
        filename="GTM + Consent Mode v2"
        code={`new ConsentiSetup({
  core: { regulation: 'gdpr' },
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX',
      urlPassthrough: true,    // cookieless conversion modelling
      adsDataRedaction: true,  // redact ad pings when consent denied
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
  core: { regulation: 'gdpr' },
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
        resolved profile after it has been loaded (from the API, a local{' '}
        <code>ConsentiProfile</code>, or the built-in default). Only the keys you supply are
        applied — everything else is left unchanged.
      </p>
      <p>
        This is a runtime override only. It does not affect the stored profile. See the{' '}
        <a href="/docs/ui/profiles/">Profiles guide</a> for a full reference and examples.
      </p>
      <CodeBlock
        lang="ts"
        filename="Override banner position per page"
        code={`// Checkout page — move banner out of the way
new ConsentiSetup({
  core: { profileId: profile.getId() },
  profileOverride: {
    mainBanner: { position: 'right-bottom' },
  },
})`}
      />
      <CodeBlock
        lang="ts"
        filename="Override buttons only"
        code={`new ConsentiSetup({
  core: { profileId: profile.getId() },
  profileOverride: {
    mainBanner: {
      buttons: [
        { text: 'Accept',  style: 'primary',   action: 'custom', cookies: '*' },
        { text: 'Decline', style: 'secondary', action: 'custom', cookies: '!' },
      ],
    },
  },
})`}
      />

      <hr />

      <h2>rootEl</h2>
      <p>
        By default the widget appends a <code>&lt;div id=&quot;consenti-root&quot;&gt;</code> to{' '}
        <code>document.body</code> and mounts banners and modals inside it. Use{' '}
        <code>rootEl</code> to mount into your own container instead.
      </p>
      <table>
        <thead>
          <tr><th>Value</th><th>Behaviour</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>string</code> (CSS selector)</td>
            <td>Resolved via <code>document.querySelector()</code>. Throws if the element is not found.</td>
          </tr>
          <tr>
            <td><code>HTMLElement</code></td>
            <td>Used directly. Throws if the element is not attached to the document.</td>
          </tr>
          <tr>
            <td>omitted</td>
            <td>Creates <code>#consenti-root</code> and appends it to <code>document.body</code> (default).</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="Mount into a specific wrapper"
        code={`// HTML: <div id="consent-wrapper"></div>
new ConsentiSetup({
  core: { profileId: 1 },
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
      <p>
        Dark mode can also be authored per-profile in the dashboard (step 1 of profile creation).
        The <code>ConsentiConfig.darkMode</code> setting takes precedence over the profile-level
        flag.
      </p>
      <CodeBlock
        lang="ts"
        filename="Dark mode"
        code={`new ConsentiSetup({
  core: { profileId: 1 },
  darkMode: true,
})

// Or detect the user's OS preference:
new ConsentiSetup({
  core: { profileId: 1 },
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
})`}
      />
      <p>
        To customise the dark palette, override the CSS custom properties on{' '}
        <code>.consenti-root--dark</code> in your own stylesheet after importing the widget CSS.
      </p>

      <hr />

      <h2>autoInit</h2>
      <p>
        By default the widget begins initialising immediately when the constructor runs. Set{' '}
        <code>autoInit: false</code> to prevent this — the widget will not touch the DOM until
        you explicitly call <code>widget.init()</code>. This is useful when the mount point does
        not yet exist in the DOM at construction time (e.g. in SPAs where the container renders
        asynchronously).
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>autoInit</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>
              When <code>false</code>, the constructor returns without initialising. Call{' '}
              <code>await widget.init()</code> manually to start the widget. After{' '}
              <code>destroy()</code> you can also call <code>init()</code> again to
              re-initialise the same instance.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="Deferred initialisation"
        code={`const widget = new ConsentiSetup({
  core: { regulation: 'gdpr' },
  rootEl: '#consent-mount',
  autoInit: false,
})

// Later, once the mount point exists in the DOM:
await widget.init()
widget.onReady(() => console.log('Ready:', widget.hasConsent()))`}
      />

      <hr />

      <h2>Locale switcher</h2>
      <p>
        When a profile has multiple locales configured, you can show a 🌐 globe button next to the
        close button on the banner and/or modal. Clicking it reveals a dropdown of all available
        locales; selecting one reinitialises the widget with the new locale.
      </p>
      <p>
        Enable it per surface via the profile configuration:
      </p>
      <CodeBlock
        lang="ts"
        filename="Enable locale switcher via profileOverride"
        code={`new ConsentiSetup({
  core: { profileId: 1, locale: 'en' },
  profileOverride: {
    mainBanner: { showLocaleSwitcher: true },
    preferenceModal: { showLocaleSwitcher: true },
  },
})`}
      />
      <p>
        In the dashboard, toggle <strong>Show locale switcher</strong> on any banner or modal tab
        inside the UI Template editor. The switcher is hidden automatically when only one locale is
        available, regardless of the flag.
      </p>

      <hr />

      <h2>Link buttons</h2>
      <p>
        Buttons with <code>action: &apos;link&apos;</code> are rendered as{' '}
        <code>&lt;a&gt;</code> elements in a separate <code>.consenti-banner__links</code> (or{' '}
        <code>.consenti-modal__links</code>) container, below the body text — separate from the
        action button row. Use them for Privacy Policy, Terms of Service, or any other navigation
        link.
      </p>
      <CodeBlock
        lang="ts"
        filename="Link buttons in a local profile"
        code={`new ConsentiProfile({
  id: 1,
  defaultLocale: 'en',
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        htmlText: 'We use cookies to improve your experience.',
        buttons: [
          { text: 'Accept All',  style: 'primary', action: 'custom', cookies: '*' },
          { text: 'Manage',      style: 'secondary', action: 'manage' },
          // Link buttons — rendered as <a> below the body text
          { text: 'Privacy Policy', style: 'text', action: 'link', url: '/privacy' },
          { text: 'Terms',          style: 'text', action: 'link', url: '/terms' },
        ],
      },
      // ...
    },
  },
  cookies: [{ id: 'analytics', expiry: 365 }],
})`}
      />
      <p>
        The <code>style</code> option controls the link appearance (same BEM modifier classes as
        buttons). The default style when <code>action === &apos;link&apos;</code> is{' '}
        <code>&apos;text&apos;</code>. In the dashboard, select <strong>Link (open URL)</strong>{' '}
        in the Action dropdown of the button editor to reveal the URL field.
      </p>

      <hr />

      <h2>Minimal configs by use case</h2>

      <h3>Simplest possible — built-in profile, no backend</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({ core: { regulation: 'gdpr' } })`}
      />

      <h3>CCPA opt-out (no banner)</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({ core: { regulation: 'ccpa' } })`}
      />

      <h3>Cross-subdomain consent</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    regulation: 'gdpr',
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
    regulation: 'gdpr',
    userId: '{{ server_user_id }}',
  },
  api: { enabled: true },
})`}
      />

      <h3>GPC strict mode + GTM</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    regulation: 'gdpr',
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
  ConsentiConfig,   // top-level config object
  CoreConfig,       // core section
  ApiConfig,        // api section
  UtilsConfig,      // utils section
  GtmConfig,        // utils.gtm section
  ThemeConfig,      // core.theme section
} from '@consenti/ui'`}
      />
    </div>
  )
}
