import Link from 'next/link'
import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'

export const metadata: Metadata = { title: 'Backend API Overview' }

export default function APIOverviewPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — @consenti/api</h1>
      <p>
        The Consenti backend module records consent to a database, serves the REST API, provides an admin dashboard,
        and runs server-side plugins. It has zero external runtime dependencies — only Node.js 24 built-ins.
      </p>

      <h2>Installation</h2>
      <Terminal code="npm install @consenti/api" />

      <h2>Quick start</h2>
      <p>
        Add it to your existing Node.js server — <code>consenti.router</code> mounts all routes
        inside your app. No separate process or port needed.
      </p>
      <CodeBlock lang="ts" code={`import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()

const consenti = createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },  // path is a directory
  auth: {
    mode: 'local',
    adminEmail: 'admin@yoursite.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

app.use(consenti.router)  // all Consenti routes now live under /consenti
app.listen(3000)`} />

      <h2>What createConsenti returns</h2>
      <table>
        <thead>
          <tr><th>Property</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>handler</code></td><td><code>http.RequestListener</code></td><td>Plain Node.js HTTP handler — use with <code>http.createServer</code> or as a terminal handler</td></tr>
          <tr><td><code>router</code></td><td>Express-compatible middleware</td><td>Mount with <code>app.use(consenti.router)</code>; calls <code>next()</code> for unmatched routes</td></tr>
          <tr><td><code>fastifyHandler</code></td><td>Fastify plugin</td><td>Register with <code>fastify.register(consenti.fastifyHandler)</code></td></tr>
          <tr><td><code>honoApp</code></td><td>Hono app</td><td>Use with <code>consenti.honoApp.fetch(request)</code> for fetch-based runtimes</td></tr>
          <tr><td><code>ready</code></td><td><code>Promise&lt;void&gt;</code></td><td>Resolves when storage is connected, migrations run, and bootstrap admin is created</td></tr>
          <tr><td><code>storage</code></td><td><code>StorageAdapter</code></td><td>Direct access to the storage layer for custom queries</td></tr>
          <tr><td><code>services</code></td><td>service map</td><td>Programmatic access — <code>consenti.services.profile.get(id)</code>, <code>consenti.services.consent.submit(...)</code>, etc.</td></tr>
          <tr><td><code>eventBus</code></td><td><code>EventEmitter</code></td><td>Subscribe to lifecycle events: <code>consent.created</code>, <code>profile.updated</code>, <code>cache:warm</code>, etc.</td></tr>
          <tr><td><code>destroy()</code></td><td><code>Promise&lt;void&gt;</code></td><td>Graceful shutdown — closes DB connection and calls plugin <code>destroy()</code></td></tr>
        </tbody>
      </table>

      <h2>Architecture</h2>
      <CodeBlock lang="text" code={`Request → Routes → Services → Repositories → StorageAdapter → Database
                ↓
           Plugins (hooks fire at service layer)`} />
      <ul>
        <li><strong>Routes</strong> — validate input, call services, return HTTP responses</li>
        <li><strong>Services</strong> — business logic (consent validation, versioning, expiry)</li>
        <li><strong>Repositories</strong> — translate domain objects to/from the storage adapter</li>
        <li><strong>StorageAdapter</strong> — the only layer that knows about the DB engine</li>
        <li><strong>Plugins</strong> — lifecycle hooks fired at the service layer</li>
      </ul>

      <h2>Storage adapters</h2>
      <table>
        <thead>
          <tr><th>Driver</th><th>Config value</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>JSON file</td><td><code>json</code></td><td>Default — zero install, dev/low-traffic only. Not suitable for production.</td></tr>
          <tr><td>node:sqlite (built-in)</td><td><code>node:sqlite</code></td><td>Node 22.5+ built-in. Zero install. Recommended for Node 22+.</td></tr>
          <tr><td>better-sqlite3</td><td><code>better-sqlite3</code> or <code>sqlite</code></td><td>Native addon — faster, needs build toolchain. Node 20+.</td></tr>
          <tr><td>WASM SQLite</td><td><code>node-sqlite3-wasm</code></td><td>Pure WASM, no compilation. Node 20+.</td></tr>
          <tr><td>PostgreSQL</td><td><code>postgresql</code></td><td>Optional peer dep: <code>npm install pg</code></td></tr>
          <tr><td>MySQL / MariaDB</td><td><code>mysql</code></td><td>Optional peer dep: <code>npm install mysql2</code></td></tr>
          <tr><td>MongoDB</td><td><code>mongodb</code></td><td>Optional peer dep: <code>npm install mongodb</code></td></tr>
        </tbody>
      </table>

      <h2>Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose mt-4">
        {[
          { href: '/docs/api/installation/', title: 'Installation', desc: 'npm install, embed in Express/Fastify/Next.js, first-run DB setup' },
          { href: '/docs/api/configuration/', title: 'Configuration', desc: 'Full createConsenti() options reference including s3Api, handleCache, and geo resolvers' },
          { href: '/docs/api/routes/', title: 'API Routes', desc: 'REST endpoints, request/response shapes' },
          { href: '/docs/api/dashboard/', title: 'Admin Dashboard', desc: 'Built-in Preact SPA — profiles, templates, consent records, RBAC' },
          { href: '/docs/api/events/', title: 'Events', desc: 'EventBus reference — consent, profile, and cache lifecycle events' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="block p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition-all no-underline">
            <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
