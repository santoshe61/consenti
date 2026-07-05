import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Profiles — UI Widget' }

export default function UIProfilesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Profiles</h1>
      <p>
        A <strong>profile</strong> defines everything the Consenti widget renders: which cookies /
        purposes it manages, the banner and modal layout, all button labels and actions, and the
        text copy for every supported locale. It is the single source of truth for the UI — not
        the widget config itself.
      </p>

      <h2>How profiles are resolved</h2>
      <p>
        Every time <code>new ConsentiSetup(config)</code> initialises, it resolves exactly one
        profile through one of six scenarios. The compliance group (from{' '}
        <code>compliance.type</code> or auto-detected from the browser) determines which
        pre-built profile is loaded.
      </p>

      <table>
        <thead>
          <tr><th>Scenario</th><th>API</th><th>compliance.type</th><th>Resolution</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1A</strong></td>
            <td>off</td>
            <td>auto-detect</td>
            <td>Browser locale + optional geo resolver → compliance group → pre-built profile chunk (dynamic import)</td>
          </tr>
          <tr>
            <td><strong>1B</strong></td>
            <td>off</td>
            <td>fixed (e.g. <code>&apos;opt-in&apos;</code>)</td>
            <td>Pre-built profile chunk for that group, loaded via dynamic import</td>
          </tr>
          <tr>
            <td><strong>2A</strong></td>
            <td>on</td>
            <td>auto-detect</td>
            <td><code>GET /resolve-profile</code> returns the best profile URL for the visitor; result cached in <code>sessionStorage</code> (1 h TTL)</td>
          </tr>
          <tr>
            <td><strong>2B</strong></td>
            <td>on</td>
            <td><code>api.complianceGroup</code> set</td>
            <td>Fetches the profile for a specific compliance group — skips auto-resolution</td>
          </tr>
          <tr>
            <td><strong>Local</strong></td>
            <td>any</td>
            <td>any</td>
            <td><code>ConsentiProfile</code> registered in code; takes precedence over pre-built profiles when found for the matching compliance type</td>
          </tr>
          <tr>
            <td><strong>Fallback</strong></td>
            <td>any</td>
            <td>any</td>
            <td>Built-in default GDPR profile (Google Consent Mode v2, four purposes) — always available</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock
        lang="text"
        filename="Resolution flow (API enabled)"
        code={`new ConsentiSetup({ api: { enabled: true } })
    │
    ├─ 2A. GET /resolve-profile  ──▶  success → fetch returned profile URL (cached 1h)
    │                                  fail   ↓
    ├─ Local: ConsentiProfile in registry ──▶  found  → use local profile
    │                                           missing ↓
    ├─ 1A. Pre-built profile (auto-detect) ──▶  loaded → use pre-built chunk
    │                                            fail   ↓
    └─ Fallback: built-in default          ──▶  always available`}
      />

      <Callout type="info">
        After resolution, any properties set in <code>profileOverride</code> are merged on top.
        See <a href="#profileoverride">profileOverride</a> below.
      </Callout>

      <h2>Pre-built profiles</h2>
      <p>
        Consenti ships pre-built profiles for each compliance group. They are loaded as dynamic
        import chunks — only the chunk for the resolved compliance group is downloaded. Each
        pre-built profile covers all four Google Consent Mode v2 purposes plus a mandatory
        functional bucket.
      </p>
      <p>
        The fallback built-in profile (used when all resolution steps fail) is an English
        opt-in GDPR profile — a realistic starting point for any GTM-backed site.
      </p>
      <CodeBlock
        lang="ts"
        filename="Default profile cookies (fallback)"
        code={`// Built-in fallback — used when all resolution steps fail
const defaultCookies = [
  { id: 'functionality_storage', mandatory: true },
  { id: 'analytics_storage',     listenGpc: true, expiry: 365 },
  { id: 'ad_storage',            listenGpc: true, expiry: 365 },
  { id: 'ad_user_data',          listenGpc: true, expiry: 365 },
  { id: 'ad_personalization',    listenGpc: true, expiry: 365 },
]`}
      />
      <p>
        To customise the pre-built profile banner without defining a full profile, use{' '}
        <a href="#profileoverride">profileOverride</a>.
      </p>

      <hr />

      <h2>ConsentiProfile — custom profiles in code</h2>
      <p>
        Use <code>ConsentiProfile</code> to define profiles entirely in JavaScript. Each instance
        is registered in a module-level registry. <code>ConsentiSetup</code> prefers a local
        profile over the pre-built profile for the same compliance group when one is found.
      </p>
      <Callout type="tip">
        Define the profile before calling <code>new ConsentiSetup()</code> — the registry lookup
        happens during init. No ID needs to be passed; the profile is matched by compliance group
        (or used as the default if no group-specific profile is found).
      </Callout>

      <h3>Minimal example</h3>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

