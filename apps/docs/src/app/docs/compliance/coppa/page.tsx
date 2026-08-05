import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

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
      <ComplianceTierBadge tier="partial" />
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
        Age gate is a <strong>per-profile, per-locale</strong> dashboard setting, not a
        <code>createConsenti()</code>/<code>ConsentiSetup()</code> config option — one global age
        doesn&apos;t fit every jurisdiction a multi-region deployment serves. In the dashboard&apos;s
        Profile Editor:
      </p>
      <ol>
        <li>Step 1 → enable &quot;Age gate&quot;, set minimum age to 13, check &quot;Require parental consent&quot;.</li>
        <li>
          Main Banner content step → author the age-gate modal&apos;s heading, body text, and
          Yes/No button labels for each locale you support.
        </li>
      </ol>
      <p>
        The widget reads this straight off the resolved profile (<code>profile.ageGate</code>/
        <code>profile.ageGateModal</code>) — no separate widget-side config needed. For a
        standalone/local profile (<code>registerProfile()</code>), set <code>ageGate</code>/
        <code>ageGateModal</code> directly on the <code>EmbeddedProfile</code>/
        <code>EmbeddedTranslations</code> you register instead.
      </p>

      <h2>How it works</h2>
      <p>
        When the active profile&apos;s <code>ageGate.enabled: true</code>, the widget shows a Yes/No
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
          widget requests a <code>parentalConsentToken</code> from the backend (signed with{' '}
          <code>compliance.dataSigningHash</code>, auto-generated if not set) and fires a{' '}
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
        Consenti mints a stateless, signed <code>parentalConsentToken</code> and emits it — no
        server-side persistence of the token itself, and no email-sending infrastructure in this
        zero-runtime-dependency package. Both the request and the resolve step are plumbing for
        your own out-of-band verification process, for example:
      </p>
      <ol>
        <li>
          Widget declines → calls <code>POST /consent/:visitorId/parental-consent-request</code>,
          fires <code>consenti:parentalConsentRequired</code> with the returned token
        </li>
        <li>
          Your <code>eventBus.on('consent.parentalConsentRequired', ...)</code> listener sends the
          parent an email with a verification link containing the token
        </li>
        <li>Parent clicks the link → your backend verifies them however you choose</li>
        <li>
          Once verified, call <code>POST /consent/parental-consent-resolve</code> with{' '}
          <code>{'{ token }'}</code> — either from the parent&apos;s page (via{' '}
          <code>resolveParentalConsent()</code> from <code>@consenti/ui</code>) or server-side.
          Consenti emits <code>consent.parentalConsentGranted</code>; your own{' '}
          <code>eventBus</code> listener decides what &quot;granted&quot; means for stored consent
          (e.g. call <code>PUT /consent/:visitorId</code> yourself) — Consenti doesn&apos;t update
          the record automatically.
        </li>
      </ol>
      <Callout type="warning">
        Token replay isn&apos;t prevented — there&apos;s no persistence to mark a token
        &quot;used,&quot; an accepted tradeoff of staying fully stateless.{' '}
        <code>compliance.dataSigningHash</code> is auto-generated in memory if you don&apos;t set
        it, so tokens are always signed — but with an ephemeral, unpersisted key unless you set it
        explicitly, meaning a server restart between issuing and resolving a token invalidates it.
        Set <code>compliance.dataSigningHash</code> before relying on this in production.
      </Callout>

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
