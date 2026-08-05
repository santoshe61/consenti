import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Google Consent Mode v2 Explained — Consenti',
  description:
    'What Google Consent Mode v2 is, why it became mandatory for advertisers in the EEA, and how a cookie banner talks to it — with basic vs. advanced mode explained plainly.',
  keywords: [
    'Google Consent Mode v2',
    'Google Consent Mode v2 library',
    'consent mode basic vs advanced',
    'gtag consent api',
    'open source CMP',
  ],
  alternates: { canonical: '/guides/hot-topics/google-consent-mode-v2-explained' },
  openGraph: {
    title: 'Google Consent Mode v2 Explained — Consenti',
    description:
      'What Google Consent Mode v2 is, why it became mandatory for advertisers in the EEA, and how a cookie banner talks to it.',
    url: 'https://consenti.dev/guides/hot-topics/google-consent-mode-v2-explained',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Google Consent Mode v2 Explained — Consenti',
    description:
      'What Google Consent Mode v2 is, why it became mandatory for advertisers in the EEA, and how a cookie banner talks to it.',
    images: ['/og-image.jpg'],
  },
}

export default function GoogleConsentModeV2ExplainedPage() {
  return (
    <div className="prose max-w-none">
      <h1>Google Consent Mode v2 Explained</h1>
      <p className="lead">
        Google Consent Mode v2 is the API Google Tags use to ask one question before they do
        anything: <em>did this visitor agree to be tracked?</em> It doesn&apos;t collect consent
        itself — that&apos;s the job of a cookie banner or consent management platform (CMP). It
        just gives Google&apos;s tags a standard way to receive the answer and change their
        behaviour accordingly.
      </p>

      <h2>Why it exists</h2>
      <p>
        Before Consent Mode, a tag either fired or it didn&apos;t. If a visitor declined analytics
        cookies, the only correct move was to block Google Analytics entirely — which meant losing
        all visibility into that visitor&apos;s session, including anonymous, aggregate numbers you
        were legally allowed to keep. Consent Mode fixes this by letting tags run in a{' '}
        <strong>cookieless, modelled mode</strong> instead of an all-or-nothing one.
      </p>
      <p>
        From <strong>March 2024</strong>, Google made Consent Mode a requirement for advertisers
        using Google Ads or Analytics remarketing/conversion features for EEA traffic. Sites that
        don&apos;t implement it can lose access to features like audience remarketing and
        conversion modelling for European visitors.
      </p>

      <h2>The seven consent signals</h2>
      <p>
        Consent Mode v2 works off seven named signals, each set to <code>granted</code> or{' '}
        <code>denied</code>. A cookie banner is responsible for deciding the value of each; Google
        tags just read them.
      </p>
      <table>
        <thead>
          <tr>
            <th>Signal</th>
            <th>Controls</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>ad_storage</code>
            </td>
            <td>Cookies used for ad targeting/remarketing</td>
          </tr>
          <tr>
            <td>
              <code>ad_user_data</code>
            </td>
            <td>Sending user data to Google for advertising purposes (v2 addition)</td>
          </tr>
          <tr>
            <td>
              <code>ad_personalization</code>
            </td>
            <td>Personalised advertising, remarketing lists (v2 addition)</td>
          </tr>
          <tr>
            <td>
              <code>analytics_storage</code>
            </td>
            <td>Google Analytics cookies</td>
          </tr>
          <tr>
            <td>
              <code>functionality_storage</code>
            </td>
            <td>Cookies that remember choices like language</td>
          </tr>
          <tr>
            <td>
              <code>personalization_storage</code>
            </td>
            <td>Personalisation features outside advertising</td>
          </tr>
          <tr>
            <td>
              <code>security_storage</code>
            </td>
            <td>Cookies used for fraud prevention, authentication</td>
          </tr>
        </tbody>
      </table>
      <p>
        The two <code>ad_user_data</code> / <code>ad_personalization</code> signals are what
        actually make it <em>v2</em> — v1 only had <code>ad_storage</code> and{' '}
        <code>analytics_storage</code>.
      </p>

      <h2>Basic mode vs. advanced mode</h2>
      <p>
        This is the part most write-ups skip. There are two ways to implement Consent Mode, and
        they behave very differently before a visitor makes a choice:
      </p>
      <ul>
        <li>
          <strong>Basic Consent Mode</strong> — Google tags don&apos;t load <em>at all</em> until
          the visitor interacts with the banner. Simple, but you get zero data — not even
          cookieless pings — for visitors who never respond.
        </li>
        <li>
          <strong>Advanced Consent Mode</strong> — tags load immediately with every signal defaulted
          to <code>denied</code>, firing cookieless, anonymised pings. Once the visitor responds,
          Google fires a <code>consent update</code> and the tag switches behaviour live, without a
          page reload. This is what almost every production site should use, because it&apos;s the
          only mode that lets Google build modelled conversions for visitors who decline.
        </li>
      </ul>
      <Callout type="info">
        The default-then-update pattern is the whole mechanism: call{' '}
        <code>gtag(&apos;consent&apos;, &apos;default&apos;, ...)</code> before any tag fires, then{' '}
        <code>gtag(&apos;consent&apos;, &apos;update&apos;, ...)</code> once the visitor decides. A
        CMP&apos;s job is to make sure that ordering never breaks — the default call has to happen
        first, every time, on every page.
      </Callout>

      <h3>Closing the gap for GPC-flagged visitors</h3>
      <p>
        Consenti&apos;s own <code>default</code> push happens during async init, after it resolves
        the visitor&apos;s profile — which is normally fast enough not to matter, but it does leave
        a small window before the freeze applies. For a visitor sending{' '}
        <code>navigator.globalPrivacyControl</code>, that gap is exactly the moment a tag could fire
        before consent is denied. <code>buildSyncGpcSnippet()</code> closes it: a tiny,
        dependency-free <code>&lt;script&gt;</code> you place first in <code>&lt;head&gt;</code>,
        ahead of GTM/gtag.js and the Consenti bundle, that checks GPC synchronously and pushes the
        same denied-by-default signals immediately if it&apos;s set.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { buildSyncGpcSnippet } from '@consenti/ui'

// Server-side (e.g. a Next.js layout, or any template that renders <head>):
buildSyncGpcSnippet() // default dataLayer name`}
      />
      <p>
        See{' '}
        <Link href="/docs/ui/advanced-configuration/">Advanced Configuration</Link> for the full
        snippet output, the custom-<code>dataLayerName</code> option, and exact placement in{' '}
        <code>&lt;head&gt;</code>.
      </p>

      <h2>What a CMP actually has to do</h2>
      <p>
        Consent Mode itself is just an API — it doesn&apos;t ship a banner, doesn&apos;t store a
        decision across page loads, and doesn&apos;t know anything about GDPR, CCPA, or any other
        law. Wiring it correctly means:
      </p>
      <ol>
        <li>Setting all seven signals to <code>denied</code> before the GTM/gtag snippet loads.</li>
        <li>Persisting the visitor&apos;s decision (cookie or storage) so it survives navigation.</li>
        <li>
          Re-mapping banner categories (e.g. &ldquo;Marketing&rdquo;, &ldquo;Analytics&rdquo;) onto
          the seven Google-specific signal names.
        </li>
        <li>Calling <code>update</code> the moment a decision is made or changed — including revocation.</li>
      </ol>
      <p>
        This is exactly the kind of plumbing an{' '}
        <Link href="/">open source CMT (Consent management tool) </Link> like Consenti is built to own, so you don&apos;t have
        to hand-roll the <code>gtag</code> stub queue and signal mapping yourself. Consenti pushes{' '}
        <code>default</code> on initialisation and <code>update</code> on every consent change
        automatically, and exposes <code>widget.getGTMConsent()</code> if you want to read the
        current signal state directly.
      </p>

      <CodeBlock
        lang="typescript"
        filename="consent.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'opt-in' },
  utils: {
    gtm: { containerId: 'GTM-XXXXXX' }, // Consenti handles default + update calls
  },
})`}
      />

      <p>
        For the full configuration options — container ID, URL passthrough, ads data redaction —
        see the dedicated{' '}
        <Link href="/guides/frontend/gtm/">GTM & Google Consent Mode v2 guide</Link>. If
        you&apos;re specifically wiring this up inside the Google Tag Manager console rather than
        via a JS library, the{' '}
        <Link href="/guides/hot-topics/google-consent-mode-for-gtm/">
          Google Consent Mode for GTM
        </Link>{' '}
        guide covers that workflow.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/guides/frontend/gtm/',
            label: 'GTM & Google Consent Mode v2',
            desc: 'Full Consenti setup guide — config, dataLayer output, verification steps',
          },
          {
            href: '/guides/hot-topics/google-consent-mode-for-gtm/',
            label: 'Google Consent Mode for GTM',
            desc: 'Configuring tags and triggers inside the GTM console',
          },
          {
            href: '/docs/ui/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'Full utils.gtm option reference',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Is Google Consent Mode v2 mandatory outside the EEA?',
            answer: (
              <p className="m-0">
                Google&apos;s enforcement is currently scoped to EEA traffic for Ads and Analytics
                remarketing/conversion features. Many teams implement it globally anyway, since
                the signal-based approach also works cleanly for CCPA/CPRA opt-out states and
                doesn&apos;t hurt on traffic where it isn&apos;t strictly required.
              </p>
            ),
          },
          {
            question: 'Does Consent Mode replace a cookie banner?',
            answer: (
              <p className="m-0">
                No. Consent Mode has no UI and no storage of its own — it only reacts to signals a
                banner (or CMP) sends it. You still need a banner to collect the decision in the
                first place; Consent Mode is the wire between that decision and Google&apos;s tags.
              </p>
            ),
          },
          {
            question: 'What happens if I only implement basic mode?',
            answer: (
              <p className="m-0">
                Tags simply don&apos;t load until the visitor responds to the banner. That&apos;s
                compliant, but you lose the cookieless pings advanced mode sends before a decision
                is made — which Google uses to model conversions for non-consenting traffic. Most
                sites that care about ad performance choose advanced mode.
              </p>
            ),
          },
          {
            question: 'Can I implement Consent Mode v2 without a full CMP?',
            answer: (
              <p className="m-0">
                Yes — you can call <code>gtag(&apos;consent&apos;, ...)</code> directly from your
                own banner code. The trade-off is you own the default/update ordering, the signal
                mapping, and persistence yourself. A library purpose-built for this — Consenti or
                otherwise — mainly saves you from re-solving that plumbing on every project.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
