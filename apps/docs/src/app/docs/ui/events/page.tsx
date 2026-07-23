import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'UI Events',
  description:
    'Consenti fires typed consenti: prefixed DOM events on window at every consent lifecycle step.',
  alternates: { canonical: '/docs/ui/events' },
  openGraph: {
    title: 'UI Events',
    description:
      'Consenti fires typed consenti: prefixed DOM events on window at every consent lifecycle step.',
    url: 'https://consenti.dev/docs/ui/events',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI Events',
    description:
      'Consenti fires typed consenti: prefixed DOM events on window at every consent lifecycle step.',
    images: ['/og-image.jpg'],
  },
}

export default function UIEventsPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Events</h1>
      <p>
        Consenti fires custom DOM events on <code>window</code> at every consent lifecycle step. All
        events are prefixed <code>consenti:</code> and carry a typed <code>detail</code> payload.
      </p>

      <h2>Event reference</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Fired when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>consenti:bannerInitialized</code>
            </td>
            <td>Widget initialises and determines whether to show the banner</td>
          </tr>
          <tr>
            <td>
              <code>consenti:bannerVisibility</code>
            </td>
            <td>Banner shows or hides</td>
          </tr>
          <tr>
            <td>
              <code>consenti:modalVisibility</code>
            </td>
            <td>Preference modal shows or hides</td>
          </tr>
          <tr>
            <td>
              <code>consenti:consentBeingSubmitted</code>
            </td>
            <td>User clicked a consent button (before API call)</td>
          </tr>
          <tr>
            <td>
              <code>consenti:consentSubmitted</code>
            </td>
            <td>Consent saved (cookie written + API call if configured)</td>
          </tr>
          <tr>
            <td>
              <code>consenti:parentalConsentRequired</code>
            </td>
            <td>
              Age gate declined with <code>requireParentalConsent: true</code> — carries a{' '}
              <code>parentalConsentToken</code>; see the{' '}
              <a href="/docs/compliance/coppa">COPPA guide</a>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Typed API — on() / off()</h2>
      <p>
        The recommended way to subscribe to events is <code>widget.on()</code> /{' '}
        <code>widget.off()</code>. This API is typed, handles the <code>CustomEvent</code>{' '}
        unwrapping for you, and cleans up automatically when <code>widget.destroy()</code> is
        called. The <code>consenti:</code> prefix on the event name is optional.
      </p>
      <CodeBlock
        lang="ts"
        code={`import type { ConsentEvent } from '@consenti/ui'

const handler = (data: ConsentEvent) => {
  console.log('Consent saved:', data.consentJson)
  console.log('Action:', data.consentAction)
  console.log('GPC detected:', data.gpcDetected)
}

widget.on('consentSubmitted', handler)      // 'consenti:' prefix is optional
widget.off('consentSubmitted', handler)     // must pass the same function reference`}
      />

      <h2>Raw DOM listeners</h2>
      <p>
        Raw <code>window.addEventListener</code> calls work too and can coexist with{' '}
        <code>on()</code>:
      </p>
      <CodeBlock
        lang="ts"
        code={`import type { ConsentEvent } from '@consenti/ui'

window.addEventListener('consenti:consentSubmitted', (e: Event) => {
  const detail = (e as CustomEvent<ConsentEvent>).detail
  console.log('Consent action:', detail.consentAction) // 'accept_all' | 'reject_all' | 'custom' | 'update'
  console.log('Consent values:', detail.consentJson)   // { analytics: 'granted', marketing: 'denied', ... }
  console.log('Page URL:', detail.pageUrl)
  console.log('GPC detected:', detail.gpcDetected)
})`}
      />

      <h2>Detail types</h2>

      <h3>BannerInitializedDetail</h3>
      <CodeBlock
        lang="ts"
        code={`interface BannerInitializedDetail {
  profileId: string
  complianceGroup?: ComplianceType
  hasExistingConsent: boolean  // true if valid consent cookie exists
  gpcDetected: boolean
  willShow: boolean            // true if banner will be rendered
}`}
      />

      <h3>BannerVisibilityDetail</h3>
      <CodeBlock
        lang="ts"
        code={`interface BannerVisibilityDetail {
  visible: boolean               // true = banner appeared; false = banner hidden
  variant: 'main' | 'gpc' // which banner
  action: boolean             // true = triggered by user button click
}`}
      />

      <h3>ModalVisibilityDetail</h3>
      <CodeBlock
        lang="ts"
        code={`interface ModalVisibilityDetail {
  visible: boolean               // true = modal opened; false = modal closed
  action: boolean             // true = triggered by user button click
}`}
      />

      <h3>ConsentSubmittedDetail</h3>
      <CodeBlock
        lang="ts"
        code={`interface ConsentSubmittedDetail {
  consentId: string                        // UUID per submission
  visitorId: string                        // visitor UUID (stable across sessions)
  profileId: string
  consentJson: Record<string, ConsentStatus>  // { analytics: 'granted', ... }
  consentAction: 'accept_all' | 'reject_all' | 'custom' | 'update'
  gpcDetected: boolean
  pageUrl: string                          // window.location.href at submission time
  timestamp: number                        // Unix timestamp, trimmed to seconds
  fromBroadcast?: boolean                  // true if this instance learned of the change via a cross-tab broadcast
  apiResponse: ConsentDbRecord             // backend response if api.enabled: true
}`}
      />

      <h2>GTM / Google Consent Mode v2</h2>
      <p>
        When <code>utils.gtm</code> is configured (see the{' '}
        <a href="/docs/ui/advanced-configuration/">Advanced Configuration page</a> for every{' '}
        <code>utils.gtm</code> option), Consenti calls the real <code>gtag()</code> consent API —
        via the standard stub-queue pattern, so it works whether your own gtag.js/GTM snippet loads
        before or after Consenti:
      </p>
      <CodeBlock
        lang="js"
        code={`// On initialization — before any tag can fire (default denied state)
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
})

// On submission
gtag('consent', 'update', {
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
})

// Plus, when configured:
gtag('set', 'url_passthrough', true)
gtag('set', 'ads_data_redaction', true) // true when ad_storage is denied`}
      />

      <Callout type="info">
        Set <code>utils.gtm.verbose: true</code> to additionally mirror every{' '}
        <code>consenti:*</code> event onto the dataLayer as a generic{' '}
        <code>{'{ event, content }'}</code> push — useful for custom, non-Consent-Mode GTM triggers.
        Off by default.
      </Callout>

      <h2>ConsentScript — auto-load scripts on consent</h2>
      <p>
        <code>ConsentScript</code> watches <code>consenti:consentSubmitted</code> and injects or
        removes a <code>&lt;script&gt;</code> tag based on whether a specific cookie ID is granted.
        Consent is also evaluated immediately at construction time so existing consent is honoured
        without waiting for the next submission event.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { ConsentScript } from '@consenti/ui'

