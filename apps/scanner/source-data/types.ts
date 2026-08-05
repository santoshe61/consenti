import type { COOKIE_PURPOSE_IDS } from '@consenti/utils'

export type CookiePurpose = typeof COOKIE_PURPOSE_IDS[number]

/**
 * How trustworthy a catalog entry's own classification is — a property of the *data*, not of a
 * runtime match. Distinct from `TrackerFinding.confidence` (`exact`/`pattern`/`behavioral-only`/
 * `unclassified`), which describes *how* a specific signal captured during a scan matched this
 * entry (name equality vs. wildcard pattern vs. domain-only heuristic). A single entry here keeps
 * one `MatchConfidence` regardless of how many different signals end up matching it at scan time.
 */
export type MatchConfidence =
  /** The vendor's own documentation (privacy policy, cookie policy, developer docs) states this
   * purpose/category directly. */
  | 'confirmed'
  /** A reasonable classification without a directly-cited vendor source — e.g. inferred from the
   * vendor's general product category, or carried over from a well-known public reference. */
  | 'inferred'

/**
 * One vendor/tracker catalog entry, matched by third-party **hostname** — used for network
 * requests, `<script src>` tags, and iframe origins, none of which carry a cookie name. Fields
 * beyond `domainSuffix`/`vendor`/`category`/`confidence` are optional and commonly unfilled; they
 * exist so a contributor with more information (a vendor's own docs, a GVL entry, a public CMP's
 * database) has somewhere to put it rather than needing a schema change first. See `README.md` in
 * this directory for how to add or update an entry.
 */
export interface DomainKnowledgeEntry {
  /** Hostname suffix match — `example.com` matches `example.com` and `*.example.com`. */
  domainSuffix: string
  vendor: string
  category: CookiePurpose
  confidence: MatchConfidence
  /** Vendor's own site — lets a reviewer verify this entry against current vendor documentation. */
  vendorUrl?: string
  /** Short, human-readable purpose description — the kind of copy a CMP preference modal shows
   * end users for this vendor (OneTrust/Cookiebot-style "what this tracker is for"). */
  detail?: string
  /** IAB TCF Global Vendor List id, when this vendor is GVL-registered. */
  tcfVendorId?: number
  /** Typical retention/expiry — informational only, never enforced by the scanner (e.g. '2 years',
   * 'session'). */
  retention?: string
  /** Where this entry's classification came from (a URL or a short citation) — keeps the dataset
   * auditable and correctable rather than a black box of unsourced claims. */
  source?: string
}
