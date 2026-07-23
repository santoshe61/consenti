import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'APPI Compliance Guide (Japan)',
  description:
    'How to implement APPI (Act on the Protection of Personal Information) cookie consent in Japan with Consenti. Opt-in mode, audit logs, and geo-detection.',
  keywords: [
    'APPI',
    'APPI compliance',
    'Japan personal data protection',
    'cookie consent Japan',
    'Act on the Protection of Personal Information',
  ],
  alternates: { canonical: 'https://consenti.dev/docs/compliance/appi' },
  openGraph: {
    title: 'APPI Compliance Guide (Japan)',
    description:
      'How to implement APPI (Act on the Protection of Personal Information) cookie consent in Japan with Consenti. Opt-in mode, audit logs, and geo-detection.',
    url: 'https://consenti.dev/docs/compliance/appi',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APPI Compliance Guide (Japan)',
    description:
      'How to implement APPI (Act on the Protection of Personal Information) cookie consent in Japan with Consenti. Opt-in mode, audit logs, and geo-detection.',
    images: ['/og-image.jpg'],
  },
}

export default function APPIPage() {
  return (
    <div className="prose max-w-none">
      <h1>APPI Compliance Guide (Japan)</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — opt-in for sensitive data and
        cross-border transfers; opt-out for general third-party sharing. Use{' '}
        <code>compliance: {"{ type: 'opt-in' }"}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Japan's <strong>Act on the Protection of Personal Information (APPI)</strong> was
        significantly revised in 2022 (enforced from April 2022) and is administered by the{' '}
        <strong>Personal Information Protection Commission (PPC)</strong>. Unlike GDPR, APPI uses a
        mixed model: opt-in for sensitive data and cross-border transfers to foreign companies
        without adequate protection, but opt-out is permitted for certain third-party sharing of
        general data. Consenti supports APPI via <code>regulation: 'appi'</code>.
      </p>

      <Callout type="warning">
        Consenti provides <strong>Partial</strong> coverage for APPI. The opt-in consent widget
        covers sensitive data and foreign transfer scenarios. The opt-out third-party sharing model
        (for general personal information under Art. 27) differs from a standard consent banner and
        requires additional implementation on your site.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://www.ppc.go.jp/en/legal/" target="_blank" rel="noopener noreferrer">
            PPC — Personal Information Protection Commission (English)
          </a>
        </li>
        <li>
          <a
            href="https://elaws.e-gov.go.jp/document?lawid=415AC0000000057"
            target="_blank"
            rel="noopener noreferrer"
          >
            APPI — e-Gov Law Database (Japanese)
          </a>
        </li>
      </ul>

      <h2>Consent model breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Required model</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Sensitive personal information (health, race, religion, criminal record, disability,
              etc.)
            </td>
            <td>Opt-in consent (Art. 20)</td>
          </tr>
          <tr>
            <td>Third-party transfer to foreign entity without adequate protection</td>
            <td>Opt-in consent (Art. 28)</td>
          </tr>
          <tr>
            <td>Third-party transfer of general personal information (domestic)</td>
            <td>Opt-out permitted — notify and allow objection (Art. 27)</td>
          </tr>
          <tr>
            <td>Analytics / functional cookies (non-sensitive)</td>
            <td>Consent recommended; legitimate interest available</td>
          </tr>
        </tbody>
      </table>

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
            <td>Purpose notification</td>
            <td>
              Must notify data subjects of the purpose of use before or at the time of collection
            </td>
          </tr>
          <tr>
            <td>Sensitive data</td>
            <td>Explicit opt-in required (Art. 20)</td>
          </tr>
          <tr>
            <td>Third-party transfer</td>
            <td>Consent required unless within same enterprise group or an exception applies</td>
          </tr>
          <tr>
            <td>Overseas transfer</td>
            <td>
              Opt-in if destination country lacks adequate protection; provide information on
              protection level
            </td>
          </tr>
          <tr>
            <td>Access and correction</td>
            <td>Data subjects may request disclosure, correction, and deletion</td>
          </tr>
          <tr>
            <td>Records</td>
            <td>Controllers must maintain records of third-party provisions and receipts</td>
          </tr>
          <tr>
            <td>Enforcer</td>
            <td>Personal Information Protection Commission (PPC)</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling APPI mode</h2>
      <h3>Frontend widget</h3>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    regulation: 'appi',
  },
})`}
      />
      <p>
        In APPI mode, Consenti renders an opt-in banner for cookies classified as sensitive or
        involving overseas data transfer. Cookies without sensitive classification receive a
        lightweight notice with an opt-out link (the Art. 27 opt-out model).
      </p>

      <h3>Profile configuration</h3>
      <CodeBlock
        lang="json"
        code={`{
  "regulation": "appi",
  "appi": {
    "businessName": "株式会社アクメ",
    "purposeUrl": "https://yoursite.jp/privacy",
    "overseasTransfer": true
  }
}`}
      />

      <Callout type="info">
        Set <code>appi.overseasTransfer: true</code> if any of your vendors (analytics, ads, CDN)
        store data outside Japan. This triggers the opt-in flow for those cookies even if they are
        not classified as sensitive.
      </Callout>

      <h2>Erasure</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
    </div>
  )
}
