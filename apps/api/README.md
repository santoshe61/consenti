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

    // Postgres/MySQL only — connection pool tuning
    poolMax: 10,                       // max pool connections (default: 10, both drivers' own default)
    statementTimeoutMs: 30_000,        // abort a query after N ms — unset by default; a forced
                                        // default could break a legitimate long-running export
    idleInTransactionTimeoutMs: 30_000, // Postgres only: kill a connection idle inside an open transaction after N ms
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
  // When enabled, every locale JSON written to disk is also PUT to S3, plus a small
  // pointer.json per compliance group ({ profileId, version }) written on activate —
  // S3 has no symlink equivalent to the local hot-serve swap, so this pointer plays
  // the same role. Consenti's own /resolve-profile route does NOT read from S3 or
  // resolve this pointer — it's a contract for an external CDN/edge function to use
  // if you want reads to bypass the Node process entirely.
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
  handleCache: (paths: string[], profileId: string, isPurge: boolean) => {
    // paths: array of file paths that were written or removed
    // profileId: id of the profile that triggered this write (stable across edits — see Profile Edit History)
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
  // The actual gating prompt is widget-side (@consenti/ui README, "Age Gate" section) — this
  // block only needs to exist so `ageVerified`/`parentalConsentToken` land in consent records;
  // there's a matching `compliance.ageGate` block in the widget config with the same shape.
  ageGate: {
    enabled: false,
    minimumAge: 13,              // COPPA = 13; GDPR Article 8 = 16
    requireParentalConsent: false,
  },

  // ── Data retention ───────────────────────────────────────────────────────────
  dataRetention: {
    purgeAfterDays: 365,          // delete consent records older than N days; runs nightly
    auditLogPurgeAfterDays: 730,  // optional, independent from purgeAfterDays — unset = keep forever
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

### Default Profile Seeding

`ProfileService` exposes two idempotent helpers for seeding the 8 built-in compliance groups:

```ts
// Seed one group (skips if an active profile already exists for that group)
await profileService.seedDefaultProfile('opt-in')

// Seed all 8 groups in parallel
await profileService.seedAllDefaults()
```

Each seeded profile is built from the English base in `@consenti/utils/profiles` and automatically includes translated text overlays for **German (de), Spanish (es), French (fr), and Japanese (ja)** — 5 locales total per group, 40 locale files across all 8 groups.

Locale coverage per compliance group:

| Group                       | en | de | es | fr | ja |
|-----------------------------|----|----|----|----|----|
| `opt-in` (GDPR)             | ✓  | ✓  | ✓  | ✓  | ✓  |
| `opt-out` (CCPA)            | ✓  | ✓  | ✓  | ✓  | ✓  |
| `opt-out-strict` (CPRA)     | ✓  | ✓  | ✓  | ✓  | ✓  |
| `opt-in-dpdpa` (India)      | ✓  | ✓  | ✓  | ✓  | ✓  |
| `opt-in-china` (PIPL)       | ✓  | ✓  | ✓  | ✓  | ✓  |
| `opt-in-brazil` (LGPD)      | ✓  | ✓  | ✓  | ✓  | ✓  |
| `general-privacy-consent`   | ✓  | ✓  | ✓  | ✓  | ✓  |
| `notice-only`               | ✓  | ✓  | ✓  | ✓  | ✓  |

All 5 locales — English base plus the de/es/fr/ja overlays — live in `packages/utils/src/profiles/`, the single source of truth for default compliance-profile content shared by profile seeding, the dashboard's "Load Defaults", and `@consenti/ui`'s embedded fallback profile (English only there — see below).

### First-Run Setup Wizard

The dashboard shows a 4-step setup wizard (`#/setup`) once — the first time any admin logs in after install — like a self-hosted app's installer (WordPress, phpMyAdmin, etc.):

1. **Welcome** — links to documentation and the in-dashboard "How Consenti Works" page. Skippable.
2. **Your configuration** — a plain, read-only view of the fully merged `ConsentiServerConfig` (your config + env vars merged over the built-in defaults — exactly what `createConsenti` resolved at boot), with secrets redacted.
3. **Default compliance profiles** — an accordion of the 8 built-in compliance groups (label, description, and badges for GPC mode / TCF / CPRA categories / DPDPA disclosure), all checked by default. Continuing calls the same idempotent `seedDefaultProfile`/`seedAllDefaults` helpers described above.
4. **Confirmation** — a summary of what was installed, plus a production-readiness panel that surfaces the JSON-storage-driver and default-credentials warnings `createConsenti` already logs to the server console (otherwise invisible to a dashboard-only admin). CTAs: **Go to Dashboard** / **See How Consenti Works**.

Gated by `tenant_settings.setup_completed` (per-tenant in multi-tenant mode) — set once the wizard finishes **or** is skipped, and never reset from the dashboard afterward. There is no "run it again" entry point; it's a one-time first-run flow, not a recurring settings screen: navigating to `#/setup` directly once setup is complete redirects to the dashboard instead of reopening it, and the two mutating routes (`seed-profiles`, `complete`) reject with `409` if called again after completion — enforced both in the router and on the server, not just by hiding the nav entry. Backed by 5 admin routes under `/setup/*` (see [Admin REST API](#admin-rest-api)).

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
      ${complianceGroup}/  # → symlink to the active profile's version dir (hot-serve path)
  logs/                    # reserved for future structured logging
```

**Key rules:**
- Every profile save writes to a new immutable version directory under `${profileId}/${version}/`
- `${complianceGroup}/` only exists when a profile is **active** for that group — it's a directory symlink (junction on Windows), not a copy
- On **activate**: `${complianceGroup}/` is atomically repointed at `${profileId}/${version}/` — one filesystem rename, no window where it's missing or a mix of two versions, and no leftover files from a version whose locale set has since shrunk
- On **deactivate** / **delete**: the `${complianceGroup}/` symlink is removed (the version directory it pointed to is untouched)
- `default.json` = full resolved profile for `defaultLocale`; used as locale fallback (303 redirect)
- Windows: symlinks are created as directory **junctions** — no admin rights or Developer Mode required, but the volume must be NTFS and `storage.path` must stay on the same drive

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
GET /consenti/api/v1/resolve-profile?data=<base64-encoded-GeoHints>
```

For widgets using `compliance.type: 'auto'` — called once on page load to discover which compliance group and static profile file to serve. The widget sends browser geo hints encoded as base64 JSON:

```js
// Widget encodes automatically via encodeGeoHints()
const data = btoa(JSON.stringify({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  languages: navigator.languages,
  language: navigator.language,
  locale: 'fr-FR',
}))
```

Response:

```json
{
  "path": "/consenti/api/v1/profiles/default/opt-in/fr-FR",
  "complianceGroup": "opt-in",
  "locale": "fr-FR",
  "found": true
}
```

When `found` is `false` (no active profile for this tenant/group), `path` is `null` and the widget automatically falls back to the embedded profile for the resolved `complianceGroup`. This means the widget works even before you have seeded profiles for every compliance group.

Legacy query params `?tz=`, `?lang=`, `?locale=` are still accepted for backward compatibility — the `data` param takes priority when both are present.

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
  "locale": "en",
  "gpcDetected": false,
  "source": "banner",
  "ageVerified": true,
  "parentalConsentToken": "pcon_..."
}
```

`ageVerified`/`parentalConsentToken` are optional — only sent by the widget when `compliance.ageGate.enabled: true` (see the `@consenti/ui` README's "Age Gate" section). Both are stored as-is; this endpoint doesn't validate or enforce them.

Response `201`:

```json
{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile-id",
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
{ "valid": false, "reason": "profile_changed" }
// other reasons: "consent_expired" | "hmac_invalid"
```

`profile_changed` means the profile this consent was collected against is no longer the active profile for its compliance group (a newer edit has superseded it) — every profile edit mints a new id rather than mutating in place, so an id mismatch is what signals staleness now (there is no separate version counter).

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
| `POST` | `/auth/refresh`   | Reissue a fresh token from the current one — extends the session |

```http
POST /consenti/admin/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "your-password" }
```

```json
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Session length**: admin tokens are valid for 30 minutes from issuance, not a flat expiry from
login — the dashboard calls `POST /auth/refresh` on user activity (mouse/keyboard/scroll/touch) to
extend it another 30 minutes, and proactively logs the user out the moment 30 minutes pass with no
activity at all, rather than leaving the session to silently lapse in the background.

### Profiles

| Method     | Path                             | Description                                                             |
|------------|----------------------------------|-------------------------------------------------------------------------|
| `GET`      | `/profiles`                      | List all profiles                                                       |
| `GET`      | `/profiles?summary=1`            | List profiles as `ProfileSummary[]` (no blob, with template names)     |
| `POST`     | `/profiles`                      | Create a profile — 422 on missing mandatory content or compliance errors; `{ conflict, requiresChoice: true }` when an active profile exists on the same `complianceGroup` |
| `GET`      | `/profiles/:id`                  | Get a profile                                                           |
| `PUT`      | `/profiles/:id`                  | Edit a profile — mutates the row **in place**, increments `version`; returned `id` always matches the URL's. Same mandatory-content + compliance validation + conflict detection |
| `DELETE`   | `/profiles/:id`                  | Delete a profile                                                        |
| `POST`     | `/profiles/:id/copy`             | Duplicate a profile as a new, always-inactive profile (`version` resets to 1). Optional `{ name }` body, defaults to `Copy of {name}` |
| `POST`     | `/profiles/:id/activate`         | Activate a profile — writes locale JSON files to `${complianceGroup}/` |
| `POST`     | `/profiles/:id/deactivate`       | Deactivate a profile — removes `${complianceGroup}/` locale files       |
| `GET`      | `/profiles/:id/versions`         | List every version snapshot on disk, newest first (`{ version, createdAt, locales[] }[]`) |
| `GET`      | `/profiles/:id/versions/:entryId` | Read a specific version's locale file, `:entryId` is its `version` number (query: `?locale=en`) |
| `POST`     | `/profiles/validate`             | Validate a consent template (`cookies` + `categories`) against a compliance group (no save) |
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
  customComplianceGroup: string | null
  isActive: boolean
  consentTemplateName: string | null
  uiTemplateName: string | null
  createdAt: string
  updatedAt: string
}
```

### Consent Templates

A Consent Template merges what used to be two concerns — the parameter (cookie) list and its categories — into one entity. Categories own legal basis; a parameter's effective legal basis is derived from whichever category lists it (a parameter must belong to exactly one category).

| Method     | Path                                        | Description                                              |
|------------|---------------------------------------------|----------------------------------------------------------|
| `GET`      | `/consent-templates`                        | List consent templates                                   |
| `GET`      | `/consent-templates/:id`                    | Get a consent template                                    |
| `POST`     | `/consent-templates`                        | Create a consent template — `{ name, cookies: CookieMap, categories: CategoryMap }` |
| `PUT`      | `/consent-templates/:id`                    | Update a consent template — 422 if the change breaks compliance for a dependent profile |
| `DELETE`   | `/consent-templates/:id`                    | Delete a consent template — 422 if any active profiles use it |
| `POST`     | `/consent-templates/:id/copy`               | Duplicate a consent template                              |
| `GET`      | `/consent-templates/:id/profile-usage`      | List profiles using this template (`ProfileSummary[]`)   |

`CookieMap`/`CategoryMap` are keyed by id (`Record<string, Cookie>` / `Record<string, Category>`) — the id is the map key, not a field on the value.

#### Consent Template Safety Guards

**Deletion guard:** `DELETE /consent-templates/:id` returns `422` with `{ profiles: ProfileSummary[] }` when one or more active profiles reference the template. Deactivate those profiles first, then delete.

**Compliance guard:** When updating a template (`PUT`) with new `cookies` and/or `categories`, the backend re-runs compliance validation (using the *new* set) against every profile currently using the template. If any profile's `complianceGroup` rules would be violated, the response is `422` with:

```json
{
  "blockingProfiles": [{ "id": "...", "name": "...", "complianceGroup": "opt-in" }]
}
```

Profiles listed in `blockingProfiles` must be updated (switch template or change complianceGroup) before the change can be saved.

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

Query params for `GET /consents`: `page`, `limit` (max 500), `profileId`, `from`, `to`, `q` (**prefix** search across visitorId, profileId, locale, source — matches from the start of the field, not a substring anywhere in it). Response: `{ items, total, page, limit }`. List rows omit `consentJson`/`parentalConsentToken`/`tcfString`/`signature` — fetch `GET /consents/:visitorId` for the full record.

### Visitors

| Method | Path           | Description                         |
|--------|----------------|-------------------------------------|
| `GET`  | `/visitors`    | List visitor records (paginated)    |

Query params for `GET /visitors`: `page`, `limit` (max 500), `from`, `to`, `q` (**prefix** search across visitorId, country). Response: `{ items, total, page, limit }`.

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

| Method     | Path                       | Description                                                    |
|------------|----------------------------|------------------------------------------------------------------|
| `GET`      | `/apikeys`                 | List API keys                                                  |
| `POST`     | `/apikeys`                 | Create an API key (raw key returned once — save it!)           |
| `DELETE`   | `/apikeys/:id`             | Revoke an API key (soft — can be undone with `reactivate`)     |
| `POST`     | `/apikeys/:id/reactivate`  | Re-enable a revoked key — same hash, no new secret to distribute |
| `DELETE`   | `/apikeys/:id/permanent`   | Permanently delete the key row — cannot be undone              |

### Settings

Tenant-wide dashboard settings — the Public and Admin API origin allowlists shown on the API
Config page (split into two panels, one per API).

| Method   | Path        | Description                        |
|----------|-------------|-------------------------------------|
| `GET`    | `/settings` | Get this tenant's settings (`{}` if none set yet) |
| `PATCH`  | `/settings` | Update settings (partial — only sends fields being changed) |

```ts
// GET /consenti/admin/settings
{ "allowedOrigins": ["https://example.com"], "adminAllowedOrigins": ["https://dashboard.example.com"] }