// bind: true (default) — auto-removes script on consent revoke, re-injects on re-grant
new ConsentScript({
  cookieId: 'analytics_storage',
  widget,
  src: 'https://cdn.example.com/analytics.js',
  onLoad: () => console.log('Analytics loaded'),
  onRevoke: () => console.log('Analytics removed'),
})

// bind: false — check consent once at construction; never attach a change listener
new ConsentScript({
  cookieId: 'analytics_storage',
  widget,
  src: 'https://cdn.example.com/analytics.js',
  bind: false,
})`}
      />

      <h2>ConsentAction — run a callback based on one parameter&apos;s consent</h2>
      <p>
        Same lifecycle as <code>ConsentScript</code> (evaluates immediately at construction,
        re-evaluates on <code>consenti:consentSubmitted</code>, <code>destroy()</code> to unbind)
        but fires <code>onGrant</code>/<code>onDeny</code> callbacks instead of injecting a{' '}
        <code>&lt;script&gt;</code>. Use this for SDKs that expose their own opt-in/opt-out method
        (Segment, Mixpanel, Amplitude, Sentry, …) rather than a script tag to toggle.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { ConsentAction } from '@consenti/ui'

new ConsentAction({
  id: 'analytics_storage',
  widget,
  onGrant: (params) => analyticsSdk.optIn(),
  onDeny: (params) => analyticsSdk.optOut(),
})`}
      />

      <h2>CategoryAction — run a callback based on a category&apos;s rollup state</h2>
      <p>
        Same shape as <code>ConsentAction</code>, bound to a whole category instead of one
        parameter. A category counts as granted only when <em>every</em> parameter it contains is{' '}
        <code>&apos;granted&apos;</code> — <code>onDeny</code> fires for both a fully-denied and a
        partially-granted (mixed) category.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { CategoryAction } from '@consenti/ui'

new CategoryAction({
  id: 'marketing',
  widget,
  onGrant: (params) => adSdk.enableAll(),
  onDeny: (params) => adSdk.disableAll(),
})`}
      />

      <h2>CategoryScript — load a script based on a category&apos;s rollup state</h2>
      <p>
        Like <code>ConsentScript</code>, but gated on a whole category being fully granted instead
        of one parameter.
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

      <h2>scanConsentScripts — declarative, zero-JS gating via data attributes</h2>
      <p>
        Mark an inert <code>&lt;script type=&quot;text/plain&quot;&gt;</code> tag with{' '}
        <code>data-consenti-consent-script</code> or <code>data-consenti-category-script</code> and
        Consenti gates it automatically — no hand-written <code>ConsentScript</code>/
        <code>CategoryScript</code> call needed. Runs automatically once per{' '}
        <code>ConsentiSetup.init()</code> cycle (respects <code>autoInit: false</code> — only runs
        once the widget is actually initialized).
      </p>
      <CodeBlock
        lang="html"
        code={`<script type="text/plain" data-consenti-category-script="marketing" src="https://example.com/pixel.js"></script>

<script type="text/plain" data-consenti-consent-script="analytics_storage">
  /* inline snippet, injected verbatim when granted */
</script>

<!-- data-consenti-bind="false" — evaluate once, never auto-remove/re-inject -->
<script type="text/plain" data-consenti-consent-script="ad_storage" data-consenti-bind="false" src="..."></script>`}
      />
      <p>
        Call it again manually after dynamically adding more tags (e.g. from a late-loading CMS
        widget) — each tag is only ever scanned once, so re-calling is safe:
      </p>
      <CodeBlock
        lang="ts"
        code={`import { scanConsentScripts } from '@consenti/ui'

scanConsentScripts(widget)`}
      />

      <h2>BannerTrigger — open banner/modal from any element</h2>
      <p>Attach a trigger to any existing element or let Consenti auto-create a button:</p>
      <CodeBlock
        lang="ts"
        code={`import { BannerTrigger } from '@consenti/ui'

// Attach to existing element
new BannerTrigger({ widget, el: '#footer-cookie-settings', action: 'modal' })

// Or auto-create a button and place it yourself
const trigger = new BannerTrigger({ widget, action: 'banner', label: 'Cookie Settings' })
document.querySelector('#footer')?.appendChild(trigger.getElement())`}
      />
    </div>
  )
}
