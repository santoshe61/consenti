import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/components/Callout'
import { CodeBlock } from '@/components/CodeBlock'

export const metadata: Metadata = {
  title: 'API Routes',
  description:
    'Backend API routes split across two base paths, public and admin, both configurable via basePath in createConsenti().',
  alternates: { canonical: '/docs/api/routes' },
  openGraph: {
    title: 'API Routes',
    description:
      'Backend API routes split across two base paths, public and admin, both configurable via basePath in createConsenti().',
    url: 'https://consenti.dev/docs/api/routes',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Routes',
    description:
      'Backend API routes split across two base paths, public and admin, both configurable via basePath in createConsenti().',
    images: ['/og-image.jpg'],
  },
}

export default function APIRoutesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — API Routes</h1>
      <p>
        Routes are split across two base paths (configurable via <code>basePath</code> in{' '}
        <code>createConsenti()</code>, default <code>/consenti</code>):
      </p>

      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <Link
          href="/docs/api/routes/public/"
          className="group block rounded-xl border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 p-5 transition-colors no-underline"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Public
            </span>
            <code className="text-xs text-slate-500">/consenti/api/v1</code>
          </div>
          <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700 mb-1">
            Public API Routes
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            No auth required. Profile lookup and consent submission — used by the UI widget.
          </p>
        </Link>

        <Link
          href="/docs/api/routes/admin/"
          className="group block rounded-xl border border-slate-200 bg-slate-50 hover:border-violet-400 hover:bg-violet-50 p-5 transition-colors no-underline"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
              Admin
            </span>
            <code className="text-xs text-slate-500">/consenti/admin</code>
          </div>
          <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 mb-1">
            Admin API Routes
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            JWT required. Profile management, consent records, users, roles, audit, stats, and
            exports.
          </p>
        </Link>
      </div>

      <h2>Error format</h2>
      <p>All error responses share the same structure:</p>
      <CodeBlock
        lang="json"
        code={`{
  "error": "Profile not found"
}`}
      />

      <Callout type="info">
        Stack traces are never included in production error responses (
        <code>NODE_ENV === &apos;production&apos;</code>). They are logged server-side only.
      </Callout>

      <h2>OpenAPI / Swagger</h2>
      <p>
        When <code>dashboard: true</code> is set in <code>createConsenti()</code>, the interactive
        Swagger UI is available at:
      </p>
      <CodeBlock lang="text" code="http://localhost:3001/consenti/api/docs" />
      <p>
        The raw OpenAPI JSON spec is at <code>/consenti/api/openapi.json</code>.
      </p>

      <h2>Rate limiting</h2>
      <p>
        Rate limiting applies to public API routes only. Admin routes are exempt (they require JWT
        auth).
      </p>
      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  rateLimit: {
    windowMs: 60_000,  // 1-minute window
    maxRequests: 60,   // max requests per IP per window
  },
})`}
      />
    </div>
  )
}
