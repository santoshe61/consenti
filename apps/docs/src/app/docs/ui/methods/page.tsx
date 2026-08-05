import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'UI API Methods',
  description:
    'The public methods exposed by a ConsentiSetup instance after initialising the Consenti UI widget.',
  alternates: { canonical: '/docs/ui/methods' },
  openGraph: {
    title: 'UI API Methods',
    description:
      'The public methods exposed by a ConsentiSetup instance after initialising the Consenti UI widget.',
    url: 'https://consenti.dev/docs/ui/methods',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI API Methods',
    description:
      'The public methods exposed by a ConsentiSetup instance after initialising the Consenti UI widget.',
    images: ['/og-image.jpg'],
  },
}

export default function UIMethodsPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — API Methods</h1>
      <p>
        After creating a <code>ConsentiSetup</code> instance, the returned object exposes these
        methods. Only methods the developer needs to call are public — internal state is protected.
      </p>

      <h2>Quick reference</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Returns</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Consent state
            </td>
          </tr>
          <tr>
            <td>
              <code>hasConsent()</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>True if a valid consent record exists for the current profile</td>
          </tr>
          <tr>
            <td>
              <code>getConsent(type?)</code>
            </td>
            <td>
              <code>ConsentValue | Record&lt;string, string&gt; | null</code>
            </td>
            <td>
              Raw consent keyed by cookie ID, or pass <code>type</code> (<code>'purpose'</code>,{' '}
              <code>'category'</code>, <code>'google-gtm'</code>, <code>'adobe'</code>,{' '}
              <code>'meta'</code>, <code>'microsoft-clarity'</code>, <code>'twilio-segment'</code>)
              for a re-shaped format
            </td>
          </tr>
          <tr>
            <td>
              <code>getGTMConsent()</code>
            </td>
            <td>
              <code>Record&lt;string, string&gt; | null</code>
            </td>
            <td>
              <code>@deprecated</code> — same as <code>getConsent(&apos;google-gtm&apos;)</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>getConsentDate()</code>
            </td>
            <td>
              <code>Date | false</code>
            </td>
            <td>Date of most recent consent submission, or false if none</td>
          </tr>
          <tr>
            <td>
              <code>isCookieGranted(cookieId, requestValue?)</code>
            </td>
            <td>
              <code>boolean | ConsentStatus</code>
            </td>
            <td>
              Check if a single cookie is granted. Pass <code>true</code> as second arg to get the
              raw status string instead of a boolean
            </td>
          </tr>
          <tr>
            <td>
              <code>isCategoryGranted(categoryId, requestValue?)</code>
            </td>
            <td>
              <code>
                boolean | {'{'}[id: string]: ConsentStatus{'}'}[]
              </code>
            </td>
            <td>
              True when every cookie in the category is granted. Pass <code>true</code> to get an
              array of per-cookie status records
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Bulk actions
            </td>
          </tr>
          <tr>
            <td>
              <code>grantAll(onlyMandatory?)</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>
              Accept all cookies. Pass <code>true</code> to grant only mandatory and deny the rest
            </td>
          </tr>
          <tr>
            <td>
              <code>denyAll(includingMandatory?)</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>
              Deny all non-mandatory cookies. Pass <code>true</code> to deny mandatory too (logs a
              warning)
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Visibility
            </td>
          </tr>
          <tr>
            <td>
              <code>showBanner(gpc?)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Programmatically show the main (or GPC) banner</td>
          </tr>
          <tr>
            <td>
              <code>hideBanner()</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Hide the banner</td>
          </tr>
          <tr>
            <td>
              <code>showModal()</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Open the preference modal</td>
          </tr>
          <tr>
            <td>
              <code>hideModal()</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Close the preference modal</td>
          </tr>
          <tr>
            <td>
              <code>bannerVisibility()</code>
            </td>
            <td>
              <code>'main' | 'gpc' | false</code>
            </td>
            <td>Current banner state</td>
          </tr>
          <tr>
            <td>
              <code>modalVisibility()</code>
            </td>
            <td>
              <code>'preference' | false</code>
            </td>
            <td>Current modal state</td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Events
            </td>
          </tr>
          <tr>
            <td>
              <code>on(event, handler)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>
              Subscribe to a typed widget event. The <code>consenti:</code> prefix is optional
            </td>
          </tr>
          <tr>
            <td>
              <code>off(event, handler)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Unsubscribe a previously registered handler (pass the same function reference)</td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Lifecycle
            </td>
          </tr>
          <tr>
            <td>
              <code>init()</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>
              Manually start initialisation — required when <code>autoInit: false</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>onReady(cb)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Register a callback fired when the widget is fully initialised</td>
          </tr>
          <tr>
            <td>
              <code>switchLocale(locale)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Switch the active locale and re-render the widget</td>
          </tr>
          <tr>
            <td>
              <code>submitConsent(consent)</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>Submit consent programmatically</td>
          </tr>
          <tr>
            <td>
              <code>deleteConsent()</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>Delete consent record (cookie + backend)</td>
          </tr>
          <tr>
            <td>
              <code>reConsent()</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>Delete consent and re-open the banner</td>
          </tr>
          <tr>
            <td>
              <code>forgetMe(resetAgeGate?)</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>
              Right-to-erasure entry point — wraps <code>reConsent()</code> with{' '}
              <code>consenti:forgetMeRequested</code>/<code>consenti:forgotten</code> events around
              it. See the{' '}
              <a href="/guides/hot-topics/right-to-erasure">Right to Erasure guide</a>.
            </td>
          </tr>
          <tr>
            <td>
              <code>destroy()</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Unmount the widget and remove all event listeners</td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Identity
            </td>
          </tr>
          <tr>
            <td>
              <code>getUserId()</code>
            </td>
            <td>
              <code>string | null</code>
            </td>
            <td>Current logged-in application user ID, or <code>null</code> for an anonymous visitor</td>
          </tr>
          <tr>
            <td>
              <code>setUserId(userId, reConsent?)</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>
              Set (or clear with <code>null</code>) the logged-in application user ID; reconsents
              by default when it changes on a device with an existing consent record
            </td>
          </tr>
          <tr>
            <td>
              <code>getVisitor()</code>
            </td>
            <td>
              <code>
                {'{'} visitorId, type, userId {'}'}
              </code>
            </td>
            <td>
              Snapshot of the current visitor&apos;s identity — the stable per-browser{' '}
              <code>visitorId</code> (<code>null</code> until a consent decision exists), whether
              they&apos;re <code>&apos;authenticated&apos;</code> or{' '}
              <code>&apos;anonymous&apos;</code>, and the app <code>userId</code>
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Runtime configuration
            </td>
          </tr>
          <tr>
            <td>
              <code>setDarkMode(enable?)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>
              Toggle or set dark mode without re-initialising. Omit <code>enable</code> to toggle
            </td>
          </tr>
          <tr>
            <td>
              <code>setTheme(theme)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>Merge CSS token overrides into the current theme at runtime</td>
          </tr>
          <tr>
            <td>
              <code>setConfig(config)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>
              Deep-merge a partial config. Re-applies theme/dark mode side-effects; does not re-init
            </td>
          </tr>
          <tr>
            <td>
              <code>setProfile(override)</code>
            </td>
            <td>
              <code>void</code>
            </td>
            <td>
              Merge a partial profile override and re-render visible UI without a network call
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Diagnostics
            </td>
          </tr>
          <tr>
            <td>
              <code>version()</code>
            </td>
            <td>
              <code>
                {'{'} package, profileVersion, consentVersion {'}'}
              </code>
            </td>
            <td>Package version, active profile ID, and consent schema version</td>
          </tr>
        </tbody>
      </table>

      <h2>Method details</h2>

      <h3>init()</h3>
      <p>
        Manually triggers widget initialisation. Normally called automatically on construction. Set{' '}
        <code>autoInit: false</code> in <code>ConsentiConfig</code> to disable auto-start — for
        example when the mount point (<code>rootEl</code>) is rendered after the widget is created.
      </p>
      <CodeBlock
        lang="ts"
        code={`const widget = new ConsentiSetup({
  core: {},
  rootEl: '#consent-mount',
  autoInit: false,
})

// Later, once #consent-mount is available in the DOM:
await widget.init()
widget.onReady(() => {
  console.log('Widget ready:', widget.hasConsent())
})`}
      />
      <p>
        <code>init()</code> is also useful after <code>destroy()</code> to re-initialise the same
        instance rather than creating a new one.
      </p>
      <CodeBlock
        lang="ts"
        code={`widget.destroy()

// Swap config or wait for a condition, then:
await widget.init()`}
      />

      <Callout type="info">
        Calling <code>init()</code> while a previous call is still in progress is a no-op — only one
        initialisation can run at a time per instance.
      </Callout>

      <h3>switchLocale(locale)</h3>
      <p>
        Switches the active locale, re-resolves the profile, and re-renders the widget with the new
        language. The locale switcher UI calls this automatically when the user picks a language.
        You can also call it programmatically.
      </p>
      <CodeBlock
        lang="ts"
        code={`widget.switchLocale('fr')   // switch to French
widget.switchLocale('de-AT') // switch to Austrian German`}
      />
      <p>
        The profile must have multiple locales configured for the switcher to be useful. See{' '}
        <a href="/docs/ui/advanced-configuration/">Advanced Configuration</a> → <em>core</em> for
        locale setup details.
      </p>

      <h3>onReady(callback)</h3>
      <p>
        Called once the profile has resolved and the banner state has been determined. Safe to call
        before or after the widget has initialised.
      </p>
      <CodeBlock
        lang="ts"
        code={`widget.onReady(() => {
  console.log('Widget ready. Has consent:', widget.hasConsent())
})`}
      />

      <h3>hasConsent()</h3>
      <CodeBlock
        lang="ts"
        code={`if (!widget.hasConsent()) {
  widget.showBanner()
}`}
      />

      <h3 id="getconsent-type">getConsent(type?)</h3>
      <p>
        With no argument, returns the <strong>raw</strong> consent map — keyed by whichever cookie{' '}
        <em>parameter</em> IDs actually exist in the profile. There&apos;s no fixed/predefined key
        set; the shape mirrors the profile&apos;s own <code>cookies</code> map one-for-one:
      </p>
      <CodeBlock
        lang="ts"
        code={`const consent = widget.getConsent()
// keyed by your own cookie parameter IDs, e.g.:
// { ga_measurement: 'granted', hotjar: 'denied', preferences_storage: 'granted' }

if (consent?.ga_measurement === 'granted') {
  initAnalytics()
}`}
      />
      <p>
        Pass <code>type</code> to get a re-shaped, vendor- or taxonomy-ready object instead. Every
        value below is a real, independent <code>ConsentType</code> — none of them are aliases of
        each other:
      </p>
      <table>
        <thead>
          <tr>
            <th>
              <code>type</code>
            </th>
            <th>Keyed by</th>
            <th>Values</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>&apos;purpose&apos;</code>
            </td>
            <td>
              the fixed taxonomy: <code>necessary</code>/<code>functional</code>/
              <code>preferences</code>/<code>analytics</code>/<code>marketing</code>
            </td>
            <td>
              <code>'granted' | 'denied' | 'objected'</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;category&apos;</code>
            </td>
            <td>
              your own authored category IDs (<code>preferenceModal.categories</code> keys)
            </td>
            <td>
              <code>'granted' | 'denied' | 'objected'</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;google-gtm&apos;</code>
            </td>
            <td>Google Consent Mode v2 signal names</td>
            <td>
              <code>'granted' | 'denied'</code> + <code>ads_data_redaction</code>/
              <code>url_passthrough</code> flags
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;adobe&apos;</code>
            </td>
            <td>
              <code>analytics</code>, <code>target</code>, <code>manager</code>,{' '}
              <code>optimizer</code>
            </td>
            <td>
              <code>'granted' | 'denied' | 'objected'</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;meta&apos;</code>
            </td>
            <td>
              <code>pixel</code>, <code>api</code>, <code>plugins</code>,{' '}
              <code>facebookLogin</code>
            </td>
            <td>
              <code>'granted' | 'denied' | 'objected'</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;microsoft-clarity&apos;</code>
            </td>
            <td>
              <code>session</code>, <code>heatmaps</code>, <code>performance</code>
            </td>
            <td>
              <code>'granted' | 'denied' | 'objected'</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>&apos;twilio-segment&apos;</code>
            </td>
            <td>
              <code>identify</code>, <code>page</code>, <code>track</code>, <code>group</code>,{' '}
              <code>alias</code>
            </td>
            <td>
              <code>'granted' | 'denied' | 'objected'</code>
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        <code>&apos;purpose&apos;</code> and <code>&apos;category&apos;</code> are easy to mix up —
        they answer different questions. <code>&apos;purpose&apos;</code> gives you the fixed,
        stable taxonomy every parameter is tagged with (useful for vendor mapping, which is why the
        formats below all derive from it too). <code>&apos;category&apos;</code> gives you consent
        for your own authored category IDs instead — <code>&apos;granted&apos;</code> only when{' '}
        <em>every</em> parameter in that category is granted; otherwise <code>&apos;denied&apos;</code>{' '}
        (covers a fully-denied category and a partially-granted one alike) or{' '}
        <code>&apos;objected&apos;</code> (only for a <code>legitimate_interest</code> category
        that&apos;s uniformly objected to):
      </p>
      <CodeBlock
        lang="ts"
        code={`widget.getConsent('purpose')
// { necessary: 'granted', functional: 'granted', preferences: 'denied', analytics: 'denied', marketing: 'denied' }

widget.getConsent('category')
// { 'cat-necessary': 'granted', 'cat-analytics': 'denied', 'cat-personalization-li': 'objected' }
// — keyed by whatever category IDs you defined in preferenceModal.categories`}
      />
      <p>
        See <a href="/docs/ui/advanced-profiles/#cookie-type">Advanced Profiles</a> for the full
        parameter (<code>purpose</code>) vs. category model.
      </p>

      <h3>getGTMConsent()</h3>
      <Callout type="warning">
        <code>@deprecated</code> — use <code>getConsent(&apos;google-gtm&apos;)</code> instead;
        identical output. Kept for backwards compatibility.
      </Callout>
      <p>Returns consent in the exact shape Google Tag Manager expects for Consent Mode v2:</p>
      <CodeBlock
        lang="ts"
        code={`const gtm = widget.getGTMConsent()
// {
//   analytics_storage: 'granted',
//   ad_storage: 'denied',
//   ad_user_data: 'denied',
//   ad_personalization: 'denied',
//   functionality_storage: 'granted',
// }`}
      />
      <p>
        For the other vendor formats (<code>&apos;adobe&apos;</code>, <code>&apos;meta&apos;</code>,{' '}
        <code>&apos;microsoft-clarity&apos;</code>, <code>&apos;twilio-segment&apos;</code>), see the
        respective{' '}
        <a href="/guides/frontend/adobe/">Adobe</a>,{' '}
        <a href="/guides/frontend/meta/">Meta</a>,{' '}
        <a href="/guides/frontend/clarity/">Microsoft Clarity</a>, and{' '}
        <a href="/guides/frontend/segment/">Twilio Segment</a> integration guides.
      </p>

      <h3>submitConsent(consent)</h3>
      <p>Programmatically submit consent — useful for custom UI flows:</p>
      <CodeBlock
        lang="ts"
        code={`await widget.submitConsent({
  analytics: 'granted',
  marketing: 'denied',
  necessary: 'granted',
})`}
      />

      <Callout type="warning">
        Cookies belonging to a category with <code>legalBasis: 'mandatory'</code> are always{' '}
        <code>'granted'</code> regardless of what you pass. Passing <code>'denied'</code> for one of
        them is silently ignored.
      </Callout>

      <h3>reConsent(resetAgeGate?)</h3>
      <p>
        Deletes the existing consent record and re-opens the banner. Use for "Change cookie
        settings" buttons:
      </p>
      <CodeBlock
        lang="ts"
        code={`document.querySelector('#change-cookie-settings')?.addEventListener('click', () => {
  widget.reConsent()
})`}
      />
      <p>
        If the profile has an <code>ageGate</code> configured, <code>reConsent()</code> re-shows
        the age-gate prompt too by default (not just the banner) — mirroring the original
        first-visit flow. Pass <code>false</code> to skip it and go straight to the banner,
        keeping the visitor&apos;s prior age-gate answer:
      </p>
      <CodeBlock
        lang="ts"
        code={`widget.reConsent(false) // skip the age gate, just re-show the banner`}
      />

      <h3>forgetMe(resetAgeGate?)</h3>
      <p>
        The self-service &quot;right to be forgotten&quot; entry point — GDPR Art. 17, CCPA/CPRA,
        LGPD Art. 18, and equivalent erasure rights. Same underlying erasure as{' '}
        <code>reConsent()</code> (same <code>resetAgeGate</code> parameter), but dispatches{' '}
        <code>consenti:forgetMeRequested</code> before and <code>consenti:forgotten</code> after,
        so a host app can hook its own identity-verified erasure workflow across other systems
        (CRM, DMP, analytics) — the CMP itself only ever erases its own consent record. This is
        what powers the preference modal&apos;s &quot;Forget me&quot; button (
        <code>preferenceModal.showForgetMe</code>), and is also the method to call for a custom
        placement of the same action — a footer link or an account/privacy-settings page:
      </p>
      <CodeBlock
        lang="ts"
        code={`document.querySelector('#delete-my-data')?.addEventListener('click', () => {
  widget.forgetMe()
})`}
      />
      <p>
        See the <a href="/guides/hot-topics/right-to-erasure/">Right to Erasure guide</a> for the
        full picture, including the server-side <code>DELETE /consent/:visitorId</code> endpoint
        and its own <code>consent:erased</code> eventBus event.
      </p>

      <h3>isCookieGranted(cookieId, requestValue?)</h3>
      <p>
        The most common gating pattern — check whether a single cookie is <code>'granted'</code>
        without manually inspecting <code>getConsent()</code>.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Boolean mode (default) — true if granted
