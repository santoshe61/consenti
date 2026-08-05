import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Google Consent Mode for GTM — Consenti',
  description:
    'How to configure Google Consent Mode v2 inside the Google Tag Manager console — container consent settings, per-tag consent checks, and the Consent Initialization trigger.',
  keywords: ['Google Consent Mode for GTM', 'GTM consent settings', 'Google Consent Mode v2 library', 'consent initialization trigger'],
  alternates: { canonical: '/guides/hot-topics/google-consent-mode-for-gtm' },
  openGraph: {
    title: 'Google Consent Mode for GTM — Consenti',
    description:
      'How to configure Google Consent Mode v2 inside the Google Tag Manager console — container settings, tag-level checks, and initialization order.',
    url: 'https://consenti.dev/guides/hot-topics/google-consent-mode-for-gtm',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Google Consent Mode for GTM — Consenti',
    description:
      'How to configure Google Consent Mode v2 inside the Google Tag Manager console — container settings, tag-level checks, and initialization order.',
    images: ['/og-image.jpg'],
  },
}

export default function GoogleConsentModeForGtmPage() {
  return (
    <div className="prose max-w-none">
      <h1>Google Consent Mode for GTM</h1>
      <p className="lead">
        This is the GTM-console side of Consent Mode v2 — what to click inside Google Tag Manager
        itself, as opposed to the JavaScript config on your site. If you&apos;ve already wired up a
        cookie banner and just need GTM to respect it, this is the checklist.
      </p>

      <h2>1. Turn on container-level consent settings</h2>
      <p>
        In GTM: <strong>Admin → Container Settings → Additional Settings → Consent Overview</strong>.
        Turning this on surfaces a consent status for every tag in the container and unlocks the
        built-in <strong>Consent Initialization — All Pages</strong> trigger.
      </p>

      <h2>2. Set the default consent state before anything fires</h2>
      <p>
        GTM needs to know the default (denied) state before any other tag evaluates. Two ways to do
        this:
      </p>
      <ul>
        <li>
          <strong>Consent Initialization trigger</strong> — a special trigger type that always fires
          before any regular tag, used with a small custom HTML tag that calls{' '}
          <code>gtag(&apos;consent&apos;, &apos;default&apos;, {'{...}'})</code>.
        </li>
        <li>
          <strong>Default consent set outside GTM</strong> — if your cookie banner already calls{' '}
          <code>gtag(&apos;consent&apos;, &apos;default&apos;, ...)</code> before the GTM snippet
          loads (the pattern Consenti and similar libraries use), you can skip step 2 inside GTM
          entirely — the default is already set by the time GTM tags evaluate.
        </li>
      </ul>

      <CodeBlock
        lang="javascript"
        filename="Consent Initialization tag (if not set upstream)"
        code={`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
});`}
      />

      <Callout type="warning">
        Do this only once. If your cookie banner already sets the default before GTM loads (check
        the dataLayer in DevTools for a <code>consent_default</code> entry), adding a second
        Consent Initialization tag inside GTM will conflict with it and can cause tags to briefly
        read the wrong state.
      </Callout>

      <h2>3. Add consent checks to each tag</h2>
      <p>
        Open a tag (e.g. GA4 Configuration, Google Ads Conversion) → scroll to{' '}
        <strong>Consent Settings</strong> → check <strong>Require additional consent for tag
        to fire</strong> → select the relevant signal (<code>analytics_storage</code> for GA4,{' '}
        <code>ad_storage</code> for Ads tags). GTM will now hold that tag until the signal is{' '}
        <code>granted</code>, without you writing a custom trigger condition.
      </p>

      <h2>4. Confirm the update call reaches GTM</h2>
      <p>
        When a visitor changes their preference, your banner needs to call{' '}
        <code>gtag(&apos;consent&apos;, &apos;update&apos;, {'{...}'})</code>. GTM tags configured
        with consent checks re-evaluate automatically — no extra trigger needed, no page reload.
      </p>

      <h2>5. Debug in Preview mode</h2>
      <ol>
        <li>Open GTM Preview and load your site.</li>
        <li>Check the summary panel — each tag shows whether it fired or was blocked by consent.</li>
        <li>Click a blocked tag to see exactly which signal it was waiting on.</li>
        <li>Accept the relevant category in your banner and confirm the tag fires without a reload.</li>
      </ol>

      <p>
        If you&apos;re using a library that already owns the default/update calls — Consenti&apos;s{' '}
        <code>utils.gtm</code> config does this on the JS side — the GTM-console work is mostly
        steps 3 and 5: adding consent checks per tag and verifying them in Preview. See the{' '}
        <Link href="/guides/frontend/gtm/">GTM & Google Consent Mode v2</Link> guide for the config
        API, or{' '}
        <Link href="/guides/hot-topics/google-consent-mode-v2-explained/">
          Google Consent Mode v2 Explained
        </Link>{' '}
        for the concepts behind basic vs. advanced mode.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/guides/frontend/gtm/',
            label: 'GTM & Google Consent Mode v2',
            desc: 'The JS-side Consenti config — containerId, verbose mode, dataLayer output',
          },
          {
            href: '/guides/hot-topics/google-consent-mode-v2-explained/',
            label: 'Google Consent Mode v2 Explained',
            desc: 'What the seven signals mean and basic vs. advanced mode',
          },
          {
            href: '/docs/ui/events/',
            label: 'Events',
            desc: 'consenti:* events you can also route into GTM triggers',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Do I need a GTM community template for Consent Mode?',
            answer: (
              <p className="m-0">
                No — Consent Mode support is built into GTM natively via the Consent Settings tab
                on each tag and the container-level Consent Overview toggle. Community templates
                exist for specific CMP integrations, but the core mechanism doesn&apos;t require
                one.
              </p>
            ),
          },
          {
            question: 'Where do I see which tags are being blocked by consent?',
            answer: (
              <p className="m-0">
                GTM Preview mode&apos;s summary panel lists every tag with a fired/not-fired status,
                and clicking a blocked tag shows which consent signal it&apos;s waiting on.
              </p>
            ),
          },
          {
            question: 'Can I set consent defaults per-region inside GTM instead of via my banner?',
            answer: (
              <p className="m-0">
                You can build a Consent Initialization tag with region-conditional logic, but
                it&apos;s usually simpler to let your cookie banner/CMP resolve the visitor&apos;s
                jurisdiction (it already needs that logic to pick a compliance profile) and just
                pass the resulting default state to <code>gtag</code> once.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
