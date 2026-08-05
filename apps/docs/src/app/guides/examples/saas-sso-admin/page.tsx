import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { RelatedDocs } from '@/components/RelatedDocs'
import { ExampleNav } from '@/components/ExampleNav'

export const metadata: Metadata = {
  title: 'Example — SaaS Dashboard (Backend + SSO Admin)',
  description:
    'Backend deployment with Auth0 OIDC admin login, node:sqlite storage, and a widget that reports consent server-side.',
  alternates: { canonical: '/guides/examples/saas-sso-admin' },
  openGraph: {
    title: 'Example — SaaS Dashboard (Backend + SSO Admin)',
    description:
      'Backend deployment with Auth0 OIDC admin login, node:sqlite storage, and a widget that reports consent server-side.',
    url: 'https://consenti.dev/guides/examples/saas-sso-admin',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Example — SaaS Dashboard (Backend + SSO Admin)',
    description:
      'Backend deployment with Auth0 OIDC admin login, node:sqlite storage, and a widget that reports consent server-side.',
    images: ['/og-image.jpg'],
  },
}

export default function SaasSsoAdminExample() {
  return (
    <div className="prose max-w-none">
      <h1>SaaS Dashboard — Backend + SSO Admin</h1>
      <p className="lead">
        A B2B SaaS product with a compliance team that needs an audit trail and doesn&apos;t want
        engineers editing banner copy in code. The backend records every consent decision, and the
        admin dashboard is gated behind the company&apos;s existing Auth0 tenant — no separate
        Consenti password to manage.
      </p>

      <h2>What this demonstrates</h2>
      <ul>
        <li><code>node:sqlite</code> storage — no external database to provision</li>
        <li>OIDC (Auth0) admin login instead of local email/password</li>
        <li>Frontend widget reporting consent to the backend, with automatic fallback on failure</li>
        <li>Reading the saved record back from the <code>consentSubmitted</code> event</li>
      </ul>

      <h2>1. Backend</h2>
      <CodeBlock
        lang="ts"
        filename="server.ts"
        code={`import { createConsenti } from '@consenti/api'
import http from 'node:http'

const consenti = createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },
  auth: {
    mode: 'oidc',
    masterSecret: process.env.CONSENTI_ADMIN_MASTER_SECRET!,
    oidc: {
      issuer: 'https://your-tenant.auth0.com',
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      redirectUri: 'https://app.example.com/consenti/admin/v1/auth/oidc/callback',
      claimsMapping: {
        email: 'email',
        roles: 'consenti_roles', // custom claim in your Auth0 token
      },
    },
  },
  dashboard: true,
})

http.createServer(consenti.handler).listen(3001)`}
      />
      <Callout type="info">
        Anyone in your Auth0 tenant can now sign in to <code>/consenti/</code> with their existing
        company account. Map <code>consenti_roles</code> to Consenti&apos;s RBAC roles from the{' '}
        <strong>Roles</strong> section so, say, support staff only get read access to Consents.
      </Callout>

      <h2>2. Frontend widget</h2>
      <CodeBlock
        lang="tsx"
        filename="components/ConsentSetup.tsx"
        code={`'use client'
import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({
      api: { enabled: true, baseUrl: 'https://app.example.com' },
    })

    widget.on('consentSubmitted', ({ apiResponse, visitorId }) => {
      // apiResponse is the saved ConsentDbRecord — useful for support tooling
      console.log('Consent record', apiResponse.id, 'for visitor', visitorId)
    })

    return () => widget.destroy()
  }, [])
  return null
}`}
      />
      <p>
        If Auth0 or the network is unreachable, the widget silently falls back to the matching
        pre-built profile — a SaaS outage never blocks the banner from rendering.
      </p>

      <h2>3. Audit trail, for free</h2>
      <p>
        Every profile edit an admin makes is versioned and viewable in{' '}
        <strong>Profile History</strong>; every admin action is written to the append-only{' '}
        <strong>Audit Log</strong> section, never deleted by Consenti. Nothing extra to configure — this ships with{' '}
        <code>dashboard: true</code>.
      </p>

      <RelatedDocs
        items={[
          { href: '/guides/backend/auth/', label: 'Auth Modes', desc: 'Local, JWT, OIDC, SAML, and custom auth' },
          { href: '/guides/backend/storage/', label: 'Choosing a Storage Driver', desc: 'json vs node:sqlite vs Postgres/MySQL/Mongo' },
          { href: '/docs/api/dashboard/', label: 'Admin Dashboard', desc: 'Every dashboard section and who can access it' },
        ]}
      />

      <ExampleNav currentSlug="saas-sso-admin" />
    </div>
  )
}
