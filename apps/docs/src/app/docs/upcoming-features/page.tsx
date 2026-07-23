import type { Metadata } from 'next'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Upcoming Features',
  description:
    'Features that exist in the Consenti codebase but are intentionally disabled or unimplemented in the current release.',
  alternates: { canonical: '/docs/upcoming-features' },
  openGraph: {
    title: 'Upcoming Features',
    description:
      'Features that exist in the Consenti codebase but are intentionally disabled or unimplemented in the current release.',
    url: 'https://consenti.dev/docs/upcoming-features',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upcoming Features',
    description:
      'Features that exist in the Consenti codebase but are intentionally disabled or unimplemented in the current release.',
    images: ['/og-image.jpg'],
  },
}

export default function UpcomingFeaturesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Upcoming Features</h1>
      <p>
        Features listed here exist in the codebase in some form — a route, a service, a database
        table, a dashboard panel — but are intentionally disabled or unimplemented in the current
        release. They&apos;re kept in place, dormant, as a documented starting point rather than
        deleted outright, in case the underlying idea is revisited with a design that addresses why
        it was held back.
      </p>

      <h2>Proof of notice</h2>
      <Callout type="warning">
        Disabled. The <code>POST /notice-shown</code> and{' '}
        <code>GET /visitors/:visitorId/notice-shown</code> routes both return 404, the widget never
        calls either, and the dashboard&apos;s Visitor detail panel no longer shows this section.
      </Callout>
      <p>
        The idea: record that the consent banner was actually rendered to a visitor, independent of
        whether they ever interacted with it — evidence that a &quot;notice was shown&quot; even to
        someone who never made a decision.
      </p>
      <p>Why it&apos;s held back rather than shipped:</p>
      <ul>
        <li>
          It requires minting a persistent visitor identifier <em>before</em> any consent decision
          exists, purely to correlate a pre-decision impression ping with later records. That
          conflicts directly with this project&apos;s core design principle: no identifier is
          created or written to storage until a consent decision actually happens (see{' '}
          <a href="/docs/ui/configuration">UI Configuration</a>).
        </li>
        <li>
          No mainstream CMP ships this as a
          per-visitor tracked feature. Their compliance evidence is decision-scoped — a receipt
          created when a choice is made — not impression-scoped.
        </li>
        <li>
          It isn&apos;t required by GDPR. The actual evidentiary obligation (Art. 7(1)) is to
          demonstrate that consent <em>was given</em>, when it was given — not that notice was
          passively displayed to someone who never decided.
        </li>
        <li>
          In practice, regulators verify banner behavior by testing the live site themselves (fresh
          browser, inspect the network tab) rather than relying on a site&apos;s own impression logs
          — so the evidentiary value is low relative to the tracking surface it adds.
        </li>
      </ul>
      <p>
        What&apos;s still in the codebase, dormant: the <code>notice_shown</code> table/collection
        across all storage adapters, <code>NoticeRepo</code> / <code>NoticeService</code>, both
        routes (guarded behind a <code>NOTICE_SHOWN_ENABLED</code> flag hardcoded to{' '}
        <code>false</code>), and the dashboard&apos;s <code>visitorsApi.noticeShown()</code> client
        call. See the <a href="/docs/api/routes/admin">Admin Routes</a> reference for the disabled
        endpoint.
      </p>
      <p>
        If this is revisited, the design that would actually fit the project&apos;s principles is an
        anonymous, aggregate impression counter (banner rendered N times for profile X on date Y) —
        no per-visitor identifier, no join key back to the Visitor table — rather than a per-visitor
        log.
      </p>
    </div>
  )
}
