import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'API Installation' }

export default function APIInstallationPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Installation</h1>

      <Callout type="info">
        The API package requires Node.js 22 or later. You need Node 24 to use <code>node:sqlite</code> which shipped as a stable built-in in.
      </Callout>

      <h2>npm install</h2>
      <Terminal code="npm install @consenti/api" />

      <h2>Add to your existing Express app</h2>
      <p>
        <code>createConsenti</code> returns a router you mount on your existing server.
        No new process, no separate port — it lives inside your app at <code>/consenti</code>.
      </p>
      <CodeBlock lang="ts" filename="app.ts" code={`import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()

const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  dashboard: true,
})

app.use(consenti.router)  // mounts all routes under /consenti

app.listen(3000, () => {
  console.log('Server at http://localhost:3000')
  console.log('Admin at http://localhost:3000/consenti/')
})`} />

      <h2>No existing server yet? Use the built-in starter</h2>
      <p>
        If you have no Node.js server at all, <code>consenti.start(port)</code> spins one up for
        you as a convenience — useful for a dedicated consent service or local development.
      </p>
      <CodeBlock lang="ts" filename="server.ts" code={`import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

await consenti.start(3001)
// → Admin dashboard at http://localhost:3001/consenti/
// → REST API at http://localhost:3001/consenti/api/v1/`} />

      <h2>With Fastify</h2>
      <CodeBlock lang="ts" filename="app.ts" code={`import Fastify from 'fastify'
import { createConsenti } from '@consenti/api'

const app = Fastify()
const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  dashboard: true,
})

// Use the plain Node handler via a Fastify raw handler
app.all('/consenti/*', async (req, reply) => {
  reply.hijack()
  consenti.handler(req.raw, reply.raw)
})`} />

      <h2>With Next.js API routes</h2>
      <CodeBlock lang="ts" filename="app/consenti/[...path]/route.ts" code={`import { createConsenti } from '@consenti/api'
import type { NextRequest } from 'next/server'

let consenti: Awaited<ReturnType<typeof createConsenti>>

async function getConsenti() {
  if (!consenti) {
    consenti = createConsenti({
      storage: { driver: 'sqlite', path: './consenti.db' },
      auth: { mode: 'local', adminEmail: process.env.CONSENTI_ADMIN_EMAIL!, adminPassword: process.env.CONSENTI_ADMIN_PASSWORD! },
    })
  }
  return consenti
}

export async function GET(req: NextRequest) {
  const c = await getConsenti()
  return c.handleRequest(req)
}

export { GET as POST, GET as PUT, GET as DELETE, GET as PATCH }`} />

      <Callout type="tip">
        The <code>consenti.handler</code> is a standard <code>http.IncomingMessage → http.ServerResponse</code> handler.
        Any Node.js HTTP framework can wrap it.
      </Callout>

      <h2>First run</h2>
      <p>On first start with SQLite, Consenti:</p>
      <ol>
        <li>Creates the database file at the configured path</li>
        <li>Runs all migrations (creates <code>visitors</code>, <code>consent_records</code>, <code>consent_history</code>, <code>profiles</code>, <code>admin_users</code>, <code>audit_logs</code> tables)</li>
        <li>Creates the admin user from <code>auth.adminEmail</code> + <code>auth.adminPassword</code></li>
        <li>Seeds the default profile (<code>profileId: '0'</code>)</li>
      </ol>
      <p>Subsequent starts run pending migrations only.</p>

      <h2>Environment variables</h2>
      <CodeBlock lang="bash" filename=".env" code={`CONSENTI_ADMIN_PASSWORD=your-strong-password
NODE_ENV=production
# Optional:
CONSENTI_DB_PATH=./data/consenti.db
CONSENTI_BASE_PATH=/consent         # change /consenti prefix
CONSENTI_ADMIN_JWT_SECRET=your-jwt-secret          # auto-generated if not set`} />
    </div>
  )
}
