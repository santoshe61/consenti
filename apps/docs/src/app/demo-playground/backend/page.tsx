import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Backend Admin — Consenti' }

export default function BackendDemoPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 mb-3">Backend Admin</h1>
        <p className="text-slate-500 dark:text-gray-400 text-lg max-w-2xl">
          The Consenti backend is running locally with SQLite. Access the admin dashboard
          to manage consent profiles, view audit logs, and configure RBAC.
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
            Full-featured admin SPA. Manage consent profiles, preview banners, view visitor
            consent records, audit logs, and RBAC roles.
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
            Interactive Swagger UI for all public and admin REST endpoints. Try requests
            directly from your browser.
          </p>
          <span className="text-sm font-semibold text-brand-500 group-hover:underline">
            Open Swagger UI →
          </span>
        </a>
      </div>

      {/* Credentials panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-bold text-blue-700 mb-3">Demo credentials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-500 text-xs font-semibold uppercase tracking-wide">Email</span>
            <p className="font-mono text-blue-900 mt-0.5">user@consenti.dev</p>
          </div>
          <div>
            <span className="text-blue-500 text-xs font-semibold uppercase tracking-wide">Password</span>
            <p className="font-mono text-blue-900 mt-0.5">Consenti@123</p>
          </div>
          <div>
            <span className="text-blue-500 text-xs font-semibold uppercase tracking-wide">Storage</span>
            <p className="font-mono text-blue-900 mt-0.5">json (consenti-data.json)</p>
          </div>
        </div>
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
