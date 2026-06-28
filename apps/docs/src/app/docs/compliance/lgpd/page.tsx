import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'LGPD Compliance Guide (Brazil)' }

export default function LGPDPage() {
  return (
    <div className="prose max-w-none">
      <h1>LGPD Compliance Guide</h1>
      <p>
        Brazil's <strong>Lei Geral de Proteção de Dados Pessoais (LGPD)</strong> — Law 13,709/2018 —
        came into full force in September 2020 and is enforced by the{' '}
        <strong>ANPD (Autoridade Nacional de Proteção de Dados)</strong>. It is structurally similar to
        the EU GDPR, relying on 10 lawful bases for processing with consent being the most common
        for cookie-based analytics and marketing.
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" rel="noopener noreferrer">
            Lei 13.709/2018 — LGPD full text (Portuguese)
          </a>
        </li>
        <li>
          <a href="https://www.gov.br/anpd/pt-br" target="_blank" rel="noopener noreferrer">
            ANPD — Autoridade Nacional de Proteção de Dados
          </a>
        </li>
      </ul>

      <h2>Key requirements</h2>
      <table>
        <thead>
          <tr><th>Requirement</th><th>Detail</th></tr>
        </thead>
        <tbody>
          <tr><td>Consent model</td><td>Opt-in — free, informed, unambiguous, purpose-specific</td></tr>
          <tr><td>Sensitive data</td><td>Explicit consent required (health, biometric, racial origin, religion, political/union membership)</td></tr>
          <tr><td>Minors</td><td>Under-12 requires parental/guardian consent; 12–17 requires at least assent</td></tr>
          <tr><td>Withdrawal</td><td>Must be free and easy; controller must stop processing on withdrawal</td></tr>
          <tr><td>Lawful bases</td><td>10 bases — consent (Art. 7 I), legitimate interest (Art. 7 IX), contract, legal obligation, vital interests, etc.</td></tr>
          <tr><td>Records</td><td>Controllers must maintain processing records</td></tr>
          <tr><td>Enforcer</td><td>ANPD — Autoridade Nacional de Proteção de Dados</td></tr>
        </tbody>
      </table>

      <h2>LGPD vs. GDPR</h2>
      <table>
        <thead>
          <tr><th></th><th>GDPR</th><th>LGPD</th></tr>
        </thead>
        <tbody>
          <tr><td>Opt-in required</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Lawful bases</td><td>6</td><td>10</td></tr>
          <tr><td>Minor age threshold</td><td>16 (States may lower to 13)</td><td>12 (parental consent); 12–17 assent</td></tr>
          <tr><td>DPO equivalent</td><td>Data Protection Officer</td><td>Encarregado (mandatory for some controllers)</td></tr>
          <tr><td>Enforcer</td><td>National DPAs / EDPB</td><td>ANPD</td></tr>
          <tr><td>GPC</td><td>Optional to honour</td><td>Not recognised — no equivalent</td></tr>
        </tbody>
      </table>

      <h2>Enabling LGPD mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({
  core: {
    regulation: 'lgpd',
  },
})`} />

      <h3>Profile configuration (dashboard)</h3>
      <p>Select <strong>LGPD (Brazil)</strong> as the regulation. The consent flow mirrors the GDPR opt-in
      model. Optionally add your <em>Encarregado</em> (DPO equivalent) contact in the profile metadata
      to render it in the consent notice footer.</p>

      <CodeBlock lang="json" code={`{
  "regulation": "lgpd",
  "lgpd": {
    "encarregadoEmail": "privacidade@empresa.com.br",
    "purposeDescription": "Para operar o site e enviar e-mails transacionais."
  }
}`} />

      <Callout type="info">
        The <code>lgpd.encarregadoEmail</code> field, when set, is rendered in the modal notice footer —
        giving users a direct route to your data officer, as recommended by ANPD.
      </Callout>

      <h2>Sensitive data categories</h2>
      <p>
        LGPD Article 11 lists data requiring <em>explicit</em> consent: health/genetic data, biometric
        data, racial or ethnic origin, religious belief, political opinion, union membership, and sexual
        orientation. Tag cookies containing any of these as <code>sensitive: true</code> in your cookie
        definitions to trigger the explicit-consent banner variant.
      </p>

      <h2>Right to erasure (Art. 18)</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
    </div>
  )
}
