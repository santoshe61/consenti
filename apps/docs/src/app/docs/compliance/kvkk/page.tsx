import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

export const metadata: Metadata = {
  title: 'KVKK Compliance Guide (Turkey)',
  description:
    "KVKK compliance guide for Consenti — Turkey's data protection law enforced by the KVK Board, inspired by the EU GDPR.",
  alternates: { canonical: '/docs/compliance/kvkk' },
  openGraph: {
    title: 'KVKK Compliance Guide (Turkey)',
    description:
      "KVKK compliance guide for Consenti — Turkey's data protection law enforced by the KVK Board, inspired by the EU GDPR.",
    url: 'https://consenti.dev/docs/compliance/kvkk',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KVKK Compliance Guide (Turkey)',
    description:
      "KVKK compliance guide for Consenti — Turkey's data protection law enforced by the KVK Board, inspired by the EU GDPR.",
    images: ['/og-image.jpg'],
  },
}

export default function KVKKPage() {
  return (
    <div className="prose max-w-none">
      <h1>KVKK Compliance Guide (Turkey)</h1>
      <ComplianceTierBadge tier="supported" />
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — explicit consent required for
        sensitive personal data. Use <code>compliance: {"{ type: 'opt-in' }"}</code> in your{' '}
        <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Turkey's <strong>Kişisel Verilerin Korunması Kanunu (KVKK)</strong> — Law No. 6698 — came
        into force in April 2016 and is enforced by the{' '}
        <strong>Kişisel Verileri Koruma Kurumu (KVK Board / KVKK Authority)</strong>. It is inspired
        by the EU GDPR's predecessor (Directive 95/46/EC) and has been progressively updated to
        align with modern GDPR requirements. Consenti supports KVKK via{' '}
        <code>regulation: 'kvkk'</code>.
      </p>

      <Callout type="warning">
        Consenti provides <strong>Partial</strong> coverage for KVKK. The consent UI, audit log, and
        withdrawal are fully supported. Data localisation requirements (certain data must be stored
        in Turkey), cross-border transfer rules, and VERBİS (data controller registry) registration
        are infrastructure and legal obligations that fall outside Consenti's scope.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a
            href="https://www.kvkk.gov.tr/Icerik/6649/6698-Sayili-Kanun"
            target="_blank"
            rel="noopener noreferrer"
          >
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
          <tr>
            <th>Requirement</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compliance Group</td>
            <td>Opt-in — informed, related to a specific matter, based on free will</td>
          </tr>
          <tr>
            <td>Sensitive data</td>
            <td>
              Explicit consent required (race, ethnicity, political opinion, religion, sect, health,
              sexual life, criminal record, biometrics, security measures)
            </td>
          </tr>
          <tr>
            <td>Blanket consent</td>
            <td>Not valid — consent must be specific per purpose</td>
          </tr>
          <tr>
            <td>Withdrawal</td>
            <td>Must be possible at any time; equivalent mechanism to giving consent</td>
          </tr>
          <tr>
            <td>VERBİS registration</td>
            <td>
              Data controllers above certain size thresholds must register in the data controller
              registry
            </td>
          </tr>
          <tr>
            <td>Cross-border transfer</td>
            <td>
              Requires either data subject consent or KVK Board authorisation (or country adequacy)
            </td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>KVK Board (Kişisel Verileri Koruma Kurumu)</td>
          </tr>
        </tbody>
      </table>

      <h2>KVKK vs. GDPR</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>GDPR</th>
            <th>KVKK</th>
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
            <td>6 (Art. 6)</td>
            <td>Similar list in Art. 5–6; consent is primary</td>
          </tr>
          <tr>
            <td>Sensitive data</td>
            <td>Art. 9 special categories</td>
            <td>Art. 6 — broader list including security measures</td>
          </tr>
          <tr>
            <td>DPO equivalent</td>
            <td>DPO (mandatory for some)</td>
            <td>No mandatory DPO requirement</td>
          </tr>
          <tr>
            <td>Registry</td>
            <td>No mandatory controller registry</td>
            <td>VERBİS — mandatory for qualifying controllers</td>
          </tr>
          <tr>
            <td>GPC</td>
            <td>Optional</td>
            <td>Not recognised</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling KVKK mode</h2>
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
  "regulation": "kvkk"
}`}
      />
      <p>
        Unlike DPDPA (which has a dedicated <code>dpdpa</code> profile block rendered
        automatically), KVKK has no dedicated metadata field yet. Turkish law requires the data
        controller's identity and contact information to be disclosed — add it directly to{' '}
        <code>preferenceModal.htmlText</code> (or <code>mainBanner.htmlText</code>) via{' '}
        <code>profileOverride</code> or the dashboard's text editor.
      </p>

      <h2>What Consenti does — and what it doesn&apos;t</h2>
      <p>
        Everything above is the consent-collection UX layer: opt-in capture, per-category records,
        withdrawal, and erasure. KVKK imposes registry and transfer obligations beyond what a
        consent widget can satisfy on its own. Consenti does <strong>not</strong>:
      </p>
      <ul>
        <li>
          Complete VERBİS (Data Controllers&apos; Registry) registration — that&apos;s an
          administrative filing with the KVK Board you complete outside the product, if your
          organisation meets the qualifying size/processing thresholds
        </li>
        <li>
          Obtain KVK Board authorisation for a cross-border transfer that lacks an adequacy
          decision or explicit data-subject consent — that&apos;s a legal/administrative step, not
          a widget config
        </li>
        <li>
          Guarantee data localisation for data subject to Turkey-specific storage expectations —
          self-hosting <code>@consenti/api</code> means you control where it runs, not that it
          runs in Turkey
        </li>
        <li>
          Author sector-specific written consent forms some KVK Board guidance requires beyond
          cookie consent — Consenti covers the cookie/tracking consent surface, not every KVKK
          consent touchpoint your organisation may have
        </li>
      </ul>

      <h2>Operator checklist</h2>
      <p>Beyond configuring Consenti&apos;s opt-in consent group, an operator with KVKK exposure still needs to:</p>
      <ol>
        <li>Register in VERBİS if your organisation meets the KVK Board&apos;s size/processing thresholds, and keep that registration current</li>
        <li>Confirm the cross-border transfer legal basis (consent, KVK Board authorisation, or adequacy) before routing data to non-Turkey infrastructure</li>
        <li>Keep the data controller&apos;s identity and contact information current in <code>preferenceModal.htmlText</code> or <code>mainBanner.htmlText</code>, as required by Turkish law</li>
        <li>Configure each cookie category with a genuinely distinct, specific purpose — KVKK does not recognise blanket consent, so the underlying per-category records need to reflect real purpose granularity even if your banner offers an &quot;accept all&quot; shortcut</li>
      </ol>

      <h2>Erasure</h2>
      <p>KVKK Article 7 grants data subjects the right to request deletion. Use:</p>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
      <p>
        For the widget-side &quot;Forget me&quot; button and the events both sides fire, see the{' '}
        <Link href="/guides/hot-topics/right-to-erasure/">Right to Erasure guide</Link>.
      </p>
    </div>
  )
}