// PATCH /consenti/admin/settings
{ "allowedOrigins": ["https://example.com", "https://foo.example.com"] }
```

**`allowedOrigins`** is the **fallback** used by `POST /consenti/api/v1/consent`'s origin check
when the specific profile being submitted to doesn't set its own `profileJson.allowedOrigins`
(profile-level, if present, always takes precedence). The public API has no auth token, so this
is its only access gate.

**`adminAllowedOrigins`** is an additional CORS-layer check on top of Bearer-token auth for
browser-originated `/consenti/admin/*` requests (server-to-server callers without an `Origin`
header are unaffected). Unauthenticated static assets (`widget.js`/`widget.css`) are exempt —
they must stay embeddable from any origin. **Be careful**: if you configure this, include the
dashboard's own origin or you'll lock yourself out of the dashboard along with everyone else.

Both lists accept full origins (`https://example.com`) or a wildcard subdomain pattern
(`*.example.com`). Empty/unset means no restriction — every origin is allowed.

### Setup Wizard

Backs the dashboard's one-time first-run wizard (see [First-Run Setup Wizard](#first-run-setup-wizard)). All routes require `settings:update`, same as Settings above.

| Method | Path                          | Description                                                       |
|--------|-------------------------------|--------------------------------------------------------------------|
| `GET`  | `/setup/status`                | `{ completed: boolean }` — whether this tenant has finished/skipped the wizard |
| `GET`  | `/setup/config`                | Resolved `ConsentiServerConfig` (secrets redacted) plus `usingJsonStorage`/`usingDefaultCredentials` readiness flags |
| `GET`  | `/setup/compliance-groups`     | The 8 built-in compliance groups with label/description/regulation metadata |
| `POST` | `/setup/seed-profiles`         | `{ groups: string[] }` — seeds default profiles for the given groups (subset of the 8 ids; 400 on an unknown id) |
| `POST` | `/setup/complete`              | Marks the wizard complete — called on both finish and skip; never reset from the dashboard afterward |

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

| Method | Path         | Description                                             |
|--------|--------------|---------------------------------------------------------|
| `GET`  | `/audit`     | Paginated audit log; filter by `action`, `resourceType`, date range, `q` (**prefix** search across action, resourceType, resourceId, userId). Response: `{ items, total, page, limit }`; list rows omit `oldData`/`newData` — fetch `GET /audit/:id` for the full entry. |
| `GET`  | `/audit/:id` | Full audit log entry (`oldData`/`newData`) — list rows omit these for performance; fetch on demand |

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

Only active when `tcf.enabled: true`. `cmpId`/`cmpVersion` here must match the widget's own
`compliance.tcf` config (`@consenti/ui` README, "TCF" section) — both sides encode the same
simplified TC string. The widget installs `window.__tcfapi` itself; these two admin-only routes
are for the dashboard's vendor/purpose pickers, not consumed by the public widget.

---

## Admin Dashboard

Served at `{basePath}/` when `dashboard: true`.

| Section             | Description                                                              |
|---------------------|--------------------------------------------------------------------------|
| Dashboard           | Consent overview, timeline chart, country breakdown, GPC stats           |
| Reports             | Opt-in trend and category/locale breakdowns, date-range filter, requires `stats:view` |
| Profiles            | Create / edit / copy / delete / activate / deactivate consent profiles   |
| Profile History     | Edit history viewer — browse every past snapshot in a profile's lineage  |
| Consent Templates   | Reusable parameter + category definitions (blank by default + Load Defaults) |
| UI Templates        | Reusable banner + modal layout settings                                  |
| Consents            | Browse, filter, search, paginate, export consent records; per-visitor history; row click opens a detail modal with signature/consent-data breakdown |
| Visitors            | Visitor list with geographic data; search, paginate; row click opens a detail modal including proof-of-notice history |
| Users               | Admin user management with allowed-tenant scoping; search; local-auth password reset (`super_admin` only) |
| Roles               | RBAC roles and fine-grained permission assignment                        |
| Sites               | Multi-tenant site management **(superadmin only)**                       |
| TCF Vendors         | IAB Global Vendor List                                                   |
| Audit Log           | Immutable log of all admin actions; search, paginate; row click opens a detail modal with old/new data diff |
| Settings / API      | API keys, branding, OpenAPI docs **(superadmin only)**                   |
| Setup Wizard        | One-time first-run welcome / config / default-profiles / confirmation flow — see [First-Run Setup Wizard](#first-run-setup-wizard) |

### Dashboard RBAC

- **Sites** and **API** sections are visible only to users with the `super_admin` role
- **TCF Vendors** is visible to all authenticated users
- **Reports** requires the `stats:view` permission (granted by default to `super_admin`, `admin`, `compliance_officer`, and `viewer` roles)
- **Password reset** in the Users edit modal is shown only to `super_admin` users, and only when `auth.mode === 'local'` (JWT/OIDC/SAML/custom auth manage credentials outside Consenti, so there is nothing to reset here)

### Profile Creation Wizard

**Step 1 — Profile metadata:**

| Field               | Type                                                 | Description                                                                 |
|---------------------|------------------------------------------------------|-----------------------------------------------------------------------------|
| `name`              | `string`                                             | Human-readable profile name                                                 |
| `defaultLocale`     | `string` (BCP 47)                                    | Locale served when visitor locale is unavailable; written as `default.json` |
| `complianceGroup`   | `ComplianceGroupId`                                  | Regulation group for geo-routing (e.g. `opt-in`, `opt-out-strict`)          |
| `customComplianceGroup` | `string` (lower-kebab-case)                      | Required when `complianceGroup` is unset ("None / Custom") — it's the identifier the widget's `compliance.type` config uses to fetch this profile (see [Public REST API](#public-rest-api) hot-serve path). Drives activation, deactivation, and "one active profile per group" conflict detection the same way `complianceGroup` does; no `COMPLIANCE_GROUPS` validation rules or GPC defaults apply to it, since none exist for a free-form name. |
| `gpcMode`           | `'ignore' \| 'honor' \| 'strict'`                   | GPC signal handling. Overrides group default.                               |
| `expiryDays`        | `number` (default `365`)                             | Days until stored consent expires and the visitor is asked again. Profile-wide — replaces the old per-parameter expiry field. |
| `darkMode`          | `boolean`                                            | Enable dark mode in the consent banner                                      |
| `hidePoweredBy`     | `boolean` (default `true`)                           | Hide "Powered by Consenti" branding link. Defaults to checked/hidden in the dashboard, matching the widget's own default for a profile that never sets this field. |
| `allowReceipt`      | `boolean`                                            | Allow visitors to download a PDF consent receipt                            |
| `allowedOrigins`    | `string[]`                                           | Allowlisted domains for CORS on this profile's consent endpoints            |
| `complianceConfig`          | `Record<string, string>`                             | Per-compliance extra config (e.g. DPDPA data fiduciary name). Only shown when the selected `complianceGroup` requires it; otherwise omitted. |
| `showFooterMetadata`        | `boolean`                                            | Show a metadata strip in the banner and modal footer with: Consent ID (visitor UUID), Consent Date, Profile Version, and a "Privacy Settings" link. |
| `enhanceAccessibility`      | `boolean`                                            | Apply WCAG 2.1 AA enhancements: 44 px min button height, 3 px focus rings. Adds `.consenti--enhanced-a11y` class to the widget root. |

**Step 2 — Consent Template:** Define parameters (cookies) and the categories that own their legal basis, edited together. Clicking **Next** at the bottom of Step 2 calls `POST /admin/profiles/validate` with the selected template's `cookies` + `categories` and the chosen `complianceGroup`:

- **Compliance errors** (red panel): block advancing to Step 3 until resolved (e.g. a category has no `legalBasis` set, or a marketing-purpose parameter is assigned to a `mandatory` category).
- **Compliance warnings** (amber panel): show an acknowledgment checkbox; the user must check it before advancing. Warnings do not block save — they surface potential issues (e.g. `preGrant: true` on a strict opt-in profile).

Parameter fields:

| Field               | Type                                            | Description                                                               |
|---------------------|-------------------------------------------------|---------------------------------------------------------------------------|
| `id`                | `string` (map key)                              | Unique identifier referenced in button arrays and category `cookies[]`    |
| `purpose`           | `'necessary' \| 'functional' \| 'preferences' \| 'analytics' \| 'marketing'` | What the parameter is for. Required — parameter IDs are free-form, so the purpose is what integrations and compliance checks rely on. Selecting a purpose pre-fills `listenGpc` and `cpraCategory` (still editable). Known Google Consent Mode IDs (`ad_storage`, `analytics_storage`, …) auto-detect their purpose. |
| `listenGpc`         | `boolean`                                       | Auto-denied when GPC signal is active                                     |
| `preGrant`          | `boolean`                                       | Pre-grant this parameter's default consent. Only editable when its category's `legalBasis === 'consent'` — `mandatory`/`legitimate_interest` categories are already effectively pre-granted, so the checkbox is locked checked for those. |
| `tcfVendorId` / `tcfPurposes` | `number` / `number[]`                 | IAB TCF vendor + purpose IDs associated with this parameter               |
| `cpraCategory`      | `'sale' \| 'sharing' \| 'sensitive'`            | CPRA data category                                                        |

Category fields (own the legal basis for every parameter listed in `cookies[]` — a parameter must belong to **exactly one** category):

| Field               | Type                                                 | Description                                                          |
|---------------------|--------------------------------------------------------|--------------------------------------------------------------------|
| `id`                | `string` (map key)                                    | Unique identifier                                                    |
| `legalBasis`        | `'mandatory' \| 'consent' \| 'legitimate_interest'`   | Legal basis for every parameter in `cookies[]` — replaces the old per-parameter `legalBasis` field |
| `cookies`           | `string[]`                                            | Parameter IDs belonging to this category                             |

Purpose defaults (applied to the parameter when a purpose is selected, all overridable; the category's `legalBasis` is authored separately):

| `purpose`     | Suggested category `legalBasis` | `listenGpc` | `cpraCategory` |
|---------------|-----------------------------------|-------------|----------------|
| `necessary`   | `mandatory`                       | `false`     | —              |
| `functional`  | `legitimate_interest`             | `false`     | —              |
| `preferences` | `legitimate_interest`             | `false`     | —              |
| `analytics`   | `consent`                         | `true`      | —              |
| `marketing`   | `consent`                         | `true`      | `sharing`      |

**Per-profile parameter overrides:** `ProfileConfig.cookiesOverride?: Record<string, Partial<Cookie>>` lets a profile tune specific fields (e.g. `preGrant`) of a template-authored parameter without forking the whole Consent Template — deltas merge onto the resolved `cookies` map by parameter id at resolve time (`GET /profiles/:tenantId/:complianceGroup/:locale` and friends); a delta for a parameter id not present in the template is ignored. `categoriesOverride`/`uiOverride` exist on the type for a future phase but aren't applied yet.

In the Step 2 parameter table, **Pre Grant** is editable per-profile (writes/removes a `cookiesOverride` delta) except for parameters whose category isn't `legalBasis: 'consent'` (locked checked-and-disabled, same rule as template authoring). Selecting a compliance group or Consent Template auto-defaults it: `opt-out`/`opt-out-strict` force it off (with an amber warning), every other group forces it on for parameters the template didn't already pre-grant — only where that differs from the template's authored value.

**Step 3 — UI Template:** Configure banner and modal layout. New UI templates start **blank** (no prefilled buttons). Click **Load Defaults** in the amber callout to populate a sensible starter structure.

- **Main Banner / GPC Banner:** `position`, `overlayOpacity`, `showClose`, `headingTag`, `buttons`
- **Preference Modal:** `position`, `overlayOpacity`, `showClose`, `persistent`, `buttons` — categories are no longer edited here; they come from the Consent Template selected in Step 2.
- Button `id`: a machine identifier (e.g. `accept-all`), **not** display text — UI templates own layout/behavior only. The visitor-facing label for each button is authored per-locale in Step 4, shown there as `id (action)` so authors know which button they're labeling.
- Button `type`: `primary | secondary | text | reject | submit | manage | close`
- Button `cookies`: `*` (grant all) · `!` (deny all) · comma-separated IDs

Additional UI template fields:

| Field | Scope | Type | Description |
|-------|-------|------|-------------|
| `stackButtonsOnBreakpoint` | Main Banner, GPC Banner | `number` | Below this viewport width (px) banner buttons stack vertically and stretch full-width. `0` or absent = disabled. Default when enabled: `576`. |
| `trapFocus` | Preference Modal | `boolean` | Confine Tab / Shift+Tab keyboard navigation within the modal while it is open. `Escape` closes and restores prior focus. |

**Step 4 — Content:** Enter localised copy with live preview:

- Main Banner: heading, body HTML
- GPC Banner: heading, body HTML
- Preference Modal: heading, subheading, intro HTML, per-category heading + description, plus an optional legitimate-interest description (`legitimateInterestDescription`) shown only for categories with `legalBasis: 'legitimate_interest'` — the GDPR balancing-test justification, localized per profile alongside the rest of the category content
- Consent receipt checkbox label + description (only shown when **Allow consent receipt** is enabled in Step 1) — `PreferenceModal.receiptLabel`/`receiptDescription`, authored and localized per profile instead of the widget's built-in default text

**Adding locales:** Click **+ Add locale** to open a searchable `CountrySelecter` dropdown showing all BCP 47 locale options. Select a locale to add its tab instantly.

**Default-locale placeholders:** When editing a non-default locale tab, all heading, subheading, and category-heading inputs show the default locale's value as placeholder text — so translators see the source copy without switching tabs.

**Import / Export:** available above the wizard card on every content step (Main Banner / GPC Banner / Preference Modal) — not scoped to whichever step is active, since each covers the whole profile. `Load Defaults` stays inside each step's own card, scoped to that section only, and is sourced from `packages/utils/src/profiles` for whichever compliance group and active locale tab you're on (a custom, non-preset compliance group falls back to `general-privacy-consent`'s content); category text is matched to your Consent Template's own categories by cookie purpose, not by id.

| Button | Action |
|--------|--------|
| **JSON** | Exports every locale the profile has content for as `locales.json`: `{ "en": { "mainBanner.heading": "...", "category.necessary.heading": "...", ... }, "fr-FR": {...} }` — one flat dot-path key/value map per locale. Button columns are keyed by the UI template's button id (e.g. `mainBanner.button.accept-all`); category columns by the consent template's category id. |
| **CSV** | Exports `locales.csv` — one row per *every* BCP 47 locale in the `CountrySelecter` list (not just ones this profile already has), so translators never hand-type a locale code. Column A is the locale; the rest are the same dot-path keys as the JSON export, as column headers. Rows for locales the profile already has content for are pre-filled; the rest are blank, ready to fill in. |
| **Import** | Accepts either format. The header row (JSON: none; CSV: row 1) is not user data. For CSV, rows where every content column is blank are skipped — so importing the full 70+ row template back doesn't create empty locale entries for locales you didn't fill in. Skipped/invalid locale keys are listed in an amber callout after import. |

**Readability callouts:** Inline advisory warnings (yellow) appear beneath `heading` and body HTML fields when:
- A heading exceeds 80 characters
- Average sentence length in the body exceeds 25 words
- Total word count in the body exceeds 150 words

These are informational only — the profile can still be saved.

### Mandatory Content Validation

`POST /profiles` and `PUT /profiles/:id` reject (`422`) a save where any locale is missing required
content — this is what guarantees a profile can never end up with a blank banner. The dashboard
wizard already blocks this client-side (hard stop on Next/Save, jumping to the offending locale
tab); the backend check is the enforcement backstop for bulk CSV/JSON import, which bypasses the
wizard's step-by-step gating entirely. Both use the same `hasVisibleText` check
(`@consenti/utils`) so a rich-text field that *looks* non-empty by string length but renders no
actual text (an empty paragraph node, for example) is still correctly caught as blank.

Mandatory per locale (heading is always optional, everywhere):

| Section | Field | Rule |
|---|---|---|
| Main Banner / GPC Banner | Body text (`htmlText`) | Required, non-blank |
| Main Banner / GPC Banner | Every button's label | Required, non-blank |
| Preference Modal | Heading | Required, non-blank |
| Preference Modal | Every button's label | Required, non-blank |
| Preference Modal | Every category's heading | Required, non-blank |

GPC Banner rules only apply to a locale that actually submitted `gpcBanner` content — a profile
with `gpcMode: 'ignore'`, or a locale nobody's authored a GPC variant for, simply omits it. A
failing save returns:
```json
{ "error": "Profile content is missing required fields", "details": { "errors": [
  { "locale": "hi", "section": "mainBanner", "field": "htmlText", "message": "Body text is required" }
] } }
```
(`details` is only included outside `NODE_ENV=production`, same as the compliance-validation 422 above.)

### Profile Activation

Profiles are **inactive** after creation. To serve them via geo-routing:

1. Click **Activate** in the profile list or use `POST /admin/profiles/:id/activate`
2. Consenti atomically repoints `${storage.path}/profiles/${tenantId}/${complianceGroup}/` (a symlink) at the profile's version directory
3. The static file route starts serving these files immediately (zero DB on the hot path)

Only one profile per `complianceGroup` can be active at a time. Activating a new profile automatically deactivates the existing one.

### Profile Edit History

`id` is stable across every edit — each save mutates the row in place and increments `version`, and writes a new resolved-JSON snapshot immutably to `${id}/${version}/`. There's no separate DB-level archive; that on-disk snapshot tree is the audit trail. The dashboard history page (`#/banners/profiles/:id/history`) shows:
- Left panel: every version, newest first, by date
- Right panel: prettified JSON for the selected version; locale switcher dropdown

Via API:
```http
GET /consenti/admin/profiles/:id/versions
GET /consenti/admin/profiles/:id/versions/:entryId?locale=fr-FR
```

`:id` is the profile's stable id. `:entryId` is one specific version's number, as returned by the `versions` list.

### Archived Profiles

`ProfileService.delete()` removes the DB row but never deletes the on-disk version-snapshot tree, so deleted profiles' history is still readable — it's just no longer reachable by browsing the Profiles list. The **Archived Profiles** page (`#/banners/profiles/archived`, linked from the Profiles list) lists every profile-id directory found on disk with no matching DB row, built from a directory listing only — id, version count, last-modified date — no file content is read until a specific version is opened. Clicking one opens the same version-history viewer used for active profiles.

```http
GET /consenti/admin/profiles/archived
```
Returns `{ id, versionCount, lastModified }[]`. `GET /profiles/:id/versions` and `GET /profiles/:id/versions/:entryId` (above) both work for archived ids too — they read the version-directory tree directly and were never actually gated on the DB row existing.

### Template Save Safety

When saving a **Consent Template** or **UI Template** that is used by one or more profiles, a confirmation dialog appears listing the affected profiles. You must confirm before changes are applied. Uses `GET /admin/consent-templates/:id/profile-usage` or `GET /admin/ui-templates/:id/profile-usage` internally.

When **deleting** a Consent Template used by active profiles, the delete is blocked with a 422 error listing those profiles. Deactivate the affected profiles before deleting the template.

When **changing parameters or categories** on a Consent Template, the backend re-runs compliance validation against every profile using the template. If any profile's compliance would break, the save is blocked with a 422 listing `blockingProfiles` — see [Consent Template Safety Guards](#consent-template-safety-guards).

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
| `profile.updated` | `{ previous, current: Profile }` | Profile edited — `current.id` matches `previous.id`; `current.version` is incremented |
| `profile.deleted` | `{ id: string, previous: Profile }` | Profile deleted |
| `cache:warm` | `{ paths: string[], profileId: string }` | Fired after locale JSON files are written; paths to warm in CDN/cache |
| `cache:purge` | `{ paths: string[], profileId: string }` | Fired after locale JSON files are removed; paths to purge from CDN/cache |

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

## ConsentAction / CategoryAction

Server-side counterparts to `@consenti/ui`'s `ConsentAction`/`CategoryAction` — thin wrappers around `consent.created`/`consent.updated` that fire `onGrant`/`onDeny` only on an actual status transition (not on every event), across every visitor's submissions. Prefer these over listening to the raw events directly when you only care about one parameter or one category — they handle the previous-vs-current comparison for you.

There is no server equivalent of the widget's `ConsentScript`/`CategoryScript` — injecting a `<script>` tag only makes sense in a browser DOM the server doesn't have. `services.consent.create()`/`.update()` are already the server-side submit/update methods these hooks react to (see [ConsentService](#services)).

### `ConsentAction`

Watches a single cookie parameter.

```ts
import { createConsenti, ConsentAction } from '@consenti/api'

const { eventBus } = createConsenti({ /* ... */ })

