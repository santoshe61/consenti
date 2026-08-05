import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'
import {
  X
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Consenti, What-Why-How ? Why It Exists, and How It Stays Compliant',
  description:
    'What Consenti is, why it detects jurisdiction in the browser instead of shipping one banner for everyone, and the compliance-review process the project is working toward.',
  keywords: [
    'Consenti, What-Why-How ',
    'why Consenti',
    'consent management platform explained',
    'jurisdiction detection cookie banner',
    'open source CMP comparison',
  ],
  alternates: { canonical: '/guides/what-is-consenti' },
  openGraph: {
    title: 'Consenti, What-Why-How ? Why It Exists, and How It Stays Compliant',
    description:
      'What Consenti is, why it detects jurisdiction in the browser instead of shipping one banner for everyone, and how the project plans to keep pace with law changes.',
    url: 'https://consenti.dev/guides/what-is-consenti',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Consenti, What-Why-How ? Why It Exists, and How It Stays Compliant',
    description:
      'What Consenti is, why it detects jurisdiction in the browser instead of shipping one banner for everyone, and how the project plans to keep pace with law changes.',
    images: ['/og-image.jpg'],
  },
}

const COMPARISON_ROWS: Array<{ label: string; browserOnly: string; saas: string; consenti: string }> = [
  {
    label: 'Where jurisdiction is decided',
    browserOnly: 'Not decided at all — one banner for every visitor, you wire geo logic yourself',
    saas: 'Server-side, on the vendor’s infrastructure',
    consenti: 'In the browser itself, by default — timezone + language resolve visitors to the correct compliance group with zero network calls; an optional backend upgrades this to real IP geo-resolution',
  },
  {
    label: 'Works with no backend at all',
    browserOnly: 'Yes, but that’s all it does',
    saas: 'No — the vendor is the backend',
    consenti: 'Yes — jurisdiction-aware banner, consent storage, and events all run client-side',
  },
  {
    label: 'Consent API surface',
    browserOnly: 'Usually a single accepted/rejected flag',
    saas: 'Vendor-specific SDK, varies by product tier',
    consenti: 'getConsent(type?) with built-in mappers for GTM/Consent Mode v2, Meta, Adobe, Segment, plus generic; DOM events; React/Vue/Angular subpath exports',
  },
  {
    label: 'Extending it',
    browserOnly: 'Fork the source',
    saas: 'Whatever the vendor’s integration marketplace offers',
    consenti: 'Plugin system with lifecycle hooks — official BigQuery/Segment/Snowflake plugins, write your own for anything else',
  },
]

