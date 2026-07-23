import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'DPDPA Compliance Guide (India 2023)',
  description:
    "DPDPA compliance guide for Consenti — India's Digital Personal Data Protection Act 2023, enforced by the Data Protection Board of India.",
  alternates: { canonical: '/docs/compliance/dpdpa' },
  openGraph: {
    title: 'DPDPA Compliance Guide (India 2023)',
    description:
      "DPDPA compliance guide for Consenti — India's Digital Personal Data Protection Act 2023, enforced by the Data Protection Board of India.",
    url: 'https://consenti.dev/docs/compliance/dpdpa',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPDPA Compliance Guide (India 2023)',
    description:
      "DPDPA compliance guide for Consenti — India's Digital Personal Data Protection Act 2023, enforced by the Data Protection Board of India.",
    images: ['/og-image.jpg'],
  },
}

export default function DPDPAPage() {
  return (
    <div className="prose max-w-none">
      <h1>DPDPA Compliance Guide</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in-dpdpa</code> — India-specific opt-in with
        fiduciary name, grievance officer in modal, and age gate (18+). GPC signal is ignored. Use{' '}
        <code>compliance: {"{ type: 'opt-in-dpdpa' }"}</code> in your <code>ConsentiSetup</code>{' '}
        config.
      </Callout>
      <p>
        India's Digital Personal Data Protection Act 2023 (DPDPA) came into force in August 2023 and
        is enforced by the Data Protection Board of India under the Ministry of Electronics and
        Information Technology (MeitY).
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a
            href="https://www.meity.gov.in/content/digital-personal-data-protection-act-2023"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ministry of Electronics and Information Technology (MeitY) — DPDPA 2023
          </a>{' '}
          — official Act page
        </li>
        <li>
          <a
            href="https://egazette.gov.in/WriteReadData/2023/247302.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            India Gazette Notification — DPDPA 2023 (PDF)
          </a>{' '}
          — official gazette text of the Act
        </li>
        <li>
          <a href="https://www.meity.gov.in/" target="_blank" rel="noopener noreferrer">
            MeitY — Ministry of Electronics and Information Technology
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
            <td>Opt-in — no silent or pre-ticked consent</td>
          </tr>
          <tr>
            <td>GPC</td>
            <td>
              Not recognised under DPDPA — Consenti ignores GPC when regulation is{' '}
              <code>'dpdpa'</code>
            </td>
          </tr>
          <tr>
            <td>Data Fiduciary disclosure</td>
            <td>Name of the entity collecting data must appear in the consent notice</td>
          </tr>
          <tr>
            <td>Grievance Officer</td>
            <td>Email address for complaints must be disclosed in the consent notice</td>
          </tr>
          <tr>
            <td>Purpose</td>
            <td>Processing purpose must be described in clear, plain language</td>
          </tr>
          <tr>
            <td>Withdrawal</td>
            <td>Must be as easy as giving consent</td>
          </tr>
          <tr>
            <td>Minors</td>
            <td>Under-18 requires verifiable parental consent (Section 9)</td>
          </tr>
        </tbody>
      </table>

      <h2>DPDPA vs. GDPR</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>GDPR</th>
            <th>DPDPA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Opt-in required</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>GPC honoured</td>
            <td>Optional</td>
            <td>Not applicable</td>
          </tr>
          <tr>
            <td>Data Fiduciary name in notice</td>
            <td>Not required in banner</td>
            <td>Required</td>
          </tr>
          <tr>
            <td>Grievance Officer in notice</td>
            <td>Not required in banner</td>
            <td>Required</td>
          </tr>
          <tr>
            <td>Sensitive categories</td>
            <td>GDPR Art. 9 special categories</td>
            <td>Sensitive personal data (Chapter III)</td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>Data Protection Authorities</td>
            <td>Data Protection Board of India</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling DPDPA mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    regulation: 'dpdpa',
    // autoHonorGPC is not needed — GPC is not recognised under DPDPA
  },
})`}
      />

      <h3>Profile configuration (dashboard)</h3>
      <p>
        In the <strong>Profile Editor</strong>, select <strong>DPDPA (India 2023)</strong> as the
        regulation. Three fields appear:
      </p>
      <ul>
        <li>
          <strong>Data Fiduciary Name</strong> — your company or product name (appears in the modal
          notice)
        </li>
        <li>
          <strong>Grievance Officer Email</strong> — contact address for data complaints (required
          by law)
        </li>
        <li>
          <strong>Purpose Description</strong> *(optional)* — plain-language description of why you
          collect data
        </li>
      </ul>

      <h3>Programmatic profile JSON</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "dpdpa",
  "dpdpa": {
    "dataFiduciary": "Acme Corp",
    "grievanceEmail": "privacy@acme.com",
    "purposeDescription": "To operate the website and send transactional emails."
  }
}`}
      />

      <h2>Consent notice (modal footer)</h2>
      <p>
        When <code>regulation: 'dpdpa'</code> is active and the profile includes a{' '}
        <code>dpdpa</code> block, Consenti automatically injects a notice before the modal action
        buttons:
      </p>
      <CodeBlock
        lang="html"
        code={`<div class="consenti-modal__dpdpa-notice">
  <strong>Data Fiduciary:</strong> Acme Corp.
  <strong>Purpose:</strong> To operate the website and send transactional emails.
  You may withdraw consent at any time or contact our Grievance Officer at
  <a href="mailto:privacy@acme.com">privacy@acme.com</a>.
</div>`}
      />
      <p>No custom template changes are required — the notice is rendered automatically.</p>

      <h2>GPC under DPDPA</h2>
      <Callout type="warning">
        DPDPA does not recognise GPC as a valid opt-out signal. Even if the visitor's browser sends
        <code>navigator.globalPrivacyControl === true</code>, Consenti will not automatically deny
        cookies under DPDPA. The banner is always shown on first visit for an explicit opt-in.
      </Callout>

      <h2>Right to withdrawal (Section 6)</h2>
      <p>
        DPDPA Section 6 requires that withdrawal of consent is as easy as giving consent. Use{' '}
        <code>widget.showModal()</code> from a persistent footer link to give users a way to update
        their choices at any time:
      </p>
      <CodeBlock
        lang="html"
        code={`<a href="#" onclick="window.__consenti?.showModal(); return false;">
  Manage my consent
</a>`}
      />

      <h2>Erasure (Section 12)</h2>
      <p>
        DPDPA Section 12 grants users the right to erasure. Use the GDPR-compatible erasure
        endpoint:
      </p>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
      <p>This removes all consent records, history, and visitor data for the given visitor ID.</p>
    </div>
  )
}
