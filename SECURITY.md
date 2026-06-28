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

- `audit_logs` is **append-only** — the storage adapter never issues `UPDATE` or `DELETE` against this table.
- This provides immutable evidence for GDPR accountability obligations.

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
| Consent cookie HMAC verification is client-side only | Server-side cookie verification is planned for a future phase. Do not rely on the signed cookie as a server-side proof of consent without additional verification. |
| Consent cookies lack `HttpOnly` | The consent widget intentionally reads `consenti_*` cookies via JavaScript to display consent state. `HttpOnly` cannot be applied globally. The `visitorId` embedded in the cookie name is a persistent identifier that XSS payloads can read — mitigate by deploying a strong CSP that prevents script injection. |
| Plugin hooks run in-process with full Node.js access | Only install plugins from trusted sources. No sandbox exists today. |
| SQLite DB file permissions are operator responsibility | The file must not be web-accessible. Configure your web server to block direct file access. |
| No built-in CSP headers | Add `Content-Security-Policy` at your reverse proxy or web server layer. |
| Swagger UI loaded from unpkg CDN | The API documentation page (`/api/docs`) loads `swagger-ui-dist@5.17.14` from `https://unpkg.com`. If operating in a high-security environment, pin to a specific version and add `integrity="sha384-…"` SRI hashes (compute with `openssl dgst -sha384 -binary file | openssl base64 -A`), or serve Swagger UI assets locally. |

---

## Bug Bounty

There is no formal bug bounty program at this time. Responsible disclosure is appreciated and all valid reports will be credited in the release changelog (with the reporter's permission).
