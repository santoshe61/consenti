import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Minus, X } from 'lucide-react'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Open-source alternatives to OneTrust — Consenti',
  description:
    'OneTrust is a full privacy-management suite; most "OneTrust alternative" searches are really about the cookie consent module. A scoped comparison against open-source options.',
  keywords: ['OneTrust alternative', 'open source CMP', 'OneTrust cookie consent alternative'],
  alternates: { canonical: '/guides/hot-topics/open-source-alternatives-to-onetrust' },
  openGraph: {
    title: 'Open-source alternatives to OneTrust — Consenti',
    description:
      'OneTrust is a full privacy-management suite; most "OneTrust alternative" searches are really about the cookie consent module.',
    url: 'https://consenti.dev/guides/hot-topics/open-source-alternatives-to-onetrust',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open-source alternatives to OneTrust — Consenti',
    description:
      'OneTrust is a full privacy-management suite; most "OneTrust alternative" searches are really about the cookie consent module.',
    images: ['/og-image.jpg'],
  },
}

type Cell = boolean | string
const rows: { label: string; consenti: Cell; klaro: Cell; orestbida: Cell; consentstack: Cell }[] = [
  { label: 'Open source', consenti: true, klaro: true, orestbida: true, consentstack: true },
  { label: 'Self-hosted', consenti: true, klaro: true, orestbida: true, consentstack: true },
  { label: 'Built-in backend + audit log', consenti: true, klaro: false, orestbida: false, consentstack: false },
  { label: 'Admin dashboard included', consenti: true, klaro: false, orestbida: false, consentstack: false },
  { label: 'TCF v2.3 support', consenti: 'partial', klaro: 'partial', orestbida: 'partial', consentstack: 'partial' },
  { label: 'React / Vue / Angular hooks', consenti: true, klaro: false, orestbida: false, consentstack: false },
  { label: 'Zero runtime dependencies', consenti: true, klaro: false, orestbida: true, consentstack: false },
  { label: 'GPC auto-honour', consenti: true, klaro: false, orestbida: false, consentstack: false },
]

function Cell({ value }: { value: Cell }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 mx-auto">
        <Check size={13} className="text-green-600" strokeWidth={2.5} />
      </span>
    )
  if (value === false)
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 mx-auto">
        <X size={13} className="text-red-400" strokeWidth={2.5} />
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
      <Minus size={10} /> {value}
    </span>
  )
}

export default function OpenSourceAlternativesToOneTrustPage() {
  return (
    <div className="prose max-w-none">
      <h1>Open-source alternatives to OneTrust</h1>
      <p className="lead">
        OneTrust is a large enterprise privacy-management suite — cookie consent is one module
        inside a platform that also covers data subject access requests (DSARs), vendor risk
        assessments, and data mapping. Most people searching for a &ldquo;OneTrust
        alternative&rdquo; only need the cookie-banner-and-consent-records piece, not the whole
        suite — so this comparison scopes to that.
      </p>

      <Callout type="info">
        If your team actually needs DSAR workflow automation, vendor risk scoring, or enterprise
        data mapping across hundreds of systems, an open-source cookie consent tool won&apos;t
        replace OneTrust&apos;s full platform. This comparison is specifically about the cookie
        consent / CMP module.
      </Callout>

      <h2>Cookie consent module: feature comparison</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700 my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Feature</th>
              <th className="py-3 px-4 font-bold text-brand-600 text-center">Consenti</th>
              <th className="py-3 px-4 font-semibold text-slate-500 text-center">Klaro</th>
              <th className="py-3 px-4 font-semibold text-slate-500 text-center">orestbida</th>
              <th className="py-3 px-4 font-semibold text-slate-500 text-center">ConsentStack</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : ''}>
                <td className="py-2.5 px-4 text-slate-700 dark:text-gray-300 font-medium">{row.label}</td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.consenti} /></td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.klaro} /></td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.orestbida} /></td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.consentstack} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What OneTrust has that no open-source cookie tool replicates</h2>
      <ul>
        <li>Automated DSAR intake and fulfilment workflows across many connected systems.</li>
        <li>Vendor/third-party risk assessment scoring and questionnaires.</li>
        <li>Enterprise data mapping and processing-activity inventories (RoPA).</li>
        <li>A dedicated vendor support and compliance-advisory relationship.</li>
      </ul>

      <h2>What an open-source cookie consent module gives you instead</h2>
      <ul>
        <li>No per-domain or per-pageview licensing — run it on as many properties as you own.</li>
        <li>Consent records stay on your own infrastructure rather than a vendor&apos;s multi-tenant platform.</li>
        <li>Full source access — audit exactly what the banner does and modify it if you need to.</li>
        <li>No procurement cycle — <code>npm install</code> and you&apos;re running.</li>
      </ul>

      <p>
        Consenti is one option built specifically as a full-stack, zero-dependency alternative for
        this narrower scope: a banner widget, a backend with an append-only audit log, and an admin
        dashboard, all self-hosted. It won&apos;t replace OneTrust&apos;s DSAR or vendor-risk
        modules, but for the consent-banner-plus-records use case, it covers the same ground without
        the enterprise price tag.
      </p>

      <p className="text-xs text-slate-400 dark:text-gray-500">
        Feature comparison reflects our understanding of public documentation as of Jan 2026.
        OneTrust, Klaro, orestbida/cookie-consent, and ConsentStack are trademarks of their
        respective owners; Consenti is not affiliated with, endorsed by, or sponsored by any of
        them. See the <Link href="/terms/">Terms of Use</Link> for our comparisons policy.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/guides/hot-topics/self-hosting-a-cmp/',
            label: 'Self-hosting a CMP',
            desc: 'What running your own consent stack actually involves',
          },
          {
            href: '/guides/hot-topics/open-source-alternatives-to-cookiebot/',
            label: 'Open-source alternatives to Cookiebot',
            desc: 'The same comparison, scoped against Cookiebot instead',
          },
          {
            href: '/docs/compliance/jurisdiction-coverage-map/',
            label: 'Jurisdiction Coverage Map',
            desc: 'Every country mapped to a compliance group out of the box',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Can an open-source tool fully replace OneTrust?',
            answer: (
              <p className="m-0">
                For cookie consent specifically, often yes. For OneTrust&apos;s broader suite —
                DSAR automation, vendor risk, data mapping — no single open-source cookie consent
                project attempts to cover that scope; you&apos;d be looking at separate tooling or
                process for those pieces.
              </p>
            ),
          },
          {
            question: 'Why do open-source CMPs cost nothing when OneTrust is enterprise-priced?',
            answer: (
              <p className="m-0">
                Different business models, not necessarily different quality for the cookie-consent
                slice — OneTrust prices for a much larger platform plus vendor support and
                compliance advisory. An open-source project trades that support relationship for
                zero licensing cost and full source access.
              </p>
            ),
          },
          {
            question: 'Does switching away from OneTrust risk compliance gaps?',
            answer: (
              <p className="m-0">
                Only if the replacement doesn&apos;t cover what you were actually using OneTrust
                for. If it was cookie consent only, a well-scoped open-source CMP can match that.
                If you relied on DSAR or vendor-risk modules, you&apos;d need a plan for those
                separately before migrating off OneTrust.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