export default function WhatIsConsentiPage() {
  return (
    <div className="prose max-w-none">
      <h1>Consenti, What-Why-How ?</h1>
      <p className="lead">
        Consenti is an open-source Consent Management Platform (CMP). This page covers what that
        means in practice, why it&apos;s built the way it is, and how the project plans to keep its
        compliance coverage current as laws change.
      </p>

      <h2>What Consenti is</h2>
      <p>
        Consenti is a consent layer for your site: it shows a banner shaped by the regulation that
        applies to each visitor, blocks non-essential cookies and tracking scripts until consent is
        given, records what the visitor chose, and exposes that choice everywhere else on the page
        — your tag manager, analytics, ad pixels, and your own code — through a single API. It
        ships as two independent npm packages: <code>@consenti/ui</code>, the browser widget, and{' '}
        <code>@consenti/api</code>, an optional Node.js backend for durable storage, an admin
        dashboard, and an append-only audit log. Apache 2.0, zero external runtime dependencies on
        either side.
      </p>
      <p>
        The part that matters most: nothing non-essential loads until consent says it can.
        Blocking is the point — a banner that only <em>displays</em> a choice without gating what
        runs isn&apos;t doing the compliance work, it&apos;s decoration.
      </p>

      <h2>Why Consenti</h2>
      <p>
        Most open-source cookie banners run entirely in the browser and stop there — you get a
        banner, not jurisdiction awareness. Most hosted SaaS CMPs do detect jurisdiction, but the
        detection, the banner logic, and your consent data all live on the vendor&apos;s servers
        behind a monthly fee.
      </p>
      <p>
        Consenti&apos;s position: <strong>jurisdiction detection happens in the browser itself, by
          default, with no backend required.</strong> The widget reads the visitor&apos;s timezone and{' '}
        <code>navigator.language</code>, matches them against an embedded map of 190+ countries, and
        picks the correct compliance group — GDPR-shaped opt-in for an EU timezone, CCPA-shaped
        opt-out for California, and so on — before the banner ever renders. No IP lookup service,
        no server round-trip, no vendor in the middle. When you do add the optional backend, that
        same decision upgrades to real IP-based geo-resolution for higher accuracy, but the
        browser-only baseline is already jurisdiction-correct on its own. See{' '}
        <Link href="/guides/frontend/auto-detection/">How Auto-Detection Works</Link> for the exact
        resolution logic.
      </p>
      <p>
        On top of that, Consenti tries to give developers close to everything they&apos;d need to
        integrate consent into an existing stack rather than a fixed accepted/rejected flag: a{' '}
        <code>getConsent(type?)</code> method with built-in mappers for GTM/Google Consent Mode v2,
        Meta, Adobe, and Segment; a full DOM event lifecycle (<code>consenti:consentSubmitted</code>{' '}
        and friends); framework subpath exports for React, Vue, and Angular; and a plugin system on
        the backend with lifecycle hooks so a BigQuery, Segment, or Snowflake sink — or your own
        custom destination — is a few lines, not a fork.
      </p>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200 w-1/5">
                &nbsp;
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200 w-1/4">
                Browser-only OSS tools
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200 w-1/4">
                Hosted SaaS CMPs
              </th>
              <th className="px-4 py-3 text-left font-semibold text-brand-700 dark:text-brand-400 w-[30%]">
                Consenti
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
            {COMPARISON_ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800'}>
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-gray-300 align-top">{row.label}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-gray-400 align-top">{row.browserOnly}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-gray-400 align-top">{row.saas}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-gray-200 align-top font-medium">{row.consenti}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 dark:text-gray-500 -mt-4">
        Based on public documentation as of Jan 2026. Product names mentioned elsewhere on this
        site are trademarks of their respective owners; Consenti is not affiliated with or
        endorsed by any of them. See the full{' '}
        <Link href="/">homepage comparison table</Link> for a feature-by-feature breakdown against
        named products.
      </p>

      <h2>How Consenti aims to stay compliant</h2>
      <Callout type="info">
        This section describes the process the project is working toward, not a settled fact about
        how every release ships today. Current, per-law status (Full / Partial / In development)
        lives on the{' '}
        <Link href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</Link> and
        the homepage compliance table — treat those as the source of truth, and this section as the
        intent behind them.
      </Callout>
      <p>
        Privacy law doesn&apos;t hold still, and a CMP that goes stale is worse than no CMP — it
        gives a false sense of coverage. The intended cadence:
      </p>
      <ol>
        <li>
          <strong>Quarterly review.</strong> An aggressive scan of regulatory changes across every
          jurisdiction Consenti maps — new laws, amendments, regulator guidance — and a check of
          what that means for the existing compliance groups and defaults.
        </li>
        <li>
          <strong>Draft an implementation plan.</strong> Turn findings into a concrete plan: which
          compliance group needs a default change, whether a new group is needed, what config or
          profile fields have to move.
        </li>
        <li>
          <strong>Publish it for public comment.</strong> The plan goes up publicly —{' '}
          <a href="https://github.com/santoshe61/consenti/discussions" target="_blank" rel="noopener noreferrer">
            GitHub Discussions
          </a>{' '}
          is the intended venue — for roughly a month, so other developers and anyone with legal
          context on that jurisdiction can flag issues before anything ships.
        </li>
        <li>
          <strong>Implement and publish.</strong> Once the comment window closes, the plan gets
          built and shipped, with the outcome recorded in the{' '}
          <Link href="/docs/changelog/">changelog</Link>.
        </li>
        <li>
          <strong>Lighter interim scans between quarters.</strong> A quarterly cycle is too slow for
          an urgent change — a regulator deadline or a fast-moving amendment — so the plan includes
          shorter, targeted scans between full reviews to catch anything time-sensitive.
        </li>
      </ol>
      <p>
        Planned or in-flight work already tracked this way shows up on{' '}
        <Link href="/docs/upcoming-features/">Upcoming Features</Link>. The mechanism behind steps
        1–2 — the research brief, the 10-jurisdiction registry, and the report template — lives in{' '}
        <a
          href="https://github.com/santoshe61/consenti/tree/master/compliance-docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <code>compliance-docs/</code>
        </a>{' '}
        in the repo, alongside the quarterly reports it has produced so far.
      </p>

      {/* What Consenti is not */}
      <section id='what-consenti-is-not'>
        <h2>What Consenti is not</h2>
        <div className="mb-10 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-5">
          <p className="text-[13px] text-amber-800/90 dark:text-amber-200/80 leading-relaxed mb-3">
            All the comparison tables on this site compares Consenti's consent-widget & backend app features. It&apos;s not the same product
            category as the privacy suites some competitors sell alongside their CMP — those
            often bundle:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] text-amber-800/90 dark:text-amber-200/80">
            <li className="flex items-start gap-2">
              <X size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
              DSAR case-management workflows
            </li>
            <li className="flex items-start gap-2">
              <X size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
              Third-party vendor / tracker risk scoring
            </li>
            <li className="flex items-start gap-2">
              <X size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
              A managed legal/regulatory-monitoring subscription
            </li>
            <li className="flex items-start gap-2">
              <X size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
              Contractual compliance indemnification
            </li>
            <li className="flex items-start gap-2 sm:col-span-2">
              <X size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
              An IAB-registered TCF CMP ID out of the box — the TCF integration is spec-correct
              encoding you register yourself
            </li>
          </ul>
          <p className="text-[13px] text-amber-800/90 dark:text-amber-200/80 leading-relaxed mt-3">
            Consenti is a self-hosted open-source consent toolkit — the widget, the audit-grade
            storage, and the compliance-group routing. It&apos;s CMP building blocks you own and
            run, not a managed compliance department.
          </p>
        </div>
      </section>

      <RelatedDocs
        items={[
          {
            href: '/guides/frontend/auto-detection/',
            label: 'How Auto-Detection Works',
            desc: 'The exact browser-side and server-side jurisdiction resolution logic',
          },
          {
            href: '/docs/compliance/jurisdiction-coverage-map/',
            label: 'Jurisdiction Coverage Map',
            desc: 'The full 190+ country → compliance-group table, with current status per law',
          },
          {
            href: '/docs/compliance/compliance-groups/',
            label: 'Compliance Groups',
            desc: 'The 8 built-in groups and the regulations behind each one',
          },
          {
            href: '/docs/ui/plugins/',
            label: 'Plugins',
            desc: 'Extending Consenti without forking it',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Is Consenti compliant out of the box?',
            answer: (
              <p className="m-0">
                It ships the infrastructure — jurisdiction-correct banners, blocking, audit
                records, erasure endpoints — for the laws it actively maintains. Whether your
                specific site is compliant also depends on what you configure (cookie categories,
                copy, retention) and your own legal review; Consenti doesn&apos;t replace that
                judgment.
              </p>
            ),
          },
          {
            question: 'How accurate is browser-only jurisdiction detection?',
            answer: (
              <p className="m-0">
                Timezone and language are a heuristic, not a certainty — a VPN user or a traveller
                can trigger the wrong group. It&apos;s accurate enough to be the correct default for
                the overwhelming majority of visitors with zero setup. For higher accuracy, add the
                optional backend and switch to real IP-based geo-resolution; see{' '}
                <Link href="/guides/frontend/auto-detection/">How Auto-Detection Works</Link>.
              </p>
            ),
          },
          {
            question: 'How can I weigh in on a compliance update before it ships?',
            answer: (
              <p className="m-0">
                That&apos;s the point of the public-comment step above — proposed changes are meant
                to be posted to{' '}
                <a href="https://github.com/santoshe61/consenti/discussions" target="_blank" rel="noopener noreferrer">
                  GitHub Discussions
                </a>{' '}
                before they&apos;re implemented, specifically so developers and anyone with legal
                context on a jurisdiction can flag problems early.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
