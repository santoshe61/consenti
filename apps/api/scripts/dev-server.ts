import { createServer } from 'node:http'
import { createConsenti } from '../src/index.ts'

const [major] = process.versions.node.split('.').map(Number)
if (major < 20) {
  console.error(`\n[dev-server] Requires Node.js >= 20.0.0. Current: v${process.versions.node}\n`)
  process.exit(1)
}

const PORT = Number(process.env['CONSENTI_DEV_PORT'] ?? 3001)

const consenti = createConsenti({
  dashboard: false,
  compliance: { gdpr: true, ccpa: true, gpc: true },
  branding: {
    appName: "Consenti",
    appLogoPath: "./logo-dark.svg"
  },
  storage: {
    driver: 'json',
    path: '../../db/'
  }
})

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const body = chunks.length ? Buffer.concat(chunks) : undefined

  const webReq = new Request(url, {
    method: req.method ?? 'GET',
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([, v]) => v != null) as [string, string][],
    ),
    body: body?.length && req.method !== 'GET' && req.method !== 'HEAD'
      ? body
      : undefined,
  })

  let webRes: Response
  try {
    webRes = await consenti.honoApp.fetch(webReq)
  } catch (err) {
    console.error('[dev-server] handler error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
    return
  }

  const headers: Record<string, string> = {}
  webRes.headers.forEach((value, key) => { headers[key] = value })
  res.writeHead(webRes.status, headers)
  const buf = await webRes.arrayBuffer()
  res.end(Buffer.from(buf))
})

server.listen(PORT, () => {
  console.log(`\n[dev-server] Consenti API running at http://localhost:${PORT}, consenti base path is http://localhost:${PORT}/consenti`)
  console.log('[dev-server] Admin email:', process.env['CONSENTI_ADMIN_EMAIL'] ?? 'user@consenti.dev')
  console.log('[dev-server] Password:   (set via CONSENTI_ADMIN_PASSWORD env var)')
  console.log('[dev-server] DB:    consenti-dev.db\n')
})
