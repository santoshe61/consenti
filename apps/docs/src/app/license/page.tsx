import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Minus, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'License',
  description: 'Consenti is Apache License 2.0. Plain-language summary and links to the full text.',
  alternates: { canonical: 'https://consenti.dev/license' },
  openGraph: {
    title: 'License',
    description:
      'Consenti is Apache License 2.0. Plain-language summary and links to the full text.',
    url: 'https://consenti.dev/license',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'License',
    description:
      'Consenti is Apache License 2.0. Plain-language summary and links to the full text.',
    images: ['/og-image.jpg'],
  },
}

const PERMISSIONS = ['Commercial use', 'Modification', 'Distribution', 'Private use', 'Patent use']

const CONDITIONS = [
  'License and copyright notice must be included',
  'State changes made to the code',
]

const LIMITATIONS = ['No liability', 'No warranty', 'No trademark rights']

function IconList({ items, icon, tone }: { items: string[]; icon: React.ReactNode; tone: string }) {
  return (
    <ul className="not-prose space-y-2 list-none pl-0">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-300">
          <span className={`shrink-0 mt-0.5 ${tone}`}>{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function LicensePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="prose max-w-none">
        <h1>License</h1>
        <p>
          Every Consenti package (<code>@consenti/ui</code>, <code>@consenti/api</code>) is licensed
          under the <strong>Apache License, Version 2.0</strong>. This page is a plain-language
          summary — the{' '}
          <a
            href="https://github.com/santoshe61/consenti/blob/master/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            LICENSE file on GitHub
          </a>{' '}
          is the actual, binding text.
        </p>

        <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">
              Permissions
            </h3>
            <IconList items={PERMISSIONS} icon={<Check size={15} />} tone="text-green-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">
              Conditions
            </h3>
            <IconList items={CONDITIONS} icon={<AlertTriangle size={15} />} tone="text-amber-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">
              Limitations
            </h3>
            <IconList items={LIMITATIONS} icon={<Minus size={15} />} tone="text-red-500" />
          </div>
        </div>

        <p>
          In short: you can use, modify, and redistribute Consenti — including commercially and in
          closed-source products — as long as you keep the license/copyright notice and note what
          you changed. You get no warranty and no liability coverage from the maintainers, and no
          rights to the Consenti name/trademark beyond what&apos;s needed to credit the project.
        </p>

        <h2>Compliance &amp; legal use — additional disclaimer</h2>
        <p>
          The <code>LICENSE</code> file also carries an additional, explicit disclaimer beyond the
          standard Apache 2.0 warranty section, because Consenti is a <em>consent management</em>{' '}
          tool:{' '}
          <strong>
            using Consenti does not by itself make any site or product legally compliant
          </strong>{' '}
          with GDPR, CCPA, or any other privacy regulation. The maintainers bear no responsibility
          for legal or regulatory outcomes arising from the use, misuse, or misconfiguration of this
          software — that responsibility sits with whoever deploys and configures it. If you find a
          jurisdiction, regulation, or behavior that Consenti gets wrong, the software is open
          source specifically so you (or your legal/engineering team) can fix or extend it. See{' '}
          <Link href="/terms/">Terms of Use</Link> for the full statement.
        </p>

        <h2>Third-party dependencies</h2>
        <p>
          <code>@consenti/ui</code> and <code>@consenti/api</code> ship with{' '}
          <strong>zero external runtime dependencies</strong> — browser and Node.js built-ins only —
          so there is no third-party dependency license tree to audit for the core packages.
          Optional peer dependencies (e.g. <code>better-sqlite3</code>, <code>pg</code>,{' '}
          <code>samlify</code>) carry their own licenses, which apply only if you choose to install
          them.
        </p>

        <p>
          Related: <Link href="/terms/">Terms of Use</Link> ·{' '}
          <Link href="/privacy/">Privacy Policy</Link>
        </p>
      </div>
    </main>
  )
}
