# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities by emailing **support@consenti.dev** with the subject line:
`[SECURITY] Consenti — <short description>`

Please include:

- Affected package(s) and version(s)
- A description of the vulnerability and its impact
- Steps to reproduce (proof-of-concept code if applicable)
- Any suggested mitigations

You will receive an acknowledgement within **48 hours** and a status update within **7 days**.

We follow a **90-day responsible disclosure** policy. We ask that you refrain from publicly disclosing the issue until we have released a fix or the 90-day window has passed, whichever comes first.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (`main`) | Yes — security fixes applied immediately |
| `next` (pre-release) | Best effort |
| older tagged releases | Not actively patched; upgrade recommended |

---

## Security Architecture

The following design decisions are security-relevant. Understanding them helps both auditors and operators deploy Consenti safely.

### Data Minimisation

- **IP addresses are never stored raw.** Every IP is SHA-256 hashed before persistence: `createHash('sha256').update(ip).digest('hex')`. The original IP cannot be recovered.
- Visitor IDs use `crypto.randomUUID()` — no sequential integers that could be enumerated.

### Authentication & Authorisation

- **Passwords:** scrypt via `node:crypto` — no external bcrypt dependency.
- **JWTs:** signed with `createHmac('sha256', secret)` via `node:crypto` — no `jsonwebtoken` package.
- **All admin routes** require a valid JWT via `auth.middleware.ts`. No admin endpoint is reachable without authentication.
- **RBAC:** fine-grained permissions enforced at the service layer.

### Audit Log Integrity

- `audit_logs` is **append-only / never deleted by Consenti** — the storage adapter never issues
  `UPDATE` or `DELETE` against this table, under any configuration. There is no retention-purge
  option for this table (unlike `compliance.dataRetention.purgeAfterDays`, which purges expired
  *consent records* and is unrelated).
- This provides append-only evidence for GDPR accountability obligations. It is not
  cryptographically tamper-evident (no chaining/hashing between entries) — see "Known
  Limitations."
- Operators who need to reduce audit-log retention for their own storage or operational reasons
  must do so manually, directly against their own database. This is intentionally outside
  Consenti's supported paths — there is no config flag or admin action that deletes audit log
  rows.

### Error Handling

- Stack traces are **suppressed** in `NODE_ENV=production` responses. Only a structured JSON error with a code and message is returned.

### Dependencies

- `apps/ui` and `apps/api` have **zero external runtime dependencies.** No transitive supply-chain risk from npm packages.

---

## Operator Security Checklist

When deploying Consenti in production:

- [ ] Set `NODE_ENV=production` to suppress stack traces
- [ ] Configure a strong `auth.adminPassword` (≥ 16 chars, env var — never hardcoded; bootstrap enforces ≥ 12 chars minimum and warns below 16)
- [ ] Set a random `jwt.secret` of at least 32 bytes (env var)
- [ ] Set `cors.origins` to an explicit allowlist — never use `'*'` in production
- [ ] Restrict filesystem access to the SQLite DB file (mode `600`, owned by the app user)
- [ ] Put Consenti behind a reverse proxy (nginx / Caddy) with TLS termination
- [ ] Add `Content-Security-Policy`, `X-Frame-Options`, and `Strict-Transport-Security` headers at the proxy layer
- [ ] Enable rate limiting (built-in) and configure `rateLimit.windowMs` / `rateLimit.max` for your traffic
- [ ] Rotate the JWT secret if it is ever exposed; all active sessions will be invalidated

---

## Known Limitations

The following are known trade-offs, not vulnerabilities, but operators should be aware of them:

