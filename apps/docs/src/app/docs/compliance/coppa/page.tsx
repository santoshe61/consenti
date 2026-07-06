import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'COPPA Compliance Guide' }

export default function COPPAPage() {
  return (
    <div className="prose max-w-none">
      <h1>COPPA Compliance Guide</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>general-privacy-consent</code> — full-flexibility
        mode; configure your profile to show age-gated consent for children under 13.
        Use <code>compliance: {'{ type: \'general-privacy-consent\' }'}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        COPPA (Children's Online Privacy Protection Act) applies to websites and online services
        directed at children under 13 in the United States.
      </p>

      <h2>Configuration</h2>
      <CodeBlock lang="ts" code={`createConsenti({
  ageGate: {
    enabled: true,
    minimumAge: 13,
    requireParentalConsent: true,
  },
})`} />

      <h2>How it works</h2>
      <p>When <code>ageGate.enabled: true</code>:</p>
      <ol>
        <li>The frontend widget shows an age verification screen before the consent banner</li>
        <li>If the user indicates they are under <code>minimumAge</code>, consent submission is blocked</li>
        <li>If <code>requireParentalConsent: true</code>, the form collects a <code>parentalConsentToken</code></li>
        <li>The <code>age_verified</code> and <code>parental_consent_token</code> fields are stored on the consent record</li>
      </ol>

      <h2>API fields</h2>
      <CodeBlock lang="json" code={`{
  "visitorId": "uuid",
  "consentJson": { "analytics": "denied" },
  "ageVerified": true,
  "parentalConsentToken": "signed-token-from-parent-flow"
}`} />

      <h2>Parental consent flow</h2>
      <p>
        Consenti does not implement the parental consent flow itself — it stores the token your system generates.
        A typical flow:
      </p>
      <ol>
        <li>Child enters age, is redirected to parental consent page</li>
        <li>Parent enters email, receives verification link</li>
        <li>Parent clicks link → your system generates a signed JWT</li>
        <li>JWT is passed as <code>parentalConsentToken</code> when submitting consent</li>
      </ol>

      <h2>Dashboard filtering</h2>
      <p>
        In the admin dashboard, consent records with <code>age_verified: true</code> are flagged
        so compliance officers can audit them separately.
      </p>

      <Callout type="danger">
        COPPA applies to <strong>operators</strong>, not technology vendors.
        You are responsible for implementing the full parental consent flow.
        Consenti provides the infrastructure; your legal team determines whether COPPA applies to your service.
      </Callout>

      <Callout type="warning">
        For services <strong>not</strong> directed at children: implement age screening.
        Redirect users who indicate they are under 13 away from your service entirely
        (do not simply deny consent). This is a legal requirement, not a UX choice.
      </Callout>
    </div>
  )
}
