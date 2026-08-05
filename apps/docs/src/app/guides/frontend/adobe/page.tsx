import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Adobe Analytics & Experience Platform — Frontend Guide — Consenti',
  description:
    'Read Consenti consent state in Adobe format and wire it to Adobe Launch, AppMeasurement, and the Adobe Experience Platform Web SDK (alloy).',
  alternates: { canonical: '/guides/frontend/adobe' },
  openGraph: {
    title: 'Adobe Analytics & Experience Platform — Frontend Guide — Consenti',
    description:
      'Read Consenti consent state in Adobe format and wire it to Adobe Launch, AppMeasurement, and the Adobe Experience Platform Web SDK (alloy).',
    url: 'https://consenti.dev/guides/frontend/adobe',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Adobe Analytics & Experience Platform — Frontend Guide — Consenti',
    description:
      'Read Consenti consent state in Adobe format and wire it to Adobe Launch, AppMeasurement, and the Adobe Experience Platform Web SDK (alloy).',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendAdobeGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Adobe Analytics & Experience Platform</h1>
      <p className="lead">
        Unlike Google Consent Mode, Adobe has no single industry-standard consent signal — Launch,
        AppMeasurement, and the Experience Platform Web SDK each expect consent expressed
        differently. Consenti doesn&apos;t auto-inject an Adobe snippet the way it does for GTM;
        instead it gives you a ready-made Adobe-shaped consent object and script-gating primitives
        so you wire it to whichever Adobe surface you run.
      </p>

      <h2>Reading consent in Adobe&apos;s shape</h2>
      <p>
        <code>widget.getConsent(&apos;adobe&apos;)</code> maps your visitor&apos;s consent onto the
        four Adobe product surfaces:
      </p>

      <CodeBlock
        lang="typescript"
        code={`const adobeConsent = widget.getConsent('adobe')
// {
//   analytics: 'granted',   // Adobe Analytics / AppMeasurement — from cookies with purpose: 'analytics'
//   target: 'denied',       // Adobe Target — from cookies with purpose: 'preferences'
//   manager: 'denied',      // Audience Manager — from cookies with purpose: 'marketing'
//   optimizer: 'denied',    // Recommendations/Optimizer — from cookies with purpose: 'marketing'
// }`}
      />

      <Callout type="info">
        There&apos;s no fixed <code>adobe_analytics</code> cookie ID baked into the widget — this
        rolls up whichever parameters carry that <code>purpose</code> in your profile. See{' '}
        <a href="/docs/ui/methods/#getconsent-type">API Methods</a> for the full{' '}
        <code>getConsent(type)</code> reference.
      </Callout>

      <h2>Option A — Gate the Launch/AppMeasurement library itself</h2>
      <p>
        The simplest integration: don&apos;t load Adobe Launch (or the standalone AppMeasurement
        script) until the relevant category is granted. Use <code>CategoryScript</code> so the
        library is only fetched — and any beacons it fires only happen — once consent exists. The{' '}
        <code>categoryId</code> here is your own authored category ID (see{' '}
        <a href="/docs/ui/advanced-profiles/#category-type">Category type</a>) — use whichever id
        actually covers analytics/marketing in your profile:
      </p>

      <CodeBlock
        lang="typescript"
        filename="adobe.ts"
        code={`import { CategoryScript } from '@consenti/ui'

// Analytics-only Launch property
new CategoryScript({
  categoryId: 'analytics',
  widget,
  src: 'https://assets.adobedtm.com/YOUR_LAUNCH_PROPERTY/launch-EN.min.js',
})

// If the same Launch property also fires Target/Audience Manager rules,
// gate it on 'marketing' instead so it waits for the broader consent
new CategoryScript({
  categoryId: 'marketing',
  widget,
  src: 'https://assets.adobedtm.com/YOUR_LAUNCH_PROPERTY/launch-EN.min.js',
})`}
      />

      <Callout type="warning">
        Only use one of these — injecting the same Launch property twice under two different
        categories creates duplicate <code>s.t()</code>/<code>s.tl()</code> beacons. Pick the
        broadest category your property actually needs and gate on that.
      </Callout>

      <h2>Option B — Adobe Experience Platform Web SDK (alloy)</h2>
      <p>
        If you&apos;re on the Experience Platform Web SDK, <code>alloy(&apos;setConsent&apos;, …)</code>{' '}
        is the real consent entry point — it accepts an explicit collect flag rather than needing
        the library itself gated. Load <code>alloy.js</code> normally, set a denied default before
        anything can send data, then update it from Consenti&apos;s events:
      </p>

      <CodeBlock
        lang="typescript"
        filename="adobe-alloy.ts"
        code={`import { CategoryAction } from '@consenti/ui'

// Default to denied the moment alloy loads — mirrors Consenti's own
// deny-by-default posture before the visitor has made a choice
alloy('setConsent', {
  consent: [{ standard: 'Adobe', version: '2.0', value: { collect: { val: 'n' } } }],
})

// Keep alloy's consent flag in sync with the 'analytics' category's rollup
new CategoryAction({
  id: 'analytics',
  widget,
  onGrant: () => {
    alloy('setConsent', {
      consent: [{ standard: 'Adobe', version: '2.0', value: { collect: { val: 'y' } } }],
    })
  },
  onDeny: () => {
    alloy('setConsent', {
      consent: [{ standard: 'Adobe', version: '2.0', value: { collect: { val: 'n' } } }],
    })
  },
})`}
      />

      <p>
        If your Experience Platform datastream also enforces IAB TCF, pass the{' '}
        <code>tcfdata</code> standard instead of/alongside <code>Adobe</code> — see Adobe&apos;s
        Web SDK consent documentation for the exact payload shape for your configured standard.
      </p>

      <h2>Verifying</h2>
      <ol>
        <li>
          Install the <strong>Adobe Experience Platform Debugger</strong> browser extension.
        </li>
        <li>
          Before consenting, confirm no Analytics/Target/AEP network requests fire (Network tab,
          filter for <code>2o7.net</code>, <code>omtrdc.net</code>, or your first-party CNAME, and
          for AEP, <code>/ee/v2/interact</code>).
        </li>
        <li>
          Accept the relevant category on the Consenti banner and confirm the requests start
          appearing without a page reload.
        </li>
        <li>
          For alloy, the Debugger&apos;s &ldquo;Events&rdquo; panel shows the resolved consent
          object attached to each interact call — verify <code>collect.val</code> matches what you
          expect.
        </li>
      </ol>

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'getConsent(type) and other instance methods',
          },
          {
            href: '/docs/ui/events/',
            label: 'Events',
            desc: 'ConsentScript, ConsentAction, CategoryAction, and CategoryScript',
          },
          {
            href: '/guides/frontend/gtm/',
            label: 'GTM & Google Consent Mode v2',
            desc: 'The one vendor Consenti does wire up automatically, for comparison',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Why doesn’t Consenti auto-inject the Adobe Launch snippet like it does for GTM?',
            answer: (
              <p className="m-0">
                Adobe doesn&apos;t have one standard consent wire format the way Google Consent Mode
                v2 does — AppMeasurement, Launch rule conditions, and the Experience Platform Web
                SDK each read consent differently, and which one you use depends on your Adobe
                setup. Rather than guess, Consenti gives you the resolved consent object (
                <code>getConsent(&apos;adobe&apos;)</code>) and generic gating primitives (
                <code>CategoryScript</code>, <code>CategoryAction</code>) so you point them at
                whichever surface you actually run.
              </p>
            ),
          },
          {
            question: 'Which category should Adobe Target map to — I want it separate from Analytics?',
            answer: (
              <p className="m-0">
                <code>getConsent(&apos;adobe&apos;).target</code> is derived from cookies whose{' '}
                <code>purpose</code> is <code>preferences</code>, distinct from{' '}
                <code>analytics</code>. If your profile doesn&apos;t define any{' '}
                <code>preferences</code>-purpose cookies, <code>target</code> will always resolve to{' '}
                <code>&apos;denied&apos;</code> — add a cookie entry with{' '}
                <code>purpose: &apos;preferences&apos;</code> for Target-related storage so it has
                something to roll up from.
              </p>
            ),
          },
          {
            question: 'Do I still need this if I only use Adobe Analytics server-side?',
            answer: (
              <p className="m-0">
                If AppMeasurement never loads in the browser, there&apos;s no client-side signal to
                gate — but you should still check{' '}
                <code>widget.getConsent(&apos;adobe&apos;).analytics</code> before your own code
                sends a server-side hit on the visitor&apos;s behalf, the same way you&apos;d check
                consent before calling a Conversions API from your backend.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
