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
  storage: { driver: 'node:sqlite', path: './consenti-data' },  // directory, not a file
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: process.env.CONSENTI_ADMIN_PASSWORD! },
  dashboard: true,
})

app.use(consenti.router)  // mounts all routes under /consenti

app.listen(3000, () => {
  console.log('Server at http://localhost:3000')
  console.log('Admin at http://localhost:3000/consenti/')
})`} />

      <h2>Standalone — no existing server</h2>
      <p>
        Use the plain <code>node:http</code> handler when you have no existing HTTP framework.
      </p>
      <CodeBlock lang="ts" filename="server.ts" code={`import { createServer } from 'node:http'
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

await consenti.ready   // wait for DB + bootstrap

const server = createServer(consenti.handler)
server.listen(3001, () => {
  console.log('Admin dashboard → http://localhost:3001/consenti/')
  console.log('REST API        → http://localhost:3001/consenti/api/v1/')
})`} />

      <h2>With Fastify</h2>
      <CodeBlock lang="ts" filename="app.ts" code={`import Fastify from 'fastify'
import { createConsenti } from '@consenti/api'

const fastify = Fastify()
const consenti = createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: process.env.CONSENTI_ADMIN_PASSWORD! },
  dashboard: true,
})

await fastify.register(consenti.fastifyHandler)
await fastify.listen({ port: 3000 })`} />

      <h2>With Next.js App Router</h2>
      <CodeBlock lang="ts" filename="app/consenti/[...path]/route.ts" code={`import { createConsenti } from '@consenti/api'
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
    })
  }
  return consenti
}

async function consentiHandler(req: NextRequest) {
  const c = await getConsenti()
  return c.handleRequest(req)
}

export { consentiHandler as GET, consentiHandler as POST, consentiHandler as PUT, consentiHandler as DELETE, consentiHandler as PATCH }`} />

      <Callout type="tip">
        The <code>consenti.handler</code> is a standard <code>http.IncomingMessage → http.ServerResponse</code> handler.
        Any Node.js HTTP framework can wrap it.
      </Callout>

      <h2>First run</h2>
      <p>On first start, Consenti:</p>
      <ol>
        <li>Creates the storage directory at the configured <code>storage.path</code> with <code>db/</code>, <code>profiles/</code>, and <code>logs/</code> subdirectories</li>
        <li>Runs all migrations (creates <code>visitors</code>, <code>consent_records</code>, <code>consent_history</code>, <code>profiles</code>, <code>admin_users</code>, <code>audit_logs</code> tables and DB indexes)</li>
        <li>Creates the admin user from <code>auth.adminEmail</code> + <code>auth.adminPassword</code></li>
        <li>Seeds the default profile (<code>profileId: '0'</code>)</li>
      </ol>
      <p>Subsequent starts run pending migrations only.</p>

      <h2>Environment variables</h2>
      <p>All config fields can be set via environment variables. Code config takes precedence over env vars.</p>
      <CodeBlock lang="bash" filename=".env" code={`# Auth
CONSENTI_ADMIN_EMAIL=user@consenti.dev
CONSENTI_ADMIN_PASSWORD=your-strong-password
CONSENTI_ADMIN_JWT_SECRET=your-jwt-secret   # auto-generated if not set (sessions expire on restart)

# Storage
CONSENTI_DB_DRIVER=node:sqlite              # default: json
CONSENTI_DB_PATH=./consenti-data            # directory path
CONSENTI_DB_URI=postgresql://...            # server drivers (pg, mysql, mongodb)
CONSENTI_DB_DATABASE=consenti               # database name override

# Routing
CONSENTI_BASE_PATH=/cmp                     # change /consenti prefix (default: /consenti)

# Rate limiting
CONSENTI_RATE_LIMIT_WINDOW_MS=60000         # default: 60000
CONSENTI_RATE_LIMIT_MAX_REQUESTS=60         # default: 60

# Body size
CONSENTI_MAX_BODY_SIZE=1048576              # default: 1 MB

# Node.js
NODE_ENV=production                         # suppresses stack traces in error responses`} />
    </div>
  )
}
