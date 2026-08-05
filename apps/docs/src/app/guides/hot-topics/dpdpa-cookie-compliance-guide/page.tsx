import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'DPDPA Cookie Compliance Guide — Consenti',
  description:
    'A practical, step-by-step guide to DPDPA cookie consent for India — what an opt-in banner needs, what an age gate needs, and how a consent record should look.',
  keywords: [
    'DPDPA cookie consent',
    'DPDPA compliance guide',
    'India cookie banner',
    'Digital Personal Data Protection Act',
  ],
  alternates: { canonical: '/guides/hot-topics/dpdpa-cookie-compliance-guide' },
  openGraph: {
    title: 'DPDPA Cookie Compliance Guide — Consenti',
    description:
      'A practical, step-by-step guide to DPDPA cookie consent for India — banner, age gate, and consent record requirements.',
    url: 'https://consenti.dev/guides/hot-topics/dpdpa-cookie-compliance-guide',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPDPA Cookie Compliance Guide — Consenti',
    description:
      'A practical, step-by-step guide to DPDPA cookie consent for India — banner, age gate, and consent record requirements.',
    images: ['/og-image.jpg'],
  },
}

export default function DpdpaCookieComplianceGuidePage() {
  return (
    <div className="prose max-w-none">
      <h1>DPDPA Cookie Compliance Guide</h1>
      <p className="lead">
        India&apos;s Digital Personal Data Protection Act (DPDPA), 2023 requires opt-in consent
        before non-essential cookies run for Indian visitors — but it also asks for a few things
        GDPR banners typically skip, as covered in{' '}
        <Link href="/guides/hot-topics/gdpr-vs-dpdpa/">GDPR vs DPDPA</Link>. This is the
        implementation checklist, not the statute text.
      </p>

      <h2>What a DPDPA-compliant cookie banner needs</h2>
      <ol>
        <li>
          <strong>Opt-in by default.</strong> Every non-essential cookie category starts denied.
          No pre-checked boxes, no &ldquo;continuing to browse implies consent&rdquo;.
        </li>
        <li>
          <strong>Data Fiduciary name, in the notice.</strong> DPDPA expects the entity collecting
          data to identify itself directly in the consent notice, not just buried in a privacy
          policy link.
        </li>
        <li>
          <strong>Grievance officer contact.</strong> A name or contact channel for complaints,
          shown alongside or one click from the notice.
        </li>
        <li>
          <strong>An age gate at 18, not 16.</strong> DPDPA&apos;s parental-consent threshold is
          higher than most GDPR-adjacent laws — a banner tuned for Europe will often use the wrong
          cutoff for India.
        </li>
        <li>
          <strong>No reliance on GPC.</strong> DPDPA doesn&apos;t reference Global Privacy Control,
          so a banner can&apos;t treat the browser signal as consent or as an opt-out for Indian
          traffic the way it might for CCPA states.
        </li>
        <li>
          <strong>A durable consent record.</strong> Timestamp, what was agreed to, and the ability
          to withdraw just as easily as it was given.
        </li>
      </ol>

      <Callout type="warning">
        A common mistake: reusing a single global &ldquo;16+&rdquo; age gate for every jurisdiction.
        For India-mapped traffic, that under-complies with DPDPA&apos;s 18+ threshold.
      </Callout>

      <h2>Example — an opt-in-dpdpa profile</h2>
      <p>
        Rather than writing this notice logic from scratch, you can route India-mapped traffic to
        a dedicated compliance profile. Here&apos;s what that looks like configured through
        Consenti, an open-source consent widget with a built-in <code>opt-in-dpdpa</code> profile —
        shown as one concrete implementation, not the only way to do this:
      </p>
      <CodeBlock
        lang="typescript"
        filename="consent.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'opt-in-dpdpa' }, // fiduciary name + grievance officer + 18+ age gate
  utils: {
    geo: { autoDetect: true }, // route India traffic here automatically
  },
})`}
      />
      <p>
        The <code>opt-in-dpdpa</code> group ships with the fiduciary-name and grievance-officer
        fields as first-class config, sets the age gate to 18, and ignores GPC by design — so the
        notice matches the statute without extra copywriting per deployment.
      </p>

      <h2>Recording the consent decision</h2>
      <p>
        Whatever banner you use, the record you keep should answer: what was shown, what was
        chosen, when, and by which policy version. If you&apos;re also running a backend, an
        append-only audit log (never edited or deleted) is the safest way to keep that
        trail defensible.
      </p>
      <CodeBlock
        lang="typescript"
        filename="server.ts"
        code={`import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  storage: { driver: 'sqlite' }, // or postgres/mysql/mongo at scale
  compliance: { type: 'opt-in-dpdpa' },
})
// every decision is written to an append-only audit_logs table`}
      />

      <RelatedDocs
        items={[
          {
            href: '/docs/compliance/dpdpa/',
            label: 'DPDPA Compliance Guide',
            desc: 'Full legal reference — official Act links, enforcement body, statute details',
          },
          {
            href: '/guides/hot-topics/gdpr-vs-dpdpa/',
            label: 'GDPR vs DPDPA',
            desc: 'Side-by-side comparison if you also serve EU traffic',
          },
          {
            href: '/guides/backend/geo-routing/',
            label: 'Geo-Routing & Auto-Detection',
            desc: 'How to route visitors to the right compliance profile automatically',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Does DPDPA apply to a site with no Indian office?',
            answer: (
              <p className="m-0">
                DPDPA&apos;s scope covers processing of personal data of individuals in India,
                regardless of where the processing entity is based, with some carve-outs for
                purely offshore processing under contract. If you have Indian visitors or users,
                it&apos;s worth treating it as in-scope rather than assuming a foreign-registration
                exemption.
              </p>
            ),
          },
          {
            question: 'Is a cookie banner alone enough for DPDPA compliance?',
            answer: (
              <p className="m-0">
                A compliant banner covers the consent-collection half of DPDPA. The Act also
                covers broader obligations — breach notification, data minimisation, grievance
                redressal processes — that sit outside what any banner widget can handle alone.
                Treat this guide as the cookie-consent slice, not full DPDPA compliance.
              </p>
            ),
          },
          {
            question: 'What age threshold should the age gate use?',
            answer: (
              <p className="m-0">
                18. That&apos;s higher than the 13–16 range common under GDPR-adjacent laws, so
                don&apos;t reuse a European age-gate config for India-routed traffic.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