new ConsentAction({
  id: 'analytics_storage',           // cookie id to watch
  eventBus,
  onGrant: ({ visitorId, cookieId, status, record }) => crm.optIn(visitorId),
  onDeny: ({ visitorId, cookieId, status, record }) => crm.optOut(visitorId),
})
```

**Options** (`ConsentActionOptions`):

| Option | Type | Description |
|---|---|---|
| `id` | `string` | The consent parameter (cookie) ID to watch |
| `eventBus` | `EventEmitter` | The `eventBus` returned by `createConsenti()` |
| `onGrant` | `(params: ConsentActionParams) => void` | Called when the parameter transitions to `'granted'` |
| `onDeny` | `(params: ConsentActionParams) => void` | Called when the parameter transitions away from `'granted'` (`'denied'` or `'objected'`) |

**Callback params** (`ConsentActionParams`): `{ visitorId: string, cookieId: string, status: ConsentStatus, record: ConsentDbRecord }`

### `CategoryAction`

Watches a whole category's rollup consent state — granted only when *every* cookie in the category is granted, matching the preference modal's tri-state rollup rule.

```ts
import { createConsenti, CategoryAction } from '@consenti/api'

const { eventBus, services } = createConsenti({ /* ... */ })

new CategoryAction({
  categoryId: 'marketing',
  eventBus,
  profiles: services.profile,        // resolves the category's cookie ids per profile
  onGrant: ({ visitorId, categoryId, status, record }) => adsPlatform.optIn(visitorId),
  onDeny: ({ visitorId, categoryId, status, record }) => adsPlatform.optOut(visitorId),
})
```

**Options** (`CategoryActionOptions`):

| Option | Type | Description |
|---|---|---|
| `categoryId` | `string` | The category ID to watch |
| `eventBus` | `EventEmitter` | The `eventBus` returned by `createConsenti()` |
| `profiles` | `ProfileService` | The `services.profile` returned by `createConsenti()` — resolves which cookies belong to this category for the record's profile (categories are defined on the consent template) |
| `onGrant` | `(params: CategoryActionParams) => void` | Called when every cookie in the category transitions to `'granted'` |
| `onDeny` | `(params: CategoryActionParams) => void` | Called when the category transitions away from fully granted |

**Callback params** (`CategoryActionParams`): `{ visitorId: string, categoryId: string, status: ConsentStatus, record: ConsentDbRecord }`

Both classes expose `destroy()` to remove their event listeners when the hook is no longer needed.

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
| Signed consent records    | Opt-in via `consentSigningKey` — HMAC-SHA256 (`node:crypto` `createHmac`) over each record's core fields, hex-encoded into `signature`. No-op and no schema burden when unset. |

### Signed consent records (opt-in)

Set `consentSigningKey` to have every consent record signed at create/update time — tamper-evidence for server-stored records, independent of the widget's own cookie-signing (`core.cookieSigningKey`, which protects the visitor's local cookie).

```ts
createConsenti({
  consentSigningKey: process.env.CONSENTI_CONSENT_SIGNING_KEY,
})
```

- The signature covers `tenantId`, `visitorId`, `profileId`, `locale`, and the sorted `consentJson` entries — not the DB-generated `id`/`createdAt`/`updatedAt`.
- `GET /consent/:visitorId/verify` checks the signature when both a key is configured and the record has one, adding `hmac_invalid` to `reasons` on mismatch. Records signed before the key was configured (or never signed) never fail this check for its absence.
- `signature` is included in CSV/JSON/XLSX exports (`GET /export/consents`) and shown in the dashboard's Consents detail view.
- Hash-chaining between records (a full tamper-evident log, not just per-record integrity) is not implemented — out of scope for now.

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
