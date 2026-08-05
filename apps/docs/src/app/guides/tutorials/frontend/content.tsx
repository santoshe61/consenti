import Link from 'next/link'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { BACKEND_TUTORIAL_STEPS } from '@/lib/tutorial-steps'

async function Step1Install() {
  return (
    <>
      <p>
        Pick whichever installation method matches your project — each is self-contained, so use
        only the one you need.
      </p>

      <h3>Option A — npm (recommended)</h3>
      <Terminal code="npm install @consenti/ui" />
      <p>Zero runtime dependencies — the widget uses only browser built-ins.</p>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({})
// A banner appears on first visit — Consenti auto-detects the right compliance
// group (GDPR, CCPA, etc.) from the visitor's browser locale.`}
      />

      <h3>Option B — CDN / UMD (no build step)</h3>
      <p>
        Exposes a global <code>ConsentiUI</code> object. No stylesheet link needed — styles inject
        automatically.
      </p>
      <CodeBlock
        lang="html"
        filename="index.html"
        code={`<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
<script>
  const { ConsentiSetup } = ConsentiUI
  new ConsentiSetup({})
</script>`}
      />

      <h3>Option C — ESM in the browser (no bundler)</h3>
      <CodeBlock
        lang="html"
        filename="index.html"
        code={`<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({})
</script>`}
      />

      <Callout type="info">
        No config is required to get a working, compliant banner with any of the three options.
        Everything from here on is about customizing it. See{' '}
        <Link href="/docs/ui/installation/">UI Installation</Link> for CSS options and the full
        package structure (<code>dist/index.mjs</code> for ESM, <code>dist/index.umd.js</code> for
        the CDN/UMD bundle, plus <code>dist/react.mjs</code>, <code>dist/vue.mjs</code>, and{' '}
        <code>dist/angular.mjs</code> framework adapters).
      </Callout>
    </>
  )
}

async function Step2Configure() {
  return (
    <>
      <p>
        Pin a specific compliance mode instead of relying on auto-detect, and patch copy or buttons
        with <code>profileOverride</code> — a deep-merge on top of the resolved profile:
      </p>
      <CodeBlock
        lang="ts"
        code={`const widget = new ConsentiSetup({
  compliance: { type: 'opt-in' }, // GDPR-model — or 'opt-out' for CCPA-model
  profileOverride: {
    mainBanner: {
      heading: 'We value your privacy',
      htmlText: 'We use cookies to improve your experience.',
      buttons: {
        'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
        'reject-optional': { text: 'Reject Optional', style: 'primary', action: 'custom', cookies: '!' },
        'customize': { text: 'Customize', style: 'secondary', action: 'manage' },
      },
    },
  },
})`}
      />
      <p>
        <code>profileOverride</code> is enough for most projects — see the{' '}
        <Link href="/docs/ui/configuration/">Configuration</Link> and{' '}
        <Link href="/docs/ui/profiles/">Profile</Link> reference pages for every option.
      </p>

      <h2>Scenario: more accurate geo-detection</h2>
      <p>
        <code>compliance: {'{ type: \'auto\' }'}</code> (the default) resolves the visitor&apos;s
        compliance group entirely client-side, from <code>Intl.DateTimeFormat</code> timezone +{' '}
        <code>navigator.language</code> — a heuristic, not real IP geolocation. There is no
        frontend-only hook to plug in your own country/region detector; the customization point
        for that lives on the <strong>backend</strong>, in <code>compliance.geoDataProvider</code>.
        Connect one and the frontend config barely changes:
      </p>
      <CodeBlock
        lang="ts"
        filename="Frontend — unchanged apart from pointing at your backend"
        code={`new ConsentiSetup({
  api: { enabled: true, baseUrl: 'https://your-site.com' },
  compliance: { type: 'auto' }, // now resolved server-side, not by browser heuristic
})`}
      />
      <CodeBlock
        lang="ts"
        filename="server.ts — your own geoDataProvider resolver"
        code={`createConsenti({
  // ...
  compliance: {
    type: 'auto',
    geoDataProvider: async ({ ip, timezone, language }) => {
      const res = await fetch(\`https://api.mygeoip.com/\${ip}\`)
      const data = await res.json()
      return { country: data.country_code, region: data.region, locale: data.locale ?? null }
    },
  },
})`}
      />
      <p>
        Most projects don&apos;t need a fully custom function — built-in{' '}
        <code>&apos;geoip&apos;</code> and <code>&apos;maxmind&apos;</code> resolvers cover most
        cases. See the{' '}
        <Link href="/guides/tutorials/backend/configure-backend/">
          Backend tutorial — Configure Backend
        </Link>{' '}
        step for those, and the full{' '}
        <Link href="/guides/backend/geo-routing/">Geo-Routing &amp; Auto-Detection</Link> guide for
        a comparison of every resolver.
      </p>
    </>
  )
}

