import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'KVKK Compliance Guide (Turkey)' }

export default function KVKKPage() {
  return (
    <div className="prose max-w-none">
      <h1>KVKK Compliance Guide (Turkey)</h1>
      <p>
        Turkey's <strong>Kişisel Verilerin Korunması Kanunu (KVKK)</strong> — Law No. 6698 — came into
        force in April 2016 and is enforced by the{' '}
        <strong>Kişisel Verileri Koruma Kurumu (KVK Board / KVKK Authority)</strong>. It is inspired by
        the EU GDPR's predecessor (Directive 95/46/EC) and has been progressively updated to align with
        modern GDPR requirements. Consenti supports KVKK via <code>regulation: 'kvkk'</code>.
      </p>

      <Callout type="warning">
        Consenti provides <strong>Partial</strong> coverage for KVKK. The consent UI, audit log, and
        withdrawal are fully supported. Data localisation requirements (certain data must be stored in
        Turkey), cross-border transfer rules, and VERBİS (data controller registry) registration are
        infrastructure and legal obligations that fall outside Consenti's scope.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.kvkk.gov.tr/Icerik/6649/6698-Sayili-Kanun" target="_blank" rel="noopener noreferrer">
            KVKK — Law No. 6698 (Turkish)
          </a>
        </li>
        <li>
          <a href="https://www.kvkk.gov.tr/en" target="_blank" rel="noopener noreferrer">
            KVK Board — official English portal
          </a>
        </li>
      </ul>

      <h2>Key requirements</h2>
      <table>
        <thead>
          <tr><th>Requirement</th><th>Detail</th></tr>
        </thead>
        <tbody>
          <tr><td>Consent model</td><td>Opt-in — informed, related to a specific matter, based on free will</td></tr>
          <tr><td>Sensitive data</td><td>Explicit consent required (race, ethnicity, political opinion, religion, sect, health, sexual life, criminal record, biometrics, security measures)</td></tr>
          <tr><td>Blanket consent</td><td>Not valid — consent must be specific per purpose</td></tr>
          <tr><td>Withdrawal</td><td>Must be possible at any time; equivalent mechanism to giving consent</td></tr>
          <tr><td>VERBİS registration</td><td>Data controllers above certain size thresholds must register in the data controller registry</td></tr>
          <tr><td>Cross-border transfer</td><td>Requires either data subject consent or KVK Board authorisation (or country adequacy)</td></tr>
          <tr><td>Enforcer</td><td>KVK Board (Kişisel Verileri Koruma Kurumu)</td></tr>
        </tbody>
      </table>

      <h2>KVKK vs. GDPR</h2>
      <table>
        <thead>
          <tr><th></th><th>GDPR</th><th>KVKK</th></tr>
        </thead>
        <tbody>
          <tr><td>Opt-in required</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Lawful bases</td><td>6 (Art. 6)</td><td>Similar list in Art. 5–6; consent is primary</td></tr>
          <tr><td>Sensitive data</td><td>Art. 9 special categories</td><td>Art. 6 — broader list including security measures</td></tr>
          <tr><td>DPO equivalent</td><td>DPO (mandatory for some)</td><td>No mandatory DPO requirement</td></tr>
          <tr><td>Registry</td><td>No mandatory controller registry</td><td>VERBİS — mandatory for qualifying controllers</td></tr>
          <tr><td>GPC</td><td>Optional</td><td>Not recognised</td></tr>
        </tbody>
      </table>

      <h2>Enabling KVKK mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({
  core: {
    regulation: 'kvkk',
  },
})`} />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock lang="json" code={`{
  "regulation": "kvkk",
  "kvkk": {
    "controllerName": "Acme Yazılım A.Ş.",
    "contactEmail": "kvkk@acme.com.tr",
    "purposeDescription": "Web sitesini işletmek ve işlem e-postaları göndermek."
  }
}`} />
      <p>
        Turkish law requires the data controller's identity and contact information to be disclosed.
        Setting <code>kvkk.controllerName</code> and <code>kvkk.contactEmail</code> renders these in
        the consent modal footer automatically.
      </p>

      <h2>Erasure</h2>
      <p>KVKK Article 7 grants data subjects the right to request deletion. Use:</p>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
    </div>
  )
}
