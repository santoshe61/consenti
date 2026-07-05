import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'UI Events' }

export default function UIEventsPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Events</h1>
      <p>
        Consenti fires custom DOM events on <code>window</code> at every consent lifecycle step.
        All events are prefixed <code>consenti:</code> and carry a typed <code>detail</code> payload.
      </p>

      <h2>Event reference</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Fired when</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>consenti:bannerInitialized</code></td>
            <td>Widget initialises and determines whether to show the banner</td>
          </tr>
          <tr>
            <td><code>consenti:bannerVisibility</code></td>
            <td>Banner shows or hides</td>
          </tr>
          <tr>
            <td><code>consenti:modalVisibility</code></td>
            <td>Preference modal shows or hides</td>
          </tr>
          <tr>
            <td><code>consenti:consentBeingSubmitted</code></td>
            <td>User clicked a consent button (before API call)</td>
          </tr>
          <tr>
            <td><code>consenti:consentSubmitted</code></td>
            <td>Consent saved (cookie written + API call if configured)</td>
          </tr>
        </tbody>
      </table>

      <h2>Typed API — on() / off()</h2>
      <p>
        The recommended way to subscribe to events is <code>widget.on()</code> / <code>widget.off()</code>.
        This API is typed, handles the <code>CustomEvent</code> unwrapping for you, and cleans up
        automatically when <code>widget.destroy()</code> is called.
        The <code>consenti:</code> prefix on the event name is optional.
      </p>
      <CodeBlock lang="ts" code={`import type { ConsentEvent } from '@consenti/ui'

const handler = (data: ConsentEvent) => {
  console.log('Consent saved:', data.consent)
  console.log('Action:', data.consentAction)
  console.log('GPC detected:', data.gpcDetected)
}

widget.on('consentSubmitted', handler)      // 'consenti:' prefix is optional
widget.off('consentSubmitted', handler)     // must pass the same function reference`} />

      <h2>Raw DOM listeners</h2>
      <p>Raw <code>window.addEventListener</code> calls work too and can coexist with <code>on()</code>:</p>
      <CodeBlock lang="ts" code={`import type { ConsentEvent } from '@consenti/ui'

window.addEventListener('consenti:consentSubmitted', (e: Event) => {
  const detail = (e as CustomEvent<ConsentEvent>).detail
  console.log('Consent action:', detail.consentAction) // 'accept_all' | 'reject_all' | 'custom' | 'update'
  console.log('Consent values:', detail.consent)       // { analytics: 'granted', marketing: 'denied', ... }
  console.log('Page URL:', detail.pageUrl)
  console.log('GPC detected:', detail.gpcDetected)
})`} />

      <h2>Detail types</h2>

      <h3>BannerInitializedDetail</h3>
      <CodeBlock lang="ts" code={`interface BannerInitializedDetail {
  profileId: string
  regulation: 'gdpr' | 'ccpa'
  hasExistingConsent: boolean  // true if valid consent cookie exists
  gpcDetected: boolean
  willShow: boolean            // true if banner will be rendered
}`} />

      <h3>BannerVisibilityDetail</h3>
      <CodeBlock lang="ts" code={`interface BannerVisibilityDetail {
  show: boolean               // true = banner appeared; false = banner hidden
  bannerType: 'main' | 'gpc' // which banner
  action: boolean             // true = triggered by user button click
}`} />

      <h3>ModalVisibilityDetail</h3>
      <CodeBlock lang="ts" code={`interface ModalVisibilityDetail {
  show: boolean               // true = modal opened; false = modal closed
  action: boolean             // true = triggered by user button click
}`} />

      <h3>ConsentSubmittedDetail</h3>
      <CodeBlock lang="ts" code={`interface ConsentSubmittedDetail {
  consentId: string                        // UUID per submission
  visitorId: string                        // visitor UUID (stable across sessions)
  profileId: string
  profileVersion: number
  consentJson: Record<string, ConsentStatus>  // { analytics: 'granted', ... }
  consentAction: 'accept_all' | 'reject_all' | 'custom' | 'update'
  gpcDetected: boolean
  pageUrl: string                          // window.location.href at submission time
  timestamp: string                        // ISO 8601
  apiResponse?: unknown                    // backend response if api.enabled: true
}`} />

      <h2>GTM dataLayer pushes</h2>
      <p>
        When <code>utils.gtm.containerId</code> is set, Consenti pushes to <code>window.dataLayer</code>
        in the standard Google Consent Mode v2 format:
      </p>
      <CodeBlock lang="js" code={`// On initialization (default denied state)
dataLayer.push({
  'event': 'consent_default',
  'consent_type': 'analytics_storage',
  'consent_value': 'denied',
})

// On submission
dataLayer.push({
  'event': 'consent_update',
  'analytics_storage': 'granted',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'functionality_storage': 'granted',
})`} />

      <Callout type="info">
        Consenti automatically detects <code>window.gtag</code> and <code>window.google_tag_manager</code>
        before emitting cookieless pings — no-op pollution is prevented on non-Google sites.
      </Callout>

      <h2>ConsentScript — auto-load scripts on consent</h2>
      <p>
        <code>ConsentScript</code> watches <code>consenti:consentSubmitted</code> and injects or removes a{' '}
        <code>&lt;script&gt;</code> tag based on whether a specific cookie ID is granted.
        Consent is also evaluated immediately at construction time so existing consent is honoured without
        waiting for the next submission event.
      </p>
      <CodeBlock lang="ts" code={`import { ConsentScript } from '@consenti/ui'

// bind: true (default) — auto-removes script on consent revoke, re-injects on re-grant
new ConsentScript({
  cookieId: 'analytics',
  src: 'https://cdn.example.com/analytics.js',
  onLoad: () => console.log('Analytics loaded'),
  onRevoke: () => console.log('Analytics removed'),
})

// bind: false — check consent once at construction; never attach a change listener
new ConsentScript({
  cookieId: 'analytics',
  src: 'https://cdn.example.com/analytics.js',
  bind: false,
})`} />

      <h2>CookieTrigger — open banner/modal from any element</h2>
      <p>Attach a trigger to any existing element or let Consenti auto-create a button:</p>
      <CodeBlock lang="ts" code={`import { CookieTrigger } from '@consenti/ui'

// Attach to existing element
new CookieTrigger({ selector: '#cookie-settings', action: 'modal' })

// Or auto-create a button
new CookieTrigger({
  action: 'banner',
  label: 'Cookie Settings',
  appendTo: document.querySelector('#footer'),
})`} />
    </div>
  )
}