if (widget.isCookieGranted('analytics_storage')) {
  initAnalytics()
}

// Value mode — returns the raw ConsentStatus string, or false if not in the consent map
const status = widget.isCookieGranted('marketing', true)
// 'granted' | 'denied' | 'objected' | false`}
      />
      <p>
        During SSR or before <code>init()</code> completes, always returns <code>false</code>.
      </p>

      <h3>isCategoryGranted(categoryId, requestValue?)</h3>
      <p>
        Category-level consent check. The <code>categoryId</code> must match a key in the profile's{' '}
        <code>preferenceModal.categories</code> map.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Boolean mode — true only when ALL cookies in the category are 'granted'
if (widget.isCategoryGranted('cat-analytics')) {
  loadHeatmaps()
}

// Value mode — one record per cookie in the category
const statuses = widget.isCategoryGranted('cat-marketing', true)
// [{ ad_storage: 'granted' }, { ad_personalization: 'denied' }]`}
      />
      <p>
        Returns <code>false</code> / <code>[]</code> if the category ID is not found or the widget
        is not yet initialised.
      </p>

      <h3>grantAll(onlyMandatory?)</h3>
      <p>
        Programmatically accept cookies without the user interacting with the banner. Dismisses the
        banner after submitting.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Accept everything
await widget.grantAll()

