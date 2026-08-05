import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

export const metadata: Metadata = {
  title: 'PDPA Compliance Guide (Thailand)',
  description:
    'How to implement PDPA (Thailand Personal Data Protection Act) cookie consent with Consenti. Opt-in mode, audit logs, and auto geo-detection.',
  keywords: [
    'PDPA',
    'PDPA compliance',
    'PDPA Thailand',
    'Thai personal data protection act',
    'cookie consent Thailand',
  ],
  alternates: { canonical: 'https://consenti.dev/docs/compliance/pdpa-th' },
  openGraph: {
    title: 'PDPA Compliance Guide (Thailand)',
    description:
      'How to implement PDPA (Thailand Personal Data Protection Act) cookie consent with Consenti. Opt-in mode, audit logs, and auto geo-detection.',
    url: 'https://consenti.dev/docs/compliance/pdpa-th',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDPA Compliance Guide (Thailand)',
    description:
      'How to implement PDPA (Thailand Personal Data Protection Act) cookie consent with Consenti. Opt-in mode, audit logs, and auto geo-detection.',
    images: ['/og-image.jpg'],
  },
}

export default function PDPAThailandPage() {
  return (
    <div className="prose max-w-none">
      <h1>PDPA Compliance Guide (Thailand)</h1>
      <ComplianceTierBadge tier="supported" />
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — opt-in with cross-border transfer
        rules enforced. Use <code>compliance: {"{ type: 'opt-in' }"}</code> in your{' '}
        <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Thailand's <strong>Personal Data Protection Act B.E. 2562 (PDPA)</strong> was enacted in
        2019 and came into full enforcement on 1 June 2022. It is administered by the{' '}
        <strong>Personal Data Protection Committee (PDPC)</strong> under the Ministry of Digital
        Economy and Society. Consenti supports Thailand PDPA via <code>regulation: 'pdpa-th'</code>.
      </p>

      <Callout type="warning">
        Consenti provides <strong>Partial</strong> coverage for Thailand PDPA. The consent UI and
        audit logging are fully supported. Cross-border transfer agreements and data localisation
        obligations must be managed at the infrastructure level by your legal and engineering teams.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.pdpc.or.th/en/" target="_blank" rel="noopener noreferrer">
            Thailand PDPC — Personal Data Protection Committee
          </a>
        </li>
        <li>
          <a
            href="https://www.ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF"
            target="_blank"
            rel="noopener noreferrer"
          >
            Royal Gazette — PDPA B.E. 2562 (Thai)
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
            <td>Compliance Group</td>
            <td>Opt-in — explicit, informed, freely given</td>
          </tr>
          <tr>
            <td>Sensitive data</td>
            <td>
              Explicit consent required (race, ethnicity, political opinions, religious beliefs,
              sexual behaviour, criminal records, health data, disability, trade union membership,
              genetic/biometric data)
            </td>
          </tr>
          <tr>
            <td>Minors</td>
            <td>Under-10 requires parental consent; 10–20 requires at minimum assent</td>
          </tr>
          <tr>
            <td>Withdrawal</td>
            <td>Must not be more difficult than giving consent</td>
          </tr>
          <tr>
            <td>Cross-border transfer</td>
            <td>Destination country must have adequate protection or SCCs/BCRs in place</td>
          </tr>
          <tr>
            <td>Data Protection Officer</td>
            <td>Mandatory for large-scale or sensitive data processing</td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>PDPC — Personal Data Protection Committee</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling Thailand PDPA mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
})`}
      />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "pdpa-th"
}`}
      />
      <p>
        Unlike DPDPA (India, which has a dedicated <code>dpdpa</code> profile block rendered
        automatically), Thailand's PDPA has no dedicated metadata field yet. Add your Data
        Controller name and DPO contact directly in <code>preferenceModal.htmlText</code> via{' '}
        <code>profileOverride</code> or the dashboard's text editor.
      </p>

      <h2>Cross-border transfers</h2>
      <p>
        PDPA Section 28 restricts sending personal data to third countries without adequate
        protection. Consenti's backend stores data in SQLite (local) by default. If you use the
        MongoDB or PostgreSQL adapter with a foreign host, ensure your Data Processing Agreement
        covers PDPA cross-border transfer requirements.
      </p>

      <h2>What Consenti does — and what it doesn&apos;t</h2>
      <p>
        Everything above is the consent-collection UX layer: opt-in capture, per-category records,
        withdrawal, and erasure. Thailand&apos;s PDPA imposes obligations beyond what a consent
        widget can satisfy on its own. Consenti does <strong>not</strong>:
      </p>
      <ul>
        <li>
          Determine or execute the cross-border transfer legal basis (adequacy determination, SCCs,
          or BCRs) required by Section 28 — that&apos;s a legal/contractual step you complete
          outside the product
        </li>
        <li>
          Appoint a Data Protection Officer — mandatory for large-scale or sensitive-data
          processing under PDPA, and an organisational hire, not a config option
        </li>
        <li>
          Distinguish the two minor-consent tiers PDPA requires — parental consent under age 10
          versus at-minimum assent for ages 10–20. Consenti&apos;s age gate is a single
          minimum-age/parental-consent threshold; the assent tier for 10–20 year-olds needs a
          manual process alongside it
        </li>
        <li>
          Guarantee data localisation — whether your storage adapter&apos;s host counts as an
          adequate-protection destination is a legal determination, not something the widget
          verifies
        </li>
      </ul>

      <h2>Operator checklist</h2>
      <p>Beyond configuring Consenti&apos;s opt-in consent group, an operator with PDPA exposure still needs to:</p>
      <ol>
        <li>Appoint a Data Protection Officer if your scale or data category triggers the mandatory threshold, and publish their contact alongside the Data Controller name mentioned above</li>
        <li>Confirm the cross-border transfer legal basis before enabling a MongoDB/PostgreSQL adapter hosted outside Thailand, or before sending data to any foreign processor</li>
        <li>Build a separate assent flow for the 10–20 age tier if you knowingly serve users in that range — the built-in age gate only distinguishes &quot;requires parental consent&quot; from &quot;doesn&apos;t&quot;</li>
        <li>Keep the cross-border and Data Controller disclosures in <code>preferenceModal.htmlText</code> current as your actual vendor/processor list changes</li>
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
