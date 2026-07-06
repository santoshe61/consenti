import { EventEmitter } from 'node:events'
import { readFile } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PluginEngine } from './core/plugin-engine'
import { buildConsentiRuntimeConfig, buildConsentiConfigScript, injectConfigScript } from './utils/handle-config'
import { startGvlRefresh, stopGvlRefresh } from './tcf/gvl-cache'
import { OPENAPI_PUBLIC_SPEC, OPENAPI_ADMIN_SPEC } from './openapi/spec'
import { BetterSqlite3Adapter } from './storage/sqlite/better-sqlite3.adapter'
import { NodeSqlite3WasmAdapter } from './storage/sqlite/node-sqlite3-wasm.adapter'
import { NodeSqliteBuiltinAdapter } from './storage/sqlite/node-sqlite-builtin.adapter'
import { MongoDBAdapter } from './storage/mongodb/mongodb.adapter'
import { MySQLAdapter } from './storage/mysql/mysql.adapter'
import { PostgreSQLAdapter } from './storage/postgresql/postgresql.adapter'
import { JsonFileAdapter } from './storage/json/json-file.adapter'
import { ProfileRepo } from './repositories/profile.repo'
import { ConsentRepo } from './repositories/consent.repo'
import { VisitorRepo } from './repositories/visitor.repo'
import { AuditRepo } from './repositories/audit.repo'
import { UserRepo } from './repositories/user.repo'
import { ProfileService } from './services/profile.service'
import { GeoResolverService } from './services/geo-resolver.service'
import { LocaleJsonCacheService } from './services/locale-json-cache.service'
import { ConsentService } from './services/consent.service'
import { VisitorService } from './services/visitor.service'
import { UserService } from './services/user.service'
import { LocalAuth } from './auth/local.auth'
import { buildProfileRoutes } from './routes/public/profile.routes'
import { buildConsentRoutes } from './routes/public/consent.routes'
import { buildAdminAuthRoutes } from './routes/admin/auth.routes'
import { buildAdminProfileRoutes } from './routes/admin/profiles.routes'
import { buildAdminConsentRoutes } from './routes/admin/consents.routes'
import { buildAdminVisitorRoutes } from './routes/admin/visitors.routes'
import { buildAdminUserRoutes } from './routes/admin/users.routes'
import { buildAdminRoleRoutes } from './routes/admin/roles.routes'
import { buildAdminAuditRoutes } from './routes/admin/audit.routes'
import { buildAdminStatsRoutes } from './routes/admin/stats.routes'
import { buildAdminExportRoutes } from './routes/admin/export.routes'
import { buildAdminApiKeyRoutes } from './routes/admin/apikeys.routes'
import { buildAdminTenantRoutes } from './routes/admin/tenants.routes'
import { buildAdminTcfRoutes } from './routes/admin/tcf.routes'
import { buildAdminCookieTemplateRoutes } from './routes/admin/cookie-templates.routes'
import { buildAdminUITemplateRoutes } from './routes/admin/ui-templates.routes'
import { buildAdminAnalyticsRoutes } from './routes/admin/analytics.routes'
import { resolveStoragePaths } from './utils/storage-path'
import { resolveTenant } from './middleware/tenant.middleware'
import { RateLimiter } from './middleware/rate-limit.middleware'
import { handleCors, withCors, addSecurityHeaders } from './middleware/cors.middleware'
import { errorResponse } from './middleware/error.middleware'
import { nodeRequestToFetch, fetchResponseToNode, PayloadTooLargeError } from './utils/http'
import type { ConsentiServerConfig, StorageAdapter, StorageConfig } from '@consenti/types'
import { EMBEDDED_COMPLIANCE_MAP } from '@consenti/utils'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ── Path resolution ────────────────────────────────────────────────────────────

const DIST_DIR = dirname(fileURLToPath(import.meta.url))
// new URL pattern is recognised by @vercel/nft (Next.js standalone tracer),
// causing it to include the dashboard/ directory for any consumer's standalone build.
export const dashboardDir: string = fileURLToPath(new URL('./dashboard', import.meta.url))

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

