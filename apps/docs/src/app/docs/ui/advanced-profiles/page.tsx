import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Advanced Profile — UI Widget',
  description:
    'How Consenti profiles define the cookies, banner layout, button labels, and locale text the UI widget renders.',
  alternates: { canonical: 'https://consenti.dev/docs/ui/advanced-profiles' },
  openGraph: {
    title: 'Advanced Profile — UI Widget',
    description:
      'How Consenti profiles define the cookies, banner layout, button labels, and locale text the UI widget renders.',
    url: 'https://consenti.dev/docs/ui/advanced-profiles',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advanced Profile — UI Widget',
    description:
      'How Consenti profiles define the cookies, banner layout, button labels, and locale text the UI widget renders.',
    images: ['/og-image.jpg'],
  },
}

export default function UIAdvancedProfilesPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Advanced Profile</h1>
      <p>
        A <strong>profile</strong> defines everything the Consenti widget renders: which cookies /
        purposes it manages, the banner and modal layout, all button labels and actions, and the
        text copy for every supported locale. It is the single source of truth for the UI — not the
        widget config itself. New here? Start with the{' '}
        <a href="/docs/ui/profiles/">Profile quick start</a> instead — this page is the complete
        reference: resolution order, every <code>ConsentiProfile</code> field, multi-locale, GPC
        banner, and more.
      </p>

      <h2>How profiles are resolved</h2>
      <p>
        Every time <code>new ConsentiSetup(config)</code> initialises, it resolves exactly one
        profile through one of six scenarios. The compliance group (from{' '}
        <code>compliance.type</code> or auto-detected from the browser) determines which pre-built
        profile is loaded.
      </p>

      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>API</th>
            <th>compliance.type</th>
            <th>Resolution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>1A</strong>
            </td>
            <td>off</td>
            <td>auto-detect</td>
            <td>
              Browser locale + optional geo resolver → compliance group → pre-built profile chunk
              (dynamic import)
            </td>
          </tr>
          <tr>
            <td>
              <strong>1B</strong>
            </td>
            <td>off</td>
            <td>
              fixed (e.g. <code>&apos;opt-in&apos;</code>)
            </td>
            <td>Pre-built profile chunk for that group, loaded via dynamic import</td>
          </tr>
          <tr>
            <td>
              <strong>2A</strong>
            </td>
            <td>on</td>
            <td>auto-detect</td>
            <td>
              <code>GET /resolve-profile</code> returns the best profile URL for the visitor; result
              cached in <code>sessionStorage</code> (1 h TTL)
            </td>
          </tr>
          <tr>
            <td>
              <strong>2B</strong>
            </td>
            <td>on</td>
            <td>
              fixed — a built-in group (e.g. <code>&apos;opt-in&apos;</code>) or a custom string
            </td>
            <td>
              Fetches the profile hot-served for that group name — skips auto-resolution. A custom
              string targets a dashboard profile authored with a <code>customComplianceGroup</code>{' '}
              instead of one of the 8 built-in groups; falls back to scenario 1B (which has no
              pre-built profile for a custom name, so it throws) if nothing is active there
            </td>
          </tr>
          <tr>
            <td>
              <strong>Local</strong>
            </td>
            <td>any</td>
            <td>any</td>
            <td>
              <code>ConsentiProfile</code> registered in code; takes precedence over pre-built
              profiles when found for the matching compliance type
            </td>
          </tr>
          <tr>
            <td>
              <strong>Fallback</strong>
            </td>
            <td>any</td>
            <td>any</td>
            <td>
              Built-in default GDPR profile (Google Consent Mode v2, four purposes) — always
              available
            </td>
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
        After resolution, any properties set in <code>profileOverride</code> are merged on top. See{' '}
        <a href="#profileoverride">profileOverride</a> below.
      </Callout>

      <h2>Pre-built profiles</h2>
      <p>
        Consenti ships pre-built profiles for each compliance group. They are loaded as dynamic
        import chunks — only the chunk for the resolved compliance group is downloaded. Each
        pre-built profile covers all four Google Consent Mode v2 purposes plus a mandatory
        functional bucket.
      </p>
      <p>
        The fallback built-in profile (used when all resolution steps fail) is an English opt-in
        GDPR profile — a realistic starting point for any GTM-backed site.
      </p>
      <CodeBlock
        lang="ts"
        filename="Default profile cookies (fallback)"
        code={`// Built-in fallback — used when all resolution steps fail. expiryDays is set once,
// profile-wide (see ProfileConfig.expiryDays below) — not per cookie.
const defaultCookies = {
  functionality_storage: {},                    // legal basis comes from its category ('mandatory')
  analytics_storage:     { listenGpc: true },
  ad_storage:            { listenGpc: true },
  ad_user_data:          { listenGpc: true },
  ad_personalization:    { listenGpc: true },
}`}
      />
      <p>
        To customise the pre-built profile banner without defining a full profile, use{' '}
        <a href="#profileoverride">profileOverride</a>.
      </p>

      <hr />

      <h2>ConsentiProfile — custom profiles in code</h2>
      <p>
        Use <code>ConsentiProfile</code> to define profiles entirely in JavaScript. Each instance is
        registered in a module-level registry under a unique <code>Symbol</code>, returned by{' '}
        <code>profile.getType()</code>.
      </p>
      <Callout type="tip">
        Define the profile before calling <code>new ConsentiSetup()</code> — the registry lookup
        happens during resolution. Pass{' '}
        <code>
          compliance: {'{'} type: profile.getType() {'}'}
        </code>{' '}
        to use it directly, <em>or</em> set <code>complianceGroup: 'opt-in'</code> (etc.) on the
        profile config with{' '}
        <code>
          compliance: {'{'} type: 'opt-in' {'}'}
        </code>{' '}
        (or <code>'auto'</code>) to have it automatically preferred over the built-in profile
        whenever that group is resolved — see{' '}
        <a href="#complianceGroup-override">Overriding a built-in group</a> below.
      </Callout>

      <h3>Minimal example</h3>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'

