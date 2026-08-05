import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

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
      <ComplianceTierBadge tier="supported" />
      <Callout type="info">
        <strong>Compliance group:</strong> Canada auto-resolves to{' '}
        <code>general-privacy-consent</code> by default (Quebec is carved out to{' '}
        <code>opt-in</code> for Law 25 automatically). For stronger alignment across all of
        Canada — the same opt-in model as GDPR — configure{' '}
        <code>compliance: {"{ type: 'opt-in' }"}</code> explicitly in your{' '}
        <code>ConsentiSetup</code> config.
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
            <td>Compliance Group</td>
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
  compliance: { type: 'general-privacy-consent' },
})`}
      />

      <h3>Profile configuration (dashboard)</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "pipeda"
}`}
      />
      <p>
        Unlike DPDPA (which has a dedicated <code>dpdpa</code> profile block rendered
        automatically), PIPEDA has no dedicated metadata field yet. Add your privacy officer
        contact and a link to your privacy policy directly in{' '}
        <code>preferenceModal.htmlText</code> or as a <code>'link'</code>-action button in{' '}
        <code>mainBanner.buttons</code>, via <code>profileOverride</code> or the dashboard's text
        editor.
      </p>

      <h2>What Consenti does — and what it doesn&apos;t</h2>
      <p>
        Everything above is the consent-collection UX layer: the opt-in/implied-consent model,
        per-category records, withdrawal, and erasure. PIPEDA and Law 25 impose organisational
        obligations beyond what a consent widget can satisfy on its own. Consenti does{' '}
        <strong>not</strong>:
      </p>
      <ul>
        <li>
          Designate a Privacy Officer — Law 25 requires that person&apos;s name be made public;
          that&apos;s an organisational appointment, not a widget feature
        </li>
        <li>
          Author or host your privacy policy — Law 25 requires publishing one before collection;
          Consenti can link to it from a banner button, but doesn&apos;t write or serve the policy
          itself
        </li>
        <li>
          Judge whether your disclosure text satisfies the OPC&apos;s &quot;meaningful consent&quot;
          guidance (plain language, purpose-specific, contextually appropriate) — Consenti renders
          whatever <code>htmlText</code> you configure, it doesn&apos;t evaluate the wording
        </li>
        <li>
          Detect British Columbia or Alberta specifically — the callout above notes Consenti&apos;s
          PIPEDA/Law-25 baseline also satisfies PIPA BC and PIPA AB, but the geo-resolver applies
          the same Canada-wide default to those provinces rather than treating them as their own
          rule
        </li>
      </ul>

      <h2>Operator checklist</h2>
      <p>Beyond configuring Consenti&apos;s consent group, an operator with PIPEDA/Law 25 exposure still needs to:</p>
      <ol>
        <li>Designate a Privacy Officer and make their name public, per Law 25&apos;s disclosure requirement</li>
        <li>Publish a privacy policy and link to it from the banner or modal (e.g. a <code>&apos;link&apos;</code>-action button) before any collection occurs</li>
        <li>Review category <code>htmlText</code> against the OPC&apos;s meaningful-consent guidance rather than generic legal boilerplate</li>
        <li>Enable the under-14 age gate if you knowingly serve minors in Quebec</li>
        <li>Follow the OPC&apos;s (or CAI&apos;s, for Quebec) mandatory breach-notification process if a security incident meets the reporting threshold — separate from Consenti&apos;s audit log, which records consent actions, not security incidents</li>
      </ol>

      <h2>Right to access and erasure</h2>
      <p>PIPEDA and Law 25 grant individuals the right to access and correct their data. Use:</p>
      <CodeBlock
        lang="http"
        code={`GET  /consenti/api/v1/consent/:visitorId
DELETE /consenti/api/v1/consent/:visitorId`}
      />
      <p>
        For the widget-side &quot;Forget me&quot; button and the events both sides fire, see the{' '}
        <Link href="/guides/hot-topics/right-to-erasure/">Right to Erasure guide</Link>.
      </p>
    </div>
  )
}
