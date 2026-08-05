import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'CPRA Implementation Guide — Consenti',
  description:
    'A build-order checklist for CPRA: the Do Not Sell or Share link, GPC auto-honour, sensitive personal information opt-in, and opt-out consent records.',
  keywords: ['CPRA implementation guide', 'CPRA cookie banner', 'Do Not Sell or Share link', 'GPC opt-out'],
  alternates: { canonical: '/guides/hot-topics/cpra-implementation-guide' },
  openGraph: {
    title: 'CPRA Implementation Guide — Consenti',
    description:
      'A build-order checklist for CPRA: the Do Not Sell or Share link, GPC auto-honour, sensitive personal information opt-in, and opt-out records.',
    url: 'https://consenti.dev/guides/hot-topics/cpra-implementation-guide',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CPRA Implementation Guide — Consenti',
    description:
      'A build-order checklist for CPRA: the Do Not Sell or Share link, GPC auto-honour, sensitive personal information opt-in, and opt-out records.',
    images: ['/og-image.jpg'],
  },
}

export default function CpraImplementationGuidePage() {
  return (
    <div className="prose max-w-none">
      <h1>CPRA Implementation Guide</h1>
      <p className="lead">
        CPRA replaced CCPA in California on 1 January 2023, and it changed the shape of what a
        cookie banner needs to do — it&apos;s stricter about sensitive data and it made GPC
        (Global Privacy Control) a signal you can&apos;t ignore. Here&apos;s the implementation
        order, not the statute walkthrough. For the legal detail behind each requirement, see the{' '}
        <Link href="/docs/compliance/cpra/">CPRA Compliance Guide</Link>.
      </p>

      <h2>The build order</h2>
      <ol>
        <li>
          <strong>Default to opt-out, not opt-in.</strong> Unlike GDPR/DPDPA, CPRA doesn&apos;t
          require consent before cookies run — it requires an easy way to say no. Non-essential
          cookies can fire by default; the obligation is the opt-out mechanism, not gating on
          opt-in.
        </li>
        <li>
          <strong>Add the &ldquo;Do Not Sell or Share My Personal Information&rdquo; link.</strong>{' '}
          CPRA extended CCPA&apos;s &ldquo;sell&rdquo; language to explicitly cover
          &ldquo;share&rdquo; (mainly targeting cross-context behavioural advertising). The link
          text and destination both need updating if you&apos;re carrying over an old CCPA
          implementation. Consenti provides the button/action — placing it somewhere a visitor can
          actually find (a footer link or equivalent) is the site owner&apos;s job, not something
          Consenti auto-injects.
        </li>
        <li>
          <strong>Honour Global Privacy Control automatically.</strong> If a browser sends the GPC
          signal, that has to be treated as a valid opt-out request — for both &ldquo;sale&rdquo;
          and &ldquo;share&rdquo; — without the visitor clicking anything. <code>gpcMode</code> only
          takes effect once the widget itself has initialized; if a tag-loading script sits earlier
          in <code>&lt;head&gt;</code>, use <code>buildSyncGpcSnippet()</code> (from{' '}
          <code>@consenti/ui</code>) to freeze Google Consent Mode v2 to denied synchronously,
          ahead of everything else — see{' '}
          <a href="/docs/ui/advanced-configuration/#gpc">the GPC config reference</a> for the
          full snippet and <code>&lt;head&gt;</code> ordering.
        </li>
        <li>
          <strong>Gate sensitive personal information (SPI) behind opt-in.</strong> This is CPRA&apos;s
          biggest departure from plain CCPA: precise geolocation, biometric data, health data, and
          similar categories need a &ldquo;Limit the Use of My Sensitive Personal Information&rdquo;
          control, opt-in in spirit even though the base model is opt-out. Colorado&apos;s CPA has the
          same expectation for its own <code>opt-out</code> states — Consenti models that as a
          per-region <code>requiresSensitiveOptIn</code> carve-out rather than a separate compliance
          group; see <a href="/docs/compliance/ccpa/#colorados-sensitive-data-carve-out">the CCPA/CPRA
          guide</a> for how it's wired.
        </li>
        <li>
          <strong>Keep opt-out records with a lookback window.</strong> You need to be able to show
          what a visitor&apos;s choice was and when it was made, typically retained across a
          12-month cycle for right-to-know requests.
        </li>
      </ol>

      <Callout type="tip">
        Migrating from CCPA? The two things most implementations miss are the
        &ldquo;share&rdquo; wording update and the separate SPI opt-in control — both are CPRA
        additions that a CCPA-only banner won&apos;t have.
      </Callout>

      <h2>Example — CPRA-strict profile with GPC</h2>
      <CodeBlock
        lang="typescript"
        filename="consent.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'opt-out-strict' }, // CPRA: opt-out + SPI opt-in + Do Not Sell/Share link
  gpc: { mode: 'auto-honour' },            // GPC triggers Do Not Sell AND Do Not Share
})`}
      />
      <p>
        Consenti&apos;s <code>opt-out-strict</code> compliance group models CPRA specifically —
        distinct from the plainer CCPA <code>opt-out</code> group — with the SPI opt-in control
        and dual Do Not Sell/Share handling built in. It&apos;s one way to get this shipped without
        re-deriving the signal logic yourself.
      </p>

      <h2>Verifying it works</h2>
      <ol>
        <li>Load the site with GPC enabled (Brave, or a browser extension) and confirm sale/share cookies never fire.</li>
        <li>Click the Do Not Sell or Share link and confirm the choice persists across a reload.</li>
        <li>Trigger the SPI control separately and confirm it doesn&apos;t just mirror the general opt-out toggle.</li>
        <li>Check that a consent/opt-out record is written with a timestamp for each of the above.</li>
      </ol>

      <RelatedDocs
        items={[
          {
            href: '/docs/compliance/cpra/',
            label: 'CPRA Compliance Guide',
            desc: 'Full legal reference — CPPA enforcement, SPI categories, statute detail',
          },
          {
            href: '/docs/compliance/ccpa/',
            label: 'CCPA / US States',
            desc: 'The baseline opt-out model CPRA extends',
          },
          {
            href: '/guides/examples/multi-region-gdpr-ccpa/',
            label: 'Multi-Region Site — GDPR + CCPA Geo-Routing',
            desc: 'Serving both opt-in and opt-out models from one codebase',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Do I need separate opt-in consent for CPRA, like GDPR?',
            answer: (
              <p className="m-0">
                No — the base model stays opt-out. The one opt-in-shaped piece is the Sensitive
                Personal Information control, which needs an affirmative &ldquo;limit the use&rdquo;
                action rather than relying on the general opt-out default.
              </p>
            ),
          },
          {
            question: 'Is GPC legally binding under CPRA?',
            answer: (
              <p className="m-0">
                The California Privacy Protection Agency has taken the position that a GPC signal
                must be honoured as a valid opt-out request for sale and sharing. Treat it as
                mandatory to respect, not optional.
              </p>
            ),
          },
          {
            question: 'Does CPRA replace CCPA entirely?',
            answer: (
              <p className="m-0">
                CPRA amended and expanded CCPA rather than repealing it outright — CCPA&apos;s core
                opt-out rights are still the foundation, with CPRA layering in SPI protections, the
                &ldquo;share&rdquo; concept, and a dedicated regulator (CPPA) on top.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