const profile = new ConsentiProfile({
  defaultLocale: 'en',
  expiryDays: 365, // profile-wide consent expiry — replaces the old per-cookie \`expiry\`
  cookies: {
    necessary: {},
    analytics: { listenGpc: true },
    marketing: { listenGpc: true },
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'We value your privacy',
        htmlText: 'We use cookies to improve your experience.',
        buttons: {
          'accept-all': { text: 'Accept All',          style: 'primary',    action: 'custom', cookies: '*' },
          'reject-optional': { text: 'Reject Optional',          style: 'secondary',  action: 'custom', cookies: '!' },
          'customize': { text: 'Customize',  style: 'secondary',  action: 'manage' },
        },
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        subheading: 'Choose which cookies you allow.',
        position: 'center',
        showClose: true,
        overlayOpacity: 50,
        buttons: {
          'accept-all': { text: 'Accept All',       style: 'primary',  action: 'custom', cookies: '*' },
          'save-preferences': { text: 'Save Preferences', style: 'primary',  action: 'submit' },
          'reject-optional': { text: 'Reject Optional',       style: 'text',     action: 'custom', cookies: '!' },
        },
        categories: {
          necessary: {
            heading: 'Strictly Necessary',
            htmlText: 'Required for the site to function.',
            legalBasis: 'mandatory',
            cookies: ['necessary'],
          },
          analytics: {
            heading: 'Analytics',
            htmlText: 'Helps us understand how visitors use the site.',
            legalBasis: 'consent',
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
  },
})

new ConsentiSetup({
  compliance: { type: profile.getType() },
  // ConsentiProfile auto-registered above takes precedence over the pre-built profile
})`}
      />

      <h3>Multi-locale profile</h3>
      <p>
        Add as many locale keys as needed. The widget resolves locale by trying the exact BCP 47
        code, then the language prefix, then <code>defaultLocale</code>.
      </p>
      <CodeBlock
        lang="ts"
        code={`const profile = new ConsentiProfile({
  defaultLocale: 'en',
  cookies: {
    necessary: {},
    analytics: {},
  },
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        htmlText: 'We use cookies.',
        buttons: {
          'accept-all': { text: 'Accept All',  style: 'primary',   action: 'custom', cookies: '*' },
          'reject-optional': { text: 'Reject Optional',  style: 'secondary', action: 'custom', cookies: '!' },
        },
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        buttons: { 'save-preferences': { text: 'Save Preferences', style: 'primary', action: 'submit' } },
        categories: {
          necessary: { heading: 'Necessary', htmlText: 'Required.', legalBasis: 'mandatory', cookies: ['necessary'] },
          analytics: { heading: 'Analytics', htmlText: 'Usage stats.', legalBasis: 'consent', cookies: ['analytics'] },
        },
      },
    },
    fr: {
      mainBanner: {
        position: 'bottom',
        htmlText: 'Nous utilisons des cookies.',
        buttons: {
          'tout-accepter': { text: 'Tout accepter',  style: 'primary',   action: 'custom', cookies: '*' },
          'tout-refuser': { text: 'Tout refuser',   style: 'secondary', action: 'custom', cookies: '!' },
        },
      },
      preferenceModal: {
        heading: 'Préférences cookies',
        buttons: { enregistrer: { text: 'Enregistrer', style: 'primary', action: 'submit' } },
        categories: {
          necessary: { heading: 'Nécessaire', htmlText: 'Requis.', legalBasis: 'mandatory', cookies: ['necessary'] },
          analytics: { heading: 'Analytiques', htmlText: 'Statistiques.', legalBasis: 'consent', cookies: ['analytics'] },
        },
      },
    },
  },
})

