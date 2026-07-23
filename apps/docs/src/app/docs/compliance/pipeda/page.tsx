import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'PIPEDA / Law 25 Compliance Guide (Canada)',
  description:
    "PIPEDA and Quebec Law 25 compliance guide for Consenti — Canada's federal and provincial privacy frameworks.",
  alternates: { canonical: '/docs/compliance/pipeda' },
  openGraph: {
    title: 'PIPEDA / Law 25 Compliance Guide (Canada)',
    description:
      "PIPEDA and Quebec Law 25 compliance guide for Consenti — Canada's federal and provincial privacy frameworks.",
    url: 'https://consenti.dev/docs/compliance/pipeda',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PIPEDA / Law 25 Compliance Guide (Canada)',
    description:
      "PIPEDA and Quebec Law 25 compliance guide for Consenti — Canada's federal and provincial privacy frameworks.",
    images: ['/og-image.jpg'],
  },
}

export default function PIPEDAPage() {
  return (
    <div className="prose max-w-none">
      <h1>PIPEDA / Law 25 Compliance Guide</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — same opt-in model as GDPR. Use{' '}
        <code>compliance: {"{ type: 'opt-in' }"}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Canada has two overlapping privacy frameworks. The federal{' '}
        <strong>PIPEDA (Personal Information Protection and Electronic Documents Act)</strong>{' '}
        applies to private-sector organisations across Canada. Quebec's stricter{' '}
        <strong>Law 25 (Bill 64 / Act 25)</strong> — fully in force since September 2023 — is
        GDPR-aligned and supersedes PIPEDA for Quebec residents. Consenti's{' '}
        <code>regulation: 'pipeda'</code> mode implements the stricter Law 25 baseline, which also
        satisfies PIPEDA.
      </p>

      <Callout type="info">
        British Columbia (<strong>PIPA BC</strong>) and Alberta (<strong>PIPA AB</strong>) have
        their own substantially similar provincial laws that Consenti's PIPEDA mode also satisfies.
        If you primarily serve BC or AB, no additional configuration is required.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a
            href="https://laws-lois.justice.gc.ca/eng/acts/P-8.6/"
            target="_blank"
            rel="noopener noreferrer"
          >
            PIPEDA — full statute text (Justice Canada)
          </a>
        </li>
        <li>
          <a href="https://www.priv.gc.ca/en/" target="_blank" rel="noopener noreferrer">
            Office of the Privacy Commissioner of Canada (OPC)
          </a>
        </li>
        <li>
          <a href="https://www.cai.gouv.qc.ca/loi-25/" target="_blank" rel="noopener noreferrer">
            Commission d'accès à l'information du Québec — Law 25
          </a>
        </li>
      </ul>

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
            <td>Consent model</td>
            <td>
              Law 25: explicit opt-in for sensitive data; meaningful opt-in for all; PIPEDA: opt-in
              for sensitive, implied for others
            </td>
          </tr>
          <tr>
            <td>Purpose limitation</td>
            <td>Must collect only what is necessary for a stated purpose</td>
          </tr>
          <tr>
            <td>Privacy notice</td>
            <td>Law 25: must publish a privacy policy and disclose data use before collection</td>
          </tr>
          <tr>
            <td>Data minimisation</td>
            <td>No excessive collection; consent to each category individually</td>
          </tr>
          <tr>
            <td>Withdrawal</td>
            <td>Individuals may withdraw consent at any time with reasonable notice</td>
          </tr>
          <tr>
            <td>Minors</td>
            <td>Law 25: under-14 requires parental consent</td>
          </tr>
          <tr>
            <td>Privacy Officer</td>
            <td>Must designate a Privacy Officer (name must be public)</td>
          </tr>
          <tr>
            <td>Enforcer (federal)</td>
            <td>Office of the Privacy Commissioner of Canada (OPC)</td>
          </tr>
          <tr>
            <td>Enforcer (Quebec)</td>
            <td>Commission d'accès à l'information du Québec (CAI)</td>
          </tr>
        </tbody>
      </table>

      <h2>Law 25 vs. GDPR</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>GDPR</th>
            <th>Law 25 (Quebec)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Opt-in for all non-essential</td>
            <td>Yes</td>
            <td>Yes (since Sept 2023)</td>
          </tr>
          <tr>
            <td>Lawful bases beyond consent</td>
            <td>6</td>
            <td>Fewer — consent-first model</td>
          </tr>
          <tr>
            <td>Minor threshold</td>
            <td>16 (States may lower to 13)</td>
            <td>14</td>
          </tr>
          <tr>
            <td>Privacy officer disclosure</td>
            <td>DPO (mandatory for some)</td>
            <td>Privacy Officer (always mandatory, name public)</td>
          </tr>
          <tr>
            <td>GPC / browser signals</td>
            <td>Optional</td>
            <td>Not recognised</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling PIPEDA / Law 25 mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    regulation: 'pipeda',
  },
})`}
      />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "pipeda",
  "pipeda": {
    "privacyOfficerEmail": "privacy@yourcompany.ca",
    "privacyPolicyUrl": "https://yourcompany.ca/privacy"
  }
}`}
      />
      <p>
        When set, <code>pipeda.privacyOfficerEmail</code> is rendered in the modal notice footer.
        <code>privacyPolicyUrl</code> is used in the "Learn more" link in the consent banner.
      </p>

      <h2>Right to access and erasure</h2>
      <p>PIPEDA and Law 25 grant individuals the right to access and correct their data. Use:</p>
      <CodeBlock
        lang="http"
        code={`GET  /consenti/api/v1/consent/:visitorId
DELETE /consenti/api/v1/consent/:visitorId`}
      />
    </div>
  )
}
