import type { Metadata } from 'next'
import Link from 'next/link'
import { DemoCredentials } from '@/components/DemoCredentials'

export const metadata: Metadata = {
  title: 'Backend Admin — Consenti',
  description:
    'The Consenti backend is running locally with SQLite — access the admin dashboard to manage consent profiles, view audit logs, and configure RBAC.',
  alternates: { canonical: '/demo-playground/backend' },
  openGraph: {
    title: 'Backend Admin — Consenti',
    description:
      'The Consenti backend is running locally with SQLite — access the admin dashboard to manage consent profiles, view audit logs, and configure RBAC.',
    url: 'https://consenti.dev/demo-playground/backend',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backend Admin — Consenti',
    description:
      'The Consenti backend is running locally with SQLite — access the admin dashboard to manage consent profiles, view audit logs, and configure RBAC.',
    images: ['/og-image.jpg'],
  },
}

export default function BackendDemoPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 mb-3">
          Backend Admin
        </h1>
        <p className="text-slate-500 dark:text-gray-400 text-lg max-w-2xl">
          The Consenti backend is running locally with SQLite. Access the admin dashboard to manage
          consent profiles, view audit logs, and configure RBAC.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Admin Dashboard card */}
        <a
          href="/consenti/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 hover:border-brand-500 hover:shadow-md transition-all no-underline"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 text-xl">
              🛡️
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              Admin Dashboard
            </h2>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Full-featured admin SPA. Manage consent profiles, preview banners, view visitor consent
            records, audit logs, and RBAC roles.
          </p>
          <span className="text-sm font-semibold text-brand-500 group-hover:underline">
            Open dashboard →
          </span>
        </a>

        {/* API Docs card */}
        <a
          href="/consenti/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 hover:border-brand-500 hover:shadow-md transition-all no-underline"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 text-xl">
              📄
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              API Docs (Swagger)
            </h2>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Interactive Swagger UI for all public and admin REST endpoints. Try requests directly
            from your browser.
          </p>
          <span className="text-sm font-semibold text-brand-500 group-hover:underline">
            Open Swagger UI →
          </span>
        </a>
      </div>

      {/* Data retention callout */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <span className="text-amber-500 text-lg mt-0.5">⏱</span>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Demo environment:</strong> All data is automatically purged after 7 days. Feel
          free to create profiles, templates, and consent records — they won&apos;t persist forever.
        </p>
      </div>

      {/* Credentials panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-bold text-blue-700 mb-3">Demo credentials</h3>
        <DemoCredentials
          items={[
            { label: 'Email', value: 'user@consenti.dev' },
            { label: 'Password', value: 'Consenti@123' },
            { label: 'Storage', value: 'json (consenti-data.json)', copyable: false },
          ]}
        />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-4">
        <a
          href="/consenti/api/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-brand-500 transition-colors no-underline"
        >
          OpenAPI JSON →
        </a>
        <Link
          href="/docs/api/configuration"
          className="text-sm text-slate-500 hover:text-brand-500 transition-colors no-underline"
        >
          Backend configuration docs →
        </Link>
        <Link
          href="/docs/api/routes"
          className="text-sm text-slate-500 hover:text-brand-500 transition-colors no-underline"
        >
          API routes reference →
        </Link>
      </div>
    </div>
  )
}
