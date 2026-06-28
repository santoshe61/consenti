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
        profile. The resolution order is:
      </p>
      <ol>
        <li>
          <strong>Backend API</strong> — when <code>api.enabled: true</code>, Consenti fetches{' '}
          <code>GET /consenti/api/v1/profiles/:id/:locale</code>. The server resolves locale
          fallback and returns a single flat{' '}
          <code>ResolvedProfile</code> ready for rendering.{' '}
          If the network request fails, it falls through to the next step.
        </li>
        <li>
          <strong>Local profile</strong> — when <code>core.profileId &gt; 0</code> and a profile
          with that ID has been registered via{' '}
          <code>new ConsentiProfile(config)</code>, the widget uses it directly.
          Locale resolution is performed client-side.
        </li>
        <li>
          <strong>Built-in default</strong> — when <code>core.profileId</code> is <code>0</code>{' '}
          (or omitted) and no API is configured, the widget falls back to the built-in English
          GDPR profile covering the four Google Consent Mode v2 purposes.
        </li>
      </ol>

      <CodeBlock
        lang="text"
        filename="Resolution order"
        code={`new ConsentiSetup({ core: { profileId: 1 }, api: { enabled: true } })
    │
    ├─ 1. API: GET /consenti/api/v1/profiles/1/en  ──▶  success → use API profile
    │                                                     fail   ↓
    ├─ 2. Local registry: ConsentiProfile with id 1 ──▶  found  → use local profile
    │                                                     missing ↓
    └─ 3. Built-in default profile (profileId 0)   ──▶  always available`}
      />

      <Callout type="info">
        After resolution, any properties set in <code>profileOverride</code> are merged on top.
        See <a href="#profileoverride">profileOverride</a> below.
      </Callout>

      <h2>Built-in default profile</h2>
      <p>
        When no profile is configured (<code>core.profileId</code> omitted or <code>0</code>),
        Consenti uses a built-in English GDPR profile. It covers the four Google Consent Mode v2
        cookie purposes plus a mandatory functional bucket — a realistic starting point for any
        GTM-backed site.
      </p>
      <CodeBlock
        lang="ts"
        filename="Default profile cookies"
        code={`// Built-in default — used automatically when no profileId / no API
const defaultCookies = [
  { id: 'functionality_storage', mandatory: true },
  { id: 'analytics_storage',     listenGpc: true, expiry: 365 },
  { id: 'ad_storage',            listenGpc: true, expiry: 365 },
  { id: 'ad_user_data',          listenGpc: true, expiry: 365 },
  { id: 'ad_personalization',    listenGpc: true, expiry: 365 },
]`}
      />
      <p>
        To customise the default banner without defining a full profile, use{' '}
        <a href="#profileoverride">profileOverride</a>.
      </p>

      <hr />

      <h2>ConsentiProfile — frontend-only installation</h2>
      <p>
        When the Consenti backend is <em>not</em> deployed, use <code>ConsentiProfile</code> to
        define profiles entirely in JavaScript. Each instance is registered in a module-level
        registry. <code>ConsentiSetup</code> resolves it by the numeric ID returned by{' '}
        <code>profile.getId()</code>.
      </p>
      <Callout type="tip">
        Local profile IDs are auto-assigned starting from <strong>1000</strong> to avoid
        collisions with database-assigned API profile IDs (which start from 1).
        Never hard-code a local profile ID — always call <code>profile.getId()</code>.
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
          { text: 'Reject All',          style: 'secondary',  action: 'custom', cookies: '!' },
          { text: 'Manage Preferences',  style: 'secondary',  action: 'manage' },
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
          { text: 'Reject All',       style: 'text',     action: 'custom', cookies: '!' },
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
  core: {
    profileId: profile.getId(), // ← always use getId(), never hardcode
    regulation: 'gdpr',
  },
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
          { text: 'Reject All',  style: 'secondary', action: 'custom', cookies: '!' },
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
  core: { profileId: profile.getId(), locale: 'fr' },
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
        { text: 'Manage Preferences',   style: 'secondary', action: 'manage' },
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
            <td><code>regulation</code></td>
            <td><code>string</code></td>
            <td>No</td>
            <td>Compliance regulation stored with this profile. In API mode, the server applies it in place of <code>core.regulation</code>. For local profiles, use <code>core.regulation</code> on <code>ConsentiSetup</code> instead.</td>
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
            <td>Required when <code>regulation: &apos;dpdpa&apos;</code>. See the <a href="/docs/compliance/dpdpa/">DPDPA guide</a>.</td>
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
          <tr><td><code>cpraCategory</code></td><td><code>&apos;sale&apos; | &apos;sharing&apos; | &apos;sensitive&apos;</code></td><td>No</td><td>CPRA classification. Only used when <code>regulation: &apos;cpra&apos;</code>.</td></tr>
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
  core: { profileId: profile.getId(), regulation: 'gdpr' },
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
  core: { profileId: profile.getId() },
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
  core: { regulation: 'gdpr' }, // profileId omitted → starts from default, then overridden
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
        { text: 'Reject All',         style: 'secondary', action: 'custom', cookies: '!' },
        { text: 'Manage Preferences', style: 'secondary', action: 'manage' },
      ],
    },
    gpcBanner: {
      position: 'bottom',
      heading: 'Privacy signal detected',
      htmlText: "Your browser's GPC signal has been honoured. Ad cookies are pre-denied.",
      buttons: [
        { text: 'Understood',         style: 'primary',   action: 'custom', cookies: '!' },
        { text: 'Manage Preferences', style: 'secondary', action: 'manage' },
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
        { text: 'Reject All',       style: 'text',    action: 'custom', cookies: '!' },
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
  core: { profileId: profile.getId() },
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

      <h2>Using a backend profile by ID</h2>
      <p>
        When the Consenti API is deployed, profiles are created in the Admin Dashboard and
        assigned a numeric ID. Pass that ID to <code>core.profileId</code> and enable the API.
        The widget fetches the profile automatically at init time.
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    profileId: 3,       // numeric ID from Admin Dashboard → Profiles
    regulation: 'gdpr',
    locale: 'fr',       // server resolves locale fallback
  },
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com', // where @consenti/api is mounted
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
  ProfileConfig,       // passed to new ConsentiProfile(config)
  LocaleTranslations,  // translations[locale] shape
  MainBanner,          // mainBanner / gpcBanner shape
  PreferenceModal,     // preferenceModal shape
  Button,              // button definition
  ButtonStyle,         // 'primary' | 'secondary' | 'text' | 'accent'
  ButtonAction,        // 'custom' | 'manage' | 'submit' | 'close'
  Category,            // preference modal category
  Cookie,              // cookie / purpose definition
  ResolvedProfile,     // what profileOverride accepts (Partial<ResolvedProfile>)
} from '@consenti/ui'`}
      />
    </div>
  )
}