// Accept only mandatory cookies — deny the rest (useful for "Reject Optional" variants)
await widget.grantAll(true)`}
      />

      <h3>denyAll(includingMandatory?)</h3>
      <p>Programmatically deny all non-mandatory cookies. Dismisses the banner after submitting.</p>
      <CodeBlock
        lang="ts"
        code={`// Deny non-mandatory; mandatory cookies stay 'granted'
await widget.denyAll()

// Deny everything including mandatory — use with caution
await widget.denyAll(true)`}
      />
      <Callout type="warning">
        Passing <code>true</code> to <code>denyAll</code> denies mandatory cookies. This is
        intentionally allowed for testing and special integrations, but will log a{' '}
        <code>console.warn</code> as a reminder.
      </Callout>

      <h3>on(event, handler) / off(event, handler)</h3>
      <p>
        Typed event subscription API — a cleaner alternative to <code>window.addEventListener</code>
        . The <code>consenti:</code> prefix on the event name is optional; both forms are accepted.
      </p>
      <CodeBlock
        lang="ts"
        code={`import type { ConsentEvent } from '@consenti/ui'

const handler = (data: ConsentEvent) => {
  console.log('Consent saved:', data.consentJson)
  console.log('Action:', data.consentAction) // 'accept_all' | 'reject_all' | 'custom' | 'update'
}

