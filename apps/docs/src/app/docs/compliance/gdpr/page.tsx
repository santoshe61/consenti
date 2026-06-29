import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'GDPR Compliance Guide' }

export default function GDPRPage() {
  return (
    <div className="prose max-w-none">
      <h1>GDPR Compliance Guide</h1>
      <p>
        Consenti is built from the ground up around GDPR requirements.
        All core design decisions follow the six lawfulness principles in Article 5.
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679" target="_blank" rel="noopener noreferrer">
            Regulation (EU) 2016/679 — full text on EUR-Lex
          </a>
        </li>
        <li>
          <a href="https://edpb.europa.eu/" target="_blank" rel="noopener noreferrer">
            European Data Protection Board (EDPB)
          </a>
          {' '}— guidelines, recommendations, binding decisions
        </li>
        <li>
          <a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/" target="_blank" rel="noopener noreferrer">
            ICO — UK GDPR guidance
          </a>
          {' '}(post-Brexit UK equivalent)
        </li>
        <li>
          <a href="https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en" target="_blank" rel="noopener noreferrer">
            EDPB Guidelines 05/2020 on Consent
          </a>
        </li>
      </ul>

      <h2>Key requirements and how Consenti meets them</h2>
      <table>
        <thead>
          <tr><th>Requirement</th><th>Implementation</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Freely given</td>
            <td>No content gating; overlay opacity defaults to 0</td>
          </tr>
          <tr>
            <td>Specific</td>
            <td>Per-cookie granularity — each cookie has its own consent entry in <code>consentJson</code></td>
          </tr>
          <tr>
            <td>Informed</td>
            <td><code>htmlText</code> on categories, <code>legitimateInterest.description</code> for LI basis</td>
          </tr>
          <tr>
            <td>Unambiguous</td>
            <td>No pre-ticked boxes; all non-mandatory cookies default to <code>'denied'</code></td>
          </tr>
          <tr>
            <td>Easy to withdraw</td>
            <td><code>DELETE /consenti/api/v1/consent/:visitorId</code> (same prominence as granting)</td>
          </tr>
          <tr>
            <td>Records kept</td>
            <td>Immutable <code>consent_history</code> table; <code>audit_logs</code> for admin actions</td>
          </tr>
        </tbody>
      </table>

      <h2>Right to erasure (Article 17)</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
      <p>This deletes:</p>
      <ul>
        <li>All entries in <code>consent_records</code> for the visitor ID</li>
        <li>All entries in <code>consent_history</code> for the visitor ID</li>
        <li>The <code>visitors</code> record (IP hash, UA hash, geolocation)</li>
      </ul>
      <p>The visitor ID itself is a random UUID and contains no PII.</p>

      <h2>Data minimisation (Article 5(1)(c))</h2>
      <ul>
        <li>IP addresses are stored as SHA-256 hashes only — the raw IP is never persisted</li>
        <li>User agents are stored as SHA-256 hashes only</li>
        <li>Consent records contain only: visitor UUID, profile ID, consent choices, timestamp, source</li>
      </ul>

      <h2>Consent records as evidence</h2>
      <p>Every consent record includes:</p>
      <ul>
        <li><code>profile_version</code> — which version of the cookie policy the user consented to</li>
        <li><code>created_at</code> / <code>updated_at</code> — exact ISO 8601 timestamps</li>
        <li><code>source</code> — <code>'banner'</code>, <code>'api'</code>, or <code>'import'</code></li>
        <li><code>consent_history</code> — immutable append-only log of every change</li>
      </ul>

      <h2>Legitimate Interest (Article 6(1)(f))</h2>
      <p>Configure categories with <code>type: 'legitimate_interest'</code> in your profile:</p>
      <CodeBlock lang="json" code={`{
  "id": "ad_personalization",
  "type": "legitimate_interest",
  "legitimateInterest": {
    "enabled": true,
    "description": "We show relevant ads under legitimate interest."
  }
}`} />
      <p>Status values for LI cookies:</p>
      <ul>
        <li><code>"granted"</code> — user did not object</li>
        <li><code>"objected"</code> — user exercised their right to object (GDPR Art. 21)</li>
      </ul>
      <Callout type="info">
        The <code>'objected'</code> status is only valid for <code>type: 'legitimate_interest'</code> cookies.
        The server rejects <code>'objected'</code> for standard consent cookies.
      </Callout>

      <h2>Re-consent on profile version bump</h2>
      <p>
        When you update a profile (e.g. adding new cookies), the <code>version</code> field increments.
        The widget's <code>verify</code> endpoint returns <code>&#123; valid: false, reasons: ['profile_version_mismatch'] &#125;</code>
        for consents given under an older version, triggering the banner to show again.
      </p>

      <h2>Banner requirements</h2>
      <Callout type="warning">
        Under GDPR, the "Reject Optional" option must be as prominent as "Accept All". Do not use dark patterns
        such as grey-out reject buttons or hiding the reject option behind extra clicks.
        Consenti's default profile is compliant, but custom profiles are your responsibility.
      </Callout>
      <ul>
        <li>Do not set <code>overlayOpacity</code> above 0 if users can't access site content without consenting</li>
        <li>Always provide a way to withdraw consent (use <code>CookieTrigger</code> or <code>widget.showModal()</code> from a footer link)</li>
        <li>Mandatory cookies must be truly necessary — don't mark analytics as mandatory</li>
      </ul>
    </div>
  )
}
