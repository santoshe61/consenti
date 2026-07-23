import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

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
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — same opt-in model as GDPR. Use{' '}
        <code>compliance: {"{ type: 'opt-in' }"}</code> in your <code>ConsentiSetup</code> config.
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
            <td>Consent model</td>
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
  core: {
    regulation: 'popia',
  },
})`}
      />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "popia",
  "popia": {
    "informationOfficerEmail": "io@yourcompany.co.za",
    "purposeDescription": "To operate the website and send service emails."
  }
}`}
      />

      <Callout type="info">
        POPIA Section 18 requires you to notify data subjects of who your Information Officer is.
        Setting <code>popia.informationOfficerEmail</code> renders this contact in the modal notice
        footer automatically.
      </Callout>

      <h2>Erasure and access (Section 24)</h2>
      <CodeBlock
        lang="http"
        code={`GET    /consenti/api/v1/consent/:visitorId
DELETE /consenti/api/v1/consent/:visitorId`}
      />
    </div>
  )
}