// Subscribe — both are equivalent
widget.on('consentSubmitted', handler)
widget.on('consenti:consentSubmitted', handler)

// Unsubscribe — must pass the same function reference
widget.off('consentSubmitted', handler)

// All supported event names:
// 'bannerInitialized'       — widget initialised; hasExistingConsent is in the detail
// 'bannerVisibility'        — banner showed or hid; show / action flags in detail
// 'modalVisibility'         — modal opened or closed
// 'consentBeingSubmitted'   — user clicked a button (before API call)
// 'consentSubmitted'        — consent saved (cookie written + API call if configured)`}
      />
      <Callout type="info">
        <code>on()</code> / <code>off()</code> use the same underlying DOM events as raw{' '}
        <code>window.addEventListener</code> calls. Both can coexist in the same page. Registered
        handlers are automatically cleaned up when <code>destroy()</code> is called.
      </Callout>

      <h3>setDarkMode(enable?)</h3>
      <p>
        Toggle or set dark mode at runtime without re-initialising the widget. The dark class is
        applied to both the banner root and the preference modal.
      </p>
      <CodeBlock
        lang="ts"
        code={`widget.setDarkMode()       // toggle current state
widget.setDarkMode(true)  // force dark
widget.setDarkMode(false) // force light

// Typical use: follow the OS preference and update live
const mq = window.matchMedia('(prefers-color-scheme: dark)')
widget.setDarkMode(mq.matches)
mq.addEventListener('change', (e) => widget.setDarkMode(e.matches))`}
      />

      <h3>setTheme(theme)</h3>
      <p>
        Merge CSS token overrides into the current theme at runtime. CSS custom properties on the
        root element update immediately — no page reload required.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Switch primary colour on the fly (e.g. white-label tenant switch)