new ConsentiSetup({
  compliance: { type: profile.getType() },
  core: { locale: 'fr' },
})`}
      />

      <h3>GPC banner variant</h3>
      <p>
        Add a <code>gpcBanner</code> key alongside <code>mainBanner</code> in a locale to show a
        dedicated banner when the Global Privacy Control signal is detected. Falls back to{' '}
        <code>mainBanner</code> if not provided.
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
      buttons: {
        'understood': { text: 'Understood',           style: 'primary',   action: 'custom', cookies: '!' },
        'customize': { text: 'Customize',   style: 'secondary', action: 'manage' },
      },
    },
    preferenceModal: { /* ... */ },
  },
}`}
      />

      <h3 id="complianceGroup-override">Overriding a built-in compliance group</h3>
      <p>
        Instead of switching <code>compliance.type</code> to your profile&apos;s own{' '}
        <code>Symbol</code>, you can set <code>complianceGroup</code> on a registered profile and
        Consenti will prefer it automatically over the built-in embedded profile whenever
        geo-detection (<code>&apos;auto&apos;</code>) or an explicit <code>compliance.type</code>{' '}
        resolves to that group — no change needed at the <code>ConsentiSetup</code> call site.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'

// Full replace (deepMerge: false, the default) — this config is used as-is
// whenever the resolved group is 'opt-in'; the built-in profile is never even fetched.
new ConsentiProfile({
  complianceGroup: 'opt-in',
  defaultLocale: 'en',
  cookies: { necessary: {}, analytics: { listenGpc: true } },
  translations: { /* ... full mainBanner / preferenceModal ... */ },
})

// Patch just one field (deepMerge: true) — only the fields you supply are merged
// onto the built-in 'opt-in' profile; everything else (cookies, categories, other
// locales) comes from the built-in as normal.
new ConsentiProfile({
  complianceGroup: 'opt-in',
  deepMerge: true,
  translations: {
    en: { mainBanner: { position: 'right-bottom' } },
  },
})

