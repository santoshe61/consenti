import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

export const metadata: Metadata = {
  title: 'POPIA Compliance Guide (South Africa)',
  description:
    "POPIA compliance guide for Consenti — South Africa's data protection law enforced by the Information Regulator.",
  alternates: { canonical: '/docs/compliance/popia' },
  openGraph: {
    title: 'POPIA Compliance Guide (South Africa)',
    description:
      "POPIA compliance guide for Consenti — South Africa's data protection law enforced by the Information Regulator.",
    url: 'https://consenti.dev/docs/compliance/popia',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POPIA Compliance Guide (South Africa)',
    description:
      "POPIA compliance guide for Consenti — South Africa's data protection law enforced by the Information Regulator.",
    images: ['/og-image.jpg'],
  },
}

export default function POPIAPage() {
  return (
    <div className="prose max-w-none">
      <h1>POPIA Compliance Guide</h1>
      <ComplianceTierBadge tier="supported" />
      <Callout type="info">
        <strong>Compliance group:</strong> South Africa auto-resolves to{' '}
        <code>general-privacy-consent</code> by default. For stronger alignment with POPIA — the
        same opt-in model as GDPR — configure{' '}
        <code>compliance: {"{ type: 'opt-in' }"}</code> explicitly in your{' '}
        <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        South Africa's <strong>Protection of Personal Information Act (POPIA)</strong> — Act 4 of
        2013 — came into full force on 1 July 2021. It is enforced by the{' '}
        <strong>Information Regulator of South Africa</strong> and establishes eight conditions for
        lawful processing of personal information. POPIA is structurally similar to the EU GDPR and
        Consenti supports it via <code>regulation: 'popia'</code>.
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a
            href="https://www.gov.za/documents/protection-personal-information-act"
            target="_blank"
            rel="noopener noreferrer"
          >
            POPIA — Government Gazette No. 37067 (full text)
          </a>
        </li>
        <li>
          <a href="https://inforegulator.org.za/" target="_blank" rel="noopener noreferrer">
            Information Regulator of South Africa
          </a>
        </li>
      </ul>

      <h2>The eight processing conditions</h2>
      <table>
        <thead>
          <tr>
            <th>Condition</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Accountability</td>
            <td>Responsible party must ensure POPIA compliance</td>
          </tr>
          <tr>
            <td>2. Processing limitation</td>
            <td>Lawful, minimal, and with consent or another ground</td>
          </tr>
          <tr>
            <td>3. Purpose specification</td>
            <td>Specific, explicitly defined purpose required</td>
          </tr>
          <tr>
            <td>4. Further processing limitation</td>
            <td>Further use must be compatible with original purpose</td>
          </tr>
          <tr>
            <td>5. Information quality</td>
            <td>Data must be complete, accurate, not misleading</td>
          </tr>
          <tr>
            <td>6. Openness</td>
            <td>Data subject must be informed of processing</td>
          </tr>
          <tr>
            <td>7. Security safeguards</td>
            <td>Reasonable technical and organisational measures required</td>
          </tr>
          <tr>
            <td>8. Data subject participation</td>
            <td>Rights of access, correction, and deletion</td>
          </tr>
        </tbody>
      </table>

      <h2>Key requirements for consent</h2>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compliance Group</td>
            <td>Opt-in — voluntary, specific, informed, unambiguous</td>
          </tr>
          <tr>
            <td>Special information</td>
            <td>
              Explicit consent required (health, religious belief, racial origin, sex life, criminal
              history, biometrics)
            </td>
          </tr>
          <tr>
            <td>Children</td>
            <td>Under-18 requires parental/guardian consent (Section 35)</td>
          </tr>
          <tr>
            <td>Withdrawal</td>
            <td>Must be possible at any time; processing must cease on withdrawal</td>
          </tr>
          <tr>
            <td>Information Officer</td>
            <td>Must designate an Information Officer registered with the Regulator</td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>Information Regulator of South Africa</td>
          </tr>
        </tbody>
      </table>

      <h2>POPIA vs. GDPR</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>GDPR</th>
            <th>POPIA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Opt-in required</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>Lawful bases</td>
            <td>6</td>
            <td>8 Conditions (broader framing)</td>
          </tr>
          <tr>
            <td>Minor threshold</td>
            <td>16 (Member States may lower)</td>
            <td>18</td>
          </tr>
          <tr>
            <td>DPO equivalent</td>
            <td>Data Protection Officer</td>
            <td>Information Officer (must register)</td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>National DPAs / EDPB</td>
            <td>Information Regulator</td>
          </tr>
          <tr>
            <td>GPC</td>
            <td>Optional</td>
            <td>Not recognised</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling POPIA mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'general-privacy-consent' },
})`}
      />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "popia"
}`}
      />

      <Callout type="info">
        POPIA Section 18 requires you to notify data subjects of who your Information Officer is.
        Unlike DPDPA (which has a dedicated <code>dpdpa</code> profile block rendered
        automatically), POPIA has no dedicated metadata field yet — add your Information
        Officer's contact directly in <code>preferenceModal.htmlText</code> via{' '}
        <code>profileOverride</code> or the dashboard's text editor.
      </Callout>

      <h2>What Consenti does — and what it doesn&apos;t</h2>
      <p>
        Everything above is the consent-collection UX layer: opt-in capture, per-category records,
        withdrawal, and erasure. POPIA is a broader accountability framework than a consent widget
        can satisfy on its own. Consenti does <strong>not</strong>:
      </p>
      <ul>
        <li>
          Register you as a Responsible Party or appoint an Information Officer with the Regulator
          (Sections 55–56) — that&apos;s an administrative filing you complete outside the product
        </li>
        <li>
          File a Prior Authorisation application with the Regulator for processing that requires
          one (e.g. certain criminal-behaviour or credit-related data under Section 57), if your
          processing falls into that category
        </li>
        <li>
          Guarantee data residency — self-hosting <code>@consenti/api</code> means you control
          where it runs, not that it runs in South Africa
        </li>
        <li>
          Satisfy the eight processing conditions as a whole — Consenti&apos;s widget covers
          condition 2 (processing limitation via consent) and part of condition 6 (openness, via
          disclosure text); the remaining six are organisational obligations
        </li>
      </ul>

      <h2>Operator checklist</h2>
      <p>Beyond configuring Consenti&apos;s consent groups, a POPIA-exposed operator still needs to:</p>
      <ol>
        <li>Register/designate an Information Officer with the Information Regulator and publish their contact details (Section 55) — add that contact to <code>preferenceModal.htmlText</code> per the callout above</li>
        <li>File a Prior Authorisation application before processing any category that requires one, if applicable to your data</li>
        <li>Decide whether <code>@consenti/api</code> needs to be hosted inside South Africa for data-residency purposes, and provision that separately if so</li>
        <li>Keep the remaining seven processing conditions (accountability, purpose specification, further-processing limitation, information quality, security safeguards, data-subject participation) satisfied at the organisational level — Consenti&apos;s widget doesn&apos;t audit these</li>
      </ol>

      <h2>Erasure and access (Section 24)</h2>
      <CodeBlock
        lang="http"
        code={`GET    /consenti/api/v1/consent/:visitorId
DELETE /consenti/api/v1/consent/:visitorId`}
      />
      <p>
        For the widget-side &quot;Forget me&quot; button and the events both sides fire, see the{' '}
        <Link href="/guides/hot-topics/right-to-erasure/">Right to Erasure guide</Link>.
      </p>
    </div>
  )
}
