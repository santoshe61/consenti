# @consenti/api

Zero-dependency, GDPR-compliant Consent Management Platform backend for Node.js.

[![npm version](https://img.shields.io/npm/v/@consenti/api.svg)](https://www.npmjs.com/package/@consenti/api)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

---

## Why this package?

- **Three SQLite drivers** — `node:sqlite` (Node 22.5+ built-in, zero install), `node-sqlite3-wasm` (WASM, zero compilation, optional peer dep), `better-sqlite3` (native, optional peer dep)
- **One function to mount** — `createConsenti()` returns a router you drop into any Node.js HTTP framework
- **Self-contained admin dashboard** — full SPA served at your `basePath`, no separate deploy
- **Multi-regulation** — GDPR, CCPA, CPRA, GPC, TCF v2.2, DPDPA, LGPD, PDPA, PIPEDA, APPI, KVKK, POPIA, UK-GDPR
- **Pluggable storage** — SQLite (zero-config, default) · PostgreSQL · MySQL · MongoDB

---

## Requirements

- **Node.js ≥ 20.0.0** — Node 22 or 24 LTS recommended for production

## Which SQLite driver should I use?

| Driver | Config | Node requirement | Extra install? |
|---|---|---|---|
| `node:sqlite` | `driver: 'node:sqlite'` | ≥ 22.5 (stable in 24) | **No** — Node built-in |
| `node-sqlite3-wasm` | `driver: 'node-sqlite3-wasm'` | ≥ 20 | Yes — `npm install node-sqlite3-wasm` |
| `better-sqlite3` | `driver: 'better-sqlite3'` | ≥ 20 | Yes — `npm install better-sqlite3` |
| `'sqlite'` | `driver: 'sqlite'` | ≥ 20 | Alias for `better-sqlite3` |

`node:sqlite` is the only driver that requires no extra install — it ships with Node 22.5+.
On Node 20/21, choose between `node-sqlite3-wasm` (pure WASM, no compilation) or `better-sqlite3` (native binary, faster but may fail on Alpine/musl/ARM).

---

## Installation

```bash
npm install @consenti/api
```

All SQLite drivers and other database adapters are optional peer dependencies — only install what you need:

```bash
# SQLite (choose one — node:sqlite needs no install on Node 22.5+)
npm install node-sqlite3-wasm   # WASM SQLite — Node 20+, zero compilation
npm install better-sqlite3      # native SQLite — Node 20+, faster but needs a C++ toolchain

# Other databases
npm install pg        # PostgreSQL
npm install mysql2    # MySQL
npm install mongodb   # MongoDB
```

---

## Quick Start

### Express

```ts
import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()

const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

app.use(consenti.router)

app.listen(3000, () => {
  console.log('Server → http://localhost:3000')
  console.log('Admin  → http://localhost:3000/consenti/')
  console.log('API    → http://localhost:3000/consenti/api/v1/')
})
```

### Standalone (no framework)

```ts
import { createConsenti } from '@consenti/api'

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
// Admin dashboard → http://localhost:3001/consenti/
// REST API        → http://localhost:3001/consenti/api/v1/
```

---

## Framework Adapters

### Express / Connect

```ts
app.use(consenti.router)    // as middleware (calls next() for unmatched routes)
// — or —
app.use(consenti.handler)   // as a terminal handler (no next())
```

### Fastify

```ts
import Fastify from 'fastify'
const app = Fastify()

const consenti = createConsenti({ /* ... */ })

app.all('/consenti/*', async (req, reply) => {
  reply.hijack()
  consenti.handler(req.raw, reply.raw)
})
```

### Next.js App Router

```ts
// app/consenti/[...path]/route.ts
import { createConsenti } from '@consenti/api'
import type { NextRequest } from 'next/server'

let consenti: Awaited<ReturnType<typeof createConsenti>>

async function getConsenti() {
  if (!consenti) {
    consenti = createConsenti({
      storage: { driver: 'sqlite', path: './consenti.db' },
      auth: {
        mode: 'local',
        adminEmail: process.env.CONSENTI_ADMIN_EMAIL!,
        adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
      },
    })
  }
  return consenti
}

export async function GET(req: NextRequest) {
  const c = await getConsenti()
  return c.handleRequest(req)
}

export { GET as POST, GET as PUT, GET as DELETE, GET as PATCH }
```

### Hono / Fetch-based

```ts
return consenti.honoApp.fetch(request)
```

---

## Full Configuration

```ts
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  // ── Required ────────────────────────────────────────────────────────────────
  storage: {
    driver: 'node-sqlite3-wasm', // 'node-sqlite3-wasm' | 'node:sqlite' | 'better-sqlite3' | 'pg' | 'mongodb' | 'mysql'
    path: './consenti.db',      // SQLite only — file path

    // PostgreSQL
    // driver: 'pg',
    // url: 'postgresql://user:pass@localhost:5432/consenti',
    // pool: { max: 10, idleTimeoutMillis: 30000 },

    // MongoDB
    // driver: 'mongodb',
    // url: 'mongodb://localhost:27017',
    // dbName: 'consenti',

    // MySQL
    // driver: 'mysql',
    // url: 'mysql://user:pass@localhost:3306/consenti',
  },
  auth: {
    mode: 'local',              // 'local' | 'oauth' | 'saml' | 'none'
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET,   // auto-generated if omitted (changes on restart)
    sessionTtl: 86400,          // JWT TTL in seconds (default: 24 h)

    // OAuth / OIDC (e.g. Auth0, Keycloak)
    // mode: 'oauth',
    // oidc: {
    //   issuer: 'https://your-idp.example.com',
    //   clientId: 'your-client-id',
    //   clientSecret: process.env.OIDC_SECRET,
    //   redirectUri: 'https://app.example.com/consenti/admin/auth/callback',
    // },

    // SAML
    // mode: 'saml',
    // saml: {
    //   issuer: 'consenti',
    //   entryPoint: 'https://idp.example.com/sso/saml',
    //   cert: process.env.SAML_CERT,
    //   callbackUrl: 'https://app.example.com/consenti/admin/auth/saml/callback',
    // },

    // Custom — bring your own validator
    // mode: 'custom',
    // validateUser: async (req) => ({ id, email, roles, permissions } | null),
  },

  // ── Optional ────────────────────────────────────────────────────────────────
  basePath: '/consenti',        // URL prefix (default: '/consenti')
  dashboard: true,              // serve admin SPA (default: false)
  trustProxy: false,            // true when behind nginx / Cloudflare

  rateLimit: {
    enabled: true,
    windowMs: 60_000,           // rolling window (default: 60 s)
    maxRequests: 60,            // max requests per IP per window (default: 60)
  },

  cors: {
    origins: ['https://yoursite.com'],  // never use '*' in production
    credentials: true,
  },

  compliance: {
    gdpr: true,                 // opt-in enforcement
    ccpa: false,                // opt-out model
    gpc: true,                  // store gpc_detected on records
    tcf: {
      enabled: false,           // IAB TCF v2.2
      cmpId: 123,               // your registered CMP ID
    },
  },

  ageGate: {
    enabled: false,
    minimumAge: 13,
    requireParentalConsent: false,
  },

  dataRetention: {
    purgeAfterDays: 365,        // auto-purge old records (0 = disabled)
  },

  multiTenant: {
    enabled: false,             // isolate data per tenant
  },

  plugins: [],                  // ConsentiServerPlugin instances
})
```

---

## First Boot

On first start with SQLite, Consenti:

1. Creates the database file at the configured path
2. Runs all migrations (creates `visitors`, `consent_records`, `consent_history`, `profiles`, `admin_users`, `audit_logs` tables)
3. Creates the admin user from `auth.adminEmail` + `auth.adminPassword`
4. Seeds the default profile (`profileId: '0'`)

Subsequent starts run only pending migrations.

---

## Public REST API

Base path: `/consenti/api/v1` (change with `basePath` in config). No authentication required.

| Method     | Path                          | Description                                     |
|------------|-------------------------------|-------------------------------------------------|
| `GET`      | `/profiles/:id`               | Get profile resolved in its default locale      |
| `GET`      | `/profiles/:id/:locale`       | Get profile resolved for a specific locale      |
| `POST`     | `/consent`                    | Submit a consent record                         |
| `GET`      | `/consent/:visitorId`         | Get current consent for a visitor               |
| `PUT`      | `/consent/:visitorId`         | Update consent for a visitor                    |
| `DELETE`   | `/consent/:visitorId`         | GDPR right-to-erasure — delete all visitor data |
| `GET`      | `/consent/:visitorId/verify`  | Check if consent is still valid                 |

### Submit consent

```http
POST /consenti/api/v1/consent
Content-Type: application/json

{
  "profileId": "my-profile-id",
  "consentJson": {
    "necessary": "granted",
    "analytics": "granted",
    "marketing": "denied"
  },
  "visitorId": "uuid-v4",
  "profileVersion": 3,
  "locale": "en",
  "gpcDetected": false,
  "source": "banner"
}
```

Response `201`:

```json
{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile-id",
  "profileVersion": 3,
  "locale": "en",
  "consentJson": { "necessary": "granted", "analytics": "granted", "marketing": "denied" },
  "gpcDetected": false,
  "source": "banner",
  "createdAt": "2026-06-26T10:00:00.000Z",
  "updatedAt": "2026-06-26T10:00:00.000Z"
}
```

### Verify consent

```http
GET /consenti/api/v1/consent/visitor-uuid/verify
```

```json
{ "valid": true }

// or, when stale:
{ "valid": false, "reason": "profile_version_mismatch" }
// other reasons: "consent_expired" | "missing_cookies"
```

---

## Admin REST API

Base path: `/consenti/admin`. Every route requires `Authorization: Bearer <jwt>`.

Obtain a token via `POST /consenti/admin/auth/login`.

### Auth

| Method | Path              | Description                       |
|--------|-------------------|-----------------------------------|
| `POST` | `/auth/login`     | Authenticate — returns a JWT      |
| `GET`  | `/auth/me`        | Get current authenticated user    |
| `POST` | `/auth/logout`    | Invalidate session                |

```http
POST /consenti/admin/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "your-password" }
```

```json
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

### Profiles

| Method     | Path              | Description                              |
|------------|-------------------|------------------------------------------|
| `GET`      | `/profiles`       | List all profiles                        |
| `POST`     | `/profiles`       | Create a profile                         |
| `GET`      | `/profiles/:id`   | Get a profile                            |
| `PUT`      | `/profiles/:id`   | Update a profile (auto-bumps version)    |
| `DELETE`   | `/profiles/:id`   | Delete a profile                         |

### Consents

| Method   | Path                             | Description                                 |
|----------|----------------------------------|---------------------------------------------|
| `GET`    | `/consents`                      | List consent records (paginated, filterable)|
| `GET`    | `/consents/:visitorId`           | Get consent record for a visitor            |
| `GET`    | `/consents/:visitorId/history`   | Get consent change history                  |

Query params for `GET /consents`: `page`, `limit`, `profileId`, `from`, `to`.

### Visitors

| Method | Path           | Description                         |
|--------|----------------|-------------------------------------|
| `GET`  | `/visitors`    | List visitor records (paginated)    |

IPs are never stored raw — only SHA-256 hashes appear in the `ipHash` field.

### Users & Roles

| Method     | Path                              | Description                      |
|------------|-----------------------------------|----------------------------------|
| `GET`      | `/users`                          | List admin users                 |
| `POST`     | `/users`                          | Create an admin user             |
| `PUT`      | `/users/:id`                      | Update an admin user             |
| `GET`      | `/roles`                          | List roles                       |
| `POST`     | `/roles`                          | Create a role                    |
| `GET`      | `/roles/:id/permissions`          | Get permissions for a role       |
| `POST`     | `/roles/:id/permissions`          | Assign a permission to a role    |
| `DELETE`   | `/roles/:id/permissions/:permId`  | Revoke a permission from a role  |
| `GET`      | `/permissions`                    | List all available permissions   |

### API Keys

| Method     | Path            | Description                                          |
|------------|-----------------|------------------------------------------------------|
| `GET`      | `/apikeys`      | List API keys                                        |
| `POST`     | `/apikeys`      | Create an API key (raw key returned once — save it!) |
| `DELETE`   | `/apikeys/:id`  | Revoke an API key                                    |

### Stats & Reporting

| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| `GET`  | `/stats/overview`         | Total consents, visitors, GPC count      |
| `GET`  | `/stats/timeline`         | Daily consent counts (`?days=30`)        |
| `GET`  | `/stats/categories`       | Per-category grant/deny breakdown        |
| `GET`  | `/stats/countries`        | Consent count by country                 |
| `GET`  | `/stats/gpc`              | GPC detection statistics                 |
| `GET`  | `/export/consents`        | Export consent records (CSV or JSON)     |
| `GET`  | `/export/consents/xlsx`   | Export as XLSX                           |
| `GET`  | `/export/audit`           | Export audit log (CSV or JSON)           |

### Audit Log

| Method | Path      | Description                                             |
|--------|-----------|---------------------------------------------------------|
| `GET`  | `/audit`  | Paginated audit log; filter by `action`, `resourceType`, date range |

### Multi-Tenant

| Method     | Path             | Description          |
|------------|------------------|----------------------|
| `GET`      | `/tenants`       | List tenants         |
| `POST`     | `/tenants`       | Create a tenant      |
| `PUT`      | `/tenants/:id`   | Update a tenant      |
| `DELETE`   | `/tenants/:id`   | Delete a tenant      |

Only active when `multiTenant.enabled: true`.

### IAB TCF

| Method | Path              | Description               |
|--------|-------------------|---------------------------|
| `GET`  | `/tcf/vendors`    | List IAB TCF vendors      |
| `GET`  | `/tcf/purposes`   | List IAB TCF purposes     |

Only active when `tcf.enabled: true`.

---

## Admin Dashboard

Served at `{basePath}/` when `dashboard: true`.

| Section           | Description                                                              |
|-------------------|--------------------------------------------------------------------------|
| Dashboard         | Consent overview, timeline chart, country breakdown, GPC stats           |
| Profiles          | Create / edit / copy / delete consent profiles via 3-step wizard         |
| Cookie Templates  | Reusable cookie/purpose definitions                                      |
| UI Templates      | Reusable banner + modal layout settings                                  |
| Consents          | Browse, filter, export consent records; per-visitor history              |
| Visitors          | Visitor list with geographic data                                        |
| Users             | Admin user management                                                    |
| Roles             | RBAC roles and fine-grained permission assignment                        |
| Sites             | Multi-tenant site management                                             |
| TCF Vendors       | IAB Global Vendor List                                                   |
| Audit Log         | Immutable log of all admin actions                                       |
| Settings          | API keys, branding                                                       |

### Profile Creation Wizard

**Step 1 — Cookie Template:** Define cookie IDs and their properties:

| Field               | Type                              | Description                                       |
|---------------------|-----------------------------------|---------------------------------------------------|
| `id`                | `string`                          | Unique identifier referenced in button arrays     |
| `type`              | `'consent' \| 'legitimate_interest'` | Legal basis                                    |
| `mandatory`         | `boolean`                         | Always granted; toggle disabled in modal          |
| `listenGpc`         | `boolean`                         | Auto-denied when GPC signal is active             |
| `expiry`            | `number`                          | Days until re-consent is required (0 = session)  |

**Step 2 — UI Template:** Configure banner and modal layout:

- **Main Banner / GPC Banner:** `position`, `overlayOpacity`, `showClose`, `headingTag`, `buttons`
- **Preference Modal:** `position`, `overlayOpacity`, `showClose`, `persistent`, `buttons`, `categories`
- Button `type`: `primary | secondary | text | reject | submit | manage | close`
- Button `cookies`: `*` (grant all) · `!` (deny all) · comma-separated IDs

**Step 3 — Content:** Enter localised copy with live preview:

- Main Banner: heading, body HTML
- GPC Banner: heading, body HTML
- Preference Modal: heading, subheading, intro HTML, per-category heading + description

---

## Plugins (Server-side)

```ts
import { ConsentiServerPlugin } from '@consenti/api'
import type { PluginContext, CreateConsentInput, ConsentDbRecord } from '@consenti/api'

class MyPlugin extends ConsentiServerPlugin {
  name = 'my-plugin'

  async initialize(ctx: PluginContext) {
    // ctx.storage — access storage adapter directly
    console.log('Plugin initialised')
  }

  async destroy() {}

  // All hooks are optional:
  async beforeConsentSave(data: CreateConsentInput) {
    return data  // modify or validate; return modified data
  }

  async afterConsentSave(record: ConsentDbRecord) {
    // send to analytics, trigger webhooks, etc.
    await fetch('/my-webhook', { method: 'POST', body: JSON.stringify(record) })
  }

  async beforeConsentUpdate(data: unknown) { return data }
  async afterConsentUpdate(record: unknown) {}
  async beforeProfileFetch(id: string) { return id }
  async afterProfileFetch(profile: unknown) { return profile }
  async beforeUserCreate(data: unknown) { return data }
  async afterUserCreate(user: unknown) {}
}

const consenti = createConsenti({
  // ...
  plugins: [new MyPlugin()],
})
```

---

## Programmatic Service Access

```ts
const consenti = createConsenti({ /* ... */ })

// Access services directly — bypass HTTP layer
const profile  = await consenti.services.profile.get('profile-id')
const consent  = await consenti.services.consent.submit({ /* ... */ })
const visitors = await consenti.services.visitor.list({ tenantId: 'default' })

// Access storage adapter
await consenti.storage.getConsents({ tenantId: 'default', from: '2026-01-01' })

// Event bus
consenti.eventBus.on('ready', () => console.log('Backend ready'))

// Graceful shutdown
await consenti.destroy()
```

---

## Security

| Concern                   | Approach                                                                     |
|---------------------------|------------------------------------------------------------------------------|
| IP addresses              | Never stored raw — SHA-256 hashed: `createHash('sha256').update(ip).digest('hex')` |
| Passwords                 | `scrypt` via `node:crypto` — no external bcrypt                              |
| JWTs                      | `createHmac` via `node:crypto` — no jsonwebtoken package                     |
| Admin routes              | Always require `Authorization: Bearer <jwt>`                                 |
| Stack traces              | Suppressed in `NODE_ENV=production` responses                                |
| CORS                      | Explicit allowlist — never use `origins: '*'` in production                  |
| Rate limiting             | Applied to all public API routes by default                                  |

---

## Environment Variables

| Variable                  | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| `NODE_ENV`                | Set to `'production'` to suppress stack traces in error responses           |
| `CONSENTI_ADMIN_PASSWORD`          | Override `auth.adminPassword` from config                                   |
| `CONSENTI_ADMIN_JWT_SECRET`              | Override `auth.jwtSecret` from config                                       |
| `CONSENTI_DB_PATH`        | Override `storage.path` (SQLite)                                            |
| `CONSENTI_BASE_PATH`      | Override `basePath`                                                         |

---

## Interactive API Docs

When running, Swagger UI is available at `{basePath}/api/docs`.
OpenAPI JSON at `{basePath}/api/openapi.json`.

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
