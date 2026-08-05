import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Right to Erasure ("Right to Be Forgotten") — Consenti',
  description:
    'How GDPR Art. 17, CCPA/CPRA, LGPD Art. 18, and equivalent erasure rights work end to end in Consenti: the server-side DELETE endpoint, the preference modal\'s "Forget me" button, and the events both sides fire.',
  keywords: [
    'right to erasure',
    'right to be forgotten',
    'GDPR Article 17',
    'CCPA right to delete',
    'forget me button',
    'consent erasure API',
  ],
  alternates: { canonical: '/guides/hot-topics/right-to-erasure' },
  openGraph: {
    title: 'Right to Erasure ("Right to Be Forgotten") — Consenti',
    description:
      'How GDPR Art. 17, CCPA/CPRA, LGPD Art. 18, and equivalent erasure rights work end to end in Consenti: the server-side endpoint, the widget\'s "Forget me" button, and the events both sides fire.',
    url: 'https://consenti.dev/guides/hot-topics/right-to-erasure',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Right to Erasure ("Right to Be Forgotten") — Consenti',
    description:
      'How GDPR Art. 17, CCPA/CPRA, LGPD Art. 18, and equivalent erasure rights work end to end in Consenti.',
    images: ['/og-image.jpg'],
  },
}

export default function RightToErasureGuidePage() {
  return (
    <div className="prose max-w-none">
      <h1>Right to Erasure (&quot;Right to Be Forgotten&quot;)</h1>
      <p className="lead">
        Almost every consent-related privacy law gives a visitor some form of right to have their
        data deleted — GDPR calls it the right to erasure (Article 17), CCPA/CPRA calls it the
        right to delete, LGPD, KVKK, POPIA, and the rest have their own names and article numbers
        for essentially the same idea. This guide covers how that right is implemented in
        Consenti end to end: the server-side erasure endpoint, the preference modal&apos;s{' '}
        &quot;Forget me&quot; button, and the events both sides fire so you can wire the parts of
        the flow that are legitimately your responsibility, not the CMP&apos;s.
      </p>

      <h2>What Consenti erases vs. what&apos;s your responsibility</h2>
      <p>
        A CMP only ever holds one narrow slice of a visitor&apos;s data: their consent record —
        which cookie/tracking categories they agreed to, when, and under which profile version.
        Consenti erases <em>that</em> slice completely, instantly, and without friction, because
        it&apos;s the one thing the CMP can delete with full confidence and no risk of deleting
        the wrong person&apos;s data.
      </p>
      <p>
        A full erasure request usually reaches further than that, though — into your CRM,
        analytics warehouse, order history, support tickets, and any third-party processor you
        pass data to. None of that is something a cookie-consent widget can see or safely touch,
        and regulators generally expect identity verification and a response window (GDPR gives
        you a month) before a broader erasure request is fulfilled — not an instant, unverified
        self-service delete.
      </p>
      <p>So the split is deliberate:</p>
      <ul>
        <li>
          <strong>Consenti erases its own consent record instantly, self-service, no
            verification.</strong> There&apos;s nothing to verify — a signed ownership cookie
          already proves the request came from the same browser that gave the consent in the
          first place.
        </li>
        <li>
          <strong>Consenti fires events on both erasure paths</strong> (server-side{' '}
          <code>consent:erased</code> on the eventBus, client-side{' '}
          <code>consenti:forgetMeRequested</code>/<code>consenti:forgotten</code> on the widget)
          so your own backend and frontend code can hook in and run whatever broader,
          identity-verified erasure workflow your business actually needs — deleting the visitor
          from your CRM, DMP, or analytics platform, or kicking off a formal DSAR case if your
          data footprint requires one.
        </li>
      </ul>
      <Callout type="tip">
        If your business only processes what the consent record itself tracks — no separate CRM
        row, no server-side user profile keyed to the visitor — the CMP-side erasure described
        below may already satisfy the regulation&apos;s requirement on its own. If you hold more
        data than that elsewhere, treat these events as the trigger for your own DSAR process, not
        as the whole answer.
      </Callout>

      <h2>The compliance mapping</h2>
      <p>
        Same right, different name and article number depending on the regulation. Every one of
        these maps onto the identical <code>DELETE /consent/:visitorId</code> endpoint described
        below:
      </p>
      <table>
        <thead>
          <tr>
            <th>Regulation</th>
            <th>Where it&apos;s defined</th>
            <th>Compliance guide</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GDPR (EU)</td>
            <td>Article 17 — Right to erasure</td>
            <td><Link href="/docs/compliance/gdpr/">GDPR guide</Link></td>
          </tr>
          <tr>
            <td>UK GDPR</td>
            <td>Art. 17, applies identically to EU GDPR</td>
            <td><Link href="/docs/compliance/uk-gdpr/">UK GDPR guide</Link></td>
          </tr>
          <tr>
            <td>CCPA / CPRA (California)</td>
            <td>Right to delete</td>
            <td>
              <Link href="/docs/compliance/ccpa/">CCPA guide</Link> ·{' '}
              <Link href="/docs/compliance/cpra/">CPRA guide</Link>
            </td>
          </tr>
          <tr>
            <td>LGPD (Brazil)</td>
            <td>Art. 18 — Right to erasure</td>
            <td><Link href="/docs/compliance/lgpd/">LGPD guide</Link></td>
          </tr>
          <tr>
            <td>DPDPA (India)</td>
            <td>Section 12 — Erasure (Section 6 covers withdrawal)</td>
            <td><Link href="/docs/compliance/dpdpa/">DPDPA guide</Link></td>
          </tr>
          <tr>
            <td>KVKK (Turkey)</td>
            <td>Article 7 — Right to request deletion</td>
            <td><Link href="/docs/compliance/kvkk/">KVKK guide</Link></td>
          </tr>
          <tr>
            <td>PIPEDA / Law 25 (Canada)</td>
            <td>Right to access and erasure</td>
            <td><Link href="/docs/compliance/pipeda/">PIPEDA guide</Link></td>
          </tr>
          <tr>
            <td>PDPA (Thailand)</td>
            <td>Erasure</td>
            <td><Link href="/docs/compliance/pdpa-th/">PDPA Thailand guide</Link></td>
          </tr>
          <tr>
            <td>APPI (Japan)</td>
            <td>Erasure</td>
            <td><Link href="/docs/compliance/appi/">APPI guide</Link></td>
          </tr>
          <tr>
            <td>POPIA (South Africa)</td>
            <td>Section 24 — Erasure and access</td>
            <td><Link href="/docs/compliance/popia/">POPIA guide</Link></td>
          </tr>
        </tbody>
      </table>

      <h2>Server-side: the erasure endpoint</h2>
      <CodeBlock lang="http" code={`DELETE /consenti/api/v1/consent/:visitorId`} />
      <p>This deletes, for the given visitor ID:</p>
      <ul>
        <li>Every entry in <code>consent_records</code></li>
        <li>Every entry in <code>consent_history</code></li>
        <li>The <code>visitors</code> record (IP hash, UA hash, geolocation)</li>
      </ul>
      <p>
        The visitor ID itself is a random UUID with no PII embedded in it, and the request is
        ownership-verified — only the browser that originally submitted the consent (proven by a
        signed <code>consenti_&#123;visitorId&#125;</code> cookie) can erase it. The response also
        expires that ownership cookie.
      </p>
      <p>
        Deletion fires a <code>consent:erased</code> event on the server-side <code>eventBus</code>{' '}
        — this is the hook for cascading the erasure into your own systems:
      </p>
      <CodeBlock
        lang="typescript"
        code={`eventBus.on('consent:erased', ({ visitorId }) => {
  // Remove the visitor from your own DMP / analytics / CRM
  myDmpClient.deleteUser(visitorId)
})`}
      />
      <Callout type="danger">
        The <code>audit_logs</code> table is append-only by design — the erasure request itself
        is logged there and that log entry is retained as compliance evidence (most regulations,
        including GDPR Art. 17(3)(b), carve out an exception for records you&apos;re legally
        obligated to keep). Only the consent data itself is deleted, never the fact that an
        erasure happened.
      </Callout>

      <h2>Client-side: the preference modal&apos;s &quot;Forget me&quot; button</h2>
      <p>
        The widget doesn&apos;t expose this by default — a host developer has to opt in, because
        it&apos;s a destructive, one-way action that not every profile wants surfaced as a
        one-click button. There are two authoring steps, both in the dashboard.
      </p>

      <h3>1. Enable it on the UI Template</h3>
      <p>
        Open the profile&apos;s linked UI Template (<strong>Banners → UI Templates</strong>), go
        to the <strong>Preference Modal</strong> step, and check{' '}
        <strong>&quot;Show &apos;Forget me&apos; button&quot;</strong> — right next to{' '}
        <strong>&quot;Show locale switcher&quot;</strong>. This is a structural, per-template
        toggle (<code>preferenceModal.showForgetMe</code>), the same category as{' '}
        <code>showClose</code> or <code>trapFocus</code> — it controls whether the slot exists at
        all, shared by every profile that uses this template.
      </p>

      <h3>2. Author the button&apos;s label</h3>
      <p>
        Back in the profile editor&apos;s content step (Step 4, Preference Modal), a{' '}
        <strong>&quot;Forget Me Button&quot;</strong> section appears once the template flag above
        is on — author the button&apos;s label per locale, same pattern as the consent-receipt
        checkbox&apos;s label. Falls back to &quot;Forget me&quot; if left blank.
      </p>

      <h3>Runtime behavior</h3>
      <ul>
        <li>
          Rendered in the modal body, below the categories — only for visitors who already have a
          stored consent decision (<code>widget.hasConsent()</code>). A first-time visitor has
          nothing to erase yet, so the button doesn&apos;t render for them.
        </li>
        <li>
          Clicking it asks for confirmation (the action is destructive and can&apos;t be undone),
          then calls <code>widget.forgetMe()</code> — see below.
        </li>
        <li>
          After erasure, the banner (or age-gate, if the profile has one) re-prompts automatically,
          the same way <code>reConsent()</code> already behaves — the visitor is back to a
          no-consent state, so the compliance banner has to reappear.
        </li>
      </ul>

      <h2>Events</h2>
      <p>
        <code>forgetMe()</code> dispatches two widget events, mirroring the server&apos;s{' '}
        <code>consent:erased</code>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Fired</th>
            <th>Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>consenti:forgetMeRequested</code></td>
            <td>Right before the erasure call goes out</td>
            <td>Kick off your own identity-verified erasure workflow in parallel</td>
          </tr>
          <tr>
            <td><code>consenti:forgotten</code></td>
            <td>After the consent record is erased and the banner/age-gate has re-prompted</td>
            <td>Confirm-and-log, analytics, redirect to a &quot;you&apos;ve been forgotten&quot; page</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="typescript"
        code={`import type { ConsentEvent } from '@consenti/ui'

widget.on('forgetMeRequested', (data: ConsentEvent) => {
  // e.g. queue your own backend DSAR intake for this visitor
  fetch('/api/dsar/erasure-request', {
    method: 'POST',
    body: JSON.stringify({ visitorId: data.visitorId }),
  })
})

widget.on('forgotten', (data: ConsentEvent) => {
  console.log('Consent record erased for', data.visitorId, 'at', data.timestamp)
})`}
      />

      <h2>Other ways to trigger erasure</h2>
      <p>
        The preference modal button isn&apos;t the only way in — all three methods below are
        public and can be wired to a custom link anywhere on your site (a footer, an
        account/privacy-settings page):
      </p>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Erases the record</th>
            <th>Re-prompts banner/age-gate</th>
            <th>Fires forget-me events</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>widget.deleteConsent()</code></td>
            <td>Yes</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>widget.reConsent(resetAgeGate?)</code></td>
            <td>Yes</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>widget.forgetMe(resetAgeGate?)</code></td>
            <td>Yes</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
      <p>
        Use <code>deleteConsent()</code> if you&apos;re about to show your own custom UI next and
        don&apos;t want the banner popping up first. Use <code>reConsent()</code> for a plain
        &quot;change my cookie settings&quot; link that isn&apos;t framed as an erasure/rights
        request. Use <code>forgetMe()</code> whenever the action is user-facing as a right — a
        &quot;Delete my data&quot; or &quot;Forget me&quot; link — so the events are there for you
        to hook into.
      </p>
      <CodeBlock
        lang="html"
        code={`<a href="#" id="delete-my-data">Delete my data</a>
<script>
  document.querySelector('#delete-my-data').addEventListener('click', (e) => {
    e.preventDefault()
    window.__consenti?.forgetMe()
  })
</script>`}
      />

      <RelatedDocs
        items={[
          {
            href: '/docs/compliance/gdpr/',
            label: 'GDPR Compliance Guide',
            desc: 'Article 17 in full context, alongside opt-in mode and legitimate interest',
          },
          {
            href: '/docs/api/routes/public/',
            label: 'Public API Routes',
            desc: 'Full reference for the DELETE /consent/:visitorId endpoint',
          },
          {
            href: '/docs/api/events/',
            label: 'Server Events',
            desc: 'Every eventBus event, including consent:erased',
          },
          {
            href: '/docs/ui/events/',
            label: 'Widget Events',
            desc: 'Every consenti:* event, including forgetMeRequested/forgotten',
          },
          {
            href: '/docs/ui/methods/',
            label: 'Widget API Methods',
            desc: 'deleteConsent(), reConsent(), forgetMe(), and the rest of the public API',
          },
          {
            href: '/docs/ui/advanced-profiles/',
            label: 'Advanced Profile Reference',
            desc: 'The full PreferenceModal field list, including showForgetMe/forgetMeLabel',
          },
          {
            href: '/guides/backend/consent-flow/',
            label: 'Consent Flow (Backend)',
            desc: 'Trace a consent record from POST through storage to erasure',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Does erasing the consent record satisfy GDPR Article 17 by itself?',
            answer: (
              <p className="m-0">
                Only if the consent record is the only personal data you hold on that visitor. If
                your own backend also stores a user profile, order history, or analytics data tied
                to them, you still need to erase that separately — use the{' '}
                <code>consent:erased</code>/<code>consenti:forgetMeRequested</code> events as the
                trigger for that broader process, not as a substitute for it.
              </p>
            ),
          },
          {
            question: 'Why isn’t the "Forget me" button shown by default?',
            answer: (
              <p className="m-0">
                It&apos;s a destructive, one-way action — deleting a consent record means the
                visitor loses their saved preferences and gets re-prompted. Not every site wants
                that surfaced as a one-click button inside the modal; it&apos;s an explicit opt-in
                on the UI Template so you decide whether it fits your flow.
              </p>
            ),
          },
          {
            question: 'Can I place the erasure action outside the preference modal instead?',
            answer: (
              <p className="m-0">
                Yes — <code>widget.forgetMe()</code> (or <code>deleteConsent()</code>/
                <code>reConsent()</code> for less event-heavy variants) is a public method you can
                wire to any element: a privacy-settings page, an account-deletion flow, or a
                footer link, without touching the preference modal at all.
              </p>
            ),
          },
          {
            question: 'Is the erasure request itself logged anywhere?',
            answer: (
              <p className="m-0">
                Yes — <code>audit_logs</code> is append-only, and the erasure action is recorded
                there with the visitor ID and timestamp before the consent data itself is deleted.
                That log entry is what most regulations expect you to retain as evidence the
                request was honoured, even though the underlying consent data is gone.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
