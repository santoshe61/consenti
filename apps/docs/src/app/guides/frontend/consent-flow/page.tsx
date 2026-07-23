import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'How Consent Flow Works — Frontend Guide — Consenti',
  description:
    'Follow a consent decision from first visit through banner interaction to cookie storage and events.',
  alternates: { canonical: '/guides/frontend/consent-flow' },
  openGraph: {
    title: 'How Consent Flow Works — Frontend Guide — Consenti',
    description:
      'Follow a consent decision from first visit through banner interaction to cookie storage and events.',
    url: 'https://consenti.dev/guides/frontend/consent-flow',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Consent Flow Works — Frontend Guide — Consenti',
    description:
      'Follow a consent decision from first visit through banner interaction to cookie storage and events.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendConsentFlowGuide() {
  return (
    <div className="prose max-w-none">
      <h1>How Consent Flow Works</h1>
      <p className="lead">
        Understanding the consent lifecycle makes it easier to build features around it — gating
        analytics, reacting to preference changes, or triggering re-consent. This guide walks the
        full journey from a visitor&apos;s first page load to a stored consent record.
      </p>

      <h2>The lifecycle at a glance</h2>
      <div className="not-prose my-6 p-5 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 font-mono text-sm text-slate-700 dark:text-gray-300 leading-loose">
        <p className="m-0">
          1. Page loads → <code>new ConsentiSetup()</code> called
          <br />
          2. Widget checks for an existing consent cookie
          <br />
          3. No cookie → profile resolved → banner injected
          <br />
          4. Visitor clicks &quot;Accept All&quot; (or customises)
          <br />
          5. Cookie written to browser
          <br />
          6. <code>consenti:consentSubmitted</code> event fires on <code>window</code>
          <br />
          7. Next page load → cookie found → banner stays hidden
        </p>
      </div>

      <h2>Stage 1 — Widget initialisation</h2>
      <p>
        The moment <code>new ConsentiSetup(config)</code> runs, the widget checks
        <code>document.cookie</code> for a cookie matching the pattern <code>consenti_*</code>.
      </p>
      <ul>
        <li>
          <strong>Cookie found and valid</strong> — widget initialises silently. No banner. The{' '}
          <code>consenti:bannerInitialized</code> event fires with{' '}
          <code>{'{ visible: false }'}</code>.
        </li>
        <li>
          <strong>No cookie (first visit) or cookie expired</strong> — widget proceeds to profile
          resolution.
        </li>
      </ul>

      <CodeBlock
        lang="typescript"
        code={`const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })

// Called once widget is fully initialised — regardless of banner visibility
widget.onReady(() => {
  console.log('Has prior consent?', widget.hasConsent())
})`}
      />

      <h2>Stage 2 — Profile resolution</h2>
      <p>
        Without an existing consent record, Consenti downloads a compliance profile — the data that
        describes the banner layout, button labels, cookie categories, and GPC settings.
      </p>
      <p>Profiles can come from three places (in priority order):</p>
      <ol>
        <li>
          <strong>API-backed</strong> (<code>api.enabled: true</code>) — the widget calls your
          backend&apos;s <code>/resolve-profile</code> endpoint, which returns a URL to the right
          locale JSON file.
        </li>
        <li>
          <strong>Fixed group</strong> (<code>compliance.type: 'opt-in'</code>) — the widget
          directly loads the matching pre-built profile chunk. No network call beyond the chunk
          itself.
        </li>
        <li>
          <strong>Client-side auto</strong> (<code>compliance.type: 'auto'</code>, no API) — the
          widget reads <code>Intl.DateTimeFormat().resolvedOptions().timeZone</code> and{' '}
          <code>navigator.language</code>, maps them to a compliance group, then loads that
          pre-built chunk.
        </li>
      </ol>

      <Callout type="info">
        Profile JSON is cached in <code>sessionStorage</code> for the tab&apos;s lifetime.
        Navigating between pages never re-fetches the profile.
      </Callout>

      <h2>Stage 3 — Banner shown</h2>
      <p>
        Once the profile is loaded, the widget injects the banner into the DOM (appended to{' '}
        <code>document.body</code> by default, or your custom <code>rootEl</code>). The{' '}
        <code>consenti:bannerVisibility</code> event fires with{' '}
        <code>{'{ visible: true, type: "main" }'}</code>.
      </p>
      <p>
        If GPC is active and the profile&apos;s <code>gpcMode</code> is <code>'honor'</code> or{' '}
        <code>'strict'</code>, a GPC banner variant appears instead (or no banner at all for{' '}
        <code>'strict'</code>).
      </p>

      <h2>Stage 4 — Visitor interacts</h2>
      <p>The visitor has three paths:</p>
      <ul>
        <li>
          <strong>Accept All</strong> — grants all cookies in the profile.
        </li>
        <li>
          <strong>Reject Optional</strong> — grants only mandatory cookies; denies everything else.
        </li>
        <li>
          <strong>Customise</strong> — opens the preference modal where each category can be toggled
          individually.
        </li>
      </ul>
      <p>
        When a button is clicked, <code>consenti:consentBeingSubmitted</code> fires immediately
        (before the cookie is written). Use this to show a loading indicator if needed.
      </p>

      <h2>Stage 5 — Cookie written</h2>
      <p>After the visitor&apos;s choice is captured, Consenti writes a single cookie:</p>
      <CodeBlock
        lang="text"
        code={`consenti_{userId}_{profileId}=t:{timestamp}::{cookieId}:{status}|{cookieId}:{status}|…`}
      />

      <p>Example:</p>
      <CodeBlock
        lang="text"
        code={`consenti_a1b2c3_default=t:1782133054::analytics:granted|marketing:denied|necessary:granted`}
      />

      <p>
        The cookie lifetime equals the profile&apos;s <code>expiryDays</code> (default 365,
        profile-wide — not set per cookie). When it expires, the next visit triggers re-consent
        automatically.
      </p>

      <Callout type="tip">
        Enable HMAC signing for tamper detection by setting <code>core.cookieSigningKey</code> to a
        32+ character secret. A <code>::sig:{'{hmac}'}</code> suffix is appended to the cookie value
        and verified on every read.
      </Callout>

      <h2>Stage 6 — Event fires</h2>
      <p>
        Once the cookie is written, <code>consenti:consentSubmitted</code> fires on{' '}
        <code>window</code>. This is your hook to enable or disable third-party scripts based on the
        visitor&apos;s choices.
      </p>

      <CodeBlock
        lang="typescript"
        code={`// Using the typed widget method (recommended)
widget.on('consentSubmitted', (data) => {
  const { consentJson } = data
  // consentJson = { analytics: 'granted', marketing: 'denied', necessary: 'granted' }

  if (consentJson.analytics === 'granted') {
    initGoogleAnalytics()
  }

  if (consentJson.marketing === 'denied') {
    disableAdPixels()
  }
})

// Or a raw DOM listener
window.addEventListener('consenti:consentSubmitted', (e) => {
  const { consentJson } = e.detail
})`}
      />

      <h2>Stage 7 — Subsequent visits</h2>
      <p>
        On every page load after the initial consent, Consenti reads the cookie, validates it
        (checks the consent&apos;s <code>profileId</code> still matches the compliance group&apos;s
        currently active profile id, the <code>expiryDays</code> window, and the HMAC signature if
        signing is enabled), and if valid suppresses the banner entirely. The widget is still
        initialised and available for programmatic use — <code>widget.getConsent()</code>,{' '}
        <code>widget.showModal()</code>, etc.
      </p>

      <Callout type="warning">
        If you edit your profile (add new categories, change cookie IDs), a new profile{' '}
        <code>id</code> becomes active and the stored consent no longer matches it — verification
        returns <code>profile_changed</code> and the banner re-shows automatically. Call{' '}
        <code>widget.reConsent()</code> to force this manually.
      </Callout>

      <h2>Checking consent in your own code</h2>

      <CodeBlock
        lang="typescript"
        code={`// Gate a feature on a single cookie
if (widget.isCookieGranted('analytics')) {
  initAnalytics()
}

// Read the full consent record
const consent = widget.getConsent()
// { analytics: 'granted', marketing: 'denied', necessary: 'granted' }

// Check when the visitor last consented
const date = widget.getConsentDate()  // Date | false`}
      />

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/events/',
            label: 'Events',
            desc: 'Full reference for every consenti:* event in the lifecycle',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'getConsent, isCookieGranted, reConsent, getConsentDate, and more',
          },
          {
            href: '/docs/ui/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'cookieSigningKey, cookieDomains, expiryDays, and every other option',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'What happens when the consent cookie expires?',
            answer: (
              <p className="m-0">
                The browser deletes the cookie automatically once it expires. The next time the
                visitor loads the page, Consenti finds no cookie and re-shows the banner. The
                visitor must consent again. The expiry duration is set once, profile-wide, via the{' '}
                <code>expiryDays</code> field (in days, default 365) — not per cookie.
              </p>
            ),
          },
          {
            question: "What's the difference between 'granted', 'denied', and 'objected'?",
            answer: (
              <>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    <strong>granted</strong> — the visitor actively accepted this cookie category.
                  </li>
                  <li>
                    <strong>denied</strong> — the visitor actively rejected it, or it was pre-denied
                    (e.g. by GPC).
                  </li>
                  <li>
                    <strong>objected</strong> — used for legitimate interest cookies. The visitor
                    lodged an objection rather than giving or withholding consent.
                  </li>
                </ul>
              </>
            ),
          },
          {
            question: 'How do I trigger a re-consent flow?',
            answer: (
              <p className="m-0">
                Call <code>widget.reConsent()</code>. This deletes the stored consent cookie (and
                the backend record if <code>api.enabled</code> is true), then re-shows the banner.
                Alternatively, delete the backend profile&apos;s consent record via{' '}
                <code>DELETE /consenti/api/v1/consent/{'{visitorId}'}</code>.
              </p>
            ),
          },
          {
            question: 'Does the consent cookie sync across tabs?',
            answer: (
              <p className="m-0">
                Yes, via <code>BroadcastChannel</code>. When a visitor submits consent in one tab,
                all other same-origin tabs receive a <code>{'{ type: "consentUpdated" }'}</code>{' '}
                message and update their state without reloading. Cross-subdomain sync uses the
                backend API cookie (requires <code>api.enabled: true</code> and{' '}
                <code>core.cookieDomains</code> configured to a shared root domain like{' '}
                <code>.example.com</code>).
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
