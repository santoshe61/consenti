import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Meta Pixel & Conversions API — Frontend Guide — Consenti',
  description:
    'Wire Consenti consent state to the Meta Pixel consent API (fbq) and gate what you forward to the server-side Conversions API.',
  alternates: { canonical: '/guides/frontend/meta' },
  openGraph: {
    title: 'Meta Pixel & Conversions API — Frontend Guide — Consenti',
    description:
      'Wire Consenti consent state to the Meta Pixel consent API (fbq) and gate what you forward to the server-side Conversions API.',
    url: 'https://consenti.dev/guides/frontend/meta',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meta Pixel & Conversions API — Frontend Guide — Consenti',
    description:
      'Wire Consenti consent state to the Meta Pixel consent API (fbq) and gate what you forward to the server-side Conversions API.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendMetaGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Meta Pixel & Conversions API</h1>
      <p className="lead">
        Meta Pixel ships its own runtime consent flag (<code>fbq(&apos;consent&apos;, …)</code>) —
        so instead of gating the whole script, the usual pattern is to load the pixel once and let
        it sit revoked until Consenti tells it otherwise. This guide covers both the browser Pixel
        and what to check before forwarding events to the server-side Conversions API (CAPI).
      </p>

      <h2>Reading consent in Meta&apos;s shape</h2>
      <CodeBlock
        lang="typescript"
        code={`const metaConsent = widget.getConsent('meta')
// {
//   pixel: 'denied',           // Meta Pixel base tracking — from cookies with purpose: 'marketing'
//   api: 'denied',             // Conversions API forwarding — from cookies with purpose: 'marketing'
//   plugins: 'granted',        // Social plugins (Like/Share buttons) — from cookies with purpose: 'functional'
//   facebookLogin: 'granted',  // Facebook Login button — from cookies with purpose: 'functional'
// }`}
      />

      <Callout type="info">
        <code>pixel</code> and <code>api</code> both roll up from the same <code>marketing</code>{' '}
        purpose — Meta doesn&apos;t distinguish client vs. server tracking consent, so treat them as
        one signal unless you&apos;ve split them into separate cookie parameters. See{' '}
        <a href="/docs/ui/methods/#getconsent-type">API Methods</a> for the full{' '}
        <code>getConsent(type)</code> reference.
      </Callout>

      <h2>Step 1 — Load the pixel revoked by default</h2>
      <p>
        Load the standard Pixel base code once, but call{' '}
        <code>fbq(&apos;consent&apos;, &apos;revoke&apos;)</code> immediately after init so no
        events send until Consenti grants marketing consent:
      </p>

      <CodeBlock
        lang="html"
        filename="meta-pixel.html"
        code={`<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');

fbq('init', 'YOUR_PIXEL_ID');
fbq('consent', 'revoke');   // start denied — Consenti flips this once consent exists
fbq('track', 'PageView');   // safe to call even while revoked; fbq queues but withholds the send
</script>`}
      />

      <h2>Step 2 — Sync the consent flag from Consenti</h2>
      <p>
        <code>CategoryAction</code>&apos;s <code>id</code> is your own authored category ID (see{' '}
        <a href="/docs/ui/advanced-profiles/#category-type">Category type</a>) — use whichever one
        covers marketing/advertising consent in your profile; <code>&apos;marketing&apos;</code>{' '}
        below is just the common convention:
      </p>
      <CodeBlock
        lang="typescript"
        filename="meta-pixel.ts"
        code={`import { CategoryAction } from '@consenti/ui'

new CategoryAction({
  id: 'marketing',
  widget,
  onGrant: () => fbq('consent', 'grant'),
  onDeny: () => fbq('consent', 'revoke'),
})`}
      />

      <p>
        <code>CategoryAction</code> evaluates immediately at construction (so a returning visitor
        who already consented gets <code>fbq(&apos;consent&apos;, &apos;grant&apos;)</code> without
        waiting for a new submission) and re-fires on every future{' '}
        <code>consenti:consentSubmitted</code> event — including revocations from the preference
        modal.
      </p>

      <Callout type="tip">
        If you&apos;d rather not load <code>fbevents.js</code> at all for visitors who&apos;ve never
        consented, wrap the whole snippet in a <code>CategoryScript</code> instead (
        <code>categoryId: &apos;marketing&apos;</code>, <code>unsafeInnerHTML</code> containing the
        block above minus the <code>consent(&apos;revoke&apos;)</code> call). The tradeoff:
        first-time visitors who accept won&apos;t have historical pre-consent pageviews for Meta&apos;s
        attribution modelling, since the script never ran at all.
      </Callout>

      <h2>Server-side: Conversions API</h2>
      <p>
        CAPI calls happen from your backend, so Consenti&apos;s browser-side flag can&apos;t gate
        them directly — check <code>api</code> before you even construct the payload you send to
        your server:
      </p>

      <CodeBlock
        lang="typescript"
        code={`const metaConsent = widget.getConsent('meta')

if (metaConsent?.api === 'granted') {
  await fetch('/api/track-purchase', {
    method: 'POST',
    body: JSON.stringify({ event: 'Purchase', value: 49.99, currency: 'USD' }),
  })
}
// Your backend route then calls the Graph API Conversions API endpoint.
// Meta recommends also passing the visitor's Pixel consent status upstream
// so Meta's own systems can apply Limited Data Use processing where required.`}
      />

      <h2>Verifying</h2>
      <ol>
        <li>
          Install the <strong>Meta Pixel Helper</strong> browser extension.
        </li>
        <li>
          Before consenting, the extension should show the pixel as loaded but firing events with a{' '}
          consent-denied indicator (no data actually sent).
        </li>
        <li>Accept marketing consent on the Consenti banner.</li>
        <li>
          Confirm a <code>PageView</code> (or your next tracked event) now appears in Events
          Manager&apos;s Test Events tool within a few seconds.
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
            desc: 'CategoryAction, CategoryScript, and consenti:consentSubmitted',
          },
          {
            href: '/guides/frontend/gtm/',
            label: 'GTM & Google Consent Mode v2',
            desc: 'If you fire the Pixel through a GTM tag instead of the snippet directly',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Should I gate the pixel script itself or just the consent flag?',
            answer: (
              <p className="m-0">
                Gating just the consent flag (<code>fbq(&apos;consent&apos;, &apos;revoke&apos;)</code>{' '}
                by default) is Meta&apos;s recommended pattern — the library loads for everyone but
                withholds sends until granted, which keeps pixel initialization consistent and
                avoids re-fetching <code>fbevents.js</code> mid-session after consent changes. Fully
                gating the script with <code>CategoryScript</code> is stricter (nothing loads at all
                pre-consent) but means you lose the pixel&apos;s own internal state until the script
                is injected.
              </p>
            ),
          },
          {
            question: 'Does fbq(\'consent\', \'revoke\') stop the pixel from setting cookies?',
            answer: (
              <p className="m-0">
                Yes — when revoked, the Pixel does not set or read the <code>_fbp</code>/<code>fbc</code>{' '}
                first-party identifiers and does not send events to Meta. It resumes normal behaviour
                immediately after <code>fbq(&apos;consent&apos;, &apos;grant&apos;)</code>, no reload
                required.
              </p>
            ),
          },
          {
            question: 'Do I need to do anything different for the Conversions API vs. the browser Pixel?',
            answer: (
              <p className="m-0">
                Yes — CAPI runs server-side, so there&apos;s no <code>fbq</code> consent flag to set.
                Your backend needs to independently respect consent, typically by having the
                frontend include the resolved <code>getConsent(&apos;meta&apos;).api</code> value (or
                simply not calling your tracking endpoint at all when denied) so the server-side call
                never fires for a visitor who hasn&apos;t consented.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
