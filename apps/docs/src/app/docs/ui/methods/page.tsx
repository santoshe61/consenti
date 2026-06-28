import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'UI API Methods' }

export default function UIMethodsPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — API Methods</h1>
      <p>
        After creating a <code>ConsentiSetup</code> instance, the returned object exposes these methods.
        Only methods the developer needs to call are public — internal state is protected.
      </p>

      <h2>Quick reference</h2>
      <table>
        <thead>
          <tr><th>Method</th><th>Returns</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>init()</code></td><td><code>Promise&lt;void&gt;</code></td><td>Manually start initialisation — required when <code>autoInit: false</code></td></tr>
          <tr><td><code>onReady(cb)</code></td><td><code>void</code></td><td>Register a callback fired when the widget is fully initialised</td></tr>
          <tr><td><code>hasConsent()</code></td><td><code>boolean</code></td><td>True if a valid consent record exists for the current profile</td></tr>
          <tr><td><code>getConsent()</code></td><td><code>ConsentValue | null</code></td><td>The current consent values keyed by cookie ID</td></tr>
          <tr><td><code>getGTMConsent()</code></td><td><code>Record&lt;string, string&gt; | null</code></td><td>Consent in GTM / Google Consent Mode v2 format</td></tr>
          <tr><td><code>getConsentDate()</code></td><td><code>Date | false</code></td><td>Date of most recent consent submission, or false if none</td></tr>
          <tr><td><code>showBanner(gpc?)</code></td><td><code>void</code></td><td>Programmatically show the main (or GPC) banner</td></tr>
          <tr><td><code>hideBanner()</code></td><td><code>void</code></td><td>Hide the banner</td></tr>
          <tr><td><code>showModal()</code></td><td><code>void</code></td><td>Open the preference modal</td></tr>
          <tr><td><code>hideModal()</code></td><td><code>void</code></td><td>Close the preference modal</td></tr>
          <tr><td><code>bannerVisibility()</code></td><td><code>'main' | 'gpc' | false</code></td><td>Current banner state</td></tr>
          <tr><td><code>modalVisibility()</code></td><td><code>'preference' | false</code></td><td>Current modal state</td></tr>
          <tr><td><code>switchLocale(locale)</code></td><td><code>void</code></td><td>Switch the active locale and re-render the widget</td></tr>
          <tr><td><code>submitConsent(consent)</code></td><td><code>Promise&lt;void&gt;</code></td><td>Submit consent programmatically</td></tr>
          <tr><td><code>deleteConsent()</code></td><td><code>Promise&lt;void&gt;</code></td><td>Delete consent record (cookie + backend)</td></tr>
          <tr><td><code>reConsent()</code></td><td><code>Promise&lt;void&gt;</code></td><td>Delete consent and re-open the banner</td></tr>
          <tr><td><code>downloadReceipt()</code></td><td><code>void</code></td><td>Download a JSON consent receipt for the user</td></tr>
          <tr><td><code>destroy()</code></td><td><code>void</code></td><td>Unmount the widget and remove all event listeners</td></tr>
        </tbody>
      </table>

      <h2>Method details</h2>

      <h3>init()</h3>
      <p>
        Manually triggers widget initialisation. Normally called automatically on construction.
        Set <code>autoInit: false</code> in <code>ConsentiConfig</code> to disable auto-start —
        for example when the mount point (<code>rootEl</code>) is rendered after the widget is created.
      </p>
      <CodeBlock lang="ts" code={`const widget = new ConsentiSetup({
  core: {},
  rootEl: '#consent-mount',
  autoInit: false,
})

// Later, once #consent-mount is available in the DOM:
await widget.init()
widget.onReady(() => {
  console.log('Widget ready:', widget.hasConsent())
})`} />
      <p>
        <code>init()</code> is also useful after <code>destroy()</code> to re-initialise the same
        instance rather than creating a new one.
      </p>
      <CodeBlock lang="ts" code={`widget.destroy()

// Swap config or wait for a condition, then:
await widget.init()`} />

      <Callout type="info">
        Calling <code>init()</code> while a previous call is still in progress is a no-op — only
        one initialisation can run at a time per instance.
      </Callout>

      <h3>switchLocale(locale)</h3>
      <p>
        Switches the active locale, re-resolves the profile, and re-renders the widget with the
        new language. The locale switcher UI calls this automatically when the user picks a language.
        You can also call it programmatically.
      </p>
      <CodeBlock lang="ts" code={`widget.switchLocale('fr')   // switch to French
widget.switchLocale('de-AT') // switch to Austrian German`} />
      <p>
        The profile must have multiple locales configured for the switcher to be useful.
        See <a href="/docs/ui/configuration">Configuration</a> → <em>Locale switcher</em> for setup details.
      </p>

      <h3>onReady(callback)</h3>
      <p>Called once the profile has resolved and the banner state has been determined. Safe to call before or after the widget has initialised.</p>
      <CodeBlock lang="ts" code={`widget.onReady(() => {
  console.log('Widget ready. Has consent:', widget.hasConsent())
})`} />

      <h3>hasConsent()</h3>
      <CodeBlock lang="ts" code={`if (!widget.hasConsent()) {
  widget.showBanner()
}`} />

      <h3>getConsent()</h3>
      <CodeBlock lang="ts" code={`const consent = widget.getConsent()
// { analytics: 'granted', marketing: 'denied', necessary: 'granted' }

if (consent?.analytics === 'granted') {
  initAnalytics()
}`} />

      <h3>getGTMConsent()</h3>
      <p>Returns consent in the exact shape Google Tag Manager expects for Consent Mode v2:</p>
      <CodeBlock lang="ts" code={`const gtm = widget.getGTMConsent()
// {
//   analytics_storage: 'granted',
//   ad_storage: 'denied',
//   ad_user_data: 'denied',
//   ad_personalization: 'denied',
//   functionality_storage: 'granted',
// }`} />

      <h3>submitConsent(consent)</h3>
      <p>Programmatically submit consent — useful for custom UI flows:</p>
      <CodeBlock lang="ts" code={`await widget.submitConsent({
  analytics: 'granted',
  marketing: 'denied',
  necessary: 'granted',
})`} />

      <Callout type="warning">
        Mandatory cookies (<code>mandatory: true</code>) are always <code>'granted'</code> regardless of what you pass.
        Passing <code>'denied'</code> for a mandatory cookie is silently ignored.
      </Callout>

      <h3>reConsent()</h3>
      <p>Deletes the existing consent record and re-opens the banner. Use for "Change cookie settings" buttons:</p>
      <CodeBlock lang="ts" code={`document.querySelector('#change-cookie-settings')?.addEventListener('click', () => {
  widget.reConsent()
})`} />

      <h3>downloadReceipt()</h3>
      <p>
        Triggers a browser download of a JSON consent receipt. Useful for GDPR transparency requirements.
        The receipt includes the visitor ID, profile version, consent choices, timestamp, and a hash for integrity verification.
      </p>

      <h3>destroy()</h3>
      <p>Removes the banner DOM, modal DOM, BroadcastChannel listener, and all event listeners. Call when unmounting in SPA route changes if you manage the lifecycle manually.</p>
      <CodeBlock lang="ts" code={`// In a SPA router's cleanup callback:
widget.destroy()`} />
    </div>
  )
}