widget.setTheme({ colorPrimary: '#d32f2f', colorPrimaryText: '#ffffff' })

// Only the provided keys are updated — other theme values are preserved
widget.setTheme({ borderRadius: '0px' })`}
      />

      <h3>setConfig(config)</h3>
      <p>
        Deep-merges a partial <code>ConsentiConfig</code> into the current config without
        re-initialising. Theme and dark mode side-effects are re-applied immediately. For locale or
        profile changes, follow up with <code>switchLocale()</code> or <code>init()</code>.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Update theme and dark mode together
widget.setConfig({
  darkMode: true,
  core: { theme: { colorPrimary: '#1a73e8' } },
})

// Disable powered-by branding at runtime
widget.setConfig({ hidePoweredBy: true })`}
      />

      <h3>setProfile(override)</h3>
      <p>
        Merges a partial profile override into the active profile and re-renders any currently
        visible banner or modal — no network call is made. Useful for A/B testing copy or
        dynamically adjusting the banner text after init.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Change the banner heading live
widget.setProfile({
  mainBanner: { heading: 'We care about your privacy' },
})

// Swap the modal position
widget.setProfile({
  preferenceModal: { position: 'left' },
})`}
      />
      <Callout type="info">
        <code>setProfile</code> is a no-op before <code>init()</code> completes — the resolved base
        profile must exist for the merge to run.
      </Callout>

      <h3>version()</h3>
      <p>
        Returns the package version and the currently active profile ID. Useful for support
        diagnostics and feature flags.
      </p>
      <CodeBlock
        lang="ts"
        code={`const info = widget.version()