const profile = new ConsentiProfile({
  defaultLocale: 'en',
  cookies: [
    { id: 'necessary',  mandatory: true,  expiry: 365 },
    { id: 'analytics',  listenGpc: true,  expiry: 365 },
    { id: 'marketing',  listenGpc: true,  expiry: 365 },
  ],
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'We value your privacy',
        htmlText: 'We use cookies to improve your experience.',
        buttons: [
          { text: 'Accept All',          style: 'primary',    action: 'custom', cookies: '*' },
          { text: 'Reject Optional',          style: 'secondary',  action: 'custom', cookies: '!' },
          { text: 'Customize',  style: 'secondary',  action: 'manage' },
        ],
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        subheading: 'Choose which cookies you allow.',
        position: 'center',
        showClose: true,
        overlayOpacity: 50,
        buttons: [
          { text: 'Accept All',       style: 'primary',  action: 'custom', cookies: '*' },
          { text: 'Save Preferences', style: 'primary',  action: 'submit' },
          { text: 'Reject Optional',       style: 'text',     action: 'custom', cookies: '!' },
        ],
        categories: [
          {
            id: 'cat-necessary',
            heading: 'Strictly Necessary',
            htmlText: 'Required for the site to function.',
            mandatory: true,
            cookies: ['necessary'],
          },
          {
            id: 'cat-analytics',
            heading: 'Analytics',
            htmlText: 'Helps us understand how visitors use the site.',
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
  },
})

new ConsentiSetup({
  compliance: { type: 'opt-in' },
  // ConsentiProfile auto-registered above takes precedence over the pre-built profile
})`}
      />

      <h3>Multi-locale profile</h3>
      <p>
        Add as many locale keys as needed. The widget resolves locale by trying the exact
        BCP 47 code, then the language prefix, then <code>defaultLocale</code>.
      </p>
      <CodeBlock
        lang="ts"
        code={`const profile = new ConsentiProfile({
  defaultLocale: 'en',
  cookies: [
    { id: 'necessary', mandatory: true },
    { id: 'analytics' },
  ],
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        htmlText: 'We use cookies.',
        buttons: [
          { text: 'Accept All',  style: 'primary',   action: 'custom', cookies: '*' },
          { text: 'Reject Optional',  style: 'secondary', action: 'custom', cookies: '!' },
        ],
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        buttons: [{ text: 'Save Preferences', style: 'primary', action: 'submit' }],
        categories: [
          { id: 'cat-analytics', heading: 'Analytics', htmlText: 'Usage stats.', cookies: ['analytics'] },
        ],
      },
    },
    fr: {
      mainBanner: {
        position: 'bottom',
        htmlText: 'Nous utilisons des cookies.',
        buttons: [
          { text: 'Tout accepter',  style: 'primary',   action: 'custom', cookies: '*' },
          { text: 'Tout refuser',   style: 'secondary', action: 'custom', cookies: '!' },
        ],
      },
      preferenceModal: {
        heading: 'Préférences cookies',
        buttons: [{ text: 'Enregistrer', style: 'primary', action: 'submit' }],
        categories: [
          { id: 'cat-analytics', heading: 'Analytiques', htmlText: 'Statistiques.', cookies: ['analytics'] },
        ],
      },
    },
  },
})

