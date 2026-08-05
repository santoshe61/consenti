import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

export const metadata: Metadata = {
  title: 'APPI Compliance Guide (Japan)',
  description:
    'How to implement APPI (Act on the Protection of Personal Information) cookie consent in Japan with Consenti. Opt-in mode, audit logs, and geo-detection.',
  keywords: [
    'APPI',
    'APPI compliance',
    'Japan personal data protection',
    'cookie consent Japan',
    'Act on the Protection of Personal Information',
  ],
  alternates: { canonical: 'https://consenti.dev/docs/compliance/appi' },
  openGraph: {
    title: 'APPI Compliance Guide (Japan)',
    description:
      'How to implement APPI (Act on the Protection of Personal Information) cookie consent in Japan with Consenti. Opt-in mode, audit logs, and geo-detection.',
    url: 'https://consenti.dev/docs/compliance/appi',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APPI Compliance Guide (Japan)',
    description:
      'How to implement APPI (Act on the Protection of Personal Information) cookie consent in Japan with Consenti. Opt-in mode, audit logs, and geo-detection.',
    images: ['/og-image.jpg'],
  },
}

export default function APPIPage() {
  return (
    <div className="prose max-w-none">
      <h1>APPI Compliance Guide (Japan)</h1>
      <ComplianceTierBadge tier="supported" />
      <Callout type="info">
        <strong>Compliance group:</strong> Japan auto-resolves to{' '}
        <code>general-privacy-consent</code> by default, which applies APPI&apos;s own mixed
        model within it — opt-in for sensitive data and cross-border transfers, opt-out for
        general third-party sharing (see below). For blanket opt-in on everything instead — the
        same model as GDPR, no mixed treatment — configure{' '}
        <code>compliance: {"{ type: 'opt-in' }"}</code> explicitly in your{' '}
        <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Japan's <strong>Act on the Protection of Personal Information (APPI)</strong> was
        significantly revised in 2022 (enforced from April 2022) and is administered by the{' '}
        <strong>Personal Information Protection Commission (PPC)</strong>. Unlike GDPR, APPI uses a
        mixed model: opt-in for sensitive data and cross-border transfers to foreign companies
        without adequate protection, but opt-out is permitted for certain third-party sharing of
        general data. Consenti supports APPI via <code>regulation: 'appi'</code>.
      </p>

      <Callout type="warning">
        Consenti provides <strong>Partial</strong> coverage for APPI. The opt-in consent widget
        covers sensitive data and foreign transfer scenarios. The opt-out third-party sharing model
        (for general personal information under Art. 27) differs from a standard consent banner and
        requires additional implementation on your site.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.ppc.go.jp/en/legal/" target="_blank" rel="noopener noreferrer">
            PPC — Personal Information Protection Commission (English)
          </a>
        </li>
        <li>
          <a
            href="https://elaws.e-gov.go.jp/document?lawid=415AC0000000057"
            target="_blank"
            rel="noopener noreferrer"
          >
            APPI — e-Gov Law Database (Japanese)
          </a>
        </li>
      </ul>

      <h2>Compliance Group breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Required model</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Sensitive personal information (health, race, religion, criminal record, disability,
              etc.)
            </td>
            <td>Opt-in consent (Art. 20)</td>
          </tr>
          <tr>
            <td>Third-party transfer to foreign entity without adequate protection</td>
            <td>Opt-in consent (Art. 28)</td>
          </tr>
          <tr>
            <td>Third-party transfer of general personal information (domestic)</td>
            <td>Opt-out permitted — notify and allow objection (Art. 27)</td>
          </tr>
          <tr>
            <td>Analytics / functional cookies (non-sensitive)</td>
            <td>Consent recommended; legitimate interest available</td>
          </tr>
        </tbody>
      </table>

      <h2>Key requirements</h2>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Purpose notification</td>
            <td>
              Must notify data subjects of the purpose of use before or at the time of collection
            </td>
          </tr>
          <tr>
            <td>Sensitive data</td>
            <td>Explicit opt-in required (Art. 20)</td>
          </tr>
          <tr>
            <td>Third-party transfer</td>
            <td>Consent required unless within same enterprise group or an exception applies</td>
          </tr>
          <tr>
            <td>Overseas transfer</td>
            <td>
              Opt-in if destination country lacks adequate protection; provide information on
              protection level
            </td>
          </tr>
          <tr>
            <td>Access and correction</td>
            <td>Data subjects may request disclosure, correction, and deletion</td>
          </tr>
          <tr>
            <td>Records</td>
            <td>Controllers must maintain records of third-party provisions and receipts</td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>Personal Information Protection Commission (PPC)</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling APPI mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'general-privacy-consent' },
})`}
      />
      <p>
        In APPI mode, Consenti renders an opt-in banner for cookies classified as sensitive or
        involving overseas data transfer. Cookies without sensitive classification receive a
        lightweight notice with an opt-out link (the Art. 27 opt-out model).
      </p>

      <h3>Profile configuration</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "appi"
}`}
      />

      <Callout type="info">
        Unlike DPDPA (which has a dedicated <code>dpdpa</code> profile block rendered
        automatically), APPI has no dedicated metadata field yet. For vendors (analytics, ads,
        CDN) that store data outside Japan, put them in their own category with{' '}
        <code>legalBasis: 'consent'</code> so they're opt-in regardless of sensitivity
        classification, and disclose the overseas transfer directly in that category's{' '}
        <code>htmlText</code>.
      </Callout>

      <h2>What Consenti does — and what it doesn&apos;t</h2>
      <p>
        Everything above is the consent-collection UX layer: the mixed opt-in/opt-out model,
        per-category records, withdrawal, and erasure. APPI imposes recordkeeping and process
        obligations beyond what a consent widget can satisfy on its own. Consenti does{' '}
        <strong>not</strong>:
      </p>
      <ul>
        <li>
          Build or run the Art. 27 opt-out mechanism for domestic general-data third-party sharing
          — Consenti&apos;s banner models opt-in consent; the notify-and-allow-objection flow for
          non-sensitive domestic sharing needs separate implementation on your site (see the
          Partial-coverage callout above)
        </li>
        <li>
          Assess whether a destination country has &quot;adequate protection&quot; for an overseas
          transfer under Art. 28 — that&apos;s a legal determination, not something the widget
          verifies
        </li>
        <li>
          Maintain the Art. 25 records of third-party provisions and receipts APPI requires
          controllers to keep — that&apos;s an internal recordkeeping obligation separate from
          Consenti&apos;s consent-event audit log
        </li>
        <li>
          Handle breach notification to the PPC or affected individuals — that&apos;s a
          separate incident-response process
        </li>
      </ul>

      <h2>Operator checklist</h2>
      <p>Beyond configuring Consenti&apos;s <code>general-privacy-consent</code> profile, an operator with APPI exposure still needs to:</p>
      <ol>
        <li>Classify which vendors constitute a third-party transfer to a foreign entity, and put them in their own opt-in category per the disclosure guidance above — don&apos;t rely on the mixed-model default to catch every foreign vendor automatically</li>
        <li>Build the Art. 27 opt-out mechanism (notice + objection channel) for domestic general-data sharing separately from the consent banner</li>
        <li>Maintain Art. 25 records of third-party data provisions and receipts outside Consenti</li>
        <li>Have a breach-notification process ready for the PPC and affected individuals</li>
        <li>Keep overseas-transfer disclosures in each category&apos;s <code>htmlText</code> current as your actual vendor list changes</li>
      </ol>

      <h2>Erasure</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
      <p>
        For the widget-side &quot;Forget me&quot; button and the events both sides fire, see the{' '}
        <Link href="/guides/hot-topics/right-to-erasure/">Right to Erasure guide</Link>.
      </p>
    </div>
  )
}