async function Step3CustomProfile() {
  return (
    <>
      <p>
        For full control over cookies, categories, and copy — not just overrides — define a{' '}
        <code>ConsentiProfile</code> in code:
      </p>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'

const profile = new ConsentiProfile({
  defaultLocale: 'en',
  expiryDays: 365,
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
          'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
          'reject-optional': { text: 'Reject Optional', style: 'primary', action: 'custom', cookies: '!' },
          'customize': { text: 'Customize', style: 'secondary', action: 'manage' },
        },
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        subheading: 'Choose which cookies you allow.',
        position: 'center',
        showClose: true,
        overlayOpacity: 50,
        buttons: {
          'accept-all': { text: 'Accept All', style: 'primary', action: 'custom', cookies: '*' },
          'save-preferences': { text: 'Save Preferences', style: 'primary', action: 'submit' },
          'reject-optional': { text: 'Reject Optional', style: 'text', action: 'custom', cookies: '!' },
        },
        categories: {
          necessary: { heading: 'Strictly Necessary', htmlText: 'Required for the site to function.', legalBasis: 'mandatory', cookies: ['necessary'] },
          analytics: { heading: 'Analytics', htmlText: 'Helps us understand how visitors use the site.', legalBasis: 'consent', cookies: ['analytics'] },
          marketing: { heading: 'Marketing', htmlText: 'Used to personalise ads and measure campaigns.', legalBasis: 'consent', cookies: ['marketing'] },
        },
      },
    },
  },
})

new ConsentiSetup({
  compliance: { type: profile.getType() },
  // The registered ConsentiProfile takes precedence over the pre-built one
})`}
      />
      <Callout type="tip">
        This step is optional — skip it if <code>profileOverride</code> already covers what you
        need. See <Link href="/docs/ui/advanced-profiles/">Advanced Profile</Link> for multi-locale
        profiles and the full resolution order.
      </Callout>

      <h2>Optional profile-level configs</h2>
      <p>Pick whichever of these your compliance requirements call for — none are required.</p>

      <h3>gpcBanner — a dedicated banner when GPC is detected</h3>
      <p>
        Add a <code>gpcBanner</code> key alongside <code>mainBanner</code> in a locale. Falls back
        to <code>mainBanner</code> if omitted.
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
        'understood': { text: 'Understood', style: 'primary', action: 'custom', cookies: '!' },
        'customize': { text: 'Customize', style: 'secondary', action: 'manage' },
      },
    },
    preferenceModal: { /* ... */ },
  },
}`}
      />

      <h3>gpcMode — how strictly GPC is honored</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiProfile({
  gpcMode: 'strict', // 'ignore' | 'honor' | 'strict'
  // ...
})`}
      />
      <p>
        Defaults to the resolved compliance group's own default (<code>'honor'</code> for{' '}
        <code>opt-out</code>/<code>opt-out-strict</code>, <code>'ignore'</code> otherwise) unless
        set explicitly here or via <code>profileOverride.gpcMode</code>.
      </p>

      <h3>Other optional profile fields</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiProfile({
  allowReceipt: true,    // shows "Download consent receipt" in the modal footer
  hidePoweredBy: true,   // suppresses the "Powered by Consenti" footer link (default: hidden)
  darkMode: true,        // default dark-mode state for this profile
  // ...
})`}
      />
    </>
  )
}

