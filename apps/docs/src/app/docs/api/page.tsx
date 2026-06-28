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
  storage: { driver: 'sqlite', path: './consenti.db' },
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
          <tr><td><code>consenti.handler</code></td><td><code>http.RequestListener</code></td><td>Plain Node.js HTTP handler — use with <code>http.createServer</code></td></tr>
          <tr><td><code>consenti.router</code></td><td>Express-compatible router</td><td>Mount with <code>app.use(consenti.router)</code></td></tr>
          <tr><td><code>consenti.storage</code></td><td><code>StorageAdapter</code></td><td>Direct access to the storage layer for custom queries</td></tr>
          <tr><td><code>consenti.start(port)</code></td><td><code>Promise&lt;void&gt;</code></td><td>Convenience starter for when you have no existing server — not needed when using <code>consenti.router</code></td></tr>
          <tr><td><code>consenti.stop()</code></td><td><code>Promise&lt;void&gt;</code></td><td>Graceful shutdown — closes DB connection and calls plugin <code>destroy()</code></td></tr>
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
          <tr><th>Driver</th><th>Status</th><th>Config</th></tr>
        </thead>
        <tbody>
          <tr><td>SQLite</td><td>Built-in (default)</td><td><code>&#123; driver: 'sqlite', path: './consenti.db' &#125;</code></td></tr>
          <tr><td>MongoDB</td><td>Phase 4</td><td><code>&#123; driver: 'mongodb', url: '...' &#125;</code></td></tr>
          <tr><td>MySQL / MariaDB</td><td>Phase 4</td><td><code>&#123; driver: 'mysql', url: '...' &#125;</code></td></tr>
          <tr><td>PostgreSQL</td><td>Phase 4</td><td><code>&#123; driver: 'pg', url: '...' &#125;</code></td></tr>
        </tbody>
      </table>

      <h2>Sections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose mt-4">
        {[
          { href: '/docs/api/installation/', title: 'Installation', desc: 'npm install, embed in Express/Fastify/Next.js, first-run DB setup' },
          { href: '/docs/api/configuration/', title: 'Configuration', desc: 'Full createConsenti() options reference' },
          { href: '/docs/api/routes/', title: 'API Routes', desc: 'REST endpoints, request/response shapes' },
          { href: '/docs/api/dashboard/', title: 'Admin Dashboard', desc: 'Built-in Preact SPA — profiles, consent records, RBAC' },
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
