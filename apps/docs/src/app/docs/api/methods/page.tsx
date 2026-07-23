import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'API Methods',
  description:
    'createConsenti(config) returns a plain object with framework adapters, service references, and lifecycle controls — nothing is a class.',
  alternates: { canonical: '/docs/api/methods' },
  openGraph: {
    title: 'API Methods',
    description:
      'createConsenti(config) returns a plain object with framework adapters, service references, and lifecycle controls — nothing is a class.',
    url: 'https://consenti.dev/docs/api/methods',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Methods',
    description:
      'createConsenti(config) returns a plain object with framework adapters, service references, and lifecycle controls — nothing is a class.',
    images: ['/og-image.jpg'],
  },
}

export default function APIMethodsPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Return Value &amp; Methods</h1>
      <p>
        <code>createConsenti(config)</code> returns an object with framework adapters, service
        references, and lifecycle controls. Nothing is a <code>class</code> — you get a plain object
        you can destructure or pass around.
      </p>

      <h2>Quick reference</h2>
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Framework adapters
            </td>
          </tr>
          <tr>
            <td>
              <code>router</code>
            </td>
            <td>
              <code>(req, res, next) =&gt; void</code>
            </td>
            <td>
              Express / Connect middleware. Calls <code>next()</code> for unmatched routes.
            </td>
          </tr>
          <tr>
            <td>
              <code>handler</code>
            </td>
            <td>
              <code>(req, res) =&gt; Promise&lt;void&gt;</code>
            </td>
            <td>
              Terminal Node.js HTTP handler. Does not call next. Use with raw{' '}
              <code>http.createServer</code> or as a Fastify handler.
            </td>
          </tr>
          <tr>
            <td>
              <code>fastifyHandler</code>
            </td>
            <td>Fastify plugin</td>
            <td>
              Drop-in Fastify plugin. Register with{' '}
              <code>fastify.register(consenti.fastifyHandler)</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>honoApp</code>
            </td>
            <td>
              <code>{'{ fetch: (req: Request) => Promise<Response> }'}</code>
            </td>
            <td>
              Hono / WinterCG fetch handler. Works with Cloudflare Workers, Deno, Bun, and any
              runtime that supports the Fetch API.
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Services
            </td>
          </tr>
          <tr>
            <td>
              <code>services.profile</code>
            </td>
            <td>
              <code>ProfileService</code>
            </td>
            <td>Create, get, update, and delete consent profiles.</td>
          </tr>
          <tr>
            <td>
              <code>services.consent</code>
            </td>
            <td>
              <code>ConsentService</code>
            </td>
            <td>Submit, update, erase, and verify consent records.</td>
          </tr>
          <tr>
            <td>
              <code>services.visitor</code>
            </td>
            <td>
              <code>VisitorService</code>
            </td>
            <td>List and manage visitor records.</td>
          </tr>
          <tr>
            <td>
              <code>services.user</code>
            </td>
            <td>
              <code>UserService</code>
            </td>
            <td>Create and manage admin users programmatically.</td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Infrastructure
            </td>
          </tr>
          <tr>
            <td>
              <code>storage</code>
            </td>
            <td>
              <code>StorageAdapter</code>
            </td>
            <td>Raw storage adapter. Use when the service layer does not expose what you need.</td>
          </tr>
          <tr>
            <td>
              <code>eventBus</code>
            </td>
            <td>
              <code>EventEmitter</code>
            </td>
            <td>
              Node.js EventEmitter that fires lifecycle events. See{' '}
              <a href="/docs/api/events">Events</a>.
            </td>
          </tr>
          <tr>
            <td>
              <code>ready</code>
            </td>
            <td>
              <code>Promise&lt;void&gt;</code>
            </td>
            <td>
              Resolves after storage connects and the bootstrap admin user is created. Await this
              before accepting requests.
            </td>
          </tr>
          <tr>
            <td
              colSpan={3}
              className="bg-gray-50 font-semibold text-xs uppercase tracking-wide text-gray-500 px-2 py-1"
            >
              Lifecycle
            </td>
          </tr>
          <tr>
            <td>
              <code>destroy()</code>
            </td>
            <td>
              <code>() =&gt; Promise&lt;void&gt;</code>
            </td>
            <td>
              Graceful shutdown — stops background jobs, runs plugin <code>destroy()</code> hooks.
              Call before <code>process.exit()</code>.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── router ────────────────────────────────────────────────────────── */}
      <h2>router</h2>
      <p>
        Express / Connect compatible middleware. Handles all Consenti routes and calls{' '}
        <code>next()</code> for any path that does not match. Use this when Consenti shares a
        process with other Express routes.
      </p>
      <CodeBlock
        lang="ts"
        filename="Express"
        code={`import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()
const consenti = createConsenti({ /* ... */ })

app.use(consenti.router)  // Consenti handles /consenti/…; other routes fall through

app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(3000)`}
      />

      {/* ── handler ───────────────────────────────────────────────────────── */}
      <h2>handler</h2>
      <p>
        Terminal Node.js HTTP handler. Suitable for <code>http.createServer</code>, or as an
        all-routes Fastify handler. Does not call <code>next()</code> — if the request does not
        match, a JSON 404 is returned.
      </p>
      <CodeBlock
        lang="ts"
        filename="Standalone"
        code={`import { createServer } from 'node:http'
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({ /* ... */ })
await consenti.ready

const server = createServer(consenti.handler)
server.listen(3000)`}
      />

      {/* ── fastifyHandler ─────────────────────────────────────────────────── */}
      <h2>fastifyHandler</h2>
      <p>
        Pre-built Fastify plugin. It catches all paths and delegates to the Consenti handler,
        bypassing Fastify&apos;s routing layer for maximum compatibility.
      </p>
      <CodeBlock
        lang="ts"
        filename="Fastify"
        code={`import Fastify from 'fastify'
import { createConsenti } from '@consenti/api'

const fastify = Fastify()
const consenti = createConsenti({ /* ... */ })

await fastify.register(consenti.fastifyHandler)
await fastify.listen({ port: 3000 })`}
      />

      {/* ── honoApp ───────────────────────────────────────────────────────── */}
      <h2>honoApp</h2>
      <p>
        WinterCG-compatible fetch handler. Conforms to the <code>{'{ fetch }'}</code> interface
        expected by Hono, Cloudflare Workers, Deno, Bun, and Next.js Edge routes.
      </p>
      <CodeBlock
        lang="ts"
        filename="Hono"
        code={`import { Hono } from 'hono'
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({ /* ... */ })

const app = new Hono()
app.all('/consenti/*', (c) => consenti.honoApp.fetch(c.req.raw))`}
      />
      <CodeBlock
        lang="ts"
        filename="Next.js App Router (catch-all)"
        code={`// app/consenti/[...path]/route.ts
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({ /* ... */ })

const handler = (req: Request) => consenti.honoApp.fetch(req)

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }`}
      />

      {/* ── ready ─────────────────────────────────────────────────────────── */}
      <h2>ready</h2>
      <p>
        A <code>Promise&lt;void&gt;</code> that resolves once the storage adapter has connected,
        migrations have run, and the bootstrap admin user has been created (first run only). Reject
        if storage fails to connect.
      </p>
      <p>
        Always await <code>ready</code> before starting to accept requests in production — this
        ensures the admin user exists and the database schema is up to date.
      </p>
      <CodeBlock
        lang="ts"
        code={`const consenti = createConsenti({ /* ... */ })

await consenti.ready  // ← guaranteed schema + admin user after this line

server.listen(3000, () => {
  console.log('Consenti ready at http://localhost:3000/consenti')
})`}
      />
      <Callout type="warning">
        Skipping <code>await ready</code> is safe for fire-and-forget scripts, but in a server
        process it risks accepting requests before the database schema exists — causing crashes on
        the first query.
      </Callout>

      {/* ── services ──────────────────────────────────────────────────────── */}
      <h2>services</h2>
      <p>
        Direct programmatic access to the service layer — no HTTP overhead, no auth check. Use this
        for server-side scripts, scheduled jobs, or integration tests.
      </p>
      <CodeBlock
        lang="ts"
        code={`const { services, storage } = createConsenti({ /* ... */ })

// Read a profile
const profile = await services.profile.get('profile-uuid')

// Submit consent programmatically (e.g. from a server-side form handler)
const record = await services.consent.create({
  visitorId: 'visitor-uuid',
  profileId: 'profile-uuid',
  locale: 'en',
  consentJson: { analytics: 'granted', marketing: 'denied', necessary: 'granted' },
  gpcDetected: false,
  source: 'api',
})

// List recent visitors
const visitors = await services.visitor.list({ tenantId: 'default', page: 1, limit: 50 })`}
      />

      {/* ── storage ───────────────────────────────────────────────────────── */}
      <h2>storage</h2>
      <p>
        The raw <code>StorageAdapter</code> instance. Use it when the service layer does not expose
        the operation you need, or when writing integration tests that seed data directly.
      </p>
      <CodeBlock
        lang="ts"
        code={`const { storage } = createConsenti({ /* ... */ })
await consenti.ready

// Stream all consent records for an export job
for await (const record of storage.streamConsents({ tenantId: 'default' })) {
  await writeToWarehouse(record)
}

// Get overview stats directly
const stats = await storage.getOverviewStats('default')`}
      />

      {/* ── destroy ───────────────────────────────────────────────────────── */}
      <h2>destroy()</h2>
      <p>
        Runs graceful shutdown in order: stops the data-retention background timer, stops the GVL
        refresh job (if TCF is enabled), and calls <code>destroy()</code> on each registered plugin.
        Call this before <code>process.exit()</code> or in your framework&apos;s shutdown hook.
      </p>
      <CodeBlock
        lang="ts"
        code={`// Express + graceful shutdown
process.on('SIGTERM', async () => {
  await consenti.destroy()
  server.close(() => process.exit(0))
})

// Fastify
fastify.addHook('onClose', async () => {
  await consenti.destroy()
})`}
      />
    </div>
  )
}