async function Step4Events() {
  return (
    <>
      <p>
        Consenti fires typed <code>consenti:</code>-prefixed events at every consent lifecycle
        step. Subscribe to whichever ones your integration needs, via <code>widget.on()</code> —
        each snippet below is independent, so copy only what you use.
      </p>

      <h3>consentSubmitted — a decision was saved</h3>
      <CodeBlock
        lang="ts"
        code={`// Returning visitors — check existing consent on load
widget.onReady(() => {
  if (widget.isCookieGranted('analytics')) initAnalytics()
  if (widget.isCookieGranted('marketing')) initAds()
})

// New submission this session — typed on()/off() API
widget.on('consentSubmitted', ({ consentJson, consentAction }) => {
  if (consentJson.analytics === 'granted') initAnalytics()
  console.log('Action:', consentAction) // 'accept_all' | 'reject_all' | 'custom' | 'update'
})`}
      />

      <h3>bannerInitialized — widget finished deciding whether to show</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('bannerInitialized', ({ complianceGroup, hasExistingConsent, willShow }) => {
  console.log('Compliance group:', complianceGroup, '— will show banner:', willShow)
})`}
      />

      <h3>bannerVisibility / modalVisibility — UI shown or hidden</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('bannerVisibility', ({ visible, variant }) => {
  console.log(variant, 'banner is now', visible ? 'visible' : 'hidden')
})

widget.on('modalVisibility', ({ visible }) => {
  console.log('Preference modal is now', visible ? 'open' : 'closed')
})`}
      />

      <h3>consentBeingSubmitted — fires just before the save</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('consentBeingSubmitted', ({ consentJson, consentAction }) => {
  // Runs before the cookie is written / API call is made — useful for a loading spinner
  console.log('About to save:', consentAction)
})`}
      />

      <h3>parentalConsentRequired — COPPA age gate declined</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('parentalConsentRequired', ({ parentalConsentToken, visitorId }) => {
  // Send parentalConsentToken through your own parental-consent flow (email, verification, etc.)
  sendParentalConsentEmail(visitorId, parentalConsentToken)
})`}
      />
      <p>
        See <Link href="/docs/compliance/coppa/">COPPA</Link> for the full age-gate flow this event
        belongs to.
      </p>

      <p>
        Raw <code>window.addEventListener(&apos;consenti:consentSubmitted&apos;, ...)</code> calls
        work too, for every event — see the full{' '}
        <Link href="/docs/ui/events/">Events reference</Link> for every event name and payload
        shape.
      </p>
    </>
  )
}

