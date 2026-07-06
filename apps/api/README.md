# @consenti/api

Zero-dependency, GDPR-compliant Consent Management Platform backend for Node.js.

[![npm version](https://img.shields.io/npm/v/@consenti/api.svg)](https://www.npmjs.com/package/@consenti/api)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../../LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

---

## Why Consenti?

- **Three SQLite drivers** — `node:sqlite` (Node 22.5+ built-in, zero install), `node-sqlite3-wasm` (WASM, zero compilation, optional peer dep), `better-sqlite3` (native, optional peer dep)
- **One function to mount** — `createConsenti()` returns a router you drop into any Node.js HTTP framework
- **Self-contained admin dashboard** — full SPA served at your `basePath`, no separate deploy
- **Multi-regulation** — 76 regulations across EU/EEA, UK, US (22 state laws), India, Brazil, China, Canada, 18 APAC countries, 9 Middle East countries, 14 African countries, and more — with automatic geo-routing via 8 compliance groups
- **Pluggable storage** — SQLite (zero-config, default) · PostgreSQL · MySQL · MongoDB

---

## Requirements

- **Node.js ≥ 20.0.0** — Node 22 or 24 LTS recommended for production


## Installation

```bash
npm install @consenti/api
```

### Database / Storage
Consenti by default comes with JSON file based storage, to get started without any installation.
We have inbuilt SQLite, PostgreSQL, MySQL and MongoDB as storage adaptors, all are optional peer dependencies,  only install any one of them that you need. Thats not all, you can create an adaptor for any other database you want to use by using [adapter.interface.ts](apps/api/src/storage/adapter.interface.ts)

> **Note:** Default JSON file based storage is only for development and small scale deployments, for production it is recommended to use other database options.

```bash
# Databases (choose any one )

# 1. node:sqlite - Node native SQLite, 
     # needs no install on Node 22.5+

# OR 2. WASM SQLite — Node 20+, zero compilation (optional, install only if storage.driver: "node-sqlite3-wasm")
npm install node-sqlite3-wasm   

# OR 3. native SQLite — Node 20+, faster but needs a C++ toolchain (optional, install only if storage.driver: "better-sqlite3")
npm install better-sqlite3      

# OR 4. PostgreSQL (optional, install only if storage.driver: "postgresql")
npm install pg        

# OR 5. MySQL (optional, install only if storage.driver: "mysql")
npm install mysql2    

# OR 6. MongoDB (optional, install only if storage.driver: "mongodb")
npm install mongodb   

# OR 7. Create your own custom database Adaptor using "apps/api/src/storage/adapter.interface.ts"

```

### Which SQLite driver should I use?

| Driver | Config | Node requirement | Extra install? |
|---|---|---|---|
| `node:sqlite` | `driver: 'node:sqlite'` | ≥ 22.5 (stable in 24) | **No** — Node built-in |
| `node-sqlite3-wasm` | `driver: 'node-sqlite3-wasm'` | ≥ 20 | Yes — `npm install node-sqlite3-wasm` |
| `better-sqlite3` | `driver: 'better-sqlite3'` | ≥ 20 | Yes — `npm install better-sqlite3` |
| `'sqlite'` | `driver: 'sqlite'` | ≥ 20 | Alias for `better-sqlite3` |

`node:sqlite` is the only driver that requires no extra install — it ships with Node 22.5+.
On Node 20/21, choose between `node-sqlite3-wasm` (pure WASM, no compilation) or `better-sqlite3` (native binary, faster but may fail on Alpine/musl/ARM).


### Geo resolvers - compliance routing

Consenti ships with four geo resolver options. The default requires zero installation; the others are opt-in.

**Bonus:** You can also supply a custom resolver function via `compliance.geoDataProvider` — it receives `{ ip, timezone, language }` and must return `{ country: string | null, region: string | null, locale: string | null }`.

> **Note:** The default (`'default'`) and `'hosted-geoip-lite'` resolvers are suitable for development and lower-traffic deployments. For high-accuracy production use, choose `'geoip'` or `'maxmind'`.

### Which geo resolver should I use?

| Resolver | Config | Extra install? | Notes |
|---|---|---|---|
| `default` | `geoDataProvider: 'default'` | **No** | Timezone + Accept-Language heuristic; zero deps; less accurate |
| `hosted-geoip-lite` | `geoDataProvider: 'hosted-geoip-lite'` | **No** | Calls `ipinfo.io` via `node:https`; requires outbound internet |
| `geoip` | `geoDataProvider: 'geoip'` | Yes — `npm install geoip-lite` | Local MaxMind GeoLite2 DB via `geoip-lite`; fast, no outbound traffic |
| `maxmind` | `geoDataProvider: 'maxmind'` | Yes — `npm install maxmind` | Official MaxMind SDK; most accurate; requires `.mmdb` file |
| `CountryResolverFn` | `geoDataProvider: myFn` | Depends on your impl | Bring your own resolver — see custom example below |

```bash
# Geo resolvers (choose any one ) 

# 1. Default - language+timezone based
     # No install needed

# OR 2. Hosted Geo-IP (optional — only needed when geoDataProvider: 'hosted-geoip-lite')
     # No install needed — calls ipinfo.io using Node's built-in node:https
     # Requires outbound internet access from your server

# OR 3. Geo-IP lite (optional — only needed when geoDataProvider: 'geoip')
npm install geoip-lite

# OR 4. Maxmind (optional — only needed when geoDataProvider: 'maxmind')
npm install maxmind

# OR 5. Custom (optional — only needed when geoDataProvider: CountryResolverFn)
        # Do what it requires, just return `{ country, region, locale }` in supported format

```
---


## Full Configuration
Selected values are default

```ts
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  // ── Storage ─────────────────────────────────────────────────────────────────
  storage: {
    driver: 'json',              // 'json' | 'node:sqlite' | 'node-sqlite3-wasm' | 'better-sqlite3' | 'sqlite' | 'postgresql' | 'mysql' | 'mongodb'
    path: './consenti-data',     // base directory — Consenti creates db/, profiles/, logs/ subdirectories automatically
    
    // Optional
    uri: 'mongodb://localhost:27017/consenti', // db connection string/uri, only for (driver: 'postgresql' | 'mysql' | 'mongodb')
    database: 'consenti',        // database name when not in above uri
  },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  auth: {
    mode: 'local',               // 'local' | 'jwt' | 'oidc' | 'saml' | 'custom'
    adminEmail: 'user@consenti.dev',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD ?? "Consenti@123",
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET,  // auto-generated if omitted (sessions expire on restart)

    // OIDC (Auth0, Keycloak, Google, etc.)
    // mode: 'oidc',
    // oidc: {
    //   issuer: 'https://your-idp.example.com',
    //   clientId: 'your-client-id',
    //   clientSecret: process.env.OIDC_SECRET,
    //   redirectUri: 'https://app.example.com/consenti/admin/auth/oidc/callback',
    //   claimsMapping: { email: 'email', roles: 'consenti_roles' },
    // },

    // SAML
    // mode: 'saml',
    // saml: {
    //   issuer: 'https://idp.example.com',
    //   entryPoint: 'https://idp.example.com/sso/saml',
    //   cert: process.env.SAML_CERT!,           // IdP signing cert (PEM, no headers)
    //   callbackUrl: 'https://app.example.com/consenti/admin/auth/saml/callback',
    // },

    // Custom — bring your own authentication function
    // mode: 'custom',
    // validateUser: async (req: Request) => AdminUser | null,
  },

  // ── Routing ──────────────────────────────────────────────────────────────────
  basePath: '/consenti',         // URL prefix for all routes (default: '/consenti')
  dashboard: true,               // serve built-in admin SPA at basePath (default: true)

  // ── Branding ─────────────────────────────────────────────────────────────────
  branding: {
    appName: 'Consenti',              // shown in dashboard header, login page, browser tab
    appLogoPath: './logo-dark.svg',   // local file path or https:// URL; auto-served as static asset
    hidePoweredBy: false,             // true = hide "Powered by Consenti" badge
  },

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  rateLimit: {
    enabled: true,
    windowMs: 60_000,            // rolling window in ms (default: 60 000)
    maxRequests: 60,             // max requests per IP per window (default: 60)
  },

  // ── Compliance ───────────────────────────────────────────────────────────────
  compliance: {
    // Geo-based auto routing (recommended)
    type: 'auto',                // 'auto' = geo-resolve per visitor | ComplianceGroupId = one fixed group globally
    geoDataProvider: 'default',  // 'default' (timezone+language heuristic, zero-dep) | 'hosted-geoip-lite' (no install, calls ipinfo.io) | 'geoip' (optional peer dep) | 'maxmind' (optional peer dep) | CountryResolverFn
    autoComplianceMap: 'default',// 'default' = embedded 240-country map | operator object | 'auto' = fetch from complianceMapUrl
    // complianceMapUrl: 'https://consenti.dev/data/v1/compliance-map.json', // used when autoComplianceMap: 'auto'
  },

  // ── S3 profile file sync (optional) ─────────────────────────────────────────
  // When enabled, every locale JSON written to disk is also PUT to S3.
  // /resolve-profile returns an s3:// URL so the widget can fetch directly from CDN.
  s3Api: {
    enabled: false,
    region: 'us-east-1',
    bucketName: 'consenti-profiles',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    // sessionToken: process.env.AWS_SESSION_TOKEN, // for temporary credentials
  },

  // ── Cache invalidation hook (optional) ──────────────────────────────────────
  // Called after every profile creation, edit, activation, deactivation, or delete.
  // isPurge=false = warm the cache at these paths; isPurge=true = purge.
  handleCache: (paths: string[], version: number, isPurge: boolean) => {
    // paths: array of file paths that were written or removed
    // version: current profile version
    // isPurge: true when files were removed (deactivate/delete); false when written (activate/create)
    // Example: purge CDN edge nodes, update nginx cache keys, etc.
  },

  // ── IAB TCF v2.2 ─────────────────────────────────────────────────────────────
  tcf: {
    enabled: false,
    cmpId: 123,                  // your IAB-registered CMP ID (required when enabled)
    cmpVersion: 1,               // your CMP software version
  },

  // ── Age gate ─────────────────────────────────────────────────────────────────
  ageGate: {
    enabled: false,
    minimumAge: 13,              // COPPA = 13; GDPR Article 8 = 16
    requireParentalConsent: false,
  },

  // ── Data retention ───────────────────────────────────────────────────────────
  dataRetention: {
    purgeAfterDays: 365,         // delete consent records older than N days; runs nightly
  },

  // ── Multi-tenant ─────────────────────────────────────────────────────────────
  multiTenant: {
    enabled: false,              // scope all data to tenant from X-Tenant-ID header
  },

  // ── Proxies & body ───────────────────────────────────────────────────────────
  trustedProxies: [],            // IP / CIDR of reverse proxies (reads X-Forwarded-For)
  maxBodySize: 1_048_576,        // request body size limit in bytes (default: 1 MB)

  // ── Plugins ──────────────────────────────────────────────────────────────────
  plugins: [],                   // ConsentiServerPlugin instances
})
```

## Quick Start

### Express

```ts
import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()

const consenti = createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },
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
import { createServer } from 'node:http'
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

await consenti.ready  // wait for DB + bootstrap

const server = createServer(consenti.handler)
server.listen(3001, () => {
  console.log('Admin dashboard → http://localhost:3001/consenti/')
  console.log('REST API        → http://localhost:3001/consenti/api/v1/')
})
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
import { createConsenti } from '@consenti/api'

const fastify = Fastify()
const consenti = createConsenti({ /* ... */ })

await fastify.register(consenti.fastifyHandler)
await fastify.listen({ port: 3000 })
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
      storage: { driver: 'sqlite', path: './consenti-data' },
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

export { consentiHandler as POST, consentiHandler as PUT, consentiHandler as DELETE, consentiHandler as PATCH, consentiHandler as GET }
```

### Hono / Fetch-based

```ts
return consenti.honoApp.fetch(request)
```

---

## First Boot

On first start with JSON, Consenti:

1. Creates the storage directory at the configured path (see [Storage Directory Structure](#storage-directory-structure))
2. Runs all migrations (creates `visitors`, `consent_records`, `consent_history`, `profiles`, `admin_users`, `audit_logs` tables, and DB indexes)
3. Creates the admin user from `auth.adminEmail` + `auth.adminPassword`
4. Seeds the default profile (`profileId: '0'`)

Subsequent starts run only pending migrations.

---

## Storage Directory Structure

`storage.path` is a **directory path**. Consenti creates the following layout automatically:

```
${storage.path}/
  db/
    consenti-data.json     # JSON adapter
    consenti.db            # SQLite adapters
  profiles/
    ${tenantId}/
      ${profileId}/
        1/                 # version 1 (immutable once written)
          en.json
          fr-FR.json
          default.json     # copy of defaultLocale content (fallback)
        2/                 # version 2 written on next save
          …
      ${complianceGroup}/  # hot-serve path (active profile only)
        en.json
        fr-FR.json
        default.json
  logs/                    # reserved for future structured logging
```

**Key rules:**
- Every profile save writes to a new immutable version directory under `${profileId}/${version}/`
- `${complianceGroup}/` only exists when a profile is **active** for that group
- On **activate**: locale files are copied from `${profileId}/${currentVersion}/` → `${complianceGroup}/`
- On **deactivate** / **delete**: `${complianceGroup}/` files are removed
- `default.json` = full resolved profile for `defaultLocale`; used as locale fallback (303 redirect)

**Backward compat:** If `storage.path` has a file extension (`.json`, `.db`), the parent directory is used and a deprecation warning is logged.

---

## Public REST API

Base path: `/consenti/api/v1` (change with `basePath` in config). No authentication required.

| Method     | Path                                        | Description                                                            |
|------------|---------------------------------------------|------------------------------------------------------------------------|
| `GET`      | `/profiles/:tenantId/:complianceGroup/:locale` | **Hot-serve** — serve locale JSON directly from disk (zero DB)      |
| `GET`      | `/profiles/:tenantId/:profileId/:version/:locale` | Serve a specific version locale JSON (dashboard preview)         |
| `GET`      | `/resolve-profile`                          | Geo-resolve compliance group, return file path + locale                |
| `GET`      | `/profiles/:id`                             | get profile by ID (resolved, DB-backed, default tenant, default locale)|
| `GET`      | `/profiles/:id/:locale`                     | get profile by ID & locale (resolved, DB-backed, default tenant)       |
| `GET`      | `/profiles/auto/:locale`                    | Legacy: geo-resolve then return matching active profile                |
| `POST`     | `/consent`                                  | Submit a consent record                                                |
| `GET`      | `/consent/:visitorId`                       | Get current consent for a visitor                                      |
| `PUT`      | `/consent/:visitorId`                       | Update consent for a visitor                                           |
| `DELETE`   | `/consent/:visitorId`                       | GDPR right-to-erasure — delete all visitor data                        |
| `GET`      | `/consent/:visitorId/verify`                | Check if consent is still valid                                        |

### Static file serving (hot path)

```http
GET /consenti/api/v1/profiles/default/opt-in/en
```

Serves `${storage.path}/profiles/default/opt-in/en.json` directly from disk. No DB involved.

If the locale file doesn't exist, returns `303 See Other → .../opt-in/default` (which serves `default.json` = `defaultLocale` content).

Cache headers: `public, max-age=3600, stale-while-revalidate=60` — suitable for CDN caching.

### Resolve profile (for `compliance.type: 'auto'`)

```http
GET /consenti/api/v1/resolve-profile?tz=Europe/Paris&lang=fr-FR&locale=fr-FR
```

For widgets using `compliance.type: 'auto'` — call this once on page load to discover which compliance group and locale the visitor should receive:

```json
{
  "path": "/consenti/api/v1/profiles/default/opt-in/fr-FR",
  "resolvedLocale": "fr-FR",
  "resolvedComplianceGroup": "opt-in",
  "profileId": "gdpr-profile-uuid",
  "version": 3,
  "warning": "locale_not_found"   // only present when locale was unavailable; path points to default
}
```

Query params: `tz` (IANA timezone), `lang` (Accept-Language value), `locale` (preferred BCP 47 locale).

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

| Method     | Path                             | Description                                                             |
|------------|----------------------------------|-------------------------------------------------------------------------|
| `GET`      | `/profiles`                      | List all profiles                                                       |
| `GET`      | `/profiles?summary=1`            | List profiles as `ProfileSummary[]` (no blob, with template names)     |
| `POST`     | `/profiles`                      | Create a profile — 422 on compliance errors; `{ conflict, requiresChoice: true }` when an active profile exists on the same `complianceGroup` |
| `GET`      | `/profiles/:id`                  | Get a profile                                                           |
| `PUT`      | `/profiles/:id`                  | Update a profile (auto-bumps version) — same compliance validation + conflict detection |
| `DELETE`   | `/profiles/:id`                  | Delete a profile                                                        |
| `POST`     | `/profiles/:id/activate`         | Activate a profile — writes locale JSON files to `${complianceGroup}/` |
| `POST`     | `/profiles/:id/deactivate`       | Deactivate a profile — removes `${complianceGroup}/` locale files       |
| `GET`      | `/profiles/:id/versions`         | List version history entries (`{ version, createdAt, locales[] }[]`)   |
| `GET`      | `/profiles/:id/versions/:n`      | Read a specific version locale file (query: `?locale=en`)               |
| `POST`     | `/profiles/validate`             | Validate cookie template against a compliance group (no save)           |
| `GET`      | `/compliance-coverage`           | Active profile (or null) per compliance group — powers coverage panel   |

#### Profile Save Conflict Detection

Only one profile per `complianceGroup` can be active at a time. If you attempt to create or update a profile with `isActive: true` and another active profile already exists for the same `complianceGroup`, the backend returns **200** (not an error) with:

```json
{
  "conflict": { "id": "existing-profile-uuid", "name": "GDPR Profile v1" },
  "requiresChoice": true
}
```

Re-submit the original request with a `choice` field to resolve:

```json
{ "choice": "deactivate" }   // deactivate the conflicting profile, then save this one as active
{ "choice": "inactive" }     // save this profile as inactive (no conflict)
```

The dashboard profile editor shows a three-button popup when `requiresChoice: true` — "Deactivate existing and activate this one", "Save as inactive", and "Cancel".

#### ProfileSummary shape

```ts
{
  id: string
  name: string
  defaultLocale: string
  complianceGroup: ComplianceGroupId | null
  version: number
  isActive: boolean
  cookieTemplateName: string | null
  uiTemplateName: string | null
  createdAt: string
  updatedAt: string
}
```

### Cookie Templates

| Method     | Path                                        | Description                                              |
|------------|---------------------------------------------|----------------------------------------------------------|
| `GET`      | `/cookie-templates`                         | List cookie templates                                    |
| `GET`      | `/cookie-templates/:id`                     | Get a cookie template                                    |
| `POST`     | `/cookie-templates`                         | Create a cookie template                                 |
| `PUT`      | `/cookie-templates/:id`                     | Update a cookie template — 422 if removing cookies breaks compliance for a dependent profile |
| `DELETE`   | `/cookie-templates/:id`                     | Delete a cookie template — 422 if any active profiles use it |
| `POST`     | `/cookie-templates/:id/copy`                | Duplicate a cookie template                              |
| `GET`      | `/cookie-templates/:id/profile-usage`       | List profiles using this template (`ProfileSummary[]`)   |

#### Cookie Template Safety Guards

**Deletion guard:** `DELETE /cookie-templates/:id` returns `422` with `{ activeProfiles: ProfileSummary[] }` when one or more active profiles reference the template. Deactivate those profiles first, then delete.

**Cookie removal guard:** When updating a template (`PUT`), if cookies are removed, the backend checks all profiles using the template and runs compliance validation with the new cookie set. If any profile's `complianceGroup` requires a cookie that was removed, the response is `422` with:

```json
{
  "blockingProfiles": [{ "id": "...", "name": "...", "complianceGroup": "opt-in" }],
  "removedCookieIds": ["analytics", "marketing"]
}
```

Profiles listed in `blockingProfiles` must be updated (switch template or change complianceGroup) before the cookie removal can proceed.

### UI Templates

| Method     | Path                                        | Description                                              |
|------------|---------------------------------------------|----------------------------------------------------------|
| `GET`      | `/ui-templates`                             | List UI templates                                        |
| `GET`      | `/ui-templates/:id`                         | Get a UI template                                        |
| `POST`     | `/ui-templates`                             | Create a UI template                                     |
| `PUT`      | `/ui-templates/:id`                         | Update a UI template                                     |
| `DELETE`   | `/ui-templates/:id`                         | Delete a UI template                                     |
| `POST`     | `/ui-templates/:id/copy`                    | Duplicate a UI template                                  |
| `GET`      | `/ui-templates/:id/profile-usage`           | List profiles using this template (`ProfileSummary[]`)   |

### Analytics

| Method | Path                    | Description                                        |
|--------|-------------------------|----------------------------------------------------|
| `GET`  | `/analytics/opt-in`     | Opt-in rate stats aggregated by locale and date    |

Query params: `tenantId`, `profileId`, `complianceGroup`, `from` (ISO date), `to` (ISO date), `locale`.

```json
{
  "total": 12400,
  "granted": 6800, "denied": 4100, "managed": 1500,
  "grantedPct": 54.8, "deniedPct": 33.1, "managedPct": 12.1,
  "byLocale": { "en": { "total": 8000, "granted": 4400 } },
  "byDate": [{ "date": "2026-07-01", "total": 400, "granted": 220 }]
}
```

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

| Method     | Path                              | Description                                          |
|------------|-----------------------------------|------------------------------------------------------|
| `GET`      | `/users`                          | List admin users                                     |
| `POST`     | `/users`                          | Create an admin user                                 |
| `PUT`      | `/users/:id`                      | Update an admin user                                 |
| `GET`      | `/roles`                          | List roles                                           |
| `POST`     | `/roles`                          | Create a role                                        |
| `GET`      | `/roles/:id/permissions`          | Get permissions for a role                           |
| `POST`     | `/roles/:id/permissions`          | Assign a permission to a role                        |
| `DELETE`   | `/roles/:id/permissions/:permId`  | Revoke a permission from a role                      |
| `GET`      | `/permissions`                    | List all available permissions                       |

#### User `allowedTenants`

Admin users can be scoped to specific tenants. When `allowedTenants` is set, the user can only see and manage data for those tenants:

```ts
// POST /admin/users or PUT /admin/users/:id
{
  "name": "APAC Manager",
  "email": "apac@example.com",
  "password": "...",
  "allowedTenants": ["tenant-uuid-1", "tenant-uuid-2"]  // empty = access to all tenants
}
```

Users with `role: 'superadmin'` always have access to all tenants regardless of `allowedTenants`.

**Enforcement:** The auth middleware passes `allowedTenants` to every list query. A user whose `allowedTenants` does not include the tenant being queried receives an empty result set (not a 403), so pagination works normally. A user with an empty `allowedTenants` array has no restrictions. Routes for individual resources (`GET /consents/:visitorId`, `GET /consents/:visitorId/history`) return `403 Forbidden` instead of an empty result when the tenant is not in `allowedTenants`.

The **Users** dashboard page includes an **Edit** button on each user row (visible to users with `user:update` permission) that opens a modal for updating `allowedTenants` without changing the user's password or role.

### API Keys

| Method     | Path            | Description                                          |
|------------|-----------------|------------------------------------------------------|
| `GET`      | `/apikeys`      | List API keys                                        |
| `POST`     | `/apikeys`      | Create an API key (raw key returned once — save it!) |
| `DELETE`   | `/apikeys/:id`  | Revoke an API key                                    |

### Stats & Reporting

| Method | Path                              | Description                              |
|--------|-----------------------------------|------------------------------------------|
| `GET`  | `/stats/overview`                 | Total consents, visitors, GPC count      |
| `GET`  | `/stats/timeline`                 | Daily consent counts (`?days=30`)        |
| `GET`  | `/stats/categories`               | Per-category grant/deny breakdown        |
| `GET`  | `/stats/countries`                | Consent count by country                 |
| `GET`  | `/stats/gpc`                      | GPC detection statistics                 |
| `GET`  | `/export/consents`                | Export consent records (CSV or JSON)     |
| `GET`  | `/export/consents/xlsx`           | Export as XLSX                           |
| `GET`  | `/export/audit`                   | Export audit log (CSV or JSON)           |
| `GET`  | `/export/translations/:profileId` | Export all translatable fields as CSV    |

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

| Section             | Description                                                              |
|---------------------|--------------------------------------------------------------------------|
| Dashboard           | Consent overview, timeline chart, country breakdown, GPC stats           |
| Profiles            | Create / edit / copy / delete / activate / deactivate consent profiles   |
| Profile History     | Version history viewer — compare locale JSON per version                 |
| Cookie Templates    | Reusable cookie/purpose definitions (blank by default + Load Defaults)   |
| UI Templates        | Reusable banner + modal layout settings                                  |
| Consents            | Browse, filter, export consent records; per-visitor history              |
| Visitors            | Visitor list with geographic data                                        |
| Users               | Admin user management with allowed-tenant scoping                        |
| Roles               | RBAC roles and fine-grained permission assignment                        |
| Sites               | Multi-tenant site management **(superadmin only)**                       |
| TCF Vendors         | IAB Global Vendor List                                                   |
| Audit Log           | Immutable log of all admin actions                                       |
| Settings / API      | API keys, branding, OpenAPI docs **(superadmin only)**                   |

### Dashboard RBAC

- **Sites** and **API** sections are visible only to users with `role: 'superadmin'`
- **TCF Vendors** is visible to all authenticated users

### Profile Creation Wizard

**Step 1 — Profile metadata:**

| Field               | Type                                                 | Description                                                                 |
|---------------------|------------------------------------------------------|-----------------------------------------------------------------------------|
| `name`              | `string`                                             | Human-readable profile name                                                 |
| `defaultLocale`     | `string` (BCP 47)                                    | Locale served when visitor locale is unavailable; written as `default.json` |
| `complianceGroup`   | `ComplianceGroupId`                                  | Regulation group for geo-routing (e.g. `opt-in`, `opt-out-strict`)          |
| `gpcMode`           | `'ignore' \| 'honor' \| 'strict'`                   | GPC signal handling. Overrides group default.                               |
| `darkMode`          | `boolean`                                            | Enable dark mode in the consent banner                                      |
| `hidePoweredBy`     | `boolean`                                            | Hide "Powered by Consenti" branding link                                    |
| `allowReceipt`      | `boolean`                                            | Allow visitors to download a PDF consent receipt                            |
| `allowedOrigins`    | `string[]`                                           | Allowlisted domains for CORS on this profile's consent endpoints            |
| `complianceConfig`  | `Record<string, string>`                             | Per-compliance extra config (e.g. DPDPA data fiduciary name). Only shown when the selected `complianceGroup` requires it; otherwise omitted. |

**Step 2 — Cookie Template:** Define cookie IDs and their properties. Clicking **Next** at the bottom of Step 2 calls `POST /admin/profiles/validate` with the selected template's cookies and the chosen `complianceGroup`:

- **Compliance errors** (red panel): block advancing to Step 3 until resolved (e.g. template has no cookie with `listenGpc: true` but the group requires GPC support).
- **Compliance warnings** (amber panel): show an acknowledgment checkbox; the user must check it before advancing. Warnings do not block save — they surface potential issues.

| Field               | Type                                            | Description                                                               |
|---------------------|-------------------------------------------------|---------------------------------------------------------------------------|
| `id`                | `string`                                        | Unique identifier referenced in button arrays                             |
| `legalBasis`        | `'mandatory' \| 'consent' \| 'legitimate_interest'` | Legal basis (replaces deprecated `mandatory`+`type` fields)           |
| `listenGpc`         | `boolean`                                       | Auto-denied when GPC signal is active                                     |
| `expiry`            | `number`                                        | Days until re-consent is required (0 = session)                           |
| `tcfSpecialFeatures`| `number[]`                                      | IAB TCF special feature IDs (SF1, SF2) associated with this cookie        |

**Step 3 — UI Template:** Configure banner and modal layout. New UI templates start **blank** (no prefilled buttons or categories). Click **Load Defaults** in the amber callout to populate a sensible starter structure.

- **Main Banner / GPC Banner:** `position`, `overlayOpacity`, `showClose`, `headingTag`, `buttons`
- **Preference Modal:** `position`, `overlayOpacity`, `showClose`, `persistent`, `buttons`, `categories`
- Button `type`: `primary | secondary | text | reject | submit | manage | close`
- Button `cookies`: `*` (grant all) · `!` (deny all) · comma-separated IDs

**Step 4 — Content:** Enter localised copy with live preview:

- Main Banner: heading, body HTML
- GPC Banner: heading, body HTML
- Preference Modal: heading, subheading, intro HTML, per-category heading + description

**Adding locales:** Click **+ Add locale** to open a searchable `CountrySelecter` dropdown showing all BCP 47 locale options. Select a locale to add its tab instantly.

**Default-locale placeholders:** When editing a non-default locale tab, all heading, subheading, and category-heading inputs show the default locale's value as placeholder text — so translators see the source copy without switching tabs.

**Import / Export:**

| Button | Action |
|--------|--------|
| **JSON** | Exports *all* locale tabs as a single `locales.json` file (`{ "en": {...}, "fr-FR": {...} }`) |
| **CSV** | Exports the *current* locale tab as a `locale-{locale}.csv` file |
| **Import** | Accepts either format — multi-locale JSON auto-creates missing locale tabs; skipped locales (invalid BCP 47 key) are listed in an amber callout after import |

**Readability callouts:** Inline advisory warnings (yellow) appear beneath `heading` and body HTML fields when:
- A heading exceeds 80 characters
- Average sentence length in the body exceeds 25 words
- Total word count in the body exceeds 150 words

These are informational only — the profile can still be saved.

### Profile Activation

Profiles are **inactive** after creation. To serve them via geo-routing:

1. Click **Activate** in the profile list or use `POST /admin/profiles/:id/activate`
2. Consenti writes locale JSON files to `${storage.path}/profiles/${tenantId}/${complianceGroup}/`
3. The static file route starts serving these files immediately (zero DB on the hot path)

Only one profile per `complianceGroup` can be active at a time. Activating a new profile automatically deactivates the existing one.

### Profile Version History

Every profile save creates an immutable snapshot at `${profileId}/${version}/`. The dashboard version history page (`#/banners/profiles/:id/history`) shows:
- Left panel: list of all versions with dates
- Right panel: prettified JSON for the selected version; locale switcher dropdown

Via API:
```http
GET /consenti/admin/profiles/:id/versions
GET /consenti/admin/profiles/:id/versions/3?locale=fr-FR
```

### Template Save Safety

When saving a **Cookie Template** or **UI Template** that is used by one or more profiles, a confirmation dialog appears listing the affected profiles. You must confirm before changes are applied. Uses `GET /admin/cookie-templates/:id/profile-usage` or `GET /admin/ui-templates/:id/profile-usage` internally.

When **deleting** a Cookie Template used by active profiles, the delete is blocked with a 422 error listing those profiles. Deactivate the affected profiles before deleting the template.

When **removing cookies** from a Cookie Template, the backend checks whether the reduced cookie set satisfies the `complianceGroup` rules for every profile using the template. If any profile's compliance would break, the save is blocked with a 422 listing the `blockingProfiles` and `removedCookieIds` — see [Cookie Template Safety Guards](#cookie-template-safety-guards).

---

## EventBus

`createConsenti()` returns an `eventBus` — a standard Node.js `EventEmitter` — that fires events at every data lifecycle step.

| Event | Payload | Description |
|---|---|---|
| `ready` | none | Storage connected and admin user bootstrapped |
| `consent.created` | `ConsentDbRecord` | New consent record saved |
| `consent.updated` | `{ previous, current: ConsentDbRecord }` | Consent record updated |
| `consent.erased` | `{ visitorId: string }` | Visitor data erased (GDPR erasure) |
| `visitor.created` | `Visitor` | New visitor record created |
| `profile.created` | `Profile` | Profile created |
| `profile.updated` | `{ previous, current: Profile }` | Profile updated (version bumped) |
| `profile.deleted` | `{ id: string, previous: Profile }` | Profile deleted |
| `cache:warm` | `{ paths: string[], version: number }` | Fired after locale JSON files are written; paths to warm in CDN/cache |
| `cache:purge` | `{ paths: string[], version: number }` | Fired after locale JSON files are removed; paths to purge from CDN/cache |

`cache:warm` and `cache:purge` mirror the `handleCache` config callback — use whichever suits your integration.

```ts
const { eventBus } = createConsenti({ /* ... */ })

eventBus.on('consent.created', (record) => {
  // send to analytics, trigger webhook, etc.
  console.log('New consent from visitor:', record.visitorId)
})

eventBus.on('consent.erased', ({ visitorId }) => {
  myDmpClient.deleteVisitor(visitorId)
})
```

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

All config fields can be set via environment variables. Code config takes precedence over env vars.

| Variable                            | Config field                       | Default                          |
|-------------------------------------|------------------------------------|----------------------------------|
| `NODE_ENV`                          | —                                  | Suppress stack traces when `'production'` |
| `CONSENTI_BASE_PATH`                | `basePath`                         | `'/consenti'`                    |
| `CONSENTI_ADMIN_EMAIL`              | `auth.adminEmail`                  | `'user@consenti.dev'`            |
| `CONSENTI_ADMIN_PASSWORD`           | `auth.adminPassword`               | `'Consenti@123'`                 |
| `CONSENTI_ADMIN_JWT_SECRET`         | `auth.jwtSecret`                   | random per restart               |
| `CONSENTI_DB_DRIVER`                | `storage.driver`                   | `'json'`                         |
| `CONSENTI_DB_PATH`                  | `storage.path`                     | `'./consenti-data'`              |
| `CONSENTI_DB_URI`                   | `storage.uri`                      | —                                |
| `CONSENTI_DB_DATABASE`              | `storage.database`                 | —                                |
| `CONSENTI_DB_HOST`                  | `storage.host`                     | —                                |
| `CONSENTI_DB_PORT`                  | `storage.port`                     | —                                |
| `CONSENTI_DB_USER`                  | `storage.user`                     | —                                |
| `CONSENTI_DB_PASSWORD`              | `storage.password`                 | —                                |
| `CONSENTI_RATE_LIMIT_WINDOW_MS`     | `rateLimit.windowMs`               | `60000`                          |
| `CONSENTI_RATE_LIMIT_MAX_REQUESTS`  | `rateLimit.maxRequests`            | `60`                             |
| `CONSENTI_MAX_BODY_SIZE`            | `maxBodySize`                      | `1048576` (1 MB)                 |

---

## Interactive API Docs

When running, Swagger UI is available at `{basePath}/api/docs`.
OpenAPI JSON at `{basePath}/api/openapi.json`.


---

## Demo
For detailed API docs, Guides and Demo, visit [consenti.dev](https://consenti.dev) 

Visit author's profile at [santosh.top](https://santosh.top)


---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the monorepo root.

---

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
