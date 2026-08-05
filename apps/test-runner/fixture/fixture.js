// Plain ESM, served as-is (no build step) — boots the real built @consenti/ui
// bundle from /consenti-ui/index.mjs with a config derived from the URL's
// query string. Read by apps/test-runner/src/capture.ts and functional.ts via Playwright.

const params = new URLSearchParams(window.location.search)
const jurisdiction = params.get('jurisdiction')
const state = params.get('state')
const locale = params.get('locale') || 'en'
const configOptions = JSON.parse(params.get('configOptions') || '{}')

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Field-level merge — nested objects merge recursively, everything else (including arrays)
 * is replaced wholesale by `override`. Small and local rather than a shared package util:
 * this is the only place in the fixture that needs it. */
function deepMerge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) return override
  const result = { ...base }
  for (const key of Object.keys(override)) {
    result[key] = deepMerge(base[key], override[key])
  }
  return result
}

let config = {
  compliance: { type: jurisdiction },
  core: { locale },
  autoInit: true,
}
// Applied first so a caller's own profileOverride/api/complianceGroupsOverride (via
// --config-options) can target a custom profile or an api-hosted one instead of only the
// 8 built-in embedded profiles — see RunConfig.configOptions.
config = deepMerge(config, configOptions)

// No built-in embedded profile ships ageGate enabled — this is the "real conditions"
// trigger described in plans/DONE-test-runner.md: a profile author turning the flag on,
// same as any real site would. Applied last so this specific test always gets an age gate
// to test regardless of what configOptions.profileOverride otherwise contains.
if (state === 'ageGateModal') {
  config = deepMerge(config, { profileOverride: { ageGate: { enabled: true, minimumAge: 16 } } })
}

window.__testRunnerDone = false
window.__testRunnerError = null

window.__testRunnerState = function () {
  const widget = window.__widget
  if (!widget) return { banner: false, modal: false, ageGateVisible: false }
  return {
    banner: widget.bannerVisibility(),
    modal: widget.modalVisibility(),
    ageGateVisible: !!document.getElementById('consenti-age-gate'),
  }
}

// ─── Functional-test support ───────────────────────────────────────────────────
//
// `widget.profile` is a TypeScript `private` field, which is compile-time-only — it's a
// perfectly ordinary own-property at runtime, so reading it here is real (not hacky) DOM/JS
// introspection, not a call into private *behavior*. Used to derive button/category/cookie
// coverage from whatever the resolved profile actually authored, instead of a hardcoded
// per-jurisdiction list (same "read real state, don't guess" principle as `__testRunnerState`).

function describeButtons(buttonsMap) {
  if (!buttonsMap) return []
  return Object.entries(buttonsMap)
    .filter(([, b]) => b.action !== 'link')
    .map(([id, b]) => ({ id, action: b.action, cookies: b.cookies ?? null }))
}

function cookieLegalBasisMap(categories) {
  const map = {}
  for (const cat of Object.values(categories || {})) {
    for (const cookieId of cat.cookies || []) map[cookieId] = cat.legalBasis
  }
  return map
}

window.__testRunnerDescribe = function () {
  const widget = window.__widget
  const profile = widget && widget.profile
  if (!profile) return { buttons: [], categories: [], cookies: [] }

  let buttons = []
  if (state === 'mainBanner' && profile.mainBanner) buttons = describeButtons(profile.mainBanner.buttons)
  else if (state === 'gpcBanner' && profile.gpcBanner) buttons = describeButtons(profile.gpcBanner.buttons)
  else if (state === 'prefModal' && profile.preferenceModal) buttons = describeButtons(profile.preferenceModal.buttons)

  const categories = state === 'prefModal' && profile.preferenceModal
    ? Object.entries(profile.preferenceModal.categories || {}).map(([id, c]) => ({
      id, cookieIds: c.cookies || [], legalBasis: c.legalBasis,
    }))
    : []

  const legalBasisByCookie = cookieLegalBasisMap(profile.preferenceModal && profile.preferenceModal.categories)
  const cookies = Object.keys(profile.cookies || {}).map(id => ({
    id,
    mandatory: legalBasisByCookie[id] === 'mandatory',
    legalBasis: legalBasisByCookie[id],
  }))

  return { buttons, categories, cookies }
}

// ─── Script-gating markers ──────────────────────────────────────────────────────
//
// Injects one inert `data-consenti-consent-script` tag per real cookie ID, then triggers a
// manual `scanConsentScripts()` re-scan (public API — see apps/ui/src/utils/script-scanner.ts)
// so the widget's own gating mechanism (ConsentScript) manages each one exactly as it would
// for a real integration. Presence is checked by live DOM query, not by tracking a fired flag,
// so it correctly reflects both injection (consent granted) and removal (consent revoked).

function scriptGatingMarkerId(cookieId) {
  return 'consenti-test-marker-' + cookieId
}

async function setUpScriptGatingMarkers(widget) {
  const profile = widget.profile
  if (!profile || !profile.cookies) return
  const mod = await import('/consenti-ui/index.mjs')
  for (const cookieId of Object.keys(profile.cookies)) {
    const tag = document.createElement('script')
    tag.type = 'text/plain'
    tag.setAttribute('data-consenti-consent-script', cookieId)
    tag.textContent = '/* ' + scriptGatingMarkerId(cookieId) + ' */'
    document.body.appendChild(tag)
  }
  mod.scanConsentScripts(widget)
}

window.__testRunnerScriptPresent = function (cookieId) {
  const marker = scriptGatingMarkerId(cookieId)
  for (const el of document.head.querySelectorAll('script')) {
    if (el.textContent && el.textContent.indexOf(marker) !== -1) return true
  }
  return false
}

/** Batched form of `__testRunnerScriptPresent` — one `page.evaluate` round trip instead of
 * one per cookie ID, which matters once "every cookie ID" (per-run policy) means dozens of
 * checks per jurisdiction. */
window.__testRunnerScriptPresentAll = function () {
  const widget = window.__widget
  const profile = widget && widget.profile
  const result = {}
  if (!profile || !profile.cookies) return result
  for (const id of Object.keys(profile.cookies)) result[id] = window.__testRunnerScriptPresent(id)
  return result
}

// ─── Boot ────────────────────────────────────────────────────────────────────

import('/consenti-ui/index.mjs')
  .then(async ({ ConsentiSetup }) => {
    const widget = new ConsentiSetup(config)
    window.__widget = widget

    if (state === 'ageGateModal') {
      // `widget.ready` never resolves until the age gate is answered — poll
      // the DOM for the prompt itself instead of awaiting ready.
      const check = () => {
        if (document.getElementById('consenti-age-gate')) {
          window.__testRunnerDone = true
        } else {
          requestAnimationFrame(check)
        }
      }
      check()
      return
    }

    await widget.ready
    if (state === 'prefModal') widget.showModal()
    await setUpScriptGatingMarkers(widget)
    window.__testRunnerDone = true
  })
  .catch(err => {
    window.__testRunnerError = String((err && err.stack) || err)
    window.__testRunnerDone = true
  })