async function Step5GateScript() {
  return (
    <>
      <p>
        Consenti ships several ways to gate third-party code on consent. Pick whichever fits what
        you&apos;re gating — a script tag, an SDK call, or a whole category at once. Each snippet
        is independent.
      </p>

      <h3>ConsentScript — inject/remove a &lt;script&gt; tag, keyed to one cookie</h3>
      <CodeBlock
        lang="ts"
        code={`import { ConsentScript } from '@consenti/ui'

new ConsentScript({
  cookieId: 'analytics',
  widget,
  src: 'https://cdn.example.com/analytics.js',
  onLoad: () => console.log('Analytics loaded'),
  onRevoke: () => console.log('Analytics removed'),
})`}
      />

      <h3>CategoryScript — same, but keyed to a whole category</h3>
      <p>
        Fires only when every cookie in the category is granted — good for a bundle of ad tags that
        should load or unload together.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { CategoryScript } from '@consenti/ui'

new CategoryScript({
  categoryId: 'marketing',
  widget,
  src: 'https://example.com/ad-pixel.js',
})`}
      />

      <h3>ConsentAction — run a callback instead of loading a script</h3>
      <p>
        Use this for SDKs that expose their own opt-in/opt-out method (Segment, Mixpanel, Sentry,
        …) rather than a script tag to toggle.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { ConsentAction } from '@consenti/ui'

new ConsentAction({
  id: 'analytics',
  widget,
  onGrant: () => analyticsSdk.optIn(),
  onDeny: () => analyticsSdk.optOut(),
})`}
      />

      <h3>CategoryAction — callback keyed to a whole category</h3>
      <CodeBlock
        lang="ts"
        code={`import { CategoryAction } from '@consenti/ui'

new CategoryAction({
  id: 'marketing',
  widget,
  onGrant: () => adSdk.enableAll(),
  onDeny: () => adSdk.disableAll(),
})`}
      />

      <h3>scanConsentScripts — declarative, zero-JS gating via data attributes</h3>
      <p>
        Mark an inert <code>&lt;script type=&quot;text/plain&quot;&gt;</code> tag instead of
        writing any of the above in JS:
      </p>
      <CodeBlock
        lang="html"
        code={`<script type="text/plain" data-consenti-category-script="marketing" src="https://example.com/pixel.js"></script>

<script type="text/plain" data-consenti-consent-script="analytics">
  /* inline snippet, injected verbatim when granted */
</script>`}
      />
      <CodeBlock
        lang="ts"
        code={`import { scanConsentScripts } from '@consenti/ui'

// Runs automatically once per init — safe to call again after adding tags dynamically
scanConsentScripts(widget)`}
      />

      <h3>BannerTrigger — bonus: let visitors reopen the banner/modal</h3>
      <CodeBlock
        lang="ts"
        code={`import { BannerTrigger } from '@consenti/ui'

new BannerTrigger({ widget, el: '#footer-cookie-settings', action: 'modal' })`}
      />

      <p>
        Full reference, including every payload shape, in the{' '}
        <Link href="/docs/ui/events/">Events reference</Link>.
      </p>
    </>
  )
}

async function Step6ShipIt() {
  return (
    <>
      <p>
        Override any CSS custom property to match your brand — no Shadow DOM, your stylesheet
        applies directly:
      </p>
      <CodeBlock
        lang="css"
        code={`:root {
  --consenti-color-bg: #ffffff;
  --consenti-color-primary: #1565c0;
  --consenti-border-radius-btn: 6px;
  --consenti-border-radius: 12px;
}`}
      />
      <p>Using React or Next.js? Wrap the widget in a small effect-based component:</p>
      <CodeBlock
        lang="tsx"
        filename="ConsentSetup.tsx"
        code={`'use client'
import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({})
    return () => widget.destroy()
  }, [])
  return null
}`}
      />
      <p>
        See <Link href="/docs/ui/frameworks/">Frameworks</Link> for Vue, Angular, and Nuxt
        equivalents, and <Link href="/docs/ui/themes/">Themes &amp; CSS</Link> for every custom
        property.
      </p>

      <Callout type="tip">
        That&apos;s a complete, GDPR-style frontend-only integration. Need server-side consent
        records, an audit log, or the admin dashboard? Switch to the{' '}
        <Link href={`/guides/tutorials/backend/${BACKEND_TUTORIAL_STEPS[0]!.slug}/`}>
          Frontend + Backend tutorial
        </Link>
        .
      </Callout>

      <h2>What to read next</h2>
      <ul>
        <li>
          <Link href="/docs/ui/advanced-configuration/">UI Configuration</Link> — every{' '}
          <code>ConsentiSetup</code> option
        </li>
        <li>
          <Link href="/docs/ui/methods/">API Methods</Link> — every widget method with examples
        </li>
        <li>
          <Link href="/docs/compliance/gdpr/">Compliance guides</Link> — what each group requires
        </li>
        <li>
          <Link href="/guides/examples/">Examples</Link> — complete real-life integrations
        </li>
      </ul>
    </>
  )
}

export const FRONTEND_TUTORIAL_CONTENT = [
  Step1Install,
  Step2Configure,
  Step3CustomProfile,
  Step4Events,
  Step5GateScript,
  Step6ShipIt,
]