// {
//   package: '0.1.1',              — npm package version
//   profileVersion: 'a1b2c3d4-…',  — the active profile's id (a new id is minted on every profile edit, so this doubles as a change indicator)
//   consentVersion: null,          — reserved for a future consent schema version
// }
console.log(\`Consenti \${info.package} | profile \${info.profileVersion}\`)`}
      />

      <h3>destroy()</h3>
      <p>
        Removes the banner DOM, modal DOM, BroadcastChannel listener, and all event listeners
        (including those registered via <code>on()</code>). Call when unmounting in SPA route
        changes if you manage the lifecycle manually.
      </p>
      <CodeBlock
        lang="ts"
        code={`// In a SPA router's cleanup callback:
widget.destroy()`}
      />

      <h3>getUserId() / setUserId(userId, reConsent?)</h3>
      <p>
        Ties the widget&apos;s consent record to your own logged-in application user, so consent
        follows the visitor across devices and browser sessions instead of resetting every time
        they sign in somewhere new. Call <code>setUserId()</code> after your own auth flow resolves
        (on login) and again with <code>null</code> on logout:
      </p>
      <CodeBlock
        lang="ts"
        code={`// After your app's login completes:
await widget.setUserId('user_123')

// On logout:
await widget.setUserId(null)

// Read it back anywhere:
widget.getUserId() // 'user_123' | null`}
      />
      <p>
        If the browser already has a stored consent record for a <em>different</em> user ID (a
        shared device), <code>setUserId()</code> treats that as a different data subject:
        by default it deletes the existing record and re-opens the banner (
        <code>reConsent()</code>), and always logs a warning. Pass <code>reConsent: false</code> to
        just update the identity without prompting again — the warning still logs, so you have a
        record of the identity change:
      </p>
      <CodeBlock lang="ts" code={`await widget.setUserId('user_456', false)`} />
      <p>
        Calling <code>setUserId()</code> with the value it&apos;s already set to is a no-op, and
        if there&apos;s no prior consent record to compare against (a true first-time visitor), it
        just records the ID with no warning and no reconsent. You can also set the initial user ID
        at construction time via <code>core.userId</code>, or drive identity from an existing
        event bus by dispatching a <code>consenti:listener:identify</code> DOM event — see{' '}
        <a href="/docs/ui/advanced-configuration/">Advanced Configuration</a> → <em>core</em>.
      </p>

      <h3>getVisitor()</h3>
      <p>
        A single snapshot of the current visitor&apos;s identity — useful for logging, debugging,
        or deciding whether to call <code>setUserId()</code> in the first place:
      </p>
      <CodeBlock
        lang="ts"
        code={`const visitor = widget.getVisitor()
// {
//   visitorId: 'visi_a1b2c3d4…' | null, — stable per-browser id
//   type: 'authenticated' | 'anonymous',
//   userId: 'user_123' | null,          — same value as getUserId()
// }`}
      />
      <p>
        <code>type</code> is <code>&apos;authenticated&apos;</code> whenever a <code>userId</code>{' '}
        is set, <code>&apos;anonymous&apos;</code> otherwise. <code>visitorId</code> is{' '}
        <code>null</code> until this browser has actually made a consent decision — Consenti never
        mints or persists a visitor identifier just because <code>getVisitor()</code> was called,
        only as a side effect of a real consent decision (manual submit, GPC auto-response, or a
        decision relayed from another tab). Once a decision exists, the same <code>visitorId</code>{' '}
        is also included in the <code>consenti:consentSubmitted</code> event payload and every
        server-side consent record.
      </p>
    </div>
  )
}
