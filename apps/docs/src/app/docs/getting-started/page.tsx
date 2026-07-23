import Link from 'next/link'
import type { Metadata } from 'next'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Introduction',
  description:
    'Consenti is an open-source, zero-dependency Consent Management Platform handling the full consent lifecycle — banner, preferences, GPC, and Google Consent Mode v2.',
  alternates: { canonical: '/docs/getting-started' },
  openGraph: {
    title: 'Introduction',
    description:
      'Consenti is an open-source, zero-dependency Consent Management Platform handling the full consent lifecycle — banner, preferences, GPC, and Google Consent Mode v2.',
    url: 'https://consenti.dev/docs/getting-started',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Introduction',
    description:
      'Consenti is an open-source, zero-dependency Consent Management Platform handling the full consent lifecycle — banner, preferences, GPC, and Google Consent Mode v2.',
    images: ['/og-image.jpg'],
  },
}

export default function GettingStartedPage() {
  return (
    <div className="prose max-w-none">
      <h1>Introduction</h1>
      <p>
        Consenti is an open-source, zero-dependency Consent Management Platform (CMP). It handles
        the complete consent lifecycle — banner display, preference management, GPC detection, GTM /
        Google Consent Mode v2 integration, and compliance for GDPR, CCPA, CPRA, and ten other
        regulations — without pulling in a single external runtime dependency.
      </p>

      <h2>Two packages, one platform</h2>
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Runs in</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@consenti/ui</code>
            </td>
            <td>Browser</td>
            <td>
              The UI widget. Shows the consent banner and preference modal, detects GPC, fires DOM
              events, pushes to the GTM dataLayer, and syncs consent across tabs. Uses only browser
              built-ins — no framework required.
            </td>
          </tr>
          <tr>
            <td>
              <code className="whitespace-nowrap">@consenti/api</code>
            </td>
            <td>Node.js server</td>
            <td>
              The backend module. Install it in your existing Node.js server — it mounts consent API
              routes and an admin dashboard onto your app. No separate process. Records consent to
              SQLite by default. Uses only Node.js built-ins.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Frontend-only or full-stack?</h2>
      <p>
        The UI widget works entirely in the browser with no server needed. The backend is optional
        and adds server-side consent storage, a profile management dashboard, multi-tenant support,
        and audit logs.
      </p>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Frontend-only</th>
            <th>With backend</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consent storage</td>
            <td>
              Browser cookie or <code>localStorage</code>
            </td>
            <td>Server database (SQLite, MongoDB, PostgreSQL)</td>
          </tr>
          <tr>
            <td>Profile management</td>
            <td>
              Defined in code (<code>ConsentiProfile</code>) or inline (<code>profileOverride</code>
              )
            </td>
            <td>Admin dashboard — no code changes to update copy</td>
          </tr>
          <tr>
            <td>Consent audit log</td>
            <td>No</td>
            <td>Yes — every record stored with timestamp and visitor ID</td>
          </tr>
          <tr>
            <td>Multi-site / multi-tenant</td>
            <td>No</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>Setup effort</td>
            <td>One import, one constructor call</td>
            <td>
              <code>npm install @consenti/api</code> in your existing Node.js backend — mounts
              routes onto your server, nothing separate to run
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="tip">
        Start frontend-only. The switch to full-stack later is one config line:{' '}
        <code>api.enabled: true</code>. Existing browser consent records remain valid until
        superseded by an API record.
      </Callout>

      <h2>What happens on a first visit</h2>
      <ol>
        <li>
          The widget initialises and resolves the active profile (code-defined, API-fetched, or
          built-in default)
        </li>
        <li>
          It reads any existing consent record from the browser cookie or <code>localStorage</code>
        </li>
        <li>If no valid record exists → the banner appears</li>
        <li>The user clicks Accept / Reject / Customize</li>
        <li>Consent is saved to the browser and (if configured) POSTed to the backend</li>
        <li>
          <code>consenti:consentSubmitted</code> fires with the full consent record
        </li>
        <li>
          On every subsequent visit → the banner stays hidden unless consent has expired or the
          profile version changed
        </li>
      </ol>

      <h2>Next</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose mt-4">
        {[
          {
            href: '/docs/getting-started/quick-start/',
            title: 'Quick Start',
            desc: 'Working code for frontend-only and full-stack in under 5 minutes',
          },
          {
            href: '/docs/ui/',
            title: 'UI Widget',
            desc: 'Lifecycle, mental model, and all widget sub-pages',
          },
          {
            href: '/docs/api/',
            title: 'Backend API',
            desc: 'Installation, configuration, and admin dashboard',
          },
          {
            href: '/docs/compliance/gdpr/',
            title: 'GDPR compliance',
            desc: 'What Consenti does for you and what you still need to handle',
          },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition-all no-underline"
          >
            <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