async function tryServeDashboard(
  pathname: string,
  basePath: string,
  dashboardDir: string,
  res: ServerResponse,
  configScript: string,
): Promise<boolean> {
  const rel = pathname.slice(basePath.length) || '/'
  if (rel.startsWith('/api/') || rel.startsWith('/admin/')) return false
  const target = rel === '/' || rel === '' || !extname(rel)
    ? join(dashboardDir, 'index.html')
    : join(dashboardDir, rel)
  // directory traversal guard
  if (!target.startsWith(dashboardDir)) return false
  try {
    const raw = await readFile(target)
    const ext = extname(target).toLowerCase()
    const isHtml = ext === '.html' || ext === ''
    const ct = MIME[ext] ?? 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': ct })
    res.end(isHtml ? injectConfigScript(raw, configScript) : raw)
    return true
  } catch {
    return false
  }
}

async function serveDistFile(filePath: string, contentType: string): Promise<Response> {
  try {
    const data = await readFile(filePath)
    return new Response(data, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' } })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}

// ── Minimal path router ────────────────────────────────────────────────────────

type Handler = (req: Request, params: Record<string, string>) => Promise<Response>

interface RouteEntry {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: Handler
  rateLimit: boolean
}

function compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = []
  const regexParts = path.split('/').map(part => {
    if (part.startsWith(':')) {
      paramNames.push(part.slice(1))
      return '([^/]+)'
    }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })
  return { pattern: new RegExp(`^${regexParts.join('\\/')}$`), paramNames }
}

interface RouteGroup {
  prefix: string
  routes: Record<string, Handler>
  rateLimit?: boolean
}

function branded404(basePath: string): Response {
  const docsHref = `${basePath}/api/docs`
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 — Consenti</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
  .card{text-align:center;max-width:480px;width:100%}
  .badge{display:inline-flex;align-items:center;gap:.5rem;background:#1e2330;border:1px solid #2d3347;border-radius:999px;padding:.35rem .85rem;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#7c8db5;margin-bottom:2rem}
  .badge svg{width:14px;height:14px;fill:#4f6ef7}
  h1{font-size:6rem;font-weight:800;line-height:1;background:linear-gradient(135deg,#4f6ef7,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5rem}
  h2{font-size:1.25rem;font-weight:600;color:#cbd5e1;margin-bottom:.75rem}
  p{font-size:.9rem;color:#64748b;line-height:1.6;margin-bottom:2rem}
  a{display:inline-flex;align-items:center;gap:.4rem;background:#4f6ef7;color:#fff;text-decoration:none;padding:.6rem 1.25rem;border-radius:.5rem;font-size:.875rem;font-weight:500;transition:background .15s}
  a:hover{background:#3b5ce6}
  a svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
</style>
</head>
<body>
<div class="card">
  <div class="badge">
    <svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a1 1 0 110 2 1 1 0 010-2zm1 7H7V7h2v4z"/></svg>
    Consenti
  </div>
  <h1>404</h1>
  <h2>Page not found</h2>
  <p>The admin dashboard is not enabled on this instance.<br>Use the API or enable <code style="background:#1e2330;padding:.1rem .35rem;border-radius:.25rem;font-size:.8rem">dashboard: true</code> in your config.</p>
  <a href="${docsHref}">
    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    View API Documentation
  </a>
</div>
</body>
</html>`
  return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function buildFetchRouter(
  basePath: string,
  groups: RouteGroup[],
  rateLimiter: RateLimiter | null,
): (request: Request) => Promise<Response> {
  const entries: RouteEntry[] = []

  for (const group of groups) {
    for (const [key, handler] of Object.entries(group.routes)) {
      const spaceIdx = key.indexOf(' ')
      const method = key.slice(0, spaceIdx).toUpperCase()
      const path = key.slice(spaceIdx + 1)
      const { pattern, paramNames } = compilePath(`${group.prefix}${path}`)
      entries.push({ method, pattern, paramNames, handler, rateLimit: group.rateLimit ?? false })
    }
  }

  return async (request: Request): Promise<Response> => {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const url = new URL(request.url)
    const pathname = url.pathname
    const method = request.method.toUpperCase()

    if (rateLimiter) {
      const matched = entries.find(e => e.rateLimit && pathname.match(e.pattern))
      if (matched) {
        const ip = request.headers.get('x-real-ip') ?? ''
        if (!rateLimiter.checkRequest(ip)) {
          return withCors(errorResponse(429, 'Too Many Requests'), request)
        }
      }
    }

    for (const entry of entries) {
      if (entry.method !== method) continue
      const match = pathname.match(entry.pattern)
      if (!match) continue
      const params: Record<string, string> = {}
      entry.paramNames.forEach((name, i) => {
        const val = match[i + 1]
        if (val != null) params[name] = val
      })
      const response = await entry.handler(request, params)
      return addSecurityHeaders(withCors(response, request))
    }

    const isUiPath =
      pathname.startsWith(basePath) &&
      !pathname.startsWith(`${basePath}/api/`) &&
      !pathname.startsWith(`${basePath}/admin/`)

    return addSecurityHeaders(
      withCors(isUiPath ? branded404(basePath) : errorResponse(404, 'Not Found'), request),
    )
  }
}

// ── Deep merge ────────────────────────────────────────────────────────────────

function isPlainObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    const ov = override[key]
    const bv = result[key]
    if (ov !== undefined && isPlainObj(ov) && isPlainObj(bv)) {
      result[key] = deepMerge(bv, ov)
    } else if (ov !== undefined) {
      result[key] = ov
    }
  }
  return result
}

// ── Default config ────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ConsentiServerConfig = {
  dashboard: true,
  basePath: process.env['CONSENTI_BASE_PATH'] ?? '/consenti',
  ...(process.env['CONSENTI_MAX_BODY_SIZE'] ? { maxBodySize: Number(process.env['CONSENTI_MAX_BODY_SIZE']) } : {}),
  storage: {
    driver: (process.env['CONSENTI_DB_DRIVER'] as StorageConfig['driver'] | undefined) ?? 'json',
    path: process.env['CONSENTI_DB_PATH'] ?? './consenti-data.json',
    ...(process.env['CONSENTI_DB_URI'] ? { uri: process.env['CONSENTI_DB_URI'] } : {}),
    ...(process.env['CONSENTI_DB_DATABASE'] ? { database: process.env['CONSENTI_DB_DATABASE'] } : {}),
    ...(process.env['CONSENTI_DB_HOST'] ? { host: process.env['CONSENTI_DB_HOST'] } : {}),
    ...(process.env['CONSENTI_DB_PORT'] ? { port: Number(process.env['CONSENTI_DB_PORT']) } : {}),
    ...(process.env['CONSENTI_DB_USER'] ? { user: process.env['CONSENTI_DB_USER'] } : {}),
    ...(process.env['CONSENTI_DB_PASSWORD'] ? { password: process.env['CONSENTI_DB_PASSWORD'] } : {}),
  },
  auth: {
    mode: 'local',
    adminEmail: process.env['CONSENTI_ADMIN_EMAIL'] ?? 'user@consenti.dev',
    adminPassword: process.env['CONSENTI_ADMIN_PASSWORD'] ?? 'Consenti@123',
    ...(process.env['CONSENTI_ADMIN_JWT_SECRET'] ? { jwtSecret: process.env['CONSENTI_ADMIN_JWT_SECRET'] } : {}),
  },
  rateLimit: {
    windowMs: process.env['CONSENTI_RATE_LIMIT_WINDOW_MS'] ? Number(process.env['CONSENTI_RATE_LIMIT_WINDOW_MS']) : 60_000,
    maxRequests: process.env['CONSENTI_RATE_LIMIT_MAX_REQUESTS'] ? Number(process.env['CONSENTI_RATE_LIMIT_MAX_REQUESTS']) : 60,
  },
  branding: {
    appLogoPath: "./logo-dark.svg",
    appName: "Consenti",
    hidePoweredBy: false,
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────

function createStorageAdapter(config: NonNullable<ConsentiServerConfig['storage']>): StorageAdapter {
  switch (config.driver) {
    case 'mongodb': return new MongoDBAdapter(config)
    case 'mysql': return new MySQLAdapter(config)
    case 'postgresql': return new PostgreSQLAdapter(config)
    case 'node:sqlite': return new NodeSqliteBuiltinAdapter(config)
    case 'better-sqlite3':
    case 'sqlite': return new BetterSqlite3Adapter(config)
    case 'node-sqlite3-wasm': new NodeSqlite3WasmAdapter(config)
    case 'json':
    default: return new JsonFileAdapter(config)
  }
}

export function createConsenti(userConfig: ConsentiServerConfig) {
  const config = deepMerge(
    DEFAULT_CONFIG as unknown as Record<string, unknown>,
    userConfig as unknown as Record<string, unknown>,
  ) as ConsentiServerConfig

  if (!userConfig.storage) {
    console.warn('[Consenti] No storage config — using node-sqlite3-wasm (SQLite WASM) at ./consenti-data.db. Switch to a database driver for production.')
  }
  if (!userConfig.auth && !process.env['CONSENTI_ADMIN_PASSWORD']) {
    console.warn('[Consenti] No auth config or CONSENTI_ADMIN_PASSWORD env var — using demo credentials. Set CONSENTI_ADMIN_EMAIL and CONSENTI_ADMIN_PASSWORD before going to production.')
  }

  const storageConfig = config.storage!
  const authConfig = config.auth!

  const storagePaths = resolveStoragePaths(
    storageConfig.path ?? './consenti-data',
    storageConfig.driver ?? 'json',
  )
  const profilesDir = storagePaths.profilesDir

  const storage = createStorageAdapter(storageConfig)
  const eventBus = new EventEmitter()

  const profileRepo = new ProfileRepo(storage)
  const consentRepo = new ConsentRepo(storage)
  const visitorRepo = new VisitorRepo(storage)
  const auditRepo = new AuditRepo(storage)
  const userRepo = new UserRepo(storage)

  const pluginEngine = new PluginEngine()
  if (config.plugins?.length) pluginEngine.register(config.plugins)

  const compliance = config.compliance ?? {}
  const complianceType = compliance.type ?? 'auto'
  const needsGeo = complianceType === 'auto'

  const localeCache = (config as { localeJsonCache?: { enabled?: boolean; dir?: string } }).localeJsonCache?.enabled
    ? new LocaleJsonCacheService((config as { localeJsonCache?: { dir?: string } }).localeJsonCache!.dir!)
    : undefined

  const geoResolver = needsGeo
    ? new GeoResolverService(compliance.geoDataProvider ?? 'default', EMBEDDED_COMPLIANCE_MAP)
    : undefined

  if (complianceType === 'auto' && !compliance.geoDataProvider) {
    console.info("[Consenti] compliance.geoDataProvider not set — defaulting to timezone+language heuristic")
  }
  if (complianceType !== 'auto' && compliance.geoDataProvider) {
    console.warn('[Consenti] compliance.geoDataProvider is ignored when compliance.type is a fixed group')
  }

  const profileService = new ProfileService(profileRepo, auditRepo, 'default', storage, eventBus, localeCache, profilesDir, config.handleCache, config.s3Api)
  const visitorService = new VisitorService(visitorRepo, 'default', eventBus)
  const consentService = new ConsentService(
    consentRepo, visitorRepo, profileRepo, auditRepo, 'default', config.compliance,
    pluginEngine, eventBus, config.tcf,
  )
  const userService = new UserService(userRepo, auditRepo)

  const adminSecret = authConfig.jwtSecret ?? ''
  const localAuth = new LocalAuth(storage, adminSecret)

  const rl = config.rateLimit!
  const rateLimiter = rl.enabled === false
    ? null
    : new RateLimiter(rl.windowMs!, rl.maxRequests!)
  const authLimiter = new RateLimiter(15 * 60_000, 10)

  const multiTenantEnabled = config.multiTenant?.enabled === true
  const resolveTenantId = multiTenantEnabled
    ? (req: Request) => resolveTenant(req, storage, 'default')
    : async (_req: Request) => 'default'

  const basePath = config.basePath!
  const apiBase = `${basePath}/api/v1`
  const adminBase = `${basePath}/admin`
  const docsPath = `${basePath}/api`

  const dashboardEnabled = !!config.dashboard
  const dashboardDir = join(DIST_DIR, 'dashboard')

  const configScript = dashboardEnabled
    ? buildConsentiConfigScript(
      buildConsentiRuntimeConfig(dashboardDir, basePath, config.branding, config.compliance),
    )
    : ''

  const swaggerHtml = `<!DOCTYPE html><html><head><title>Consenti API Docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" crossorigin="anonymous"></head>
<body><div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
<script>SwaggerUIBundle({urls:[{url:'${docsPath}/openapi.json',name:'Public API (/consenti/api)'},{url:'${docsPath}/openapi-admin.json',name:'Admin API (/consenti/admin)'}],'urls.primaryName':'Public API (/consenti/api)',dom_id:'#swagger-ui',presets:[SwaggerUIBundle.presets.apis,SwaggerUIStandalonePreset],layout:'StandaloneLayout'})</script>
</body></html>`

  const robotsTxt = `User-agent: *\nDisallow: ${basePath}/\n`

  const fetchRouter = buildFetchRouter(
    basePath,
    [
      {
        prefix: docsPath,
        rateLimit: false,
        routes: {
          'GET /docs': async () => new Response(swaggerHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
          'GET /openapi.json': async () => new Response(JSON.stringify(OPENAPI_PUBLIC_SPEC, null, 2), { headers: { 'Content-Type': 'application/json' } }),
          'GET /openapi-admin.json': async () => new Response(JSON.stringify(OPENAPI_ADMIN_SPEC, null, 2), { headers: { 'Content-Type': 'application/json' } }),
        },
      },
      {
        prefix: '',
        rateLimit: false,
        routes: {
          'GET /robots.txt': async () => new Response(robotsTxt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
        },
      },
      {
        prefix: apiBase,
        rateLimit: true,
        routes: {
          ...buildProfileRoutes(profileService, geoResolver, profilesDir, apiBase),
          ...buildConsentRoutes(consentService, visitorService, profileService, resolveTenantId),
        },
      },
      {
        prefix: adminBase,
        rateLimit: false,
        routes: {
          'GET /widget.js': async () => serveDistFile(join(DIST_DIR, 'widget', 'widget.js'), 'application/javascript; charset=utf-8'),
          'GET /widget.css': async () => serveDistFile(join(DIST_DIR, 'widget', 'widget.css'), 'text/css; charset=utf-8'),
          ...buildAdminAuthRoutes(localAuth, storage, authConfig, adminSecret, authLimiter),
          ...buildAdminProfileRoutes(profileService, storage, authConfig, adminSecret),
          ...buildAdminConsentRoutes(storage, authConfig, adminSecret),
          ...buildAdminVisitorRoutes(storage, authConfig, adminSecret),
          ...buildAdminUserRoutes(userService, storage, authConfig, adminSecret),
          ...buildAdminRoleRoutes(storage, authConfig, adminSecret),
          ...buildAdminAuditRoutes(storage, authConfig, adminSecret),
          ...buildAdminStatsRoutes(storage, authConfig, adminSecret),
          ...buildAdminExportRoutes(storage, authConfig, adminSecret),
          ...buildAdminApiKeyRoutes(storage, authConfig, adminSecret),
          ...buildAdminTenantRoutes(storage, authConfig, adminSecret),
          ...buildAdminTcfRoutes(storage, authConfig, adminSecret),
          ...buildAdminCookieTemplateRoutes(storage, authConfig, adminSecret),
          ...buildAdminUITemplateRoutes(storage, authConfig, adminSecret),
          ...buildAdminAnalyticsRoutes(storage, authConfig, adminSecret),
        },
      },
    ],
    rateLimiter,
  )

  let retentionTimer: ReturnType<typeof setInterval> | null = null

  // Resolves after storage.connect() + bootstrap() complete — consumers can await
  // this before accepting requests to guarantee the admin user already exists.
  let resolveReady!: () => void
  let rejectReady!: (err: unknown) => void
  const ready = new Promise<void>((res, rej) => { resolveReady = res; rejectReady = rej })

  storage
    .connect()
    .then(async () => {
      if (authConfig.mode === 'local' && authConfig.adminEmail && authConfig.adminPassword) {
        await localAuth.bootstrap(authConfig.adminEmail, authConfig.adminPassword)
      }
      await pluginEngine.initialize({ storage, config })
      eventBus.emit('ready')
      resolveReady()

      if (config.tcf?.enabled) {
        startGvlRefresh()
      }

      if (config.dataRetention?.purgeAfterDays) {
        const days = config.dataRetention.purgeAfterDays
        const purge = () => storage.purgeExpiredConsents(days)
          .then(n => { if (n > 0) console.warn(`[consenti] Purged ${n} consent records older than ${days} days`) })
          .catch((err: unknown) => console.warn('[consenti] Data retention purge failed:', err))
        void purge()
        retentionTimer = setInterval(() => { void purge() }, 24 * 60 * 60_000)
      }
    })
    .catch((err: unknown) => {
      console.warn('[consenti] Storage connection failed:', err)
      rejectReady(err)
    })

  async function nodeHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const rawProto = req.headers['x-forwarded-proto']
      const proto = rawProto === 'https' ? 'https' : 'http'
      const host = req.headers['host'] ?? 'localhost'
      const url = new URL(req.url ?? '/', `${proto}://${host}`)

      if (dashboardEnabled && url.pathname.startsWith(basePath)) {
        const served = await tryServeDashboard(url.pathname, basePath, dashboardDir, res, configScript)
        if (served) return
      }

      const request = await nodeRequestToFetch(req, config.maxBodySize, config.trustedProxies)
      const response = await fetchRouter(request)

      if (url.pathname === `${basePath}/api/openapi.json`) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(OPENAPI_PUBLIC_SPEC, null, 2))
        return
      }

      if (url.pathname === `${basePath}/api/openapi-admin.json`) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(OPENAPI_ADMIN_SPEC, null, 2))
        return
      }

      if (url.pathname === `${basePath}/api/docs`) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(swaggerHtml)
        return
      }

      if (
        response.status === 404 &&
        dashboardEnabled &&
        url.pathname.startsWith(basePath) &&
        !url.pathname.startsWith(basePath + '/api/') &&
        !url.pathname.startsWith(basePath + '/admin/')
      ) {
        try {
          const html = await readFile(join(dashboardDir, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(injectConfigScript(html, configScript))
          return
        } catch {
          // dashboard not built — fall through
        }
      }

      await fetchResponseToNode(response, res)
    } catch (err) {
      if (!res.headersSent) {
        if (err instanceof PayloadTooLargeError) {
          res.writeHead(413, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Payload Too Large' }))
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Internal Server Error' }))
        }
      }
    }
  }

  function router(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ): void {
    nodeHandler(req, res)
      .then(() => { if (!res.writableEnded) next() })
      .catch(next)
  }

  function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    return nodeHandler(req, res)
  }

  const fastifyHandler = async (
    fastify: {
      all: (
        path: string,
        handler: (req: { raw: IncomingMessage }, reply: { raw: ServerResponse; hijack: () => void }) => Promise<void>,
      ) => void
    },
    _opts: unknown,
  ): Promise<void> => {
    fastify.all('/*', async (request, reply) => {
      await nodeHandler(request.raw, reply.raw)
      reply.hijack()
    })
  }
  Object.defineProperty(fastifyHandler, Symbol.for('skip-override'), { value: true })

  const fetchHandler = async (request: Request): Promise<Response> => {
    if (dashboardEnabled) {
      const url = new URL(request.url)
      const pathname = url.pathname
      if (pathname.startsWith(basePath)) {
        const rel = pathname.slice(basePath.length) || '/'
        if (!rel.startsWith('/api/') && !rel.startsWith('/admin/')) {
          const target = extname(rel) ? join(dashboardDir, rel) : join(dashboardDir, 'index.html')
          if (!target.startsWith(dashboardDir)) {
            return new Response('Forbidden', { status: 403 })
          }
          try {
            const raw = await readFile(target)
            const ext = extname(target).toLowerCase()
            const isHtml = ext === '.html' || ext === ''
            const ct = MIME[ext] ?? 'application/octet-stream'
            const body = isHtml ? injectConfigScript(raw, configScript) : raw
            return new Response(body, { headers: { 'Content-Type': ct } })
          } catch {
            try {
              const html = await readFile(join(dashboardDir, 'index.html'))
              return new Response(injectConfigScript(html, configScript), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              })
            } catch {
              return new Response(
                'Dashboard not built. Run: npm run build --workspace=apps/api',
                { status: 404, headers: { 'Content-Type': 'text/plain' } },
              )
            }
          }
        }
      }
    }
    return fetchRouter(request)
  }

  const honoApp = { fetch: fetchHandler }

  const services = {
    profile: profileService,
    consent: consentService,
    visitor: visitorService,
    user: userService,
  }

  return {
    router,
    handler,
    fastifyHandler,
    honoApp,
    services,
    storage: storage as StorageAdapter,
    eventBus,
    ready,
    destroy: async () => {
      if (retentionTimer) clearInterval(retentionTimer)
      if (config.tcf?.enabled) stopGvlRefresh()
      await pluginEngine.destroy()
    },
  }
}

export { SQLiteAdapter } from './storage/sqlite/sqlite.adapter'
export { MongoDBAdapter } from './storage/mongodb/mongodb.adapter'
export { MySQLAdapter } from './storage/mysql/mysql.adapter'
export { PostgreSQLAdapter } from './storage/postgresql/postgresql.adapter'

export type {
  ConsentiServerConfig,
  BrandingConfig,
  StorageAdapter,
  Profile,
  ConsentDbRecord,
  Visitor,
  AdminUser,
  Role,
  Permission,
  AuditLog,
  ConsentVerifyResult,
  SafeAdminUser,
} from '@consenti/types'
