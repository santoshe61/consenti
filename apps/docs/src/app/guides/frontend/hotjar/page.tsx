import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Hotjar & Others — Frontend Guide — Consenti',
  description:
    'Integrate any tool with no dedicated Consenti vendor format — Hotjar, Mixpanel, Amplitude, FullStory, and similar session-replay/analytics tools — using getConsent(\'purpose\'), getConsent(\'category\'), or a dedicated cookie ID.',
  alternates: { canonical: '/guides/frontend/hotjar' },
  openGraph: {
    title: 'Hotjar & Others — Frontend Guide — Consenti',
    description:
      'Integrate any tool with no dedicated Consenti vendor format — Hotjar, Mixpanel, Amplitude, FullStory, and similar session-replay/analytics tools — using getConsent(\'purpose\'), getConsent(\'category\'), or a dedicated cookie ID.',
    url: 'https://consenti.dev/guides/frontend/hotjar',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hotjar & Others — Frontend Guide — Consenti',
    description:
      'Integrate any tool with no dedicated Consenti vendor format — Hotjar, Mixpanel, Amplitude, FullStory, and similar session-replay/analytics tools — using getConsent(\'purpose\'), getConsent(\'category\'), or a dedicated cookie ID.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendHotjarGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Hotjar & Others</h1>
      <p className="lead">
        Hotjar has no runtime consent flag to toggle and no dedicated Consenti output format —
        unlike Adobe, Meta, Clarity, or Segment. It&apos;s representative of a whole class of tools
        this way: Mixpanel, Amplitude, FullStory, Crazy Egg, Mouseflow, LogRocket, Plausible,
        self-hosted Matomo, and most other analytics/session-replay tools have no runtime consent
        API of their own either. For all of them, integration comes down to the same two steps:
        pick the <code>getConsent()</code> call that matches how you modeled the tool in your
        profile, then gate script loading. This guide uses Hotjar as the worked example.
      </p>

      <h2>Which getConsent() call should I use?</h2>
      <p>
        There&apos;s no <code>getConsent(&apos;hotjar&apos;)</code> vendor format, so there&apos;s
        no single right answer — it depends on the granularity you want. All three are real,
        independent calls (see <a href="/docs/ui/methods/#getconsent-type">API Methods</a> for the
        full reference):
      </p>

      <h3>1. getConsent(&apos;purpose&apos;) — the common case</h3>
      <p>
        Hotjar cookies (<code>_hjSessionUser_*</code>, <code>_hjSession_*</code>, <code>_hjid</code>)
        are almost always tagged <code>purpose: &apos;analytics&apos;</code> like most
        session-replay/heatmap tools. If you just want the coarse rollup:
      </p>
      <CodeBlock
        lang="typescript"
        code={`const { analytics } = widget.getConsent('purpose')
// analytics: 'granted' | 'denied' | 'objected'`}
      />

      <h3>2. getConsent(&apos;category&apos;) — match the modal exactly</h3>
      <p>
        If Hotjar is bundled into a category alongside other tools and you want consent for exactly
        what the visitor toggled (not just the fixed taxonomy), read your own category ID instead
        (see <a href="/docs/ui/advanced-profiles/#category-type">Category type</a>) —{' '}
        <code>&apos;granted&apos;</code> only when every parameter in that category is granted, not
        just Hotjar&apos;s:
      </p>
      <CodeBlock
        lang="typescript"
        code={`const categories = widget.getConsent('category')
// { 'cat-analytics': 'denied', 'cat-marketing': 'granted', ... }

if (categories?.['cat-analytics'] === 'granted') {
  // every parameter in that category is granted, not just Hotjar's
}`}
      />

      <h3>3. getConsent() / getConsent(&apos;default&apos;) — a dedicated cookie</h3>
      <p>
        If you gave Hotjar its own cookie parameter in the profile, read that one ID directly — no
        rollup at all:
      </p>
      <CodeBlock
        lang="typescript"
        code={`const consent = widget.getConsent()
if (consent?.hotjar === 'granted') {
  // load Hotjar
}`}
      />
      <p>This is the read-side counterpart to the dedicated-cookie gating pattern below.</p>

      <h2>Gate the Tracking Code</h2>
      <p>
        Whichever call you read from, loading still works the same way: wrap the standard Hotjar
        snippet in a <code>CategoryScript</code> so it&apos;s never fetched — let alone executed —
        before consent exists. <code>categoryId</code> is your own authored category ID (see{' '}
        <a href="/docs/ui/advanced-profiles/#category-type">Category type</a>) —{' '}
        <code>&apos;analytics&apos;</code> below is the common convention:
      </p>

      <CodeBlock
        lang="typescript"
        filename="hotjar.ts"
        code={`import { CategoryScript } from '@consenti/ui'

new CategoryScript({
  categoryId: 'analytics',
  widget,
  unsafeInnerHTML: \`
    (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
  \`,
  onLoad: () => console.log('Hotjar loaded'),
  onRevoke: () => console.log('Hotjar script removed'),
})`}
      />

      <Callout type="warning">
        <code>CategoryScript</code> removes the <code>&lt;script&gt;</code> tag on revoke, but
        Hotjar&apos;s recorder — once started — keeps running for the rest of that page view
        regardless of the tag&apos;s presence in the DOM. Gate-on-consent (never start pre-consent)
        is reliable; gate-then-revoke mid-session only stops the <em>next</em> page load from
        starting Hotjar again, not the recording already in progress.
      </Callout>

      <h2>Alternative: gate a single named cookie</h2>
      <p>
        If Hotjar is one of several tools sharing the same analytics category and you want it to
        have its own opt-out granularity, define a dedicated cookie parameter for it in your
        profile (with <code>purpose: &apos;analytics&apos;</code>) and gate on that specific cookie
        ID instead of the whole category — the write-side counterpart to option 3 above:
      </p>

      <CodeBlock
        lang="typescript"
        code={`import { ConsentScript } from '@consenti/ui'

new ConsentScript({
  cookieId: 'hotjar', // matches the cookie ID you defined in the profile
  widget,
  unsafeInnerHTML: \`/* same Hotjar snippet as above */\`,
})`}
      />

      <h2>Verifying</h2>
      <ol>
        <li>
          Before consenting, check Network tab — no request to{' '}
          <code>static.hotjar.com</code> should fire.
        </li>
        <li>Accept analytics consent on the Consenti banner.</li>
        <li>
          Confirm the Hotjar script now loads, then check the Hotjar dashboard&apos;s{' '}
          <strong>Recordings</strong> tab — new sessions typically appear within a few minutes.
        </li>
        <li>
          Hotjar also exposes a small debug badge via <code>window.hj</code> — run{' '}
          <code>typeof window.hj</code> in the console; it should be <code>&apos;undefined&apos;</code>{' '}
          pre-consent and <code>&apos;function&apos;</code> after.
        </li>
      </ol>

      <RelatedDocs
        items={[
          {
            href: '/guides/frontend/clarity/',
            label: 'Microsoft Clarity',
            desc: 'The same script-gating pattern applied to a tool with its own consent API',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'The full getConsent(type) reference — purpose, category, and every vendor format',
          },
          {
            href: '/docs/ui/advanced-profiles/',
            label: 'Advanced Profiles',
            desc: 'The parameter (purpose) vs. category data model, in full',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Why isn’t there a dedicated Hotjar consent format like there is for Adobe or Meta?',
            answer: (
              <p className="m-0">
                Adobe, Meta, Microsoft Clarity, and Segment each expose a runtime API that expects
                consent expressed in a specific shape — Adobe&apos;s alloy <code>setConsent</code>,
                Meta&apos;s <code>fbq(&apos;consent&apos;, …)</code>, Clarity&apos;s{' '}
                <code>clarity(&apos;consent&apos;, …)</code>, and so on — so Consenti ships a
                pre-shaped output for each. Hotjar (and most other analytics/session-replay tools)
                has no equivalent API; the only lever is whether its script has loaded at all, which{' '}
                <code>getConsent(&apos;purpose&apos;)</code>/<code>getConsent(&apos;category&apos;)</code>{' '}
                plus <code>CategoryScript</code> already cover without needing a dedicated format.
              </p>
            ),
          },
          {
            question: 'Which of the three getConsent() options should I default to?',
            answer: (
              <p className="m-0">
                <code>getConsent(&apos;purpose&apos;)</code> for most setups — it&apos;s the
                simplest and matches how these tools are usually tagged (
                <code>purpose: &apos;analytics&apos;</code>). Reach for{' '}
                <code>getConsent(&apos;category&apos;)</code> only when you specifically need to
                match what the visitor saw on a particular preference-modal toggle, and a dedicated
                cookie ID only when the tool needs its own independent opt-out separate from
                everything else in its category.
              </p>
            ),
          },
          {
            question: 'Can I use Hotjar’s Suppress Attributes feature instead of script-gating?',
            answer: (
              <p className="m-0">
                Hotjar&apos;s <code>data-hj-suppress</code> attributes redact specific page content
                from recordings and heatmaps — a content-level privacy control, not a consent gate.
                It doesn&apos;t stop the script from loading or recording; use it alongside
                script-gating (e.g. to mask a payment form) rather than as a substitute for it.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