| Limitation | Notes |
|-----------|-------|
| Standalone `@consenti/ui` HMAC signing is spoofable | With no `@consenti/api` backend, `core.cookieSigningKey` has nowhere to live but the shipped browser bundle — anyone can read it and re-sign a forged cookie. It catches accidental tampering, not a motivated attacker. Server-side verification already exists via `@consenti/api`'s `compliance.dataSigningHash` (the signing key never reaches the browser) — use it whenever you need consent records that hold up as evidence, not just client-side tamper-evidence. |
| Consent cookies lack `HttpOnly` | The consent widget intentionally reads `consenti_*` cookies via JavaScript to display consent state. `HttpOnly` cannot be applied globally. The `visitorId` embedded in the cookie name is a persistent identifier that XSS payloads can read — mitigate by deploying a strong CSP that prevents script injection. |
| Plugin hooks run in-process with full Node.js access | Only install plugins from trusted sources. No sandbox exists today. |
| SQLite DB file permissions are operator responsibility | The file must not be web-accessible. Configure your web server to block direct file access. |
| No built-in CSP headers | Add `Content-Security-Policy` at your reverse proxy or web server layer. |
| Swagger UI loaded from unpkg CDN | The API documentation page (`/api/docs`) loads `swagger-ui-dist@5.17.14` from `https://unpkg.com`. If operating in a high-security environment, pin to a specific version and add `integrity="sha384-…"` SRI hashes (compute with `openssl dgst -sha384 -binary file | openssl base64 -A`), or serve Swagger UI assets locally. |

---

## Third-Party Security Review

**Status: not yet conducted.** Everything in "Security Architecture" and "Known Limitations"
above is Consenti's own self-assessment — accurate to the best of the maintainers' knowledge, but
not independently verified. This section exists so that status is stated plainly rather than left
implicit, and so a future review has a scoped starting point instead of "audit everything."

### Scope, if/when a review happens

- **Authentication** — password hashing (`scrypt` via `node:crypto`, `apps/api/src/utils/crypto.ts`),
  admin JWT issuance/verification (`createHmac('sha256', secret)`, no `jsonwebtoken` dependency),
  session/token lifecycle (`auth.middleware.ts`), OAuth/OIDC/SAML integration points.
- **Authorisation** — RBAC permission checks at the service layer (per-route `authenticate()` +
  `authError()` calls against a named permission, e.g. `settings:update` in
  `tenants.routes.ts`), and the split between `routes/admin/*` (JWT-gated, permission-checked) and
  `routes/public/*` (`consent`, `profile`, `notice`, `tcf-status`, `gpp-status` — visitor-facing,
  unauthenticated by design).
- **Storage** — all seven adapters (`postgresql`, `mysql`, `mongodb`, `json`, and the three
  `sqlite` variants) for injection risk, especially anywhere a query is composed outside the
  parameterised-query helpers; the audit-log append-only guarantee (see "Audit Log Integrity"
  above) — confirm no code path can `UPDATE`/`DELETE` `audit_logs` under any configuration.
- **Public routes** — rate limiting coverage and bypass potential, CORS configuration, input
  validation on every `routes/public/*` endpoint (these are reachable with no authentication by
  design, so they're the widest attack surface).
- **Cryptography** — the `hashIp()`/`hashUserAgent()` masking+salting scheme in `utils/crypto.ts`,
  cookie-signing (`compliance.dataSigningHash` server-side vs. the spoofable client-only fallback
  documented in "Known Limitations"), and the parental-consent token scheme
  (`utils/parental-consent-token.ts`).
- Full context for a reviewer: this file, `THREATMODEL.md` (assets, trust boundaries, STRIDE
  analysis, mitigations already in place, known gaps), and `AGENTS.md` (repo conventions).

### What "done" looks like

A findings summary — severity, affected component, remediation status — gets added to this
section once a review completes. Whether the full report is published depends on whether it
contains exploit-level detail; the summary here will not.

### Choosing a reviewer

Not something this document can commit to — engaging a specific firm or independent researcher is
a maintainer decision (budget, timing, availability) outside what's fixable in a docs pass. If
you're a security researcher interested in reviewing Consenti, or can point to one, reach out via
the vulnerability-reporting contact above with subject line `[SECURITY REVIEW]`.

---

## Bug Bounty

There is no formal bug bounty program at this time. Responsible disclosure is appreciated and all valid reports will be credited in the release changelog (with the reporter's permission).
