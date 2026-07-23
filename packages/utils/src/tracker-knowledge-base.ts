import { COOKIE_PURPOSE_IDS } from "./compliance";

type CookiePurpose = typeof COOKIE_PURPOSE_IDS[number];

/**
 * Curated, community-extendable dataset of common non-IAB tracker cookie/storage key names.
 * Not attempting to rival a crawler-fed proprietary vendor database (that's the job of
 * `@consenti/enterprise-tools`'s scanner) — this is a small, hand-maintained list covering the
 * trackers most self-hosted sites actually use, to save admins from guessing a category when
 * defining a cookie parameter by hand.
 */
export interface TrackerKnowledgeEntry {
  /** Exact cookie/storage key name, or a prefix ending in "*" for variable-suffix names
   * (e.g. GA4's per-property `_ga_<container-id>`). */
  pattern: string;
  vendor: string;
  category: CookiePurpose;
}

export const TRACKER_KNOWLEDGE_BASE: TrackerKnowledgeEntry[] = [
  // Google Consent Mode v2 — canonical parameter names, must match KNOWN_COOKIE_PURPOSES in compliance.ts
  { pattern: "security_storage", vendor: "Google Consent Mode v2", category: "necessary" },
  { pattern: "functionality_storage", vendor: "Google Consent Mode v2", category: "functional" },
  { pattern: "personalization_storage", vendor: "Google Consent Mode v2", category: "preferences" },
  { pattern: "analytics_storage", vendor: "Google Consent Mode v2", category: "analytics" },
  { pattern: "ad_storage", vendor: "Google Consent Mode v2", category: "marketing" },
  { pattern: "ad_user_data", vendor: "Google Consent Mode v2", category: "marketing" },
  { pattern: "ad_personalization", vendor: "Google Consent Mode v2", category: "marketing" },
  // Google Analytics 4 / Universal Analytics
  { pattern: "_ga", vendor: "Google Analytics", category: "analytics" },
  { pattern: "_ga_*", vendor: "Google Analytics 4", category: "analytics" },
  { pattern: "_gid", vendor: "Google Analytics", category: "analytics" },
  { pattern: "_gat", vendor: "Google Analytics", category: "analytics" },
  { pattern: "_gat_*", vendor: "Google Analytics", category: "analytics" },
  // Google Ads
  { pattern: "_gcl_au", vendor: "Google Ads", category: "marketing" },
  { pattern: "_gac_*", vendor: "Google Ads", category: "marketing" },
  { pattern: "_gcl_aw", vendor: "Google Ads", category: "marketing" },
  // Meta / Facebook Pixel
  { pattern: "_fbp", vendor: "Meta Pixel", category: "marketing" },
  { pattern: "_fbc", vendor: "Meta Pixel", category: "marketing" },
  { pattern: "fr", vendor: "Meta Pixel", category: "marketing" },
  // Hotjar
  { pattern: "_hjSessionUser_*", vendor: "Hotjar", category: "analytics" },
  { pattern: "_hjSession_*", vendor: "Hotjar", category: "analytics" },
  { pattern: "_hjid", vendor: "Hotjar", category: "analytics" },
  { pattern: "hjViewportId", vendor: "Hotjar", category: "analytics" },
  // Segment
  { pattern: "ajs_user_id", vendor: "Segment", category: "analytics" },
  { pattern: "ajs_anonymous_id", vendor: "Segment", category: "analytics" },
  { pattern: "ajs_group_id", vendor: "Segment", category: "analytics" },
  // Intercom
  { pattern: "intercom-id-*", vendor: "Intercom", category: "functional" },
  { pattern: "intercom-session-*", vendor: "Intercom", category: "functional" },
  { pattern: "intercom-device-id-*", vendor: "Intercom", category: "functional" },
  // HubSpot
  { pattern: "__hstc", vendor: "HubSpot", category: "marketing" },
  { pattern: "hubspotutk", vendor: "HubSpot", category: "marketing" },
  { pattern: "__hssc", vendor: "HubSpot", category: "marketing" },
  { pattern: "__hssrc", vendor: "HubSpot", category: "marketing" },
  // Mixpanel
  { pattern: "mp_*", vendor: "Mixpanel", category: "analytics" },
  // LinkedIn Insight Tag
  { pattern: "li_sugr", vendor: "LinkedIn Insight", category: "marketing" },
  { pattern: "bcookie", vendor: "LinkedIn Insight", category: "marketing" },
  { pattern: "lidc", vendor: "LinkedIn Insight", category: "marketing" },
  { pattern: "UserMatchHistory", vendor: "LinkedIn Insight", category: "marketing" },
  // TikTok Pixel
  { pattern: "_ttp", vendor: "TikTok Pixel", category: "marketing" },
  // Microsoft Clarity
  { pattern: "_clck", vendor: "Microsoft Clarity", category: "analytics" },
  { pattern: "_clsk", vendor: "Microsoft Clarity", category: "analytics" },
  // Pinterest Tag
  { pattern: "_pinterest_ct*", vendor: "Pinterest Tag", category: "marketing" },
  { pattern: "_pin_unauth", vendor: "Pinterest Tag", category: "marketing" },
  // X (Twitter) Pixel
  { pattern: "personalization_id", vendor: "X (Twitter) Pixel", category: "marketing" },
  // Amplitude
  { pattern: "amplitude_id_*", vendor: "Amplitude", category: "analytics" },
  // Stripe (payment fraud prevention — necessary, not marketing)
  { pattern: "__stripe_mid", vendor: "Stripe", category: "necessary" },
  { pattern: "__stripe_sid", vendor: "Stripe", category: "necessary" },
  // Cloudflare bot management (necessary — security)
  { pattern: "__cf_bm", vendor: "Cloudflare", category: "necessary" },
  { pattern: "cf_clearance", vendor: "Cloudflare", category: "necessary" },
  // Zendesk
  { pattern: "_zendesk_*", vendor: "Zendesk", category: "functional" },
  // Drift
  { pattern: "drift_aid", vendor: "Drift", category: "functional" },
  { pattern: "driftt_aid", vendor: "Drift", category: "functional" },
  // Crisp
  { pattern: "crisp-client*", vendor: "Crisp", category: "functional" },
];

/** Matches a typed cookie/storage key against the knowledge base — exact match first, then the
 * longest matching "*"-suffixed prefix pattern. Returns `undefined` for unrecognized names. */
export function matchTrackerKnowledge(id: string): TrackerKnowledgeEntry | undefined {
  const trimmed = id.trim();
  if (!trimmed) return undefined;

  const exact = TRACKER_KNOWLEDGE_BASE.find((e) => !e.pattern.endsWith("*") && e.pattern === trimmed);
  if (exact) return exact;

  const prefixMatches = TRACKER_KNOWLEDGE_BASE.filter(
    (e) => e.pattern.endsWith("*") && trimmed.startsWith(e.pattern.slice(0, -1)),
  );
  if (prefixMatches.length === 0) return undefined;
  return prefixMatches.reduce((longest, e) => (e.pattern.length > longest.pattern.length ? e : longest));
}
