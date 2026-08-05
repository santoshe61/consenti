import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { RelatedDocs } from '@/components/RelatedDocs'
import { ExampleNav } from '@/components/ExampleNav'

export const metadata: Metadata = {
  title: 'Example — Next.js App Router Full-Stack Integration',
  description:
    'Widget mounted as a Client Component in the root layout, backend mounted on a Next.js Route Handler — one deploy, no separate server.',
  alternates: { canonical: '/guides/examples/nextjs-app-router' },
  openGraph: {
    title: 'Example — Next.js App Router Full-Stack Integration',
    description:
      'Widget mounted as a Client Component in the root layout, backend mounted on a Next.js Route Handler — one deploy, no separate server.',
    url: 'https://consenti.dev/guides/examples/nextjs-app-router',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Example — Next.js App Router Full-Stack Integration',
    description:
      'Widget mounted as a Client Component in the root layout, backend mounted on a Next.js Route Handler — one deploy, no separate server.',
    images: ['/og-image.jpg'],
  },
}

export default function NextjsAppRouterExample() {
  return (
    <div className="prose max-w-none">
      <h1>Next.js App Router — Full-Stack Integration</h1>
      <p className="lead">
        Both halves of Consenti living inside one Next.js app — no separate Node.js server to
        deploy or scale. The backend is mounted on a catch-all Route Handler; the widget is a
        Client Component in the root layout, dynamically imported so the browser-only code never
        runs during SSR.
      </p>

      <h2>What this demonstrates</h2>
      <ul>
        <li>Backend mounted on <code>app/consenti/[...path]/route.ts</code> — one deploy target</li>
        <li>Widget as a Client Component, dynamically imported to stay out of the SSR bundle</li>
        <li>Environment-driven config so the same code works in dev and production</li>
      </ul>

      <h2>1. Mount the backend</h2>
      <CodeBlock
        lang="ts"
        filename="app/consenti/[...path]/route.ts"
        code={`import { createConsenti } from '@consenti/api'
import type { NextRequest } from 'next/server'

let consenti: Awaited<ReturnType<typeof createConsenti>>

async function getConsenti() {
  if (!consenti) {
    consenti = createConsenti({
      storage: { driver: 'node:sqlite', path: './consenti-data' },
      auth: {
        mode: 'local',
        adminEmail: process.env.CONSENTI_ADMIN_EMAIL!,
        adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
      },
      dashboard: true,
    })
  }
  return consenti
}

async function consentiHandler(req: NextRequest) {
  const c = await getConsenti()
  return c.handleRequest(req)
}

export { consentiHandler as GET, consentiHandler as POST, consentiHandler as PUT, consentiHandler as DELETE, consentiHandler as PATCH }`}
      />
      <p>
        Admin dashboard now lives at <code>/consenti/</code> on the same origin as your app — no
        CORS configuration needed.
      </p>

      <h2>2. Mount the widget</h2>
      <CodeBlock
        lang="tsx"
        filename="components/ConsentSetup.tsx"
        code={`'use client'

import { useEffect, useRef } from 'react'
import type { ConsentiSetup as WidgetType } from '@consenti/ui'

export function ConsentSetup() {
  const widgetRef = useRef<WidgetType | null>(null)

  useEffect(() => {
    let widget: WidgetType
    import('@consenti/ui').then(({ ConsentiSetup }) => {
      widget = new ConsentiSetup({
        api: { enabled: true, baseUrl: process.env.NEXT_PUBLIC_API_URL },
      })
      widgetRef.current = widget
    })
    return () => widgetRef.current?.destroy()
  }, [])

  return null
}`}
      />
      <CodeBlock
        lang="tsx"
        filename="app/layout.tsx"
        code={`import { ConsentSetup } from '@/components/ConsentSetup'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConsentSetup />
        {children}
      </body>
    </html>
  )
}`}
      />

      <Callout type="tip">
        Because the backend and frontend share an origin, set{' '}
        <code>NEXT_PUBLIC_API_URL</code> to your own site&apos;s URL (or leave it unset — the
        widget defaults to same-origin when <code>baseUrl</code> is omitted and{' '}
        <code>api.enabled: true</code>).
      </Callout>

      <h2>3. Read consent in a Server Component</h2>
      <p>
        Server Components can&apos;t read the widget&apos;s browser cookie directly for banner
        state, but they can query the backend&apos;s REST API for reporting or gating server-side
        logic:
      </p>
      <CodeBlock
        lang="ts"
        code={`// app/admin/consent-stats/page.tsx
async function getStats() {
  const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/consenti/api/v1/consent/\${visitorId}\`, {
    headers: { Authorization: \`Bearer \${adminToken}\` },
    cache: 'no-store',
  })
  return res.json()
}`}
      />

      <RelatedDocs
        items={[
          { href: '/docs/api/installation/', label: 'Backend Installation', desc: 'Every framework adapter, including Express, Fastify, Hono' },
          { href: '/guides/frontend/frameworks/', label: 'Framework Integrations', desc: 'React, Vue, Angular, and Vanilla JS equivalents' },
          { href: '/docs/api/routes/public/', label: 'Public Routes', desc: 'Every /consenti/api/v1 endpoint the widget and your own code can call' },
        ]}
      />

      <ExampleNav currentSlug="nextjs-app-router" />
    </div>
  )
}
