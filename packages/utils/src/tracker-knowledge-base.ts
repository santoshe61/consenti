import { COOKIE_PURPOSE_IDS } from "./compliance.js";

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

  // --- MEGA EXPANSION PACK ---

  // Adobe Experience Cloud (Analytics, Marketo, Target)
  { pattern: "AMCV_*", vendor: "Adobe Experience Cloud", category: "analytics" },
  { pattern: "AMCVS_*", vendor: "Adobe Experience Cloud", category: "analytics" },
  { pattern: "s_cc", vendor: "Adobe Analytics", category: "analytics" },
  { pattern: "s_sq", vendor: "Adobe Analytics", category: "analytics" },
  { pattern: "s_vi", vendor: "Adobe Analytics", category: "analytics" },
  { pattern: "mbox", vendor: "Adobe Target", category: "preferences" },
  { pattern: "_mkto_trk", vendor: "Marketo", category: "marketing" },

  // Programmatic Ad Exchanges & DSPs
  { pattern: "cto_bundle", vendor: "Criteo", category: "marketing" },
  { pattern: "cto_id_out", vendor: "Criteo", category: "marketing" },
  { pattern: "TTD_DEVICE_ID", vendor: "The Trade Desk", category: "marketing" },
  { pattern: "ttd_*", vendor: "The Trade Desk", category: "marketing" },
  { pattern: "id", vendor: "Google DoubleClick", category: "marketing" },
  { pattern: "IDE", vendor: "Google DoubleClick", category: "marketing" },
  { pattern: "DSID", vendor: "Google DoubleClick", category: "marketing" },
  { pattern: "KADUSERCOOKIE", vendor: "PubMatic", category: "marketing" },
  { pattern: "rubicon_user_*", vendor: "Rubicon Project", category: "marketing" },
  { pattern: "Anonymon_id", vendor: "OpenX", category: "marketing" },
  { pattern: "pdomid", vendor: "OpenX", category: "marketing" },
  { pattern: "uuid2", vendor: "AppNexus", category: "marketing" },
  { pattern: "icu", vendor: "AppNexus", category: "marketing" },

  // Core Social Media Pixels
  { pattern: "_scid", vendor: "Snap Pixel", category: "marketing" },
  { pattern: "_sc_cspv", vendor: "Snap Pixel", category: "marketing" },
  { pattern: "_rdt_uuid", vendor: "Reddit Pixel", category: "marketing" },

  // Content Discovery & Native Advertising
  { pattern: "obuid", vendor: "Outbrain", category: "marketing" },
  { pattern: "t_gid", vendor: "Taboola", category: "marketing" },

  // Premium ESPs, CDPs & Lifecycle Marketing
  { pattern: "__kla_id", vendor: "Klaviyo", category: "marketing" },
  { pattern: "sc_anonymous_id", vendor: "Salesforce Marketing Cloud", category: "marketing" },
  { pattern: "vst", vendor: "Salesforce Marketing Cloud", category: "marketing" },
  { pattern: "visitor_id*", vendor: "Salesforce Pardot", category: "marketing" },
  { pattern: "piAId", vendor: "Salesforce Pardot", category: "marketing" },
  { pattern: "exp_last_visit", vendor: "ActiveCampaign", category: "marketing" },
  { pattern: "exp_tracker", vendor: "ActiveCampaign", category: "marketing" },

  // Advanced Session Replay, Optimization & Analytics
  { pattern: "_ce.s*", vendor: "Crazy Egg", category: "analytics" },
  { pattern: "lr_*", vendor: "LogRocket", category: "analytics" },
  { pattern: "_hp2_id.*", vendor: "Heap Analytics", category: "analytics" },
  { pattern: "_hp2_ses.*", vendor: "Heap Analytics", category: "analytics" },
  { pattern: "_lo_*", vendor: "Lucky Orange", category: "analytics" },
  { pattern: "fs_uid", vendor: "FullStory", category: "analytics" },
  { pattern: "_fs_*", vendor: "FullStory", category: "analytics" },
  { pattern: "ln_or", vendor: "LiveSession", category: "analytics" },
  { pattern: "_vwo_uuid*", vendor: "Visual Website Optimizer (VWO)", category: "analytics" },
  { pattern: "_vis_opt_*", vendor: "Visual Website Optimizer (VWO)", category: "analytics" },
  { pattern: "OptimizelyBuckets", vendor: "Optimizely", category: "analytics" },
  { pattern: "optimizelyEndUserId", vendor: "Optimizely", category: "analytics" },

  // OneTrust (necessary — this is the CMP's own consent-state storage, not a tracker)
  { pattern: "OptanonConsent", vendor: "OneTrust", category: "necessary" },
  { pattern: "OptanonAlertBoxClosed", vendor: "OneTrust", category: "necessary" },

  // Syrenis Cassie (necessary — same rationale as OneTrust above: these store the CMP's own
  // consent record — when you consented, what you chose, which policy version you saw, and the
  // GTM/session bookkeeping that keeps the banner from re-prompting — not a third-party tracker
  // in their own right).
  { pattern: "SyrenisCookieConsentDate_*", vendor: "Syrenis Cassie", category: "necessary" },
  { pattern: "SyrenisCookieFormConsent_*", vendor: "Syrenis Cassie", category: "necessary" },
  { pattern: "SyrenisCookiePrivacyLink_*", vendor: "Syrenis Cassie", category: "necessary" },
  { pattern: "SyrenisGtmConsent_*", vendor: "Syrenis Cassie", category: "necessary" },
  { pattern: "SyrenisGuid_*", vendor: "Syrenis Cassie", category: "necessary" },

  // Alternative Core Global Consent Framework Engines (CMP Tools)
  { pattern: "CookieConsent", vendor: "Cookiebot", category: "necessary" },
  { pattern: "uc_settings", vendor: "Usercentrics", category: "necessary" },
  { pattern: "uc_user_interaction", vendor: "Usercentrics", category: "necessary" },
  { pattern: "didomi_token", vendor: "Didomi", category: "necessary" },
  { pattern: "euconsent-v2", vendor: "IAB TCF Global Vendor List", category: "necessary" },
  { pattern: "cconsent", vendor: "Cookie Consent Studio", category: "necessary" },

  // Real-User Monitoring (RUM) & Infrastructure Performance
  { pattern: "JSESSIONID", vendor: "New Relic", category: "necessary" },
  { pattern: "NRAGENT", vendor: "New Relic", category: "necessary" },
  { pattern: "_dd_s", vendor: "Datadog", category: "necessary" },
  { pattern: "dtCookie", vendor: "Dynatrace", category: "necessary" },
  { pattern: "dtPC", vendor: "Dynatrace", category: "necessary" },
  { pattern: "rxVisitor", vendor: "Dynatrace", category: "necessary" },
  { pattern: "ak_bmsc", vendor: "Akamai", category: "necessary" },
  { pattern: "_abck", vendor: "Akamai", category: "necessary" },

  // Video Hosting Telemetry & Analytics
  { pattern: "vuid", vendor: "Vimeo", category: "analytics" },
  { pattern: "__cf_vuid", vendor: "Vimeo", category: "analytics" },
  { pattern: "VISITOR_INFO1_LIVE", vendor: "YouTube", category: "marketing" },
  { pattern: "YSC", vendor: "YouTube", category: "necessary" }, // Keeps track of user input/session during video play
  { pattern: "GPS", vendor: "YouTube", category: "marketing" },
  { pattern: "_wistia_*", vendor: "Wistia", category: "analytics" },

  // Server-Side Event Attribution & Tagging Extensions
  { pattern: "_elvr_*", vendor: "Elevar", category: "analytics" },
  { pattern: "stkn", vendor: "Shopify Core Analytics", category: "analytics" },

  // Affiliate Network Enterprise Tracking
  { pattern: "rmStore*", vendor: "Rakuten Advertising", category: "marketing" },
  { pattern: "_ir_*", vendor: "Impact Radius", category: "marketing" },
  { pattern: "aw*", vendor: "Awin", category: "marketing" },
  { pattern: "bctc", vendor: "Awin", category: "marketing" },
  { pattern: "mcookie", vendor: "CJ Affiliate", category: "marketing" },

  // Major E-Commerce Native Framework Stores
  { pattern: "_shopify_y", vendor: "Shopify", category: "analytics" },
  { pattern: "_shopify_s", vendor: "Shopify", category: "analytics" },
  { pattern: "_shopify_sa_p", vendor: "Shopify", category: "marketing" },
  { pattern: "shopify_sa_t", vendor: "Shopify", category: "marketing" },
  { pattern: "cart_sig", vendor: "Shopify", category: "necessary" },
  { pattern: "secure_customer_sig", vendor: "Shopify", category: "necessary" },
  { pattern: "wp_woocommerce_session*", vendor: "WooCommerce", category: "necessary" },
  { pattern: "woocommerce_items_in_cart", vendor: "WooCommerce", category: "necessary" },
  { pattern: "woocommerce_cart_hash", vendor: "WooCommerce", category: "necessary" },

  // Enterprise Feedback, Surveys & Interstitials
  { pattern: "QSI_", vendor: "Qualtrics", category: "functional" },
  { pattern: "feedback_id", vendor: "SurveyMonkey", category: "functional" },
  { pattern: "usbl.", vendor: "Usabilla", category: "functional" },
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
