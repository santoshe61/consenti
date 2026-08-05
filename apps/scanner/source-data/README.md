# Scanner source data

The classification datasets `@consenti/scanner` matches captured cookies, requests, scripts, and
iframes against. This directory is the **single entry point** — every consumer, inside this
package or outside it, imports from `./index.ts`, never from an individual data file or from
`@consenti/utils` directly.

```ts
import { DOMAIN_KNOWLEDGE_BASE, matchDomainKnowledge, TRACKER_KNOWLEDGE_BASE } from '../source-data/index.js'
```

This is the open-source foundation of a dataset that's meant to grow into something comparable to
what large commercial CMPs (OneTrust, Cookiebot, etc.) ship — vendor name, category, purpose
description, retention, TCF vendor id, source citation. It stays local and community-maintained
for now; a larger, continuously-updated version of this data is the planned basis for a future
hosted/premium offering, but every field this scanner reads to classify a tracker will always stay
available here, in the open, for anyone self-hosting Consenti.

## Files

| File | Contents |
|---|---|
| `types.ts` | Shared schema (`DomainKnowledgeEntry`, `MatchConfidence`) |
| `domains.ts` | Domain → vendor → category map (matches network requests, `<script src>`, iframe origins by **hostname**) + its matcher functions |
| `index.ts` | Re-exports everything above, plus `TRACKER_KNOWLEDGE_BASE`/`matchTrackerKnowledge` (cookie/storage **name** matching) from `@consenti/utils` |

`TRACKER_KNOWLEDGE_BASE` itself still lives in `packages/utils/src/tracker-knowledge-base.ts` — it
serves the dashboard's cookie editor too, not just the scanner, so it can't be owned by an `app`
without inverting the monorepo's dependency direction (packages must not depend on apps). It's
re-exported through `index.ts` here purely so scanner code has one import path; if you're adding a
**cookie/storage-name** entry (as opposed to a domain one), edit that file directly — its own
schema and conventions are documented at the top of it.

## Adding or updating a domain entry

Edit `domains.ts`. Each entry:

```ts
{
  domainSuffix: 'example-vendor.com',   // required — matches this and any subdomain
  vendor: 'Example Vendor',             // required
  category: 'analytics',                // required — necessary | functional | preferences | analytics | marketing
  confidence: 'confirmed',              // required — see below
  vendorUrl: 'https://example-vendor.com/privacy',   // optional
  detail: 'Short user-facing purpose description.',   // optional
  tcfVendorId: 128,                     // optional — only if GVL-registered
  retention: '2 years',                 // optional — informational only, never enforced
  source: 'https://example-vendor.com/cookie-policy', // optional — where you verified this
}
```

Only `domainSuffix`/`vendor`/`category`/`confidence` are required. The rest are genuinely
optional — leave them out rather than guessing. A future contributor (or the maintainers, when
building out the hosted version) can fill them in once someone actually verifies them against the
vendor's own documentation.

### `confidence`: `'confirmed'` vs `'inferred'`

This describes the **catalog entry's** trustworthiness, not a scan's runtime result:

- `confirmed` — the vendor's own privacy policy, cookie policy, or developer docs state this
  purpose/category directly.
- `inferred` — a reasonable classification without a directly-cited vendor source (e.g. inferred
  from the vendor's general product category, or carried over from a well-known public reference).

This is unrelated to `TrackerFinding.confidence` (`exact` / `pattern` / `behavioral-only` /
`unclassified`) in the scan report — that field describes *how a specific signal matched during a
scan* (exact name, wildcard pattern, domain-only heuristic), computed fresh every scan regardless
of what's recorded here.

### What NOT to add

- **Never guess `necessary`.** A tracker only belongs in the `necessary` category when its vendor's
  own documentation states the specific cookie/domain exists purely for security, fraud
  prevention, load balancing, or the site's own core function — not because it "seems important."
  Getting this wrong is the one classification mistake that actually undermines a site's consent
  compliance (a real non-essential tracker misfiled as `necessary` bypasses the consent gate
  entirely). When unsure, leave the tracker unclassified — the scanner already routes anything it
  can't match here to the report's manual-review list rather than guessing.
- **No fabricated `tcfVendorId`/`retention`/`source`.** An invented citation is worse than a
  missing field — it looks verified when it isn't. Leave the field out.
- **No point-in-time IAB TCF Global Vendor List snapshot.** The GVL updates roughly weekly and
  `apps/api` already fetches it live (`gvl-cache.ts`); bundling a copy here would go stale between
  scanner releases. Only put a `tcfVendorId` on an entry if you've directly confirmed it against
  the vendor's current GVL registration — don't infer one from a similar entry.

## Adding a new domain vendor: checklist

1. Confirm the domain actually belongs to the vendor (not a CDN/subdomain shared across many
   unrelated vendors — that would misattribute anyone using the same CDN).
2. Check the vendor's own privacy/cookie documentation for the stated purpose.
3. Add the entry to `domains.ts` in the vendor's own comment-grouped block (or a new one).
4. Set `confidence: 'confirmed'` only if step 2 actually found a stated purpose; otherwise
   `'inferred'`.
5. Run `npm run typecheck` in `apps/scanner`.
