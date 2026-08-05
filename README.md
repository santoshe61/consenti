# Consenti

Open-source, GDPR-style opt-in Cookie Consent + Consent Management Platform toolkit.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![npm — UI](https://img.shields.io/npm/v/@consenti/ui.svg?label=%40consenti%2Fui)](https://www.npmjs.com/package/@consenti/ui)
[![npm — API](https://img.shields.io/npm/v/@consenti/api.svg?label=%40consenti%2Fapi)](https://www.npmjs.com/package/@consenti/api)

---

## Overview

Consenti is a self-hosted, open-source consent management platform. It ships as two published npm packages:

| Package | What it does |
|---|---|
| [`@consenti/ui`](./apps/ui) | Frontend widget — banner + modal + events + GPC + i18n |
| [`@consenti/api`](./apps/api) | Backend module — consent store + admin dashboard + REST API |

Also included (not published to npm): [`@consenti/scanner`](./apps/scanner) — a local CLI that crawls a site under none/reject-all/accept-all consent states and reports undeclared third-party trackers, fully offline.

**Zero required runtime dependencies** — both packages use only platform built-ins (browser APIs / Node.js built-ins) by default. `@consenti/api` supports optional peer dependencies you opt into (Mongo/MySQL/Postgres storage, spec-correct IAB TCF encoding) — nothing installs unless you ask for it.

**Multi-regulation** — Maintained: GDPR, UK-GDPR, CCPA, CPRA, LGPD. Partial: IAB TCF v2.3 and GPP (both need config + an optional dependency for spec-correct binary encoding — and both are only relevant if you monetize through programmatic/RTB ad exchanges; see below). In development: DPDPA. Also supported: PIPEDA, POPIA, PDPA-TH, APPI, KVKK. Routing-only (UX-template routing, not individually legal-maintained): PIPL and 190+ other countries/territories. See [ECOSYSTEM.md](./ECOSYSTEM.md) for what each status means.

> **Registration is only needed for programmatic ad monetization.** If you're collecting consent for first-party analytics, marketing, or functional cookies — not RTB/header-bidding ad exchanges — Consenti is fully compliant out of the box, no external registration required. Consenti implements the IAB TCF/GPP technical specs but is **not** itself a registered CMP; if you do need TCF/GPP, you must register your own `cmpId` with IAB Europe/MSPA independently before going live — Consenti's self-registration flow (config + one-time dashboard confirmation, fail-closed by default) handles the rest. See the [TCF & GPP Registration Guide](https://consenti.dev/docs/compliance/tcf-and-gpp-registration).

Coverage is extended well beyond the actively-maintained tier — geo-routing, compliance groups, and
consent flows exist for regulations across the Americas, APAC, the Middle East, and Africa (see the
[Jurisdiction Coverage Map](https://consenti.dev/docs/compliance/jurisdiction-coverage-map)). We're
a single-maintainer project, so keeping every one of those current as laws change is an ongoing
job, not a one-time claim. **If you have domain knowledge of a regulation we support, contributions
that extend or keep it current are genuinely wanted** — see [CONTRIBUTING.md](./CONTRIBUTING.md).

**Apache 2.0** · **Node 20+** · **TypeScript strict** · **npm workspaces + Turborepo**

---

## Repository Structure

```
consenti/
├── apps/
│   ├── ui/          → @consenti/ui           (frontend widget — published)
│   ├── api/         → @consenti/api          (backend module — published)
│   ├── docs/        → Next.js documentation site + interactive playground
│   └── test-runner/ → internal Playwright QA runner (unpublished)
├── packages/
│   ├── types/          → @consenti/types (shared types — internal)
│   ├── utils/           → shared compliance/geo/profile logic — bundled into @consenti/ui and @consenti/api, not published standalone
│   └── browser-engine/  → shared Playwright session/capture helpers used by apps/test-runner — internal
└── CONTRIBUTING.md  → contribution guide
```

---

## Quick Start

### 1. Install both packages into your project

```bash
# Frontend widget
npm install @consenti/ui

# Backend module (Node.js 20+ required)
npm install @consenti/api
```

### 2. Mount the backend

```ts
// server.ts
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
app.listen(3000)
// Admin dashboard → http://localhost:3000/consenti/
// REST API        → http://localhost:3000/consenti/api/v1/
```

### 3. Add the widget to your frontend

```ts
import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'opt-in' },   // GDPR-style opt-in — omit to auto-detect from geo
  core: { locale: 'en' },
  api: { enabled: true },   // fetches profile from @consenti/api
})
```

### Prefer Docker?

```bash
CONSENTI_ADMIN_PASSWORD=$(openssl rand -base64 24) \
CONSENTI_ADMIN_MASTER_SECRET=$(openssl rand -hex 32) \
docker compose up
```

See [`docker/README.md`](./docker/README.md) for PostgreSQL/MongoDB alternatives and full config options.

Deploying to Kubernetes? See [`deploy/`](./deploy/) for a community-reference Helm chart and
Terraform module (not covered by CI/tests — see that folder's README before using either).

---

## Frontend Widget (`@consenti/ui`)

See [`apps/ui/README.md`](./apps/ui/README.md) for the full reference.

**Key features:**
- Cookie consent banner on first visit — show, hide, dismiss
- Granular preference modal with per-category toggles
- Consent stored in a signed cookie or `localStorage`
- Optional GPC (Global Privacy Control) signal detection with `true` / `'strict'` modes
- Full i18n — per-locale translations with BCP 47 locale resolution
- GTM / Google Consent Mode v2 built-in (`dataLayer` push)
- Accessibility-focused — targeting WCAG 2.x AA, focus trap, ARIA patterns
- Cross-tab consent sync via `BroadcastChannel`
- SSR-safe — silent no-op during server-side rendering
- React, Vue, Angular hooks included
- Plugin API for third-party integrations

**Minimal setup:**

```ts
import { ConsentiSetup } from '@consenti/ui'

// Zero config — auto-detects the visitor's compliance group from geo/locale
new ConsentiSetup({})

// Or pin a specific compliance group instead of auto-detecting:
new ConsentiSetup({ compliance: { type: 'opt-in' } })
```

**8 built-in compliance groups**, routing regulations across every tier in [ECOSYSTEM.md](./ECOSYSTEM.md) (see the "Multi-regulation" line above for what's Maintained vs. Partial vs. routing-only) ([what each group actually satisfies](https://consenti.dev/docs/compliance/compliance-groups/)): `'opt-in'` (GDPR, UK-GDPR, KVKK, PDPA-TH, ...) · `'opt-out'` (CCPA, VCDPA, ...) · `'opt-out-strict'` (CPRA) · `'opt-in-dpdpa'` (India DPDPA) · `'opt-in-china'` (PIPL) · `'opt-in-brazil'` (LGPD) · `'general-privacy-consent'` (PIPEDA, POPIA, APPI, ...) · `'notice-only'`

---

## Backend Module (`@consenti/api`)

See [`apps/api/README.md`](./apps/api/README.md) for the full reference.

**Key features:**
- Zero-config SQLite storage — or plug in PostgreSQL, MySQL, MongoDB
- Admin Dashboard SPA served at your `basePath` — no separate deploy
- REST API for the frontend widget (profiles, consent CRUD, visitor erasure)
- Admin REST API (profiles, consents, visitors, users, roles, audit, stats, export)
- RBAC with fine-grained permissions
- JWT auth (local · OAuth/OIDC · SAML · custom) with optional per-user TOTP MFA
- Rate limiting on all public routes
- Audit log — append-only, paginated
- Data export — CSV, JSON, XLSX
- Multi-tenant mode
- IAB TCF v2.3 — Partial (spec-correct binary encoding needs `publisherCC` config + the optional `@iabtechlabtcf/core` peer dependency; simplified format otherwise). Only relevant for programmatic/RTB ad monetization — see the [TCF & GPP Registration Guide](https://consenti.dev/docs/compliance/tcf-and-gpp-registration)
- IAB GPP (US National section) — Partial, same pattern as TCF (optional `@iabgpp/cmpapi` peer dependency; simplified format otherwise)
- Plugin API for webhooks and analytics forwarding
- Programmatic service access (bypass HTTP layer)

**Minimal setup:**

```ts
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  dashboard: true,
})
```

**SQLite drivers (choose one):** `'node:sqlite'` (Node 22.5+ built-in, zero install) · `'node-sqlite3-wasm'` (Node 20+, WASM, `npm i node-sqlite3-wasm`) · `'better-sqlite3'` (Node 20+, native, `npm i better-sqlite3`)

**Other storage drivers:** `'pg'` · `'mysql'` · `'mongodb'`

---

## Commands

```bash
# Bootstrap
npm install

# Dev (all workspaces — watch mode)
npx turbo dev

# Build (production)
npx turbo build

# Type-check
npx turbo typecheck

# Lint
npx turbo lint

# Test
npx turbo test

# Single workspace
npm run dev   --workspace=apps/ui
npm run dev   --workspace=apps/api
npm run build --workspace=apps/api
npm run build --workspace=apps/ui
```

---

## Dashboard Development

The admin dashboard SPA (`apps/api/src/dashboard`) has its own Vite dev server with hot reload.

### Option A — standalone

```bash
# Build the API once
npm run build:api --workspace=apps/api

# Terminal 1 — API backend on http://localhost:3001
npm run dev:server --workspace=apps/api

# Terminal 2 — Dashboard Vite dev server on http://localhost:5173
npm run dev:dashboard --workspace=apps/api
```

Or use the combined script:

```bash
npm run dev:all --workspace=apps/api
```

Dashboard: `http://localhost:5173/` · DB file: `apps/api/consenti-dev.db`

### Option B — alongside the docs app

```bash
# Terminal 1 — Next.js docs + playground (API + dashboard at /consenti/)
npm run dev --workspace=apps/docs

# Terminal 2 — Dashboard Vite dev server proxying to docs
CONSENTI_API_URL=http://localhost:3000 npm run dev:dashboard --workspace=apps/api
```

Dashboard dev server: `http://localhost:5173/`

**Dev login:** `user@consenti.dev` / `Consenti@123`
A one-click dev sign-in button appears on the login page in development mode and is stripped from production builds.

---

## Tech Decisions

These are locked. Do not propose changes without explicit discussion.

| Concern             | Choice                                              |
|---------------------|-----------------------------------------------------|
| Runtime             | Node 20+ (22 or 24 LTS recommended for production)  |
| Default DB          | `json` (file-based, zero install, works on every supported Node version) — `node:sqlite` (Node 22.5+), `node-sqlite3-wasm`, `better-sqlite3`, `pg`, `mysql`, `mongodb` are all opt-in via `storage.driver` |
| Package manager     | npm workspaces                                      |
| Monorepo            | Turborepo                                           |
| Build (packages)    | tsup (ESM + UMD for ui; CJS + ESM for api)          |
| Build (dashboard)   | Vite + Preact + Tailwind CSS                        |
| CSS methodology     | BEM, `.consenti-` prefix, CSS custom properties     |
| UI distribution     | ESM + UMD — no Shadow DOM                           |
| Browser target      | ES2020+ (Chrome 80+, Firefox 74+, Safari 13.1+)     |
| Visitor ID          | `crypto.randomUUID()` native                        |
| TypeScript          | Strict mode everywhere                              |
| License             | Apache 2.0                                          |

---

## Security

- Raw IP addresses are **never stored** — masked and salted (`compliance.dataSigningHash`) before SHA-256 hashing
- Passwords use `scrypt` via `node:crypto` — no bcrypt
- JWTs signed with `node:crypto` `createHmac` — no jsonwebtoken package
- All admin routes require a valid JWT
- Stack traces suppressed in `NODE_ENV=production` responses
- CORS allowlist required — never use `origins: '*'` in production

To report a security vulnerability, see [SECURITY.md](./SECURITY.md).

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a summary of every change. Each entry links to a detailed file in [`changelog/`](./changelog/).

---

## Migration

Upgrading across a breaking change? See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for step-by-step instructions and before/after code examples.

---

## Ecosystem

Integrations, storage adapters, analytics plugins, and framework adapters are listed in [ECOSYSTEM.md](./ECOSYSTEM.md).

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

**Good first issues** — look for issues labelled `good first issue` on GitHub.

### Development setup

```bash
git clone https://github.com/santoshe61/consenti.git
cd consenti
nvm use         # sets Node 20 from .nvmrc (Node 22 or 24 recommended for production)
npm install
npx turbo build
npm run dev --workspace=apps/docs
```

All code must:
- Pass `npx turbo typecheck` with zero errors
- Follow existing conventions (see [AGENTS.md](./AGENTS.md))
- Include a changelog entry in `changelog/YYYY-MM-DD-V{n}.md`
- Add or update `apps/docs` documentation for any changed API surface

---

## Community

| Resource | Link |
|----------|------|
| Contributing guide | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Collaborator guide | [COLLABORATOR_GUIDE.md](./COLLABORATOR_GUIDE.md) |
| Code of Conduct | [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) |
| Security policy | [SECURITY.md](./SECURITY.md) |
| Threat model | [THREATMODEL.md](./THREATMODEL.md) |
| Ecosystem | [ECOSYSTEM.md](./ECOSYSTEM.md) |
| Contributors | [CONTRIBUTORS.md](./CONTRIBUTORS.md) |
| Changelog | [CHANGELOG.md](./CHANGELOG.md) |
| Migration guide | [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) |

---

## License

Apache 2.0 — see [LICENSE](./LICENSE).

Copyright 2026 Santosh Ojha and contributors.
