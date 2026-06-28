import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'UK GDPR Compliance Guide' }

export default function UKGDPRPage() {
  return (
    <div className="prose max-w-none">
      <h1>UK GDPR Compliance Guide</h1>
      <p>
        After Brexit, the United Kingdom retained the EU GDPR in domestic law as the <strong>UK GDPR</strong>,
        supplemented by the Data Protection Act 2018 (DPA 2018). The result is a framework that is nearly
        identical to EU GDPR but enforced independently by the Information Commissioner's Office (ICO).
        Consenti supports UK GDPR via <code>regulation: 'uk-gdpr'</code>, which applies the same opt-in
        consent model as EU GDPR with UK-locale defaults.
      </p>

      <Callout type="info">
        If you operate in both the EU and UK you can set <code>regulations: ['gdpr', 'uk-gdpr']</code> in
        your profile. Consenti will apply the stricter of the two for any given visitor.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.legislation.gov.uk/ukpga/2018/12/contents" target="_blank" rel="noopener noreferrer">
            Data Protection Act 2018 — UK statute text
          </a>
        </li>
        <li>
          <a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/" target="_blank" rel="noopener noreferrer">
            ICO — UK GDPR guidance and resources
          </a>
        </li>
        <li>
          <a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/" target="_blank" rel="noopener noreferrer">
            ICO — Consent guidance
          </a>
        </li>
      </ul>

      <h2>Key requirements</h2>
      <table>
        <thead>
          <tr><th>Requirement</th><th>Detail</th></tr>
        </thead>
        <tbody>
          <tr><td>Consent model</td><td>Opt-in — freely given, specific, informed, unambiguous</td></tr>
          <tr><td>Pre-ticked boxes</td><td>Not permitted (UK GDPR Art. 4(11))</td></tr>
          <tr><td>Bundled consent</td><td>Not permitted — each purpose must be separately consented</td></tr>
          <tr><td>Withdrawal</td><td>Must be as easy as giving consent</td></tr>
          <tr><td>Records</td><td>Controllers must demonstrate consent was obtained (accountability)</td></tr>
          <tr><td>Age</td><td>Under-13 requires parental consent (lower than EU's 16, unless Member State lowered)</td></tr>
          <tr><td>GPC</td><td>Not yet a recognised signal under UK GDPR; ICO guidance pending</td></tr>
          <tr><td>Enforcer</td><td>Information Commissioner's Office (ICO)</td></tr>
        </tbody>
      </table>

      <h2>UK GDPR vs. EU GDPR</h2>
      <table>
        <thead>
          <tr><th></th><th>EU GDPR</th><th>UK GDPR</th></tr>
        </thead>
        <tbody>
          <tr><td>Opt-in required</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Age threshold</td><td>16 (Member States may lower to 13)</td><td>13</td></tr>
          <tr><td>Enforcer</td><td>National DPAs / EDPB</td><td>ICO</td></tr>
          <tr><td>Adequacy</td><td>EU decides on third-country adequacy</td><td>UK decides independently</td></tr>
          <tr><td>GDPR article numbering</td><td>Original</td><td>Identical — UK GDPR mirrors article numbers</td></tr>
        </tbody>
      </table>

      <h2>Enabling UK GDPR mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock lang="ts" code={`new ConsentiSetup({
  core: {
    regulation: 'uk-gdpr',
  },
})`} />

      <h3>Profile configuration (dashboard)</h3>
      <p>
        Select <strong>UK GDPR</strong> as the regulation in the Profile Editor. The consent model and
        defaults are identical to EU GDPR. No additional profile fields are required.
      </p>

      <h3>Dual EU + UK operation</h3>
      <CodeBlock lang="json" code={`{
  "regulations": ["gdpr", "uk-gdpr"],
  "gpc": {
    "mode": "honour"
  }
}`} />
      <p>
        When both are active, Consenti applies EU GDPR opt-in by default (the stricter model) for all
        visitors. GPC honour is recommended for EU GDPR visitors even though it is not yet mandated under
        UK GDPR.
      </p>

      <h2>Consent records</h2>
      <p>
        UK GDPR's accountability principle (Art. 5(2)) requires demonstrating that consent was obtained.
        Every consent event is written to the immutable audit log automatically. Use the admin dashboard
        to export records or query via the API:
      </p>
      <CodeBlock lang="http" code={`GET /consenti/api/v1/admin/consent?visitorId=<id>`} />

      <h2>Erasure (UK GDPR Art. 17)</h2>
      <p>The right to erasure applies identically to EU GDPR. Use:</p>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
    </div>
  )
}
