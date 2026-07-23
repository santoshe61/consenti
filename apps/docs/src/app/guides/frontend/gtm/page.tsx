import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'GTM & Google Consent Mode v2 — Frontend Guide — Consenti',
  description:
    'Wire Consenti to Google Tag Manager and push consent signals in Google Consent Mode v2 format automatically.',
  alternates: { canonical: '/guides/frontend/gtm' },
  openGraph: {
    title: 'GTM & Google Consent Mode v2 — Frontend Guide — Consenti',
    description:
      'Wire Consenti to Google Tag Manager and push consent signals in Google Consent Mode v2 format automatically.',
    url: 'https://consenti.dev/guides/frontend/gtm',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GTM & Google Consent Mode v2 — Frontend Guide — Consenti',
    description:
      'Wire Consenti to Google Tag Manager and push consent signals in Google Consent Mode v2 format automatically.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendGtmGuide() {
  return (
    <div className="prose max-w-none">
      <h1>GTM & Google Consent Mode v2</h1>
      <p className="lead">
        Google Consent Mode v2 lets you tell Google&apos;s tags how to behave when a visitor
        hasn&apos;t consented to tracking. Consenti pushes the right signals to your{' '}
        <code>dataLayer</code> automatically — you just configure a container ID and GTM handles the
        rest.
      </p>

      <h2>Why this matters</h2>
      <p>
        Without Consent Mode, Google Ads and Analytics tags fire unconditionally. With Consent Mode
        v2, they receive a consent state (<code>granted</code> or <code>denied</code>) and adjust
        their behaviour — firing in cookieless mode or not firing at all. This is required for EU
        compliance from March 2024 for conversion modelling in Google Ads.
      </p>

      <h2>Step 1 — Add GTM config to Consenti</h2>

      <CodeBlock
        lang="typescript"
        filename="consent.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'opt-in' },
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX',    // your GTM container ID
      urlPassthrough: true,          // preserve click IDs (gclid/fbclid) for cookieless modelling
      adsDataRedaction: true,        // redact ad click IDs when ad_storage is denied
    },
  },
})`}
      />

      <p>
        That&apos;s it. Consenti injects the GTM snippet, calls{' '}
        <code>gtag(&apos;consent&apos;, &apos;default&apos;, …)</code> immediately with a
        denied-by-default state, then calls{' '}
        <code>gtag(&apos;consent&apos;, &apos;update&apos;, …)</code> each time the visitor submits
        consent.
      </p>

      <Callout type="warning">
        Do not add GTM via a separate <code>&lt;script&gt;</code> tag if you&apos;re using
        Consenti&apos;s GTM integration. Consenti injects the GTM snippet itself to ensure the
        consent default state is set <em>before</em> any tags fire. Injecting it twice creates
        duplicate pageview events.
      </Callout>

      <h2>What gets pushed to dataLayer</h2>
      <p>
        Consenti calls the real <code>gtag()</code> consent API — via the standard stub-queue
        pattern, so it works whether your own gtag.js/GTM snippet loads before or after Consenti.
        Each call ultimately becomes a <code>dataLayer.push([...])</code> entry:
      </p>

      <CodeBlock
        lang="javascript"
        code={`// On page load — before visitor interaction
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
})`}
      />

      <p>After the visitor submits their preferences:</p>

      <CodeBlock
        lang="javascript"
        code={`// On consent submission
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
        <code>consenti:*</code> event (banner shown, modal opened, etc.) onto the dataLayer as a
        generic <code>{'{ event, content }'}</code> push — useful for custom, non-Consent-Mode GTM
        triggers. It&apos;s off by default so the dataLayer only carries real consent signals.
      </Callout>

      <h2>Reading GTM-format consent in your code</h2>
      <p>
        Use <code>widget.getGTMConsent()</code> to read the current consent state in the exact
        format GTM expects — useful for debugging or for sending to your own analytics endpoint.
      </p>

      <CodeBlock
        lang="typescript"
        code={`const widget = new ConsentiSetup({ /* ... */ })

const gtmConsent = widget.getGTMConsent()
// {
//   analytics_storage: 'granted',
//   ad_storage: 'denied',
//   ad_user_data: 'denied',
//   ad_personalization: 'denied',
//   functionality_storage: 'granted',
// }`}
      />

      <h2>Verifying in GTM Preview</h2>
      <ol>
        <li>Open your site with GTM Preview active (click &ldquo;Preview&rdquo; in GTM).</li>
        <li>
          Reload the page. In the GTM debug panel, you should see a <code>consent_default</code>{' '}
          event with all values <code>denied</code>.
        </li>
        <li>
          Accept cookies on the banner. You should see a <code>consent_update</code> event with the
          values reflecting your choices.
        </li>
        <li>
          Check that tags configured to fire &ldquo;On Consent&rdquo; now fire (e.g. GA4 config
          tag).
        </li>
      </ol>

      <Callout type="tip">
        In Chrome DevTools → Network, filter for <code>collect</code> to see GA4 hits. A hit with{' '}
        <code>gcs=G111</code> means analytics consent was granted; <code>gcs=G100</code> means
        denied.
      </Callout>

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'Full utils.gtm option reference — containerId, verbose, and more',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'widget.getGTMConsent() and other instance methods',
          },
          {
            href: '/docs/ui/events/',
            label: 'Events',
            desc: 'The consenti:* events mirrored onto dataLayer when verbose is on',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'What is urlPassthrough and should I enable it?',
            answer: (
              <p className="m-0">
                <code>urlPassthrough: true</code> tells Google to pass click IDs (like{' '}
                <code>gclid</code>) as URL parameters even when cookie storage is denied. This
                allows Google Ads to model conversions without writing cookies. Enable it if you run
                Google Ads campaigns and need conversion data for EU visitors who deny ad cookies.
                It has no effect on visitors who grant consent.
              </p>
            ),
          },
          {
            question:
              'Why are my Google Ads conversion numbers dropping after enabling Consent Mode?',
            answer: (
              <p className="m-0">
                This is expected initially — Consent Mode stops firing ad tags for visitors who deny
                consent. Google then uses modelled conversions to fill the gap. Allow 2–4 weeks for
                Google&apos;s modelling to stabilise. Enable <code>urlPassthrough: true</code> and
                <code>adsDataRedaction: true</code> to give Google the best signal for modelling.
                Conversion modelling is a feature of Enhanced Conversions — ensure that&apos;s
                enabled in your Google Ads account.
              </p>
            ),
          },
          {
            question: 'How do I verify the consent signals are reaching GTM?',
            answer: (
              <>
                <ol className="m-0 pl-4 space-y-1">
                  <li>
                    Use GTM Preview mode and look for the <code>consent_default</code> and{' '}
                    <code>consent_update</code> events in the event stream.
                  </li>
                  <li>
                    Open the browser console and type <code>dataLayer</code> — you should see the
                    consent push objects.
                  </li>
                  <li>
                    In Network tab, filter for <code>collect?</code> and check the <code>gcs</code>{' '}
                    parameter value on GA4 hits.
                  </li>
                </ol>
              </>
            ),
          },
          {
            question: 'Can I customise which Consenti cookies map to which GTM consent types?',
            answer: (
              <p className="m-0">
                Not directly in config — the mapping is done inside the widget based on cookie IDs.
                Cookies with <code>listenGpc: true</code> map to ad-related consent types; others
                map to analytics or functionality. For full control, use the{' '}
                <code>consenti:consentSubmitted</code> event and push your own custom{' '}
                <code>dataLayer</code> object with the exact mapping you need.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