new ConsentiSetup({
  compliance: { type: 'opt-in' },
  core: { locale: 'fr' },
})`}
      />

      <h3>GPC banner variant</h3>
      <p>
        Add a <code>gpcBanner</code> key alongside <code>mainBanner</code> in a locale to show a
        dedicated banner when the Global Privacy Control signal is detected.
        Falls back to <code>mainBanner</code> if not provided.
      </p>
      <CodeBlock
        lang="ts"
        code={`translations: {
  en: {
    mainBanner: { /* ... */ },
    gpcBanner: {
      position: 'bottom',
      heading: 'Privacy signal detected',
      htmlText: "Your browser's GPC signal was detected. Ad cookies have been pre-denied.",
      showClose: false,
      buttons: [
        { text: 'Understood',           style: 'primary',   action: 'custom', cookies: '!' },
        { text: 'Customize',   style: 'secondary', action: 'manage' },
      ],
    },
    preferenceModal: { /* ... */ },
  },
}`}
      />

      <hr />

      <h2>ProfileConfig — all options</h2>

      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>defaultLocale</code></td>
            <td><code>string</code></td>
            <td>Yes</td>
            <td>BCP 47 locale used when the requested locale has no translation. E.g. <code>&apos;en&apos;</code>.</td>
          </tr>
          <tr>
            <td><code>cookies</code></td>
            <td><code>Cookie[]</code></td>
            <td>No</td>
            <td>List of consent purposes / cookie IDs the widget manages. See <a href="#cookie-type">Cookie type</a> below.</td>
          </tr>
          <tr>
            <td><code>translations</code></td>
            <td><code>Record&lt;string, LocaleTranslations&gt;</code></td>
            <td>No</td>
            <td>Banner and modal config keyed by locale. If omitted, the widget falls back to profileOverride or defaults.</td>
          </tr>
          <tr>
            <td><code>gpcBanner</code></td>
            <td><code>boolean</code></td>
            <td>No</td>
            <td>Derived flag — do not set manually. It is <code>true</code> when the profile has at least one locale that defines <code>translations[locale].gpcBanner</code>. The actual GPC banner content is configured inside <code>translations[locale].gpcBanner</code>.</td>
          </tr>
          <tr>
            <td><code>allowedOrigins</code></td>
            <td><code>string[]</code></td>
            <td>No</td>
            <td>Hostnames permitted to submit consent for this profile. Only enforced server-side in API mode. Supports <code>*.example.com</code> wildcards. Empty = allow all.</td>
          </tr>
          <tr>
            <td><code>dpdpa</code></td>
            <td><code>DpdpaConfig</code></td>
            <td>No</td>
            <td>Required when using the <code>opt-in-dpdpa</code> compliance group. See the <a href="/docs/compliance/dpdpa/">DPDPA guide</a>.</td>
          </tr>
        </tbody>
      </table>

      <h3 id="cookie-type">Cookie type</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>id</code></td><td><code>string</code></td><td>Yes</td><td>Unique purpose identifier. Used as the key in the stored consent map, e.g. <code>&apos;analytics_storage&apos;</code>.</td></tr>
          <tr><td><code>mandatory</code></td><td><code>true</code></td><td>No</td><td>Cannot be denied. Toggle rendered as disabled. Value always <code>&apos;granted&apos;</code>.</td></tr>
          <tr><td><code>listenGpc</code></td><td><code>boolean</code></td><td>No</td><td>When <code>true</code> and <code>autoHonorGPC</code> is active, this cookie is auto-denied when the browser GPC signal is present.</td></tr>
          <tr><td><code>expiry</code></td><td><code>number</code></td><td>No</td><td>Consent expiry in days. After this period the banner re-appears. Default: no expiry.</td></tr>
          <tr><td><code>cpraCategory</code></td><td><code>&apos;sale&apos; | &apos;sharing&apos; | &apos;sensitive&apos;</code></td><td>No</td><td>CPRA classification. Only relevant for the <code>opt-out-strict</code> compliance group.</td></tr>
        </tbody>
      </table>

      <h3>LocaleTranslations type</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mainBanner</code></td><td><code>MainBanner</code></td><td>Yes</td><td>Banner shown on first visit or when no consent exists.</td></tr>
          <tr><td><code>gpcBanner</code></td><td><code>GpcBanner</code></td><td>No</td><td>Banner shown instead of <code>mainBanner</code> when GPC is detected. Same shape as <code>MainBanner</code>. Falls back to <code>mainBanner</code> if omitted.</td></tr>
          <tr><td><code>preferenceModal</code></td><td><code>PreferenceModal</code></td><td>Yes</td><td>Slide-in panel where the user manages individual cookie categories.</td></tr>
        </tbody>
      </table>

      <h3>MainBanner / GpcBanner type</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>position</code></td><td><code>&apos;bottom&apos; | &apos;top&apos; | &apos;middle&apos; | &apos;left-bottom&apos; | &apos;right-bottom&apos;</code></td><td>Yes</td><td>Where the banner is anchored on screen.</td></tr>
          <tr><td><code>htmlText</code></td><td><code>string</code></td><td>Yes</td><td>Body content. HTML is allowed. Sanitise any user-supplied values externally.</td></tr>
          <tr><td><code>heading</code></td><td><code>string</code></td><td>No</td><td>Heading text. Omit to hide the heading element entirely.</td></tr>
          <tr><td><code>headingTag</code></td><td><code>string</code></td><td>No</td><td>HTML tag for the heading, e.g. <code>&apos;h2&apos;</code> (default) or <code>&apos;p&apos;</code>.</td></tr>
          <tr><td><code>overlayOpacity</code></td><td><code>number</code></td><td>No</td><td>Full-page overlay opacity, 0–100. <code>0</code> disables the overlay. Default: <code>0</code>.</td></tr>
          <tr><td><code>showClose</code></td><td><code>boolean</code></td><td>No</td><td>Render a ✕ close button that dismisses the banner without saving consent.</td></tr>
          <tr><td><code>showLocaleSwitcher</code></td><td><code>boolean</code></td><td>No</td><td>Show a locale switcher in the banner. Only renders when the profile has more than one locale defined.</td></tr>
          <tr><td><code>buttons</code></td><td><code>Button[]</code></td><td>Yes</td><td>Ordered list of action buttons rendered in the banner footer.</td></tr>
        </tbody>
      </table>

      <h3>PreferenceModal type</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>buttons</code></td><td><code>Button[]</code></td><td>Yes</td><td>Footer action buttons.</td></tr>
          <tr><td><code>categories</code></td><td><code>Category[]</code></td><td>Yes</td><td>Ordered list of consent categories shown with toggles.</td></tr>
          <tr><td><code>position</code></td><td><code>&apos;center&apos; | &apos;left&apos; | &apos;right&apos;</code></td><td>No</td><td>Modal panel anchor. Default: <code>&apos;center&apos;</code>.</td></tr>
          <tr><td><code>heading</code></td><td><code>string</code></td><td>No</td><td>Modal heading text.</td></tr>
          <tr><td><code>subheading</code></td><td><code>string</code></td><td>No</td><td>Optional subheading rendered below the heading.</td></tr>
          <tr><td><code>htmlText</code></td><td><code>string</code></td><td>No</td><td>Optional intro text rendered above the category list. HTML is allowed.</td></tr>
          <tr><td><code>overlayOpacity</code></td><td><code>number</code></td><td>No</td><td>Modal backdrop opacity, 0–100. Default: <code>50</code>.</td></tr>
          <tr><td><code>showClose</code></td><td><code>boolean</code></td><td>No</td><td>Show a ✕ close button in the modal header.</td></tr>
          <tr><td><code>showLocaleSwitcher</code></td><td><code>boolean</code></td><td>No</td><td>Show a locale switcher in the modal header. Only renders when the profile has more than one locale defined.</td></tr>
          <tr><td><code>persistent</code></td><td><code>boolean</code></td><td>No</td><td>When <code>true</code>, clicking the overlay does not close the modal. The user must click a footer button. Default: <code>false</code>.</td></tr>
          <tr><td><code>mobileFullScreenBreakpoint</code></td><td><code>number</code></td><td>No</td><td>Screen width in px at or below which the modal expands to fill the entire screen. Default: <code>576</code>. Set to <code>0</code> to disable full-screen on mobile entirely.</td></tr>
          <tr><td><code>headingTag</code></td><td><code>string</code></td><td>No</td><td>HTML tag for the modal heading.</td></tr>
        </tbody>
      </table>

      <h3>Button type</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>text</code></td><td><code>string</code></td><td>Yes</td><td>Label rendered on the button.</td></tr>
          <tr>
            <td><code>style</code></td>
            <td><code>&apos;primary&apos; | &apos;secondary&apos; | &apos;text&apos; | &apos;accent&apos;</code></td>
            <td>Yes</td>
            <td>
              Visual appearance only — never affects click behaviour.
              <code>primary</code> = filled accent; <code>secondary</code> = outlined/ghost;{' '}
              <code>text</code> = no border, link-like; <code>accent</code> = destructive red (uses{' '}
              <code>--consenti-accent-color</code>).
            </td>
          </tr>
          <tr>
            <td><code>action</code></td>
            <td><code>&apos;custom&apos; | &apos;manage&apos; | &apos;submit&apos; | &apos;close&apos; | &apos;link&apos;</code></td>
            <td>Yes</td>
            <td>
              What happens on click. <code>custom</code> = grant/deny the IDs in <code>cookies</code>;{' '}
              <code>manage</code> = open the preference modal; <code>submit</code> = save the current modal toggle state;{' '}
              <code>close</code> = dismiss without saving; <code>link</code> = navigate to <code>url</code> (opens in a new tab).
            </td>
          </tr>
          <tr>
            <td><code>cookies</code></td>
            <td><code>&apos;*&apos; | &apos;!&apos; | string[]</code></td>
            <td>When <code>action: &apos;custom&apos;</code></td>
            <td>
              Which cookie IDs to affect. <code>&apos;*&apos;</code> = grant all; <code>&apos;!&apos;</code> = deny all;{' '}
              <code>string[]</code> = specific IDs only.
            </td>
          </tr>
          <tr>
            <td><code>url</code></td>
            <td><code>string</code></td>
            <td>When <code>action: &apos;link&apos;</code></td>
            <td>Target URL for the link button. Opens in a new tab. Typically used for privacy policy or terms links rendered below the banner body.</td>
          </tr>
        </tbody>
      </table>

      <h3>Category type</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>id</code></td><td><code>string</code></td><td>Yes</td><td>Unique identifier. Referenced by <code>Cookie.id</code> associations.</td></tr>
          <tr><td><code>heading</code></td><td><code>string</code></td><td>Yes</td><td>Category name shown as a toggle label.</td></tr>
          <tr><td><code>htmlText</code></td><td><code>string</code></td><td>Yes</td><td>Description text beneath the heading. HTML is allowed.</td></tr>
          <tr><td><code>cookies</code></td><td><code>string[]</code></td><td>Yes</td><td>Cookie IDs that belong to this category. Toggling the category affects all listed IDs simultaneously.</td></tr>
          <tr><td><code>mandatory</code></td><td><code>true</code></td><td>No</td><td>Toggle is rendered as permanently enabled. Value always <code>&apos;granted&apos;</code>.</td></tr>
          <tr><td><code>type</code></td><td><code>&apos;consent&apos; | &apos;legitimate_interest&apos;</code></td><td>No</td><td>Legal basis. When <code>legitimate_interest</code>, refusal is stored as <code>&apos;objected&apos;</code> instead of <code>&apos;denied&apos;</code>.</td></tr>
          <tr><td><code>headingTag</code></td><td><code>string</code></td><td>No</td><td>HTML tag for the category heading, e.g. <code>&apos;h3&apos;</code> (default).</td></tr>
        </tbody>
      </table>

      <hr />

      <h2 id="profileoverride">profileOverride — runtime overrides</h2>
      <p>
        <code>profileOverride</code> lets you change any field of the <em>resolved</em> profile at
        runtime, without touching the base profile definition. It is applied as a deep merge
        on top of whatever profile was resolved (default, local, or API).
      </p>
      <p>
        Common uses: adjusting banner position per-page, swapping button copy for A/B tests,
        or running the widget with no backend at all by providing the entire profile inline.
      </p>

      <Callout type="info">
        <code>profileOverride</code> accepts a <code>Partial&lt;ResolvedProfile&gt;</code>.
        Top-level keys like <code>mainBanner</code>, <code>gpcBanner</code>, and{' '}
        <code>preferenceModal</code> are merged deeply — you only need to supply the keys you want
        to change. <code>cookies</code> is replaced entirely when provided.
      </Callout>

      <h3>Override banner copy and buttons only</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    mainBanner: {
      heading: 'Cookie notice',
      htmlText: 'We use analytics cookies to improve the site.',
      buttons: [
        { text: 'Accept',  style: 'primary',   action: 'custom', cookies: '*' },
        { text: 'Decline', style: 'secondary',  action: 'custom', cookies: '!' },
      ],
    },
  },
})`}
      />

      <h3>Change banner position per page</h3>
      <CodeBlock
        lang="ts"
        code={`// On the checkout page, keep the banner out of the way
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    mainBanner: { position: 'right-bottom' },
  },
})`}
      />

      <h3>Full inline profile — no backend, no ConsentiProfile</h3>
      <p>
        You can provide an entire profile through <code>profileOverride</code> alone.
        This is the most concise approach for simple frontend-only installations that
        do not need multi-locale support.
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    cookies: [
      { id: 'necessary',  mandatory: true },
      { id: 'analytics',  listenGpc: true, expiry: 365 },
      { id: 'marketing',  listenGpc: true, expiry: 365 },
    ],
    mainBanner: {
      position: 'bottom',
      heading: 'We value your privacy',
      htmlText: 'We use cookies to improve your experience and personalise ads.',
      buttons: [
        { text: 'Accept All',         style: 'primary',   action: 'custom', cookies: '*' },
        { text: 'Reject Optional',         style: 'secondary', action: 'custom', cookies: '!' },
        { text: 'Customize', style: 'secondary', action: 'manage' },
      ],
    },
    gpcBanner: {
      position: 'bottom',
      heading: 'Privacy signal detected',
      htmlText: "Your browser's GPC signal has been honoured. Ad cookies are pre-denied.",
      buttons: [
        { text: 'Understood',         style: 'primary',   action: 'custom', cookies: '!' },
        { text: 'Customize', style: 'secondary', action: 'manage' },
      ],
    },
    preferenceModal: {
      position: 'center',
      heading: 'Cookie Preferences',
      subheading: 'Choose which cookies you allow us to use.',
      showClose: true,
      overlayOpacity: 50,
      buttons: [
        { text: 'Accept All',       style: 'primary', action: 'custom', cookies: '*' },
        { text: 'Save Preferences', style: 'primary', action: 'submit' },
        { text: 'Reject Optional',       style: 'text',    action: 'custom', cookies: '!' },
      ],
      categories: [
        {
          id: 'cat-necessary',
          heading: 'Strictly Necessary',
          htmlText: 'Required for the site to function. Cannot be disabled.',
          mandatory: true,
          cookies: ['necessary'],
        },
        {
          id: 'cat-analytics',
          heading: 'Analytics',
          htmlText: 'Helps us understand how visitors use the site (e.g. Google Analytics).',
          cookies: ['analytics'],
        },
        {
          id: 'cat-marketing',
          heading: 'Marketing',
          htmlText: 'Used to deliver relevant ads and measure campaign effectiveness.',
          cookies: ['marketing'],
        },
      ],
    },
  },
})`}
      />

      <h3>Override modal categories only</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    preferenceModal: {
      categories: [
        {
          id: 'cat-necessary',
          heading: 'Strictly Necessary',
          htmlText: 'Core functionality. Always enabled.',
          mandatory: true,
          cookies: ['necessary'],
        },
        {
          id: 'cat-analytics',
          heading: 'Analytics',
          htmlText: 'Page view and interaction tracking.',
          cookies: ['analytics'],
        },
      ],
    },
  },
})`}
      />

      <hr />

      <h2>Using the backend API</h2>
      <p>
        When the Consenti API is deployed, profiles are managed in the Admin Dashboard and
        grouped by compliance type. The widget calls <code>GET /resolve-profile</code> to find the
        best profile for each visitor automatically.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Auto-resolve: server picks the right profile for the visitor's locale / country
