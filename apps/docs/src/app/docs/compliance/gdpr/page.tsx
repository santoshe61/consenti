import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'GDPR Compliance Guide',
  description:
    'Implement GDPR-compliant cookie consent with Consenti. Opt-in mode, legitimate interest, right-to-erasure, immutable audit logs, and signed consent receipts.',
  keywords: [
    'GDPR',
    'GDPR cookie consent',
    'GDPR compliance',
    'opt-in consent',
    'cookie banner GDPR',
    'open source GDPR',
  ],
  alternates: { canonical: 'https://consenti.dev/docs/compliance/gdpr' },
  openGraph: {
    title: 'GDPR Compliance Guide',
    description:
      'Implement GDPR-compliant cookie consent with Consenti. Opt-in mode, legitimate interest, right-to-erasure, immutable audit logs, and signed consent receipts.',
    url: 'https://consenti.dev/docs/compliance/gdpr',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GDPR Compliance Guide',
    description:
      'Implement GDPR-compliant cookie consent with Consenti. Opt-in mode, legitimate interest, right-to-erasure, immutable audit logs, and signed consent receipts.',
    images: ['/og-image.jpg'],
  },
}

export default function GDPRPage() {
  return (
    <div className="prose max-w-none">
      <h1>GDPR Compliance Guide</h1>
      <p>
        Consenti is built from the ground up around GDPR requirements. All core design decisions
        follow the six lawfulness principles in Article 5.
      </p>

      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in</code> — covers GDPR (EU / EEA), UK GDPR,
        PIPEDA (Canada), POPIA (South Africa), PDPA-TH (Thailand), APPI (Japan), and KVKK (Turkey).
        Use <code>compliance: {"{ type: 'opt-in' }"}</code> in your <code>ConsentiSetup</code>{' '}
        config to activate the opt-in consent model.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a
            href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679"
            target="_blank"
            rel="noopener noreferrer"
          >
            Regulation (EU) 2016/679 — full text on EUR-Lex
          </a>
        </li>
        <li>
          <a href="https://edpb.europa.eu/" target="_blank" rel="noopener noreferrer">
            European Data Protection Board (EDPB)
          </a>{' '}
          — guidelines, recommendations, binding decisions
        </li>
        <li>
          <a
            href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ICO — UK GDPR guidance
          </a>{' '}
          (post-Brexit UK equivalent)
        </li>
        <li>
          <a
            href="https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en"
            target="_blank"
            rel="noopener noreferrer"
          >
            EDPB Guidelines 05/2020 on Consent
          </a>
        </li>
      </ul>

      <h2>Key requirements and how Consenti meets them</h2>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Implementation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Freely given</td>
            <td>No content gating; overlay opacity defaults to 0</td>
          </tr>
          <tr>
            <td>Specific</td>
            <td>
              Per-cookie granularity — each cookie has its own consent entry in{' '}
              <code>consentJson</code>
            </td>
          </tr>
          <tr>
            <td>Informed</td>
            <td>
              <code>htmlText</code> on categories, <code>legitimateInterestDescription</code> for LI
              basis
            </td>
          </tr>
          <tr>
            <td>Unambiguous</td>
            <td>
              No pre-ticked boxes; all non-mandatory cookies default to <code>'denied'</code>
            </td>
          </tr>
          <tr>
            <td>Easy to withdraw</td>
            <td>
              <code>DELETE /consenti/api/v1/consent/:visitorId</code> (same prominence as granting)
            </td>
          </tr>
          <tr>
            <td>Records kept</td>
            <td>
              Immutable <code>consent_history</code> table; <code>audit_logs</code> for admin
              actions
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Right to erasure (Article 17)</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
      <p>This deletes:</p>
      <ul>
        <li>
          All entries in <code>consent_records</code> for the visitor ID
        </li>
        <li>
          All entries in <code>consent_history</code> for the visitor ID
        </li>
        <li>
          The <code>visitors</code> record (IP hash, UA hash, geolocation)
        </li>
      </ul>
      <p>The visitor ID itself is a random UUID and contains no PII.</p>

      <h2>Data minimisation (Article 5(1)(c))</h2>
      <ul>
        <li>IP addresses are stored as SHA-256 hashes only — the raw IP is never persisted</li>
        <li>User agents are stored as SHA-256 hashes only</li>
        <li>
          Consent records contain only: visitor UUID, profile ID, consent choices, timestamp, source
        </li>
      </ul>

      <h2>Consent records as evidence</h2>
      <p>Every consent record includes:</p>
      <ul>
        <li>
          <code>profileId</code> — the exact profile the user consented under. A new id is minted on
          every profile edit (the previous one is kept, archived, as history), so this alone
          identifies which cookie policy version was in effect — no separate version counter needed
        </li>
        <li>
          <code>createdAt</code> / <code>updatedAt</code> — exact ISO 8601 timestamps
        </li>
        <li>
          <code>source</code> — <code>'banner'</code>, <code>'api'</code>, or <code>'import'</code>
        </li>
        <li>
          <code>consent_history</code> — immutable append-only log of every change
        </li>
      </ul>

      <h2>Legitimate Interest (Article 6(1)(f))</h2>
      <p>
        Configure a category with <code>legalBasis: 'legitimate_interest'</code> in your profile —
        legal basis is set once per category, and every parameter listed in <code>cookies</code>{' '}
        inherits it:
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "preferenceModal": {
    "categories": {
      "marketing": {
        "heading": "Marketing",
        "htmlText": "Relevant ads based on your activity.",
        "legalBasis": "legitimate_interest",
        "legitimateInterestDescription": "We show relevant ads under legitimate interest.",
        "cookies": ["ad_personalization"]
      }
    }
  }
}`}
      />
      <p>Status values for LI parameters:</p>
      <ul>
        <li>
          <code>"granted"</code> — user did not object
        </li>
        <li>
          <code>"objected"</code> — user exercised their right to object (GDPR Art. 21)
        </li>
      </ul>
      <Callout type="info">
        The <code>'objected'</code> status is only valid for parameters whose category has{' '}
        <code>legalBasis: 'legitimate_interest'</code>. The server rejects <code>'objected'</code>{' '}
        for standard consent-basis parameters.
      </Callout>

      <h2>Re-consent when the profile changes</h2>
      <p>
        Profiles have no in-place version counter — every edit mints a brand-new{' '}
        <code>Profile.id</code> and archives the previous one as history. The widget's{' '}
        <code>verify</code> endpoint compares the consent's <code>profileId</code> against the
        compliance group's currently active profile id and returns{' '}
        <code>
          &#123; valid: false, reasons: ['profile_changed'], currentProfileId, consentProfileId
          &#125;
        </code>{' '}
        when they differ, triggering the banner to show again.
      </p>

      <h2>Banner requirements</h2>
      <Callout type="warning">
        Under GDPR, the "Reject Optional" option must be as prominent as "Accept All". Do not use
        dark patterns such as grey-out reject buttons or hiding the reject option behind extra
        clicks. Consenti's default profile is compliant, but custom profiles are your
        responsibility.
      </Callout>
      <ul>
        <li>
          Do not set <code>overlayOpacity</code> above 0 if users can't access site content without
          consenting
        </li>
        <li>
          Always provide a way to withdraw consent (use <code>BannerTrigger</code> or{' '}
          <code>widget.showModal()</code> from a footer link)
        </li>
        <li>
          Mandatory categories must be truly necessary — don't put analytics parameters in a{' '}
          <code>legalBasis: 'mandatory'</code> category
        </li>
      </ul>
    </div>
  )
}
