import type { DomainKnowledgeEntry } from './types.js'

/**
 * Bundled, offline domain → vendor map. Companion to `TRACKER_KNOWLEDGE_BASE` (re-exported from
 * `@consenti/utils` via this directory's `index.ts`), which matches cookie/storage *names*:
 * network requests and `<script src>` tags are identified by hostname, not by a cookie name, so
 * cookie-name matching alone misses them.
 *
 * Deliberately does not attempt to snapshot the IAB TCF Global Vendor List here — the GVL is
 * fetched live in `apps/api` (`gvl-cache.ts`) and updates roughly weekly; bundling a point-in-time
 * copy into a published CLI package would go stale between releases, and fetching it at scan time
 * would violate this tool's "no network calls except the crawl itself" offline guarantee. Any
 * third-party domain not in this list falls through to "unclassified" and lands in the report's
 * manual-review section instead of being guessed at.
 *
 * All entries below are `confidence: 'confirmed'` — every one is a widely-documented vendor whose
 * general product category (analytics, advertising, customer support, etc.) is public knowledge,
 * even though most don't yet have a cited `source`/`vendorUrl`/`tcfVendorId`/`retention` filled
 * in. Those fields are genuinely optional and open for contribution — see `README.md`.
 */
export const DOMAIN_KNOWLEDGE_BASE: DomainKnowledgeEntry[] = [
  // Google
  { domainSuffix: 'google-analytics.com', vendor: 'Google Analytics', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'analytics.google.com', vendor: 'Google Analytics', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'googletagmanager.com', vendor: 'Google Tag Manager', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'doubleclick.net', vendor: 'Google Ads', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'googlesyndication.com', vendor: 'Google Ads', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'googleadservices.com', vendor: 'Google Ads', category: 'marketing', confidence: 'confirmed' },

  // Meta
  { domainSuffix: 'connect.facebook.net', vendor: 'Meta Pixel', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'facebook.com/tr', vendor: 'Meta Pixel', category: 'marketing', confidence: 'confirmed' },

  // OneTrust — the CMP's own script/CDN is inherently necessary
  { domainSuffix: 'cookielaw.org', vendor: 'OneTrust', category: 'necessary', confidence: 'confirmed', vendorUrl: 'https://www.onetrust.com' },
  { domainSuffix: 'onetrust.com', vendor: 'OneTrust', category: 'necessary', confidence: 'confirmed', vendorUrl: 'https://www.onetrust.com' },

  // Syrenis Cassie — same rationale as OneTrust above: this is the CMP's own script/CDN.
  { domainSuffix: 'cassiecloud.com', vendor: 'Syrenis Cassie', category: 'necessary', confidence: 'confirmed' },

  // Hotjar
  { domainSuffix: 'hotjar.com', vendor: 'Hotjar', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'hotjar.io', vendor: 'Hotjar', category: 'analytics', confidence: 'confirmed' },

  // Segment
  { domainSuffix: 'cdn.segment.com', vendor: 'Segment', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'api.segment.io', vendor: 'Segment', category: 'analytics', confidence: 'confirmed' },

  // Intercom
  { domainSuffix: 'intercom.io', vendor: 'Intercom', category: 'functional', confidence: 'confirmed' },
  { domainSuffix: 'intercomcdn.com', vendor: 'Intercom', category: 'functional', confidence: 'confirmed' },

  // HubSpot
  { domainSuffix: 'hs-scripts.com', vendor: 'HubSpot', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'hsforms.com', vendor: 'HubSpot', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'hubspot.com', vendor: 'HubSpot', category: 'marketing', confidence: 'confirmed' },

  // Mixpanel
  { domainSuffix: 'mixpanel.com', vendor: 'Mixpanel', category: 'analytics', confidence: 'confirmed' },

  // LinkedIn
  { domainSuffix: 'snap.licdn.com', vendor: 'LinkedIn Insight', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'px.ads.linkedin.com', vendor: 'LinkedIn Insight', category: 'marketing', confidence: 'confirmed' },

  // TikTok
  { domainSuffix: 'analytics.tiktok.com', vendor: 'TikTok Pixel', category: 'marketing', confidence: 'confirmed' },

  // Microsoft Clarity
  { domainSuffix: 'clarity.ms', vendor: 'Microsoft Clarity', category: 'analytics', confidence: 'confirmed' },

  // Pinterest
  { domainSuffix: 'ct.pinterest.com', vendor: 'Pinterest Tag', category: 'marketing', confidence: 'confirmed' },

  // X (Twitter)
  { domainSuffix: 'static.ads-twitter.com', vendor: 'X (Twitter) Ads', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 't.co', vendor: 'X (Twitter) Ads', category: 'marketing', confidence: 'confirmed' },

  // Amplitude
  { domainSuffix: 'amplitude.com', vendor: 'Amplitude', category: 'analytics', confidence: 'confirmed' },

  // Stripe
  { domainSuffix: 'js.stripe.com', vendor: 'Stripe', category: 'necessary', confidence: 'confirmed' },

  // Cloudflare
  { domainSuffix: 'challenges.cloudflare.com', vendor: 'Cloudflare', category: 'necessary', confidence: 'confirmed' },

  // Zendesk
  { domainSuffix: 'zdassets.com', vendor: 'Zendesk', category: 'functional', confidence: 'confirmed' },
  { domainSuffix: 'zendesk.com', vendor: 'Zendesk', category: 'functional', confidence: 'confirmed' },

  // Drift
  { domainSuffix: 'driftt.com', vendor: 'Drift', category: 'functional', confidence: 'confirmed' },

  // Crisp
  { domainSuffix: 'crisp.chat', vendor: 'Crisp', category: 'functional', confidence: 'confirmed' },

  // Tealium
  { domainSuffix: 'tiqcdn.com', vendor: 'Tealium', category: 'analytics', confidence: 'confirmed' },

  // Adobe Analytics & Target Ecosystem
  { domainSuffix: 'omtrdc.net', vendor: 'Adobe Analytics', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: '2o7.net', vendor: 'Adobe Analytics', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: '://adobe.com', vendor: 'Adobe Experience Cloud', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'tt.omtrdc.net', vendor: 'Adobe Target', category: 'preferences', confidence: 'confirmed' },

  // Snap
  { domainSuffix: 'sc-static.net', vendor: 'Snapchat Pixel', category: 'marketing', confidence: 'confirmed' },

  // Criteo
  { domainSuffix: 'criteo.com', vendor: 'Criteo', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'criteo.net', vendor: 'Criteo', category: 'marketing', confidence: 'confirmed' },

  // Outbrain / Taboola
  { domainSuffix: 'outbrain.com', vendor: 'Outbrain', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'taboola.com', vendor: 'Taboola', category: 'marketing', confidence: 'confirmed' },

  // --- MEGA EXPANSION PACK ---

  // Programmatic DSPs, Ad Exchanges & Ad Networks
  { domainSuffix: '://thetradedesk.com', vendor: 'The Trade Desk', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'ttd.com', vendor: 'The Trade Desk', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'pubmatic.com', vendor: 'PubMatic', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'rubiconproject.com', vendor: 'Rubicon Project', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'openx.net', vendor: 'OpenX', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'adnxs.com', vendor: 'AppNexus', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'ib-match.com', vendor: 'AppNexus', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'casalemedia.com', vendor: 'Index Exchange', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'indexww.com', vendor: 'Index Exchange', category: 'marketing', confidence: 'confirmed' },

  // B2B Account-Based Marketing (ABM) & Intent Trackers
  { domainSuffix: 'demandbase.com', vendor: 'Demandbase', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'company-target.com', vendor: 'Demandbase', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: '6sc.co', vendor: '6sense', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: '6sense.com', vendor: '6sense', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'clearbit.com', vendor: 'Clearbit', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'clearbitjs.com', vendor: 'Clearbit', category: 'marketing', confidence: 'confirmed' },

  // Reddit
  { domainSuffix: '://redditstatic.com', vendor: 'Reddit Pixel', category: 'marketing', confidence: 'confirmed' },

  // Premium ESPs, CDPs & Lifecycle Marketing
  { domainSuffix: 'klaviyo.com', vendor: 'Klaviyo', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: '://klaviyo.com', vendor: 'Klaviyo', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'pardot.com', vendor: 'Salesforce Pardot', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'activecampaign.com', vendor: 'ActiveCampaign', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'mktoresp.com', vendor: 'Marketo', category: 'marketing', confidence: 'confirmed' },

  // Advanced Session Recording & CRO Optimizers
  { domainSuffix: 'crazyegg.com', vendor: 'Crazy Egg', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'logrocket.io', vendor: 'LogRocket', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'heapanalytics.com', vendor: 'Heap Analytics', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'luckyorange.com', vendor: 'Lucky Orange', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'luckyorange.net', vendor: 'Lucky Orange', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'fullstory.com', vendor: 'FullStory', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'livesession.io', vendor: 'LiveSession', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'visualwebsiteoptimizer.com', vendor: 'VWO', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'vwoo.com', vendor: 'VWO', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'optimizely.com', vendor: 'Optimizely', category: 'analytics', confidence: 'confirmed' },

  // Real-User Monitoring (RUM), APM & Edge Security
  { domainSuffix: 'browser-intake-datadoghq.com', vendor: 'Datadog', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'datadoghq-browser-agent.com', vendor: 'Datadog', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'nr-data.net', vendor: 'New Relic', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'dynatrace.com', vendor: 'Dynatrace', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'edgecastcdn.net', vendor: 'Akamai / Edgecast', category: 'necessary', confidence: 'confirmed' },

  // Video Analytics & Embedded Trackers
  { domainSuffix: 'vimeo.com', vendor: 'Vimeo', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'vimeocdn.com', vendor: 'Vimeo', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'youtube.com', vendor: 'YouTube Video Tracking', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'youtube-nocookie.com', vendor: 'YouTube Video Tracking', category: 'functional', confidence: 'confirmed' },
  { domainSuffix: 'wistia.com', vendor: 'Wistia', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'fast.wistia.net', vendor: 'Wistia', category: 'analytics', confidence: 'confirmed' },

  // Server-Side Event Orchestration & Affiliate Tracking
  { domainSuffix: 'elevar.com', vendor: 'Elevar', category: 'analytics', confidence: 'confirmed' },
  { domainSuffix: 'rakutenadvertising.io', vendor: 'Rakuten Advertising', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'impact.com', vendor: 'Impact Radius', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'awin.com', vendor: 'Awin', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'awin1.com', vendor: 'Awin', category: 'marketing', confidence: 'confirmed' },
  { domainSuffix: 'cj.com', vendor: 'CJ Affiliate', category: 'marketing', confidence: 'confirmed' },

  // Native E-Commerce Platforms Infrastructure
  { domainSuffix: 'shopify.com', vendor: 'Shopify Core', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'shopifycdn.com', vendor: 'Shopify Core', category: 'necessary', confidence: 'confirmed' },

  // Feedback, Enterprise Surveys & Interstitials
  { domainSuffix: 'qualtrics.com', vendor: 'Qualtrics', category: 'functional', confidence: 'confirmed' },
  { domainSuffix: 'surveymonkey.com', vendor: 'SurveyMonkey', category: 'functional', confidence: 'confirmed' },
  { domainSuffix: 'usabilla.com', vendor: 'Usabilla', category: 'functional', confidence: 'confirmed' },

  // Global Consent Management Platforms (CMP Solutions — Necessary Systems)
  { domainSuffix: 'cookiebot.com', vendor: 'Cookiebot', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'cookiebot.net', vendor: 'Cookiebot', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'usercentrics.eu', vendor: 'Usercentrics', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'didomi.io', vendor: 'Didomi', category: 'necessary', confidence: 'confirmed' },
  { domainSuffix: 'quantcast.com', vendor: 'Quantcast Choice', category: 'necessary', confidence: 'confirmed' },];

function registrableDomainOf(hostname: string): string {
  const parts = hostname.split('.')
  return parts.length <= 2 ? hostname : parts.slice(-2).join('.')
}

/** Longest-suffix match against the bundled domain list. Returns `undefined` when the hostname
 * doesn't match any known vendor domain — the caller's job to then decide "unclassified" vs.
 * "same-site, not third-party" based on the page's own origin. */
export function matchDomainKnowledge(hostname: string): DomainKnowledgeEntry | undefined {
  const host = hostname.toLowerCase()
  const matches = DOMAIN_KNOWLEDGE_BASE.filter(
    e => host === e.domainSuffix || host.endsWith(`.${e.domainSuffix}`)
  )
  if (matches.length === 0) return undefined
  return matches.reduce((longest, e) => (e.domainSuffix.length > longest.domainSuffix.length ? e : longest))
}

export function isSameSite(hostname: string, pageHostname: string): boolean {
  return registrableDomainOf(hostname) === registrableDomainOf(pageHostname)
}

export { registrableDomainOf }
