# AGENTS.md — Developer Guide for Consenti

This file is the single source of truth for every AI agent (Claude Code, Cursor, Copilot, etc.) and human contributor working in this repository. Read it fully before making any code changes.

---

## What is Consenti?

Consenti is an open-source, GDPR-compliant Cookie Consent + Consent Management Platform similar to Syrenis Cassie. It ships as two independently installable npm packages inside a Turborepo monorepo:

- `@consenti/ui` — browser-side TypeScript widget (banner + preference modal)
- `@consenti/api` — Node.js backend module (consent storage, REST API, admin dashboard)

Apache 2.0 license. Node 20+ (22 or 24 LTS recommended for production). TypeScript strict. Zero external runtime dependencies.

**Do not spawn multiple agents — work in a single thread.**

---

## Before Writing Any Code

1. Read the relevant phase plan in `plans/api/phase-*.md` or `plans/ui/phase-*.md` for what to build
2. Read the relevant feature plan in `plans/api/feature-*.md` or `plans/ui/feature-*.md` for detailed specs
3. Check `plans/consenti.md` if you are unsure about overall architecture

All major design decisions are already made. Do not propose alternatives unless the user explicitly asks.

---

## Monorepo Structure

```
consenti/
├── apps/
│   ├── ui/         → @consenti/ui     (published frontend widget)
│   ├── api/        → @consenti/api (published backend module)
│   └── docs/       → Next.js documentation site + interactive playground
├── packages/
│   └── types/      → @consenti/types (shared types — internal)
├── plans/          → all architecture and planning docs
├── AGENTS.md       ← this file
├── CLAUDE.md       ← points here
├── .rules
├── turbo.json
├── package.json    ← npm workspaces root
└── tsconfig.base.json
```

---

## Plan File Index

Read the relevant plan before writing any code. All architectural decisions are locked.

| File | When to read |
|---|---|
| `plans/consenti.md` | Monorepo overview, deployment, release strategy |
| `plans/api/backend-plan.md` | Full backend architecture reference |
| `plans/ui/frontend-plan.md` | Full frontend architecture reference |
| `plans/api/phase-1-core.md` | Building SQLite, public API, auth scaffold |
| `plans/api/phase-2-admin.md` | Building dashboard SPA, admin API, RBAC |
| `plans/api/phase-3-compliance.md` | GPC, versioning, expiry, GDPR erasure |
| `plans/api/phase-4-scale.md` | MongoDB adapter, multi-tenant, reporting |
| `plans/api/phase-5-enterprise.md` | SSO, multi-site, data warehouse |
| `plans/ui/phase-1-core.md` | Building core widget, cookie I/O, banner/modal |
| `plans/ui/phase-2-ui-features.md` | GPC, GTM, plugins, CSS, accessibility |
| `plans/ui/phase-3-advanced.md` | HMAC signing, SSR, cross-tab sync, receipt |
| `plans/api/feature-storage-adapter.md` | StorageAdapter interface + SQLite implementation |
| `plans/api/feature-auth-rbac.md` | Auth modes + RBAC permission system |
| `plans/api/feature-dashboard-spa.md` | Preact SPA architecture, locale editor, preview |
| `plans/api/feature-plugin-system.md` | Plugin base class, hook execution, event bus |
| `plans/api/feature-compliance.md` | GDPR, CCPA, GPC, LI, all regulations |
| `plans/api/feature-openapi.md` | OpenAPI spec generation, Swagger UI |
| `plans/ui/feature-cookie-format.md` | Cookie name/value format, parsing, HMAC signing |
| `plans/ui/feature-gpc.md` | GPC detection and handling modes |
| `plans/ui/feature-i18n.md` | Locale resolution algorithm, translations structure |
| `plans/ui/feature-accessibility.md` | WCAG AAA, focus trap, aria patterns |
| `plans/ui/feature-cross-tab-sync.md` | BroadcastChannel cross-tab implementation |
| `plans/ui/feature-ssr.md` | SSR guard patterns, Next.js/Nuxt integration |
| `plans/ui/feature-consent-receipt.md` | Consent receipt JSON format, download trigger |

---

## Tech Decisions — Locked

Do not propose changes to these without explicit user instruction.

