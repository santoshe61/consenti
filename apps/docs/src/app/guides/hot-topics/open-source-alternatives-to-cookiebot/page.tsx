import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Minus, X } from 'lucide-react'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Open-source alternatives to Cookiebot — Consenti',
  description:
    'Cookiebot is a hosted, cloud-scanning CMP. If you want the banner-and-blocking model without a third-party script origin, here are the open-source, self-hosted options.',
  keywords: ['Cookiebot alternative', 'open source CMP', 'self-hosted CMP'],
  alternates: { canonical: '/guides/hot-topics/open-source-alternatives-to-cookiebot' },
  openGraph: {
    title: 'Open-source alternatives to Cookiebot — Consenti',
    description:
      'Cookiebot is a hosted, cloud-scanning CMP. Here are the open-source, self-hosted alternatives.',
    url: 'https://consenti.dev/guides/hot-topics/open-source-alternatives-to-cookiebot',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open-source alternatives to Cookiebot — Consenti',
    description:
      'Cookiebot is a hosted, cloud-scanning CMP. Here are the open-source, self-hosted alternatives.',
    images: ['/og-image.jpg'],
  },
}

type Cell = boolean | string
const rows: { label: string; consenti: Cell; cookiebot: Cell; klaro: Cell; orestbida: Cell }[] = [
  { label: 'Open source', consenti: true, cookiebot: false, klaro: true, orestbida: true },
  { label: 'Self-hosted script (no vendor CDN)', consenti: true, cookiebot: false, klaro: true, orestbida: true },
  { label: 'Automated cookie-scanning crawler', consenti: 'local CLI', cookiebot: true, klaro: false, orestbida: false },
  { label: 'Built-in backend + audit log', consenti: true, cookiebot: true, klaro: false, orestbida: false },
  { label: 'Admin dashboard included', consenti: true, cookiebot: true, klaro: false, orestbida: false },
  { label: 'TCF v2.3 support', consenti: 'partial', cookiebot: true, klaro: 'partial', orestbida: 'partial' },
  { label: 'Google Consent Mode v2', consenti: true, cookiebot: true, klaro: 'partial', orestbida: 'partial' },
  { label: 'Zero runtime dependencies', consenti: true, cookiebot: false, klaro: false, orestbida: true },
  { label: 'Free, no pageview cap', consenti: true, cookiebot: 'limited', klaro: true, orestbida: true },
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

export default function OpenSourceAlternativesToCookiebotPage() {
  return (
    <div className="prose max-w-none">
      <h1>Open-source alternatives to Cookiebot</h1>
      <p className="lead">
        Cookiebot&apos;s biggest strength is its cookie-scanning crawler, which comes bundled with
        a hosted architecture: banner script loaded from Cookiebot&apos;s CDN, consent records
        stored on their infrastructure. If you want a similar banner-and-blocking model with code
        you run and own yourself, here&apos;s the open-source landscape.
      </p>

      <h2>Feature comparison</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700 my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Feature</th>
              <th className="py-3 px-4 font-bold text-brand-600 text-center">Consenti</th>
              <th className="py-3 px-4 font-semibold text-slate-500 text-center">Cookiebot</th>
              <th className="py-3 px-4 font-semibold text-slate-500 text-center">Klaro</th>
              <th className="py-3 px-4 font-semibold text-slate-500 text-center">orestbida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : ''}>
                <td className="py-2.5 px-4 text-slate-700 dark:text-gray-300 font-medium">{row.label}</td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.consenti} /></td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.cookiebot} /></td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.klaro} /></td>
                <td className="py-2.5 px-4 text-center"><Cell value={row.orestbida} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>The trade-off, in plain terms</h2>
      <p>
        Cookiebot&apos;s crawler auto-discovers cookies so you don&apos;t have to catalogue every
        script by hand — genuinely useful on a large, script-heavy site. It also runs
        continuously as a hosted service. Open-source, self-hosted widgets generally skip that
        entirely and expect you to declare cookies in config, in exchange for owning the script
        outright and keeping consent records off a third party&apos;s servers.
      </p>
      <ul>
        <li>
          <strong>Klaro</strong> and <strong>orestbida/cookie-consent</strong> are lightweight,
          frontend-only widgets — good if you just need a banner and don&apos;t need server-side
          consent records or an admin dashboard. Neither ships a scanning tool.
        </li>
        <li>
          <strong>Consenti</strong> covers the fuller Cookiebot-shaped feature set — banner,
          backend, audit log, admin dashboard, TCF v2.3 / GPP (partial — spec-correct encoding
          needs config + an optional dependency, and only matters if you monetize via
          programmatic/RTB ads), Consent Mode v2 — as an open-source, self-hosted option with no
          required runtime dependencies. It also ships{' '}
          <code>@consenti/scanner</code>, a local CLI crawler for cookie auto-discovery — you run
          it on demand rather than a third party running it continuously on their infrastructure.
        </li>
      </ul>

      <Callout type="tip">
        Consenti&apos;s <code>@consenti/scanner</code> CLI crawls your site under
        none/reject-all/accept-all consent states and reports undeclared trackers, fully offline —
        run it locally or in CI rather than paying for continuously-running hosted scanning. Most
        sites don&apos;t change their tracking scripts often enough to need live, always-on
        scanning anyway.
      </Callout>

      <p className="text-xs text-slate-400 dark:text-gray-500">
        Feature comparison reflects our understanding of public documentation as of Jan 2026.
        Cookiebot, Klaro, and orestbida/cookie-consent are trademarks of their respective owners;
        Consenti is not affiliated with, endorsed by, or sponsored by any of them. See the{' '}
        <Link href="/terms/">Terms of Use</Link> for our comparisons policy.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/guides/hot-topics/self-hosting-a-cmp/',
            label: 'Self-hosting a CMP',
            desc: 'The four pieces a self-hosted stack needs',
          },
          {
            href: '/docs/compliance/tcf-and-gpp-registration/',
            label: 'TCF & GPP Registration',
            desc: 'IAB Transparency & Consent Framework and GPP support in Consenti',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Do any open-source CMPs include a cookie-scanning crawler?',
            answer: (
              <p className="m-0">
                Most don&apos;t — cookie scanning is usually built as a hosted, continuously-running
                service, which is a lot for a frontend-only widget to take on. Consenti ships one as
                a separate local CLI (<code>@consenti/scanner</code>): you run it on demand or in CI
                instead of paying for an always-on hosted crawler. Klaro and orestbida don&apos;t
                include anything equivalent and expect cookies declared in config instead.
              </p>
            ),
          },
          {
            question: 'Is migrating off Cookiebot to a self-hosted widget difficult?',
            answer: (
              <p className="m-0">
                The mechanical part — swapping the script tag and re-declaring your cookie
                categories — is usually straightforward. Re-cataloguing cookies that Cookiebot&apos;s
                crawler previously discovered automatically is the larger task with most self-hosted
                widgets; if you migrate to Consenti, running <code>@consenti/scanner</code> against
                your site does that discovery step for you.
              </p>
            ),
          },
          {
            question: 'Which open-source option has the closest feature parity with Cookiebot?',
            answer: (
              <p className="m-0">
                Among frontend-only widgets, none replicate Cookiebot&apos;s backend, audit log,
                and dashboard. Consenti is built to cover that fuller scope — backend, audit log,
                dashboard, TCF v2.3 / GPP (partial), Consent Mode v2, and a local scanning CLI
                (<code>@consenti/scanner</code>) — as a self-hosted alternative.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
