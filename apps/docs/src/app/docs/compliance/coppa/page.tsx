import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'COPPA Compliance Guide',
  description:
    'COPPA compliance guide for Consenti — age gates and consent rules for websites and online services directed at children under 13 in the US.',
  alternates: { canonical: '/docs/compliance/coppa' },
  openGraph: {
    title: 'COPPA Compliance Guide',
    description:
      'COPPA compliance guide for Consenti — age gates and consent rules for websites and online services directed at children under 13 in the US.',
    url: 'https://consenti.dev/docs/compliance/coppa',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COPPA Compliance Guide',
    description:
      'COPPA compliance guide for Consenti — age gates and consent rules for websites and online services directed at children under 13 in the US.',
    images: ['/og-image.jpg'],
  },
}

export default function COPPAPage() {
  return (
    <div className="prose max-w-none">
      <h1>COPPA Compliance Guide</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>general-privacy-consent</code> — full-flexibility
        mode; configure your profile to show age-gated consent for children under 13. Use{' '}
        <code>compliance: {"{ type: 'general-privacy-consent' }"}</code> in your{' '}
        <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        COPPA (Children's Online Privacy Protection Act) applies to websites and online services
        directed at children under 13 in the United States.
      </p>

      <h2>Configuration</h2>
      <p>
        Two matching config blocks — server-side (so the field is accepted/stored) and widget-side
        (so the actual gating UI shows):
      </p>
      <CodeBlock
        lang="ts"
        code={`// apps/api — createConsenti({ ... })
createConsenti({
  ageGate: {
    enabled: true,
    minimumAge: 13,
    requireParentalConsent: true,
  },
})`}
      />
      <CodeBlock
        lang="ts"
        code={`// @consenti/ui — new ConsentiSetup({ ... })
new ConsentiSetup({
  compliance: {
    ageGate: {
      enabled: true,
      minimumAge: 13,
      requireParentalConsent: true,
    },
  },
})`}
      />

      <h2>How it works</h2>
      <p>
        When <code>compliance.ageGate.enabled: true</code>, the widget shows a Yes/No
        age-confirmation prompt before anything else — banner, GPC, CCPA opt-out all wait behind it
        on first visit:
      </p>
      <ol>
        <li>
          Confirmed (visitor is <code>minimumAge</code> or older) → normal banner/GPC/CCPA flow
          proceeds; every consent submission from then on carries <code>ageVerified: true</code>.
        </li>
        <li>
          Declined, <code>requireParentalConsent: false</code> → a deny-all consent is submitted
          immediately (mandatory/strictly-necessary cookies still granted),{' '}
          <code>ageVerified: false</code>, no banner shown.
        </li>
        <li>
          Declined, <code>requireParentalConsent: true</code> → same deny-all submission, plus the
          widget mints a <code>parentalConsentToken</code> itself and fires a{' '}
          <code>consenti:parentalConsentRequired</code> event carrying it — see{' '}
          <a href="/docs/ui/events">UI Events</a>.
        </li>
        <li>
          The <code>age_verified</code> and <code>parental_consent_token</code> columns are stored
          on the consent record either way.
        </li>
      </ol>

      <h2>API fields</h2>
      <CodeBlock
        lang="json"
        code={`{
  "visitorId": "uuid",
  "consentJson": { "analytics": "denied" },
  "ageVerified": false,
  "parentalConsentToken": "pcon_..."
}`}
      />

      <h2>Parental consent flow</h2>
      <p>
        Consenti mints the <code>parentalConsentToken</code> and stores it, but does not implement
        parental <em>verification</em> itself — there is no email-sending infrastructure in this
        zero-runtime-dependency package. The <code>consenti:parentalConsentRequired</code> event is
        the hook for wiring your own out-of-band process, for example:
      </p>
      <ol>
        <li>
          Widget declines → fires <code>consenti:parentalConsentRequired</code> with the token
        </li>
        <li>
          Your listener sends the parent an email with a verification link containing the token
        </li>
        <li>Parent clicks the link → your backend verifies them however you choose</li>
        <li>
          Once verified, your system calls <code>PUT /consent/:visitorId</code> to update the record
        </li>
      </ol>

      <h2>Dashboard filtering</h2>
      <p>
        In the admin dashboard, consent records with <code>age_verified: true</code> are flagged so
        compliance officers can audit them separately.
      </p>

      <Callout type="danger">
        COPPA applies to <strong>operators</strong>, not technology vendors. You are responsible for
        implementing the full parental consent flow. Consenti provides the infrastructure; your
        legal team determines whether COPPA applies to your service.
      </Callout>

      <Callout type="warning">
        For services <strong>not</strong> directed at children: implement age screening. Redirect
        users who indicate they are under 13 away from your service entirely (do not simply deny
        consent). This is a legal requirement, not a UX choice.
      </Callout>
    </div>
  )
}