| Concern | Choice |
|---|---|
| Runtime | Node 20+ (22 or 24 LTS recommended for production) |
| Default DB | `node-sqlite3-wasm` (WASM, zero compilation, Node 20+); `node:sqlite` built-in (Node 22.5+); `better-sqlite3` (native peer dep, optional) |
| Package manager | npm workspaces |
| Monorepo | Turborepo |
| Build (packages) | tsup (ESM + UMD for ui; CJS + ESM for api) |
| Build (dashboard SPA) | Vite + Preact + Tailwind |
| CSS methodology | BEM, `.consenti-` prefix, CSS custom properties |
| UI distribution | ESM + UMD, no Shadow DOM |
| License | Apache 2.0 |
| Browser target | ES2020+ (Chrome 80+, Firefox 74+, Safari 13.1+) |
| User ID | `crypto.randomUUID()` native |

---

## Commands

```bash
# Bootstrap
npm install

# Dev (all workspaces)
npx turbo dev

# Build (production)
npx turbo build

# Type check
npx turbo typecheck

# Lint
npx turbo lint

# Test
npx turbo test

# Single workspace
npm run dev --workspace=apps/ui
npm run dev --workspace=apps/api
npm run build --workspace=apps/api
```

---

## Code Conventions

### TypeScript
- Strict mode everywhere — `tsconfig.json` extends `tsconfig.base.json` which sets `"strict": true`
- No `any` — use `unknown` and narrow
- Named exports only — no default exports from package entry points
- All public-facing types live in `src/types/index.ts` per package

### Dependencies
- `apps/ui` — zero runtime deps. Browser built-ins only: `fetch`, `crypto.subtle`, `BroadcastChannel`, `CustomEvent`, `document.cookie`, `localStorage`
- `apps/api` — zero runtime deps. Node built-ins only: `node:sqlite`, `node:crypto`, `node:path`, `node:fs`, `node:events`
- `apps/docs` — external deps allowed

### CSS (`apps/ui`)
- All class names: `.consenti-` prefix, BEM: `.consenti-banner__heading--bold`
- No inline styles except for dynamic values (e.g. overlay opacity)
- CSS custom properties for all themeable values (see `plans/ui/frontend-plan.md` for full token list)
- `disableCssTemplate: true` → skip all style injection entirely

### Comments
- No comments explaining WHAT code does — names should do that
- Only add a comment for a non-obvious WHY: a hidden constraint, a subtle invariant, a known quirk
- No JSDoc on internal functions; types are the documentation

### Error handling
- `apps/ui`: never throw uncaught errors; wrap in try/catch, log via `console.warn`, degrade gracefully
- `apps/api`: throw typed errors at service layer, catch in route handler, return structured JSON error response
- Never expose stack traces in production (`NODE_ENV === 'production'`)

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| CSS classes | BEM `.consenti-` prefix | `.consenti-banner__heading--bold` |
| Custom events | `consenti:` prefix | `consenti:consentSubmitted` |
| BroadcastChannel messages | camelCase type field | `{ type: 'consentUpdated' }` |
| Event bus events | dot-separated | `consent.created` |
| Files | kebab-case | `consent-engine.ts` |
| Classes | PascalCase | `ConsentEngine` |
| Types/interfaces | PascalCase | `ConsentRecord` |
| Constants | SCREAMING_SNAKE | `DEFAULT_LOCALE` |

---

## Working on the Backend (`apps/api`)

### Layer rules (strict)

```
Routes → Services → Repositories → StorageAdapter → Database
```

- Routes validate input, call services, return HTTP responses
- Services contain business logic, call repositories
- Repositories translate between domain objects and the storage adapter
- StorageAdapter is the only layer that knows about the DB engine

Violations of this hierarchy are not acceptable. Routes may not import repositories. Services may not import routes. Repositories may not contain business logic.

### Key files
- `src/index.ts` — exports `createConsenti(config)` only
- `src/types/index.ts` — all exported types
- `src/storage/adapter.interface.ts` — the StorageAdapter contract
- `src/storage/sqlite/sqlite.adapter.ts` — default implementation
- `src/core/consent-engine.ts` — consent validation, versioning, expiry

### Security rules
- Never store raw IP addresses — SHA-256 hash: `createHash('sha256').update(ip).digest('hex')`
- Passwords: scrypt via `node:crypto` — never bcrypt (external dep)
- JWT: use `node:crypto` `createHmac` — never jsonwebtoken package
- Admin routes: always go through `auth.middleware.ts`
- `audit_logs` is append-only — never UPDATE or DELETE

### Dashboard SPA

The admin dashboard (`/consenti`) is a Preact + Tailwind CSS SPA bundled with Vite. It lives inside `apps/api/src/dashboard/`. Import from `preact` — not from `react`. Standard Tailwind config (no prefix, no scope) — safe because the dashboard is a completely separate HTML document that never shares a document with the consumer's app.

