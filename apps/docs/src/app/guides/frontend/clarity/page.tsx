import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Microsoft Clarity — Frontend Guide — Consenti',
  description:
    'Gate Microsoft Clarity session recordings and heatmaps behind Consenti consent, and sync the clarity("consent") API.',
  alternates: { canonical: '/guides/frontend/clarity' },
  openGraph: {
    title: 'Microsoft Clarity — Frontend Guide — Consenti',
    description:
      'Gate Microsoft Clarity session recordings and heatmaps behind Consenti consent, and sync the clarity("consent") API.',
    url: 'https://consenti.dev/guides/frontend/clarity',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Microsoft Clarity — Frontend Guide — Consenti',
    description:
      'Gate Microsoft Clarity session recordings and heatmaps behind Consenti consent, and sync the clarity("consent") API.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendClarityGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Microsoft Clarity</h1>
      <p className="lead">
        Clarity records sessions and builds heatmaps — squarely analytics-purpose tracking, and
        squarely something you shouldn&apos;t start before consent. Consenti gives you a
        Clarity-shaped consent object plus the primitives to gate the tracking script itself and
        keep Clarity&apos;s own runtime consent flag in sync.
      </p>

      <h2>Reading consent in Clarity&apos;s shape</h2>
      <CodeBlock
        lang="typescript"
        code={`const clarityConsent = widget.getConsent('microsoft-clarity')
// {
//   session: 'granted',      // session recordings
//   heatmaps: 'granted',     // click/scroll heatmaps
//   performance: 'granted',  // performance/rage-click metrics
// }`}
      />

      <Callout type="info">
        All three keys currently roll up from the same <code>analytics</code> purpose — Clarity
        doesn&apos;t offer a way to separately opt out of, say, heatmaps but not session recording.
        See <a href="/docs/ui/methods/#getconsent-type">API Methods</a> for the full{' '}
        <code>getConsent(type)</code> reference.
      </Callout>

      <h2>Step 1 — Gate the tracking script</h2>
      <p>
        Clarity has no build-time way to defer its own start, so the reliable approach is to not
        load <code>clarity.js</code> at all until consent exists. Wrap the standard snippet in a{' '}
        <code>CategoryScript</code>, keyed to your own authored category ID (see{' '}
        <a href="/docs/ui/advanced-profiles/#category-type">Category type</a>) —{' '}
        <code>&apos;analytics&apos;</code> below is the common convention:
      </p>

      <CodeBlock
        lang="typescript"
        filename="clarity.ts"
        code={`import { CategoryScript } from '@consenti/ui'

new CategoryScript({
  categoryId: 'analytics',
  widget,
  unsafeInnerHTML: \`
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "YOUR_PROJECT_ID");
  \`,
  onLoad: () => console.log('Clarity loaded'),
  onRevoke: () => console.log('Clarity script removed'),
})`}
      />

      <Callout type="warning">
        Removing the <code>&lt;script&gt;</code> tag on revoke (which <code>CategoryScript</code>{' '}
        does automatically) stops <em>new</em> Clarity activity, but doesn&apos;t retroactively
        delete anything already captured in that session before revocation — same caveat as any
        script-gated analytics tool. Load it only after consent in the first place if that matters
        for your compliance posture, rather than relying on gate-then-revoke.
      </Callout>

      <h2>Step 2 — Sync Clarity&apos;s own consent API</h2>
      <p>
        If your Clarity project has &ldquo;require consent&rdquo; behaviour configured, or you want
        an explicit signal independent of script presence, call{' '}
        <code>clarity(&apos;consent&apos;, …)</code> directly from a <code>CategoryAction</code>:
      </p>

      <CodeBlock
        lang="typescript"
        filename="clarity-consent.ts"
        code={`import { CategoryAction } from '@consenti/ui'

new CategoryAction({
  id: 'analytics',
  widget,
  onGrant: () => window.clarity?.('consent', true),
  onDeny: () => window.clarity?.('consent', false),
})`}
      />

      <p>
        Run this alongside the <code>CategoryScript</code> above — the script gate controls whether
        Clarity is present at all, and the consent call controls its behaviour once it is.
      </p>

      <h2>Verifying</h2>
      <ol>
        <li>
          Before consenting, open Network tab and confirm no request to{' '}
          <code>clarity.ms/tag/…</code> or <code>clarity.ms/collect</code> fires.
        </li>
        <li>Accept the analytics category on the Consenti banner.</li>
        <li>
          Confirm the Clarity script now loads, and check the{' '}
          <a
            href="https://clarity.microsoft.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clarity dashboard
          </a>{' '}
          — new sessions should appear within a couple of minutes (Clarity batches uploads, so it
          isn&apos;t instant).
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
            desc: 'CategoryScript, CategoryAction, and consenti:consentSubmitted',
          },
          {
            href: '/guides/frontend/hotjar/',
            label: 'Hotjar & Others',
            desc: 'The same script-gating pattern applied to tools with no dedicated format',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Why is there no separate consent for heatmaps vs. session recordings?',
            answer: (
              <p className="m-0">
                <code>getConsent(&apos;microsoft-clarity&apos;)</code> mirrors whatever granularity
                your Consenti profile actually defines. Out of the box all three Clarity features
                roll up from the <code>analytics</code> purpose. If you need them independent,
                define separate cookie parameters (e.g. <code>clarity_session</code>,{' '}
                <code>clarity_heatmaps</code>) with that same purpose and read their individual
                statuses from <code>widget.getConsent()</code> instead of the vendor-shaped helper.
              </p>
            ),
          },
          {
            question: 'Do I need both the CategoryScript gate and the clarity(\'consent\') call?',
            answer: (
              <p className="m-0">
                Only the <code>CategoryScript</code> gate is required for most setups — it ensures
                Clarity never loads pre-consent. The explicit <code>clarity(&apos;consent&apos;, …)</code>{' '}
                call matters if your Clarity project has &ldquo;consent mode&rdquo; enabled in its
                project settings, which makes Clarity itself wait for that call regardless of when
                the script loaded — add it for defense in depth or if you&apos;ve turned that
                setting on.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
