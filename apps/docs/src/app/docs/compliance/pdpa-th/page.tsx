import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'PDPA Compliance Guide (Thailand)' }

export default function PDPAThailandPage() {
  return (
    <div className="prose max-w-none">
      <h1>PDPA Compliance Guide (Thailand)</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — opt-in with cross-border transfer rules enforced.
        Use <code>compliance: {'{ type: \'opt-in\' }'}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Thailand's <strong>Personal Data Protection Act B.E. 2562 (PDPA)</strong> was enacted in 2019
        and came into full enforcement on 1 June 2022. It is administered by the{' '}
        <strong>Personal Data Protection Committee (PDPC)</strong> under the Ministry of Digital Economy
        and Society. Consenti supports Thailand PDPA via <code>regulation: 'pdpa-th'</code>.
      </p>

      <Callout type="warning">
        Consenti provides <strong>Partial</strong> coverage for Thailand PDPA. The consent UI and audit
        logging are fully supported. Cross-border transfer agreements and data localisation obligations
        must be managed at the infrastructure level by your legal and engineering teams.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.pdpc.or.th/en/" target="_blank" rel="noopener noreferrer">
            Thailand PDPC — Personal Data Protection Committee
          </a>
        </li>
        <li>
          <a href="https://www.ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF" target="_blank" rel="noopener noreferrer">
            Royal Gazette — PDPA B.E. 2562 (Thai)
          </a>
        </li>
      </ul>

      <h2>Key requirements</h2>
      <table>
        <thead>
          <tr><th>Requirement</th><th>Detail</th></tr>
        </thead>
        <tbody>
          <tr><td>Consent model</td><td>Opt-in — explicit, informed, freely given</td></tr>
          <tr><td>Sensitive data</td><td>Explicit consent required (race, ethnicity, political opinions, religious beliefs, sexual behaviour, criminal records, health data, disability, trade union membership, genetic/biometric data)</td></tr>
          <tr><td>Minors</td><td>Under-10 requires parental consent; 10–20 requires at minimum assent</td></tr>
          <tr><td>Withdrawal</td><td>Must not be more difficult than giving consent</td></tr>
          <tr><td>Cross-border transfer</td><td>Destination country must have adequate protection or SCCs/BCRs in place</td></tr>
          <tr><td>Data Protection Officer</td><td>Mandatory for large-scale or sensitive data processing</td></tr>
          <tr><td>Enforcer</td><td>PDPC — Personal Data Protection Committee</td></tr>
        </tbody>
      </table>

      <h2>Enabling Thailand PDPA mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({
  core: {
    regulation: 'pdpa-th',
  },
})`} />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock lang="json" code={`{
  "regulation": "pdpa-th",
  "pdpaTh": {
    "dataControllerName": "Acme Co., Ltd.",
    "dpoEmail": "dpo@acme.co.th",
    "purposeDescription": "To operate the website and provide requested services."
  }
}`} />

      <h2>Cross-border transfers</h2>
      <p>
        PDPA Section 28 restricts sending personal data to third countries without adequate protection.
        Consenti's backend stores data in SQLite (local) by default. If you use the MongoDB or PostgreSQL
        adapter with a foreign host, ensure your Data Processing Agreement covers PDPA cross-border
        transfer requirements.
      </p>

      <h2>Erasure</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
    </div>
  )
}
