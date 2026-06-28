# Threat Model

**System:** Consenti — self-hosted Consent Management Platform
**Version:** pre-v1.0 (current `main`)
**Date:** 2026-06-26
**Author:** Santosh Ojha

This document uses the STRIDE framework. It is a living document — update it when the attack surface changes (new endpoints, auth modes, storage adapters, plugins).

---

## 1. Assets

| Asset | Sensitivity | Why it matters |
|-------|------------|----------------|
| Consent records | High | Personal data under GDPR. Incorrect records can constitute a compliance violation. |
| Admin credentials (password + JWT secret) | Critical | Full database access and impersonation of all admins. |
| Visitor IDs | Medium | Pseudonymous. Linkable to browser if combined with other data. |
| Hashed IP addresses | Low-Medium | SHA-256 hashed; cannot be reversed, but remains personal data under GDPR interpretation. |
| Audit log | High | Provides GDPR accountability evidence. Tampering destroys legal defensibility. |
| SQLite DB file | High | Contains all of the above. |
| Plugin hook callbacks | Medium | Run in-process with full Node.js access. |

---

## 2. Trust Boundaries

```
[Public internet]
       │
       ▼ HTTPS (operator responsibility)
[Reverse proxy / TLS termination]
       │
       ├──▶ GET/POST /consenti/api/v1/*   ← public widget API (rate-limited, no auth)
       │
       └──▶ GET/POST /consenti/admin/*    ← admin API (JWT required)
                   │
                   ▼
           [Consenti Node.js process]
                   │
                   ├──▶ node:sqlite (filesystem)
                   │
                   └──▶ Plugin hooks (in-process)
```

---

## 3. STRIDE Threat Analysis

### Spoofing

| ID | Threat | Mitigation | Residual risk |
|----|--------|-----------|--------------|
| S1 | Attacker forges admin JWT to access admin API | HMAC-SHA256 signing with server-held secret; JWTs expire | Low — requires secret exfiltration |
| S2 | Attacker impersonates widget to flood consent endpoint | Rate limiting on all public routes | Medium — no per-visitor auth; rate limiting is IP-based |
| S3 | Attacker replays a captured JWT | JWT expiry enforced; no refresh tokens today | Medium — short expiry reduces window |

### Tampering

| ID | Threat | Mitigation | Residual risk |
|----|--------|-----------|--------------|
| T1 | Attacker modifies consent records in DB directly | Requires filesystem/OS access; audit log is append-only | Low — physical/OS security is operator responsibility |
| T2 | Attacker tampers signed consent cookie | HMAC-signed cookie format (planned Phase 3); client-side verification today | Medium — server does not currently verify cookie signature |
| T3 | XSS in dashboard SPA overwrites consent profiles | Preact escapes values by default; CSP recommended at proxy | Medium — CSP not added by default |
| T4 | Plugin hook modifies consent records outside service layer | No sandbox; operator must trust plugins | Medium — operator responsibility |

### Repudiation

| ID | Threat | Mitigation | Residual risk |
|----|--------|-----------|--------------|
| R1 | Admin denies making a profile change | Append-only `audit_logs` table records every admin action with user ID and timestamp | Low |
| R2 | Visitor denies giving consent | Consent receipt JSON includes timestamp, version, and category grants | Low |
| R3 | Audit log is deleted or altered | Storage adapter prohibits UPDATE/DELETE on `audit_logs`; detect via external log shipping | Medium — no cryptographic chaining of log entries |

### Information Disclosure

| ID | Threat | Mitigation | Residual risk |
|----|--------|-----------|--------------|
| I1 | Raw IP address exposed or stored | SHA-256 hashed before any write | Low |
| I2 | Stack traces leak internal paths in API errors | Suppressed when `NODE_ENV=production` | Low |
| I3 | SQLite DB file served over HTTP | DB path is on filesystem; web server must block direct access | Medium — operator configuration responsibility |
| I4 | Admin password or JWT secret logged | Code does not log credentials; third-party logging middleware added by operator could capture them | Medium — operator must audit their middleware stack |
| I5 | Visitor consent history enumerated via API | Visitor ID required; not guessable (UUID v4) | Low |

### Denial of Service

| ID | Threat | Mitigation | Residual risk |
|----|--------|-----------|--------------|
| D1 | Consent endpoint flooded | Built-in rate limiting (`rateLimit.windowMs` / `rateLimit.max`) | Low — configure limits to your traffic |
| D2 | Oversized consent payload | Input validation on all fields; JSON body size limit | Low |
| D3 | Admin dashboard abused to run expensive reports | Admin routes require JWT; pagination enforced on list endpoints | Low |
| D4 | SQLite locked by long write under concurrent load | SQLite WAL mode recommended; single-process deployment | Medium — at high concurrency, switch to PostgreSQL/MySQL |

### Elevation of Privilege

| ID | Threat | Mitigation | Residual risk |
|----|--------|-----------|--------------|
| E1 | Authenticated user accesses a resource beyond their role | RBAC enforced at service layer; JWT checked at middleware | Low |
| E2 | Plugin hook runs arbitrary OS commands | No sandbox; full Node.js in-process access | High — only install plugins from trusted, audited sources |
| E3 | Public consent endpoint used to write arbitrary data | Input validation; schema-validated categories; no free-form fields stored | Low |

---

## 4. Mitigations Already in Place

| Control | Where |
|---------|-------|
| SHA-256 IP hashing | `sqlite.adapter.ts` — `hashIp()` |
| scrypt password hashing | `auth.service.ts` |
| HMAC-SHA256 JWT signing | `jwt.ts` |
| Append-only audit log | `audit.repository.ts` — no UPDATE/DELETE |
| Rate limiting on public routes | `rate-limit.middleware.ts` |
| Error detail suppression in production | All route handlers |
| CORS allowlist (not `*`) | `cors.middleware.ts` |
| Auth middleware on all admin routes | `auth.middleware.ts` |
| Input validation on all endpoints | Route-layer validators |

---

## 5. Known Gaps (Planned or Operator Responsibility)

| Gap | Owner | Phase / Timeline |
|-----|-------|-----------------|
| Server-side consent cookie HMAC verification | Core team | Phase 3 |
| Cryptographically chained audit log (tamper-evident) | Core team | Phase 4 / Enterprise |
| Plugin sandbox (e.g. vm module or Worker isolation) | Core team | Phase 4 |
| CSP headers added by default | Core team | Phase 2 / TBD |
| Intrusion detection / anomaly alerting | Operator | Out of scope |
| TLS termination | Operator | Deploy responsibility |
| SQLite file permissions | Operator | Deploy responsibility |
| Middleware logging audit | Operator | Deploy responsibility |

---

## 6. Out of Scope

- Client-side browser attacks not routed through Consenti's API (XSS in the host page's own code)
- Physical server compromise
- Social engineering attacks on operators or contributors
- Denial of service at the network/infrastructure layer (CDN / WAF responsibility)

---

## 7. Revision History

| Date | Change |
|------|--------|
| 2026-06-26 | Initial threat model created |