new ConsentiSetup({ compliance: { type: 'auto' } }) // or { type: 'opt-in' } — either resolves the override above`}
      />

      <hr />

      <h2>ProfileConfig — all options</h2>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>defaultLocale</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>Yes</td>
            <td>
              BCP 47 locale used when the requested locale has no translation. E.g.{' '}
              <code>&apos;en&apos;</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>cookies</code>
            </td>
            <td>
              <code>CookieMap</code>
            </td>
            <td>No</td>
            <td>
              Consent parameters, keyed by ID (the map key <em>is</em> the ID — no separate{' '}
              <code>id</code> field). See <a href="#cookie-type">Cookie type</a> below.
            </td>
          </tr>
          <tr>
            <td>
              <code>expiryDays</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>No</td>
            <td>
              Days until consent expires and the visitor is asked again — profile-wide, replacing
              the old per-cookie <code>expiry</code>. Default: <code>365</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>translations</code>
            </td>
            <td>
              <code>Record&lt;string, LocaleTranslations&gt;</code>
            </td>
            <td>No</td>
            <td>
              Banner and modal config keyed by locale. If omitted, the widget falls back to
              profileOverride or defaults.
            </td>
          </tr>
          <tr>
            <td>
              <code>mainBanner</code>
            </td>
            <td>
              <code>MainBanner</code>
            </td>
            <td>Yes</td>
            <td>
              Default banner content, used when a locale-specific override isn&apos;t provided in{' '}
              <code>translations</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>gpcBanner</code>
            </td>
            <td>
              <code>GpcBanner</code>
            </td>
            <td>No</td>
            <td>
              Default GPC banner content (same shape as <code>MainBanner</code>), used when a
              locale-specific override isn&apos;t provided. Falls back to <code>mainBanner</code> if
              neither is set.
            </td>
          </tr>
          <tr>
            <td>
              <code>preferenceModal</code>
            </td>
            <td>
              <code>PreferenceModal</code>
            </td>
            <td>Yes</td>
            <td>
              Default modal content, including the <code>categories</code> map. See{' '}
              <a href="#category-type">Category type</a> below.
            </td>
          </tr>
          <tr>
            <td>
              <code>allowedOrigins</code>
            </td>
            <td>
              <code>string[]</code>
            </td>
            <td>No</td>
            <td>
              Hostnames permitted to submit consent for this profile. Only enforced server-side in
              API mode. Supports <code>*.example.com</code> wildcards. Empty = allow all.
            </td>
          </tr>
          <tr>
            <td>
              <code>dpdpa</code>
            </td>
            <td>
              <code>DpdpaConfig</code>
            </td>
            <td>No</td>
            <td>
              Required when using the <code>opt-in-dpdpa</code> compliance group. See the{' '}
              <a href="/docs/compliance/dpdpa/">DPDPA guide</a>.
            </td>
          </tr>
          <tr>
            <td>
              <code>complianceGroup</code>
            </td>
            <td>
              <code>ComplianceGroupId</code>
            </td>
            <td>No</td>
            <td>
              Marks this registered profile as an override for a built-in compliance group — see{' '}
              <a href="#complianceGroup-override">Overriding a built-in compliance group</a> above.
            </td>
          </tr>
          <tr>
            <td>
              <code>deepMerge</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Only meaningful together with <code>complianceGroup</code>. <code>false</code>{' '}
              (default) fully replaces the built-in profile; <code>true</code> deep-merges this
              config onto it instead.
            </td>
          </tr>
          <tr>
            <td>
              <code>gpcMode</code>
            </td>
            <td>
              <code>&apos;ignore&apos; | &apos;honor&apos; | &apos;strict&apos;</code>
            </td>
            <td>No</td>
            <td>
              Per-profile GPC handling. Overridden at runtime by <code>core.autoHonorGPC</code> when
              that&apos;s explicitly set.
            </td>
          </tr>
          <tr>
            <td>
              <code>allowReceipt</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Shows the &quot;Download consent receipt&quot; checkbox in the modal footer. See{' '}
              <code>preferenceModal.receiptLabel</code>/<code>receiptDescription</code> to customise
              its text.
            </td>
          </tr>
          <tr>
            <td>
              <code>hidePoweredBy</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Suppresses the &quot;Powered by Consenti&quot; footer link in the banner and modal.
              Defaults to <code>true</code> (hidden) when unset.
            </td>
          </tr>
          <tr>
            <td>
              <code>darkMode</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Default dark-mode state for this profile. Overridden at runtime by{' '}
              <code>ConsentiConfig.darkMode</code> or <code>setDarkMode()</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>complianceConfig</code>
            </td>
            <td>
              <code>Record&lt;string, string&gt;</code>
            </td>
            <td>No</td>
            <td>Per-compliance extra config, e.g. the DPDPA data-fiduciary name.</td>
          </tr>
          <tr>
            <td>
              <code>showFooterMetadata</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Shows a metadata footer strip (Consent ID, Date, Version, Privacy Settings link) in
              the banner/modal.
            </td>
          </tr>
          <tr>
            <td>
              <code>enhanceAccessibility</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Applies WCAG 2.1 AA button sizing (44px min-height), visible focus rings, and
              screen-reader labels.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="cookie-type">Cookie type</h3>
      <p>
        <code>cookies</code> is a <code>Record&lt;string, Cookie&gt;</code> — the map key{' '}
        <em>is</em> the parameter&apos;s ID (used as the key in the stored consent map, e.g.{' '}
        <code>cookies.analytics_storage</code>). There is no <code>id</code> field on the value
        itself. A parameter&apos;s legal basis (mandatory / consent / legitimate interest) is{' '}
        <strong>not</strong> set here — it&apos;s derived from whichever{' '}
        <a href="#category-type">Category</a> lists this ID in its <code>cookies</code> array. Every
        parameter must belong to exactly one category.
      </p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>purpose</code>
            </td>
            <td>
              <code>CookiePurpose</code>
            </td>
            <td>No</td>
            <td>
              Purpose classification (e.g. <code>&apos;analytics&apos;</code>,{' '}
              <code>&apos;marketing&apos;</code>) used for informational display in the modal.
            </td>
          </tr>
          <tr>
            <td>
              <code>listenGpc</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              When <code>true</code> and GPC handling is active, this parameter is
              auto-denied/objected when the browser GPC signal is present.
            </td>
          </tr>
          <tr>
            <td>
              <code>preGrant</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Pre-grants this parameter&apos;s default consent to <code>&apos;granted&apos;</code>{' '}
              (instead of the compliance-group default) when no stored decision exists yet. Only
              meaningful when the owning category has <code>legalBasis: &apos;consent&apos;</code> —
              mandatory/legitimate-interest categories are already effectively pre-granted. Never
              overrides an active GPC signal. Default: <code>false</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>tcfVendorId</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>No</td>
            <td>IAB TCF vendor ID, shown in the modal when TCF display is relevant.</td>
          </tr>
          <tr>
            <td>
              <code>tcfPurposes</code>
            </td>
            <td>
              <code>number[]</code>
            </td>
            <td>No</td>
            <td>IAB TCF purpose IDs this parameter serves.</td>
          </tr>
          <tr>
            <td>
              <code>tcfSpecialFeatures</code>
            </td>
            <td>
              <code>number[]</code>
            </td>
            <td>No</td>
            <td>IAB TCF special feature IDs this parameter uses.</td>
          </tr>
          <tr>
            <td>
              <code>cpraCategory</code>
            </td>
            <td>
              <code>&apos;sale&apos; | &apos;sharing&apos; | &apos;sensitive&apos;</code>
            </td>
            <td>No</td>
            <td>
              CPRA classification. Only relevant for the <code>opt-out-strict</code> compliance
              group.
            </td>
          </tr>
        </tbody>
      </table>
      <Callout type="warning">
        Setting <code>preGrant: true</code> on a strict opt-in compliance group (<code>opt-in</code>
        , <code>opt-in-dpdpa</code>, <code>opt-in-china</code>, <code>opt-in-brazil</code>) triggers
        a server-side compliance warning — those regulations require consent to be denied by
        default. Only use it for custom profiles targeting jurisdictions where pre-granted consent
        is valid.
      </Callout>

      <h3>LocaleTranslations type</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>mainBanner</code>
            </td>
            <td>
              <code>MainBanner</code>
            </td>
            <td>Yes</td>
            <td>Banner shown on first visit or when no consent exists.</td>
          </tr>
          <tr>
            <td>
              <code>gpcBanner</code>
            </td>
            <td>
              <code>GpcBanner</code>
            </td>
            <td>No</td>
            <td>
              Banner shown instead of <code>mainBanner</code> when GPC is detected. Same shape as{' '}
              <code>MainBanner</code>. Falls back to <code>mainBanner</code> if omitted.
            </td>
          </tr>
          <tr>
            <td>
              <code>preferenceModal</code>
            </td>
            <td>
              <code>PreferenceModal</code>
            </td>
            <td>Yes</td>
            <td>Slide-in panel where the user manages individual cookie categories.</td>
          </tr>
        </tbody>
      </table>

      <h3>MainBanner / GpcBanner type</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>position</code>
            </td>
            <td>
              <code>
                &apos;bottom&apos; | &apos;top&apos; | &apos;middle&apos; | &apos;left-bottom&apos;
                | &apos;right-bottom&apos;
              </code>
            </td>
            <td>Yes</td>
            <td>Where the banner is anchored on screen.</td>
          </tr>
          <tr>
            <td>
              <code>htmlText</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>Yes</td>
            <td>Body content. HTML is allowed. Sanitise any user-supplied values externally.</td>
          </tr>
          <tr>
            <td>
              <code>heading</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>Heading text. Omit to hide the heading element entirely.</td>
          </tr>
          <tr>
            <td>
              <code>headingTag</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>
              HTML tag for the heading, e.g. <code>&apos;div&apos;</code> (default) or{' '}
              <code>&apos;p&apos;</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>overlayOpacity</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>No</td>
            <td>
              Full-page overlay opacity, 0–100. <code>0</code> disables the overlay. Default:{' '}
              <code>0</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>showClose</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>Render a ✕ close button that dismisses the banner without saving consent.</td>
          </tr>
          <tr>
            <td>
              <code>showLocaleSwitcher</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Show a locale switcher in the banner. Only renders when the profile has more than one
              locale defined.
            </td>
          </tr>
          <tr>
            <td>
              <code>buttons</code>
            </td>
            <td>
              <code>Button[]</code>
            </td>
            <td>Yes</td>
            <td>Ordered list of action buttons rendered in the banner footer.</td>
          </tr>
        </tbody>
      </table>

      <h3>PreferenceModal type</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>buttons</code>
            </td>
            <td>
              <code>Button[]</code>
            </td>
            <td>Yes</td>
            <td>Footer action buttons.</td>
          </tr>
          <tr>
            <td>
              <code>categories</code>
            </td>
            <td>
              <code>CategoryMap</code>
            </td>
            <td>Yes</td>
            <td>
              Consent categories keyed by ID, each shown with its own tri-state toggle plus one
              toggle per member parameter. See <a href="#category-type">Category type</a> below.
            </td>
          </tr>
          <tr>
            <td>
              <code>position</code>
            </td>
            <td>
              <code>&apos;center&apos; | &apos;left&apos; | &apos;right&apos;</code>
            </td>
            <td>No</td>
            <td>
              Modal panel anchor. Default: <code>&apos;center&apos;</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>heading</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>Modal heading text.</td>
          </tr>
          <tr>
            <td>
              <code>subheading</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>Optional subheading rendered below the heading.</td>
          </tr>
          <tr>
            <td>
              <code>htmlText</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>Optional intro text rendered above the category list. HTML is allowed.</td>
          </tr>
          <tr>
            <td>
              <code>overlayOpacity</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>No</td>
            <td>
              Modal backdrop opacity, 0–100. Default: <code>50</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>showClose</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>Show a ✕ close button in the modal header.</td>
          </tr>
          <tr>
            <td>
              <code>showLocaleSwitcher</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              Show a locale switcher in the modal header. Only renders when the profile has more
              than one locale defined.
            </td>
          </tr>
          <tr>
            <td>
              <code>persistent</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>No</td>
            <td>
              When <code>true</code>, clicking the overlay does not close the modal. The user must
              click a footer button. Default: <code>false</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>mobileFullScreenBreakpoint</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>No</td>
            <td>
              Screen width in px at or below which the modal expands to fill the entire screen.
              Default: <code>576</code>. Set to <code>0</code> to disable full-screen on mobile
              entirely.
            </td>
          </tr>
          <tr>
            <td>
              <code>headingTag</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>HTML tag for the modal heading.</td>
          </tr>
          <tr>
            <td>
              <code>receiptLabel</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>
              Label for the consent-receipt download checkbox (shown when <code>allowReceipt</code>{' '}
              is true). Falls back to a default when omitted.
            </td>
          </tr>
          <tr>
            <td>
              <code>receiptDescription</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>
              Description shown beneath the consent-receipt checkbox. Falls back to a default when
              omitted.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Button type</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>id</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>
              Machine id, rendered as the button&apos;s DOM id (<code>consenti-btn-{'{id}'}</code>)
              so integrators can target a specific button. Set automatically when authored via a UI
              template; omitted buttons get no DOM id.
            </td>
          </tr>
          <tr>
            <td>
              <code>text</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>Yes</td>
            <td>Label rendered on the button.</td>
          </tr>
          <tr>
            <td>
              <code>style</code>
            </td>
            <td>
              <code>
                &apos;primary&apos; | &apos;secondary&apos; | &apos;text&apos; | &apos;accent&apos;
              </code>
            </td>
            <td>Yes</td>
            <td>
              Visual appearance only — never affects click behaviour.
              <code>primary</code> = filled accent; <code>secondary</code> = outlined/ghost;{' '}
              <code>text</code> = no border, link-like; <code>accent</code> = destructive red (uses{' '}
              <code>--consenti-accent-color</code>).
            </td>
          </tr>
          <tr>
            <td>
              <code>action</code>
            </td>
            <td>
              <code>
                &apos;custom&apos; | &apos;manage&apos; | &apos;submit&apos; | &apos;close&apos; |
                &apos;link&apos;
              </code>
            </td>
            <td>Yes</td>
            <td>
              What happens on click. <code>custom</code> = grant/deny the IDs in{' '}
              <code>cookies</code>; <code>manage</code> = open the preference modal;{' '}
              <code>submit</code> = save the current modal toggle state; <code>close</code> =
              dismiss without saving; <code>link</code> = navigate to <code>url</code> (opens in a
              new tab).
            </td>
          </tr>
          <tr>
            <td>
              <code>cookies</code>
            </td>
            <td>
              <code>&apos;*&apos; | &apos;!&apos; | string[]</code>
            </td>
            <td>
              When <code>action: &apos;custom&apos;</code>
            </td>
            <td>
              Which cookie IDs to affect. <code>&apos;*&apos;</code> = grant all;{' '}
              <code>&apos;!&apos;</code> = deny all; <code>string[]</code> = specific IDs only.
            </td>
          </tr>
          <tr>
            <td>
              <code>url</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              When <code>action: &apos;link&apos;</code>
            </td>
            <td>
              Target URL for the link button. Opens in a new tab. Typically used for privacy policy
              or terms links rendered below the banner body.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 id="category-type">Category type</h3>
      <p>
        <code>categories</code> is a <code>Record&lt;string, Category&gt;</code> — the map key{' '}
        <em>is</em> the category&apos;s ID. A <code>Category</code> is the single source of legal
        basis for every parameter it lists — <code>Cookie</code> itself has no legal-basis field.
      </p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>heading</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>Yes</td>
            <td>Category name shown as the master toggle label.</td>
          </tr>
          <tr>
            <td>
              <code>htmlText</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>Yes</td>
            <td>Description text beneath the heading. HTML is allowed.</td>
          </tr>
          <tr>
            <td>
              <code>cookies</code>
            </td>
            <td>
              <code>string[]</code>
            </td>
            <td>Yes</td>
            <td>
              IDs of the parameters (from the profile&apos;s <code>cookies</code> map) that belong
              to this category. Each renders its own toggle inside the category; a parameter must
              belong to exactly one category.
            </td>
          </tr>
          <tr>
            <td>
              <code>legalBasis</code>
            </td>
            <td>
              <code>
                &apos;mandatory&apos; | &apos;consent&apos; | &apos;legitimate_interest&apos;
              </code>
            </td>
            <td>Yes</td>
            <td>
              Replaces the old separate <code>mandatory</code>/<code>type</code> fields — single
              source of truth. <code>&apos;mandatory&apos;</code> = every member parameter is always{' '}
              <code>&apos;granted&apos;</code>, toggle disabled. <code>&apos;consent&apos;</code> =
              standard opt-in/opt-out. <code>&apos;legitimate_interest&apos;</code> = on by default
              until objected; refusal is stored as <code>&apos;objected&apos;</code> instead of{' '}
              <code>&apos;denied&apos;</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>legitimateInterestDescription</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>
              Only meaningful when <code>legalBasis === &apos;legitimate_interest&apos;</code>.
              Shown in the modal to explain the legitimate interest claimed — the GDPR
              balancing-test justification, authored per-locale alongside the category&apos;s other
              content.
            </td>
          </tr>
          <tr>
            <td>
              <code>headingTag</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>No</td>
            <td>
              HTML tag for the category heading, e.g. <code>&apos;div&apos;</code> (default).
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The category&apos;s own master toggle is 3-state — <code>denied</code>, <code>allowed</code>
        , or <code>partial</code> (mixed) — computed live from its member parameters&apos;
        individual toggle states, not stored separately. Clicking a <code>partial</code> toggle
        resolves to fully <code>allowed</code> first (standard tri-state checkbox convention), then{' '}
        <code>denied</code> on a second click.
      </p>

      <hr />

      <h2 id="profileoverride">profileOverride — runtime overrides</h2>
      <p>
        <code>profileOverride</code> lets you change any field of the <em>resolved</em> profile at
        runtime, without touching the base profile definition. It is applied as a deep merge on top
        of whatever profile was resolved (default, local, or API).
      </p>
      <p>
        Common uses: adjusting banner position per-page, swapping button copy for A/B tests, or
        running the widget with no backend at all by providing the entire profile inline.
      </p>

      <Callout type="info">
        <code>profileOverride</code> accepts a <code>Partial&lt;ResolvedProfile&gt;</code>,
        deep-merged key by key. Since <code>cookies</code> and{' '}
        <code>preferenceModal.categories</code> are keyed maps, you can add or override a single
        parameter/category ID without needing to repeat every other one.
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
      buttons: {
        'accept': { text: 'Accept',  style: 'primary',   action: 'custom', cookies: '*' },
        'decline': { text: 'Decline', style: 'secondary',  action: 'custom', cookies: '!' },
      },
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
        You can provide an entire profile through <code>profileOverride</code> alone. This is the
        most concise approach for simple frontend-only installations that do not need multi-locale
        support.
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    cookies: {
      necessary: {},
      analytics: { listenGpc: true },
      marketing: { listenGpc: true },
    },
    expiryDays: 365,
    mainBanner: {
      position: 'bottom',
      heading: 'We value your privacy',
      htmlText: 'We use cookies to improve your experience and personalise ads.',
      buttons: {
        'accept-all': { text: 'Accept All',         style: 'primary',   action: 'custom', cookies: '*' },
        'reject-optional': { text: 'Reject Optional',         style: 'secondary', action: 'custom', cookies: '!' },
        'customize': { text: 'Customize', style: 'secondary', action: 'manage' },
      },
    },
    gpcBanner: {
      position: 'bottom',
      heading: 'Privacy signal detected',
      htmlText: "Your browser's GPC signal has been honoured. Ad cookies are pre-denied.",
      buttons: {
        'understood': { text: 'Understood',         style: 'primary',   action: 'custom', cookies: '!' },
        'customize': { text: 'Customize', style: 'secondary', action: 'manage' },
      },
    },
    preferenceModal: {
      position: 'center',
      heading: 'Cookie Preferences',
      subheading: 'Choose which cookies you allow us to use.',
      showClose: true,
      overlayOpacity: 50,
      buttons: {
        'accept-all': { text: 'Accept All',       style: 'primary', action: 'custom', cookies: '*' },
        'save-preferences': { text: 'Save Preferences', style: 'primary', action: 'submit' },
        'reject-optional': { text: 'Reject Optional',       style: 'text',    action: 'custom', cookies: '!' },
      },
      categories: {
        necessary: {
          heading: 'Strictly Necessary',
          htmlText: 'Required for the site to function. Cannot be disabled.',
          legalBasis: 'mandatory',
          cookies: ['necessary'],
        },
        analytics: {
          heading: 'Analytics',
          htmlText: 'Helps us understand how visitors use the site (e.g. Google Analytics).',
          legalBasis: 'consent',
          cookies: ['analytics'],
        },
        marketing: {
          heading: 'Marketing',
          htmlText: 'Used to deliver relevant ads and measure campaign effectiveness.',
          legalBasis: 'consent',
          cookies: ['marketing'],
        },
      },
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
      categories: {
        necessary: {
          heading: 'Strictly Necessary',
          htmlText: 'Core functionality. Always enabled.',
          legalBasis: 'mandatory',
          cookies: ['necessary'],
        },
        analytics: {
          heading: 'Analytics',
          htmlText: 'Page view and interaction tracking.',
          legalBasis: 'consent',
          cookies: ['analytics'],
        },
      },
    },
  },
})`}
      />

      <hr />

      <h2>Using the backend API</h2>
      <p>
        When the Consenti API is deployed, profiles are managed in the Admin Dashboard and grouped
        by compliance type. The widget calls <code>GET /resolve-profile</code> to find the best
        profile for each visitor automatically.
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
  ProfileConfig,             // passed to new ConsentiProfile(config)
  RegisterableProfileConfig, // ProfileConfig, or a { complianceGroup, deepMerge: true, ... } overlay
  LocaleTranslations,        // translations[locale] shape
  MainBanner,                // mainBanner / gpcBanner shape
  PreferenceModal,           // preferenceModal shape
  Button,                    // button definition
  ButtonStyle,               // 'primary' | 'secondary' | 'text' | 'accent'
  ButtonAction,              // 'custom' | 'manage' | 'submit' | 'close' | 'link'
  Category,                  // single category definition
  CategoryMap,                // Record<string, Category> — preferenceModal.categories shape
  Cookie,                     // single parameter definition
  CookieMap,                  // Record<string, Cookie> — cookies shape
  ResolvedProfile,            // what profileOverride accepts (Partial<ResolvedProfile>)
  ComplianceWidgetConfig,     // compliance section
  AgeGateWidgetConfig,        // compliance.ageGate section
  TcfWidgetConfig,            // compliance.tcf section
  WidgetCountryResolverFn,    // custom geo resolver function type
  NonEmptyArray,              // [T, ...T[]] — at least one element
} from '@consenti/ui'`}
      />
    </div>
  )
}
