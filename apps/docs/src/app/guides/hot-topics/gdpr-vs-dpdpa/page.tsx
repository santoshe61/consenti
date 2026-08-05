import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'GDPR vs DPDPA — Consenti',
  description:
    'GDPR (EU) and DPDPA (India) are both opt-in cookie consent laws, but they disagree on legitimate interest, age gates, and enforcement. A plain-English side-by-side.',
  keywords: [
    'GDPR vs DPDPA',
    'DPDPA cookie consent',
    'GDPR cookie banner React',
    'opt-in consent India',
  ],
  alternates: { canonical: '/guides/hot-topics/gdpr-vs-dpdpa' },
  openGraph: {
    title: 'GDPR vs DPDPA — Consenti',
    description:
      'GDPR (EU) and DPDPA (India) are both opt-in cookie consent laws, but they disagree on legitimate interest, age gates, and enforcement.',
    url: 'https://consenti.dev/guides/hot-topics/gdpr-vs-dpdpa',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GDPR vs DPDPA — Consenti',
    description:
      'GDPR (EU) and DPDPA (India) are both opt-in cookie consent laws, but they disagree on legitimate interest, age gates, and enforcement.',
    images: ['/og-image.jpg'],
  },
}

export default function GdprVsDpdpaPage() {
  return (
    <div className="prose max-w-none">
      <h1>GDPR vs DPDPA</h1>
      <p className="lead">
        GDPR (EU) and DPDPA (India, 2023) are often lumped together because both require opt-in
        consent before non-essential cookies run. That similarity hides some real differences in
        what a banner and backend actually have to do. Here&apos;s the practical, non-legal-jargon
        version — see the <Link href="/guides/hot-topics/dpdpa-cookie-compliance-guide/">DPDPA Cookie Compliance Guide</Link> for the India-specific implementation checklist.
      </p>

      <h2>Where they agree</h2>
      <ul>
        <li>Non-essential cookies (analytics, ads, personalisation) require opt-in consent — no pre-ticked boxes, no implied consent from browsing.</li>
        <li>Consent has to be as easy to withdraw as it was to give.</li>
        <li>You need a record of what was consented to and when.</li>
        <li>Strictly necessary cookies (session, security, load balancing) don&apos;t need consent under either law.</li>
      </ul>

      <h2>Where they differ</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>GDPR (EU / EEA)</th>
            <th>DPDPA (India)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Legal basis beyond consent</td>
            <td>&ldquo;Legitimate interest&rdquo; can justify some processing without consent</td>
            <td>No legitimate-interest equivalent — consent is close to the only basis for non-essential cookies</td>
          </tr>
          <tr>
            <td>Who has to name themselves</td>
            <td>Data controller identified in the privacy policy</td>
            <td>The &ldquo;Data Fiduciary&rdquo; name is expected inside the consent notice itself</td>
          </tr>
          <tr>
            <td>Complaint contact</td>
            <td>DPO contact, varies by controller size</td>
            <td>Grievance officer details commonly shown alongside the consent notice</td>
          </tr>
          <tr>
            <td>Children</td>
            <td>Parental consent threshold varies 13–16 by member state</td>
            <td>Verifiable parental consent required under 18</td>
          </tr>
          <tr>
            <td>Global Privacy Control (GPC)</td>
            <td>Increasingly treated as a valid opt-out/objection signal by regulators and browsers</td>
            <td>No GPC recognition in the statute — signal is not honoured</td>
          </tr>
          <tr>
            <td>Regulator</td>
            <td>National DPAs (e.g. CNIL, ICO-equivalent bodies) under the EU umbrella</td>
            <td>Data Protection Board of India</td>
          </tr>
          <tr>
            <td>Individual rights</td>
            <td>Access, erasure, portability, objection, restriction — all explicit</td>
            <td>Access, correction, erasure, grievance redressal, nomination (post-death) rights</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        The age threshold is the one that trips people up most: DPDPA sets 18, not the 13–16 range
        most GDPR-adjacent laws use. A single &ldquo;are you over 16?&rdquo; age gate reused globally
        will under-comply for Indian traffic.
      </Callout>

      <h2>What this means for a banner and backend</h2>
      <p>
        In practice, a single generic &ldquo;GDPR banner&rdquo; reused worldwide tends to under-serve
        DPDPA visitors in two specific ways: it won&apos;t surface fiduciary/grievance-officer
        details in the notice, and it may apply the wrong age-gate threshold. The cleanest fix is
        treating GDPR and DPDPA as two distinct consent profiles rather than one, and routing
        visitors to the right one by jurisdiction.
      </p>
      <p>
        Consenti models this directly as two separate compliance groups —{' '}
        <code>opt-in</code> for GDPR-style jurisdictions and <code>opt-in-dpdpa</code> for India —
        each with its own copy, age gate, and GPC behaviour, auto-resolved from the visitor&apos;s
        location. It&apos;s one implementation option if you&apos;d rather not maintain that mapping
        by hand.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/docs/compliance/gdpr/',
            label: 'GDPR Compliance Guide',
            desc: 'Full legal-basis breakdown, erasure, and audit log details',
          },
          {
            href: '/docs/compliance/dpdpa/',
            label: 'DPDPA Compliance Guide',
            desc: 'Fiduciary disclosure, grievance officer, and age-gate specifics',
          },
          {
            href: '/guides/hot-topics/dpdpa-cookie-compliance-guide/',
            label: 'DPDPA Cookie Compliance Guide',
            desc: 'Practical, cookie-banner-focused walkthrough for India',
          },
          {
            href: '/docs/compliance/jurisdiction-coverage-map/',
            label: 'Jurisdiction Coverage Map',
            desc: 'Every country mapped to its compliance group',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Can I use the same cookie banner copy for GDPR and DPDPA?',
            answer: (
              <p className="m-0">
                You can reuse the same UI, but the copy inside it should differ — DPDPA notices
                commonly name the Data Fiduciary and grievance officer inline, which GDPR notices
                don&apos;t require. Most teams solve this with locale/profile-based content rather
                than one static banner.
              </p>
            ),
          },
          {
            question: 'Does GDPR consent transfer to DPDPA or vice versa?',
            answer: (
              <p className="m-0">
                No — they&apos;re independent statutes enforced by different bodies. A visitor who
                consented under a GDPR-style banner in the EU has given no consent recognised under
                DPDPA, and the reverse is also true. Each jurisdiction needs its own consent record.
              </p>
            ),
          },
          {
            question: 'Is GPC relevant for Indian users at all?',
            answer: (
              <p className="m-0">
                DPDPA doesn&apos;t reference GPC, so there&apos;s no statutory obligation to honour
                it for India-only traffic. Some multinational sites choose to honour it globally for
                consistency, but that&apos;s a policy choice, not a DPDPA requirement.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