new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com', // where @consenti/api is mounted
  },
  core: { locale: 'fr' },
})

// Fixed group: always fetch the GDPR-model profile
new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com',
    complianceGroup: 'opt-in',
  },
})`}
      />

      <Callout type="tip">
        You can still use <code>profileOverride</code> on top of an API profile — for example to
        change the banner position on a specific page without creating a new profile variant in the
        dashboard.
      </Callout>

      <h2>TypeScript imports</h2>
      <CodeBlock
        lang="ts"
        code={`import type {
  ProfileConfig,           // passed to new ConsentiProfile(config)
  LocaleTranslations,      // translations[locale] shape
  MainBanner,              // mainBanner / gpcBanner shape
  PreferenceModal,         // preferenceModal shape
  Button,                  // button definition
  ButtonStyle,             // 'primary' | 'secondary' | 'text' | 'accent'
  ButtonAction,            // 'custom' | 'manage' | 'submit' | 'close'
  Category,                // preference modal category
  Cookie,                  // cookie / purpose definition
  ResolvedProfile,         // what profileOverride accepts (Partial<ResolvedProfile>)
  ComplianceWidgetConfig,  // compliance section
  AgeGateWidgetConfig,     // compliance.ageGate section
  WidgetCountryResolverFn, // custom geo resolver function type
  NonEmptyArray,           // [T, ...T[]] — at least one element
} from '@consenti/ui'`}
      />
    </div>
  )
}
