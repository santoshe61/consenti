import type { Metadata } from 'next'
import { Terminal } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Minimal Setup — Backend Guide — Consenti',
  description:
    'Mount the Consenti API backend on any Node.js framework in minutes with zero database configuration.',
  alternates: { canonical: '/guides/backend/minimal-setup' },
  openGraph: {
    title: 'Minimal Setup — Backend Guide — Consenti',
    description:
      'Mount the Consenti API backend on any Node.js framework in minutes with zero database configuration.',
    url: 'https://consenti.dev/guides/backend/minimal-setup',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minimal Setup — Backend Guide — Consenti',
    description:
      'Mount the Consenti API backend on any Node.js framework in minutes with zero database configuration.',
    images: ['/og-image.jpg'],
  },
}

export default function BackendMinimalSetupGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Minimal Setup</h1>
      <p className="lead">
        <code>@consenti/api</code> is a single function — <code>createConsenti()</code> — that
        returns a router you drop into any Node.js HTTP framework. It starts with JSON file storage
        so you need zero database installation to get going. This guide walks you through from
        install to a running admin dashboard.
      </p>

      <h2>Step 1 — Install</h2>

      <Terminal code="npm install @consenti/api" />

      <p>
        That&apos;s the only required install. No database client, no ORM, no extra dependencies.
        The default JSON file storage works out of the box on any Node.js version ≥ 20.
      </p>

      <Callout type="info">
        When you&apos;re ready for production, install one of the optional storage drivers:{' '}
        <code>node:sqlite</code> (built into Node 22+, no install needed),{' '}
        <code>better-sqlite3</code>, <code>pg</code>, <code>mysql2</code>, or <code>mongodb</code>.
        See the <a href="/guides/backend/storage/">Storage Driver guide</a> for a comparison.
      </Callout>

      <h2>Step 2 — Pick your framework</h2>
      <p>
        Consenti ships adapters for the most common Node.js HTTP frameworks. Pick the one that
        matches your setup — or use the standalone option if you don&apos;t have a framework at all.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'Express',
            lang: 'typescript',
            code: `import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()

const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

app.use(consenti.router)

app.listen(3000, () => {
  console.log('Admin  → http://localhost:3000/consenti/')
  console.log('API    → http://localhost:3000/consenti/api/v1/')
})`,
          },
          {
            label: 'Standalone',
            lang: 'typescript',
            code: `import { createServer } from 'node:http'
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

await consenti.ready  // wait for DB init + admin bootstrap

const server = createServer(consenti.handler)
server.listen(3001, () => {
  console.log('Admin dashboard → http://localhost:3001/consenti/')
  console.log('REST API        → http://localhost:3001/consenti/api/v1/')
})`,
          },
          {
            label: 'Fastify',
            lang: 'typescript',
            code: `import Fastify from 'fastify'
import { createConsenti } from '@consenti/api'

const fastify = Fastify({ logger: true })

const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
})

await fastify.register(consenti.fastifyHandler)
await fastify.listen({ port: 3000 })`,
          },
          {
            label: 'Next.js App Router',
            lang: 'typescript',
            code: `// app/consenti/[...path]/route.ts
import { createConsenti } from '@consenti/api'
import type { NextRequest } from 'next/server'

let consenti: Awaited<ReturnType<typeof createConsenti>>

async function getConsenti() {
  if (!consenti) {
    consenti = createConsenti({
      storage: { driver: 'json', path: './consenti-data' },
      auth: {
        mode: 'local',
        adminEmail: process.env.CONSENTI_ADMIN_EMAIL!,
        adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
      },
    })
  }
  return consenti
}

async function handler(req: NextRequest) {
  const c = await getConsenti()
  return c.handleRequest(req)
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
}`,
          },
        ]}
      />

      <h2>Step 3 — First boot</h2>
      <p>Run your server. On first start, Consenti:</p>
      <ol>
        <li>
          Creates the storage directory (<code>./consenti-data/db/</code>,{' '}
          <code>./consenti-data/profiles/</code>).
        </li>
        <li>Bootstraps the database (creates tables and indexes).</li>
        <li>
          Creates the admin user from <code>auth.adminEmail</code> + <code>auth.adminPassword</code>
          .
        </li>
        <li>
          Seeds a default profile (<code>profileId: &apos;0&apos;</code>).
        </li>
      </ol>
      <p>Subsequent starts run only pending migrations — first-boot setup never runs twice.</p>

      <h2>Step 4 — Log in to the dashboard</h2>
      <p>
        Navigate to <code>http://localhost:3000/consenti/</code> and log in with the credentials you
        configured. You&apos;ll land on the Dashboard overview showing consent statistics. From here
        you can create profiles, manage cookie templates, view consent records, and configure RBAC.
      </p>

      <Callout type="tip">
        The Swagger UI for the REST API is available at{' '}
        <code>http://localhost:3000/consenti/api/docs</code>. The OpenAPI JSON is at{' '}
        <code>/consenti/api/openapi.json</code>.
      </Callout>

      <RelatedDocs
        items={[
          {
            href: '/docs/api/installation/',
            label: 'Installation',
            desc: 'Setup with Express, Fastify, Hono, or raw Node HTTP',
          },
          {
            href: '/docs/api/configuration/',
            label: 'Configuration',
            desc: 'The options most deployments need',
          },
          {
            href: '/docs/api/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'Full createConsenti() options — basePath, auth, storage, and more',
          },
          {
            href: '/docs/api/dashboard/',
            label: 'Admin Dashboard',
            desc: 'What the built-in dashboard at /consenti/ can do',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Which Node.js version do I need?',
            answer: (
              <p className="m-0">
                Node.js ≥ 20.0.0 is the minimum. Node 22 or 24 LTS is recommended for production —
                Node 22.5+ ships <code>node:sqlite</code> as a built-in, which is the fastest
                zero-install storage driver.
              </p>
            ),
          },
          {
            question: 'Do I need to create the database or run migrations manually?',
            answer: (
              <p className="m-0">
                No. Consenti creates all storage directories and runs all migrations automatically
                on first start. You never write SQL or run a migration command. On subsequent
                starts, only new pending migrations run.
              </p>
            ),
          },
          {
            question: 'How do I change the admin password?',
            answer: (
              <p className="m-0">
                Update <code>auth.adminPassword</code> in your config (or the{' '}
                <code>CONSENTI_ADMIN_PASSWORD</code> environment variable) and restart the server.
                Consenti re-hashes and updates the admin user&apos;s password on start.
                Alternatively, use the admin dashboard under Users → Edit.
              </p>
            ),
          },
          {
            question: "What's the default base path and can I change it?",
            answer: (
              <p className="m-0">
                The default base path is <code>/consenti</code>. All routes mount under it:{' '}
                <code>/consenti/api/v1/*</code> for the REST API and <code>/consenti/</code> for the
                dashboard. Change it by setting <code>basePath: &apos;/my-cmp&apos;</code> in config
                or the <code>CONSENTI_BASE_PATH</code> environment variable.
              </p>
            ),
          },
          {
            question: 'Is JSON file storage suitable for production?',
            answer: (
              <p className="m-0">
                JSON storage is great for development and very small deployments. For production,
                use SQLite (<code>node:sqlite</code> on Node 22+), PostgreSQL, MySQL, or MongoDB
                depending on your scale. See the{' '}
                <a href="/guides/backend/storage/">Storage Driver guide</a> for a full comparison.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
