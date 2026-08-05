/**
 * Builds a synchronous, dependency-free `<head>` snippet that freezes Google Consent Mode
 * to denied-by-default the instant a visitor's browser sends the Global Privacy Control (GPC)
 * signal — before any tag-loading script runs, including GTM/gtag.js itself and Consenti's own
 * bundle (which only applies GPC once it has loaded, parsed, and initialized asynchronously).
 *
 * This is a documentation helper, not something the widget loads itself: paste the returned
 * string as the very first `<script>` in `<head>`, ahead of GTM/gtag.js and the Consenti bundle.
 * It only touches `window[dataLayerName]`/`window.gtag` (the same stub-queue pattern
 * `EventBus.initConsentMode()` uses), so it's safe to run before those exist and harmless to
 * run again after they do — Consenti's own `gtag('consent', 'default', …)` call on init just
 * pushes another entry onto the same queue.
 *
 * The default values pushed here mirror `getGoogleGTMConsent({})` in `consent-mapper.ts` (safe
 * defaults for an empty consent map) — keep the two in sync if either changes.
 */
export function buildSyncGpcSnippet(options?: { dataLayerName?: string }): string {
  const dl = (options?.dataLayerName ?? 'dataLayer').replace(/[^a-zA-Z0-9_$]/g, '')
  return `<script>(function(){if(typeof navigator!=="undefined"&&navigator.globalPrivacyControl===true){window.${dl}=window.${dl}||[];if(typeof window.gtag!=="function"){window.gtag=function(){window.${dl}.push(arguments)}}window.gtag("consent","default",{ad_storage:"denied",analytics_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",functionality_storage:"granted",personalization_storage:"denied",security_storage:"granted",ads_data_redaction:"true",url_passthrough:"false"});window.__consentiGpcPreFrozen=true}})();</script>`
}
