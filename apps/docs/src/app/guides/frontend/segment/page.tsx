import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Twilio Segment — Frontend Guide — Consenti',
  description:
    'Gate Segment analytics.js calls — identify, page, track, group, alias — behind per-call Consenti consent instead of an all-or-nothing switch.',
  alternates: { canonical: '/guides/frontend/segment' },
  openGraph: {
    title: 'Twilio Segment — Frontend Guide — Consenti',
    description:
      'Gate Segment analytics.js calls — identify, page, track, group, alias — behind per-call Consenti consent instead of an all-or-nothing switch.',
    url: 'https://consenti.dev/guides/frontend/segment',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twilio Segment — Frontend Guide — Consenti',
    description:
      'Gate Segment analytics.js calls — identify, page, track, group, alias — behind per-call Consenti consent instead of an all-or-nothing switch.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendSegmentGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Twilio Segment</h1>
      <p className="lead">
        Segment is a pipe, not a single tracker — <code>analytics.js</code> fans one call out to
        every downstream tool in your workspace, which makes coarse script-gating a blunt
        instrument. Consenti gives you a per-call consent breakdown instead, so{' '}
        <code>identify()</code> can stay blocked while <code>page()</code> already flows, or
        vice versa.
      </p>

      <h2>Reading consent in Segment&apos;s shape</h2>
      <CodeBlock
        lang="typescript"
        code={`const segmentConsent = widget.getConsent('twilio-segment')
// {
//   identify: 'denied',   // ties events to a known user — from cookies with purpose: 'preferences'
//   page: 'granted',      // page-view calls — from cookies with purpose: 'analytics'
//   track: 'granted',     // event tracking — from cookies with purpose: 'analytics'
//   group: 'granted',     // account/org association — from cookies with purpose: 'analytics'
//   alias: 'granted',     // merging anon + known IDs — from cookies with purpose: 'analytics'
// }`}
      />

      <Callout type="info">
        <code>identify</code> is deliberately split out under the <code>preferences</code> purpose
        rather than <code>analytics</code> — it&apos;s the call that attaches PII (email, user ID,
        traits) to the visitor, so it&apos;s reasonable for a visitor to allow anonymous page/track
        events while still declining to be identified. See{' '}
        <a href="/docs/ui/methods/#getconsent-type">API Methods</a> for the full{' '}
        <code>getConsent(type)</code> reference.
      </Callout>

      <h2>Step 1 — Gate the snippet load</h2>
      <p>
        Don&apos;t call <code>analytics.load()</code> at all until at least anonymous tracking is
        allowed — this also means the Segment CDN request itself, and every downstream
        destination it can trigger, never happens pre-consent. The <code>categoryId</code> below is
        your own authored category ID (see{' '}
        <a href="/docs/ui/advanced-profiles/#category-type">Category type</a>) — use whichever one
        covers analytics in your profile:
      </p>

      <CodeBlock
        lang="typescript"
        filename="segment.ts"
        code={`import { CategoryScript } from '@consenti/ui'

new CategoryScript({
  categoryId: 'analytics',
  widget,
  unsafeInnerHTML: \`
    !function(){var analytics=window.analytics=window.analytics||[];
    if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");
    else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];
    analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};
    for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}
    analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;
    t.src="https://cdn.segment.com/analytics.js/v1/"+key+"/analytics.min.js";
    var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};
    analytics._writeKey="YOUR_WRITE_KEY";analytics.SNIPPET_VERSION="4.16.1";
    analytics.load("YOUR_WRITE_KEY");}}();
  \`,
})`}
      />

      <h2>Step 2 — Wrap each call site with its own check</h2>
      <p>
        Segment&apos;s SDK has no built-in consent flag, so per-call gating means checking{' '}
        <code>getConsent(&apos;twilio-segment&apos;)</code> at the point you call each method.
        A small wrapper keeps this out of your feature code:
      </p>

      <CodeBlock
        lang="typescript"
        filename="segment-consent.ts"
        code={`function segmentConsent() {
  return widget.getConsent('twilio-segment')
}

export function safeIdentify(userId: string, traits?: Record<string, unknown>) {
  if (segmentConsent()?.identify === 'granted') {
    window.analytics?.identify(userId, traits)
  }
}

export function safePage(name?: string, properties?: Record<string, unknown>) {
  if (segmentConsent()?.page === 'granted') {
    window.analytics?.page(name, properties)
  }
}

export function safeTrack(event: string, properties?: Record<string, unknown>) {
  if (segmentConsent()?.track === 'granted') {
    window.analytics?.track(event, properties)
  }
}`}
      />

      <p>Call site usage looks identical to calling Segment directly:</p>

      <CodeBlock
        lang="typescript"
        code={`safeTrack('Product Viewed', { productId: 'sku_123' })
safeIdentify(user.id, { email: user.email, plan: user.plan })`}
      />

      <Callout type="tip">
        Re-evaluating consent per call (rather than once at page load) means a visitor who
        withdraws consent mid-session immediately stops generating new events, without you having
        to track subscription state yourself — <code>getConsent()</code> always reflects the
        latest submission.
      </Callout>

      <h2>Backfilling identify() after consent arrives</h2>
      <p>
        A common pattern: track anonymously from page load, then call <code>identify()</code> once
        the visitor logs in or grants the cookie parameter carrying <code>purpose: &apos;preferences&apos;</code>{' '}
        — whichever happens second. <code>ConsentAction</code>&apos;s <code>id</code> here is a
        specific cookie ID (unlike <code>CategoryAction</code>/<code>CategoryScript</code>&apos;s{' '}
        <code>id</code>/<code>categoryId</code>, which target a whole authored category):
      </p>

      <CodeBlock
        lang="typescript"
        code={`import { ConsentAction } from '@consenti/ui'

new ConsentAction({
  id: 'preferences_storage', // the cookie ID you gave purpose: 'preferences' in your profile
  widget,
  onGrant: () => {
    if (currentUser) safeIdentify(currentUser.id, { email: currentUser.email })
  },
})`}
      />

      <h2>Verifying</h2>
      <ol>
        <li>Open the browser console and inspect the Segment debugger panel, or run <code>analytics.debug()</code>.</li>
        <li>Before consenting, confirm no requests to <code>api.segment.io</code> fire.</li>
        <li>
          Accept analytics consent — confirm <code>page</code>/<code>track</code> calls start
          reaching the debugger, while <code>identify</code> stays absent until you&apos;ve also
          granted the category covering your <code>preferences</code>-purpose cookie.
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
            desc: 'ConsentAction, CategoryScript, and consenti:consentSubmitted',
          },
          {
            href: '/guides/frontend/gtm/',
            label: 'GTM & Google Consent Mode v2',
            desc: 'If you load analytics.js via a GTM tag instead of the snippet directly',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Should I use Segment’s own Consent Manager instead of this?',
            answer: (
              <p className="m-0">
                Segment&apos;s Consent Manager plugin solves a similar problem but expects to own
                the banner UI and category model itself. Since Consenti already owns consent
                collection and storage, wiring <code>getConsent(&apos;twilio-segment&apos;)</code>{' '}
                into your own call sites avoids running two consent systems side by side.
              </p>
            ),
          },
          {
            question: 'Why is identify() gated separately from track() and page()?',
            answer: (
              <p className="m-0">
                <code>identify</code> attaches personally identifying traits (email, name, user ID)
                to the visitor&apos;s Segment profile, which is a materially different privacy
                impact than an anonymous pageview or event. Mapping it to cookies with{' '}
                <code>purpose: &apos;preferences&apos;</code> rather than{' '}
                <code>&apos;analytics&apos;</code> lets visitors consent to anonymous tracking
                without being personally identified.
              </p>
            ),
          },
          {
            question: 'What happens to events queued before analytics.load() finishes?',
            answer: (
              <p className="m-0">
                The Segment snippet queues any <code>analytics.track()</code>/<code>page()</code>{' '}
                calls made before the real library has finished loading from the CDN, then replays
                them once ready — so calling <code>safeTrack()</code> immediately after the{' '}
                <code>CategoryScript</code> injects the snippet is safe, no need to wait for a
                ready callback.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