### Common pitfalls
- `node:sqlite` is synchronous — wrap in async/await but don't actually await sync ops
- Cookie `Secure` flag must be omitted in development (`NODE_ENV !== 'production'`)
- `profile_json` in DB stores the full translations map; API returns only the resolved locale
- `ConsentStatus` has three values: `'granted' | 'denied' | 'objected'` (not just two)

---

## Working on the Frontend (`apps/ui`)

### SSR guard (mandatory everywhere)

Every access to browser globals must be guarded:

```ts
import { isClient } from './utils/ssr'
if (!isClient()) return
```

`new ConsentiSetup(config)` called during SSR must silently no-op — no error, no DOM touch.

### Key files
- `src/index.ts` — re-exports all public API
- `src/core/consenti-setup.ts` — the main class
- `src/utils/ssr.ts` — `isClient()` guard
- `src/utils/cookie.ts` — read/write consent cookie
- `src/utils/storage.ts` — unified `'cookie' | 'localStorage'` abstraction
- `src/react.ts` — `useConsent()` hook (subpath export `@consenti/ui/react`)

### Event naming
All custom DOM events prefixed with `consenti:`:
`consenti:bannerInitialized`, `consenti:bannerVisibility`, `consenti:modalVisibility`,
`consenti:consentBeingSubmitted`, `consenti:consentSubmitted`

### Common pitfalls
- `crypto.randomUUID()` works in Node 15+ and all ES2020 browsers — no polyfill needed
- `BroadcastChannel` is same-origin only — cross-subdomain sync uses the API cookie

---

## Hard Rules — Never Violate

| Rule | Reason |
|---|---|
| Zero external runtime deps in `apps/ui` and `apps/api` | Core design principle — consumers must not get transitive deps |
| TypeScript strict mode, no `any` | Type safety is a feature |
| All CSS: `.consenti-` prefix, BEM naming | No Shadow DOM; prefix prevents conflicts |
| No raw IP storage — SHA-256 hash only | GDPR compliance |
| No `console.error` in `apps/ui` — use `console.warn` | Never crash or alarm |
| Named exports only from package entry points | Tree-shaking and clarity |
| SSR guard on every `window`/`document`/`navigator` access | Package must work in SSR environments |
| No React/Vue code in core `src/` — framework hooks in subpath files only | Framework-agnostic core |
| Admin routes must go through `auth.middleware.ts` | Security |
| `audit_logs` is append-only — never UPDATE or DELETE | GDPR compliance evidence |
| Do not add external runtime dependencies without explicit approval | Core design principle |
| Do not use Shadow DOM | CSS scoping via `.consenti-` prefix instead |
| Do not write raw SQLite queries outside `src/storage/sqlite/sqlite.adapter.ts` | Layer isolation |
| Do not amend commits unless asked | Preserves history |
| Do not push to remote unless asked | User controls releases |
| Do not add features beyond the current phase plan | Scope discipline |
| Do not re-litigate locked tech decisions | Decisions are final |

---

## After Every Change — Mandatory Checklist

Run through this checklist after implementing any feature, fix, or enhancement.

### 1. Frontend ↔ Backend sync
- If a change touches `apps/api` (types, routes, payload shape, error codes), update the corresponding `apps/ui` integration code to match, and vice versa.
- Shared types always live in `packages/types` — never duplicate them.

### 2. README updates
Update whichever README files are affected:
- Root `README.md` — if public API surface, install instructions, or overall behaviour changed
- `apps/api/README.md` — if backend config, routes, or exported types changed
- `apps/ui/README.md` — if widget config, events, or exported API changed

### 3. Playground update (`apps/docs`)
Reflect the change in the `apps/docs` playground so the running app always exercises the latest functionality.

### 4. Docs update (`apps/docs`)
Add or update the relevant page in `apps/docs` to document the change. Cover: what changed, how to use it, any config options, and migration notes if behaviour changed.

### 5. Validations
For any form fields or endpoint you are creating, add a validation check for the expected value.

### 6. Internal Changelog entry
Create a new file at `changelog/YYYY-MM-DD-V{n}.md` (increment `n` if a file for today already exists), format is below.
```markdown
## [x.x.x] - YYYY-MM-DD
### Summary
Here we would put all summary of changes.
### Added
- `@consenti/ui`: feature 1 added
- `@consenti/api`: feature 6 added
### Changed
- 
### Fixed
- `@consenti/ui`: ui color fixed
### Breaking changes
None.
### Migration
None.
```

---

## Versioning & Release

- Each package versioned independently with semver
- Use `@changesets/cli` for change tracking
- `@consenti` npm scope (public)
- `main` → stable; `next` → pre-release

See `plans/consenti.md` for full release checklist.
