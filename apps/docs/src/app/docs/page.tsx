import Link from 'next/link'
import type { Metadata } from 'next'
import { Database, Layout, Plug, Rocket, Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Documentation for Consenti — the open-source, GDPR-compliant cookie consent and consent management platform.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'Documentation',
    description:
      'Documentation for Consenti — the open-source, GDPR-compliant cookie consent and consent management platform.',
    url: 'https://consenti.dev/docs',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation',
    description:
      'Documentation for Consenti — the open-source, GDPR-compliant cookie consent and consent management platform.',
    images: ['/og-image.jpg'],
  },
}

const sections = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started/',
    Icon: Rocket,
    iconColor: 'text-brand-500',
    iconBg: 'bg-brand-50',
    desc: 'Install Consenti and set up your first consent banner in under 5 minutes.',
  },
  {
    title: 'UI Widget',
    href: '/docs/ui/',
    Icon: Layout,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    desc: 'Complete reference for @consenti/ui — config, events, methods, themes, and framework adapters.',
  },
  {
    title: 'Backend API',
    href: '/docs/api/',
    Icon: Database,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    desc: 'Reference for @consenti/api — storage adapters, admin dashboard, RBAC, and REST endpoints.',
  },
  {
    title: 'Compliance',
    href: '/docs/compliance/gdpr/',
    Icon: Scale,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    desc: 'GDPR, CCPA, TCF v2.2, COPPA — how Consenti meets each regulation and what you need to configure.',
  },
  {
    title: 'Plugins',
    href: '/docs/plugins/',
    Icon: Plug,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
    desc: 'Extend the backend with BigQuery, Segment, Snowflake, webhooks, and community plugins.',
  },
]

export default function DocsIndexPage() {
  return (
    <div className="prose max-w-none">
      <h1>Consenti Documentation</h1>
      <p>
        Consenti is an open-source, GDPR-compliant cookie consent and consent management platform.
        The UI widget (<code>@consenti/ui</code>) is the core — install it and you have a fully
        working consent banner with zero dependencies, no backend required. Consent is stored in a
        signed browser cookie. That&apos;s all most projects need.
      </p>
      <p>
        The backend module (<code>@consenti/api</code>) is entirely optional. Add it if you need
        server-side consent records, audit logs, or the built-in admin dashboard. The UI widget also
        integrates with any custom REST API you already run — you don&apos;t have to use the
        Consenti backend at all.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose mt-8">
        {sections.map(s => {
          const Icon = s.Icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group block p-5 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all no-underline"
            >
              <div
                className={`w-9 h-9 ${s.iconBg} rounded-lg flex items-center justify-center mb-3`}
              >
                <Icon size={18} className={s.iconColor} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-brand-500 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </Link>
          )
        })}
      </div>

      <h2>Choose your setup</h2>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>What it does</th>
            <th>When you need it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@consenti/ui</code>
            </td>
            <td>Browser widget — banner, modal, GTM, GPC, i18n, signed cookie storage</td>
            <td>
              <strong>Always</strong> — this is the core package
            </td>
          </tr>
          <tr>
            <td>
              <code>@consenti/api</code>
            </td>
            <td>Node.js backend — server-side consent records, admin dashboard, REST API</td>
            <td>
              <strong>Optional</strong> — only if you need audit logs or the dashboard
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The UI widget can also POST consent to <em>any</em> existing API endpoint via the{' '}
        <code>api.baseUrl</code> config option — it is not tied to <code>@consenti/api</code>.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Browser: ES2020+ (Chrome 80+, Firefox 74+, Safari 13.1+) — for the UI widget</li>
        <li>npm 10 or later (or any npm-compatible package manager)</li>
        <li>TypeScript 5.8+ recommended (strict mode)</li>
        <li>
          Node.js 24 LTS or later — only required if using <code>@consenti/api</code>
        </li>
      </ul>
    </div>
  )
}
