import type { Metadata } from 'next'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Public API Routes' }

function Method({ m }: { m: 'GET' | 'POST' | 'PUT' | 'DELETE' }) {
  const colors = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold font-mono ${colors[m]}`}>
      {m}
    </span>
  )
}

export default function PublicRoutesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Public API Routes</h1>
      <p>
        Base path: <code>/consenti/api/v1</code> (default — set via <code>basePath</code> in{' '}
        <code>createConsenti()</code>). No authentication required.
      </p>

      <Callout type="tip">
        Explore and test all routes interactively in the{' '}
        <a href="/consenti/api/docs" target="_blank" rel="noopener noreferrer">Swagger UI</a>.
      </Callout>

      <div className="not-prose overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Method</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Path</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              { m: 'GET', p: '/profiles/:id', d: 'Get profile resolved in its default locale' },
              { m: 'GET', p: '/profiles/:id/:locale', d: 'Get profile resolved for a specific locale' },
              { m: 'POST', p: '/consent', d: 'Submit a consent record' },
              { m: 'GET', p: '/consent/:visitorId', d: 'Get current consent for a visitor' },
              { m: 'PUT', p: '/consent/:visitorId', d: 'Update consent for a visitor' },
              { m: 'DELETE', p: '/consent/:visitorId', d: 'GDPR erasure — delete all data for visitor' },
              { m: 'GET', p: '/consent/:visitorId/verify', d: 'Verify consent is still valid' },
            ].map(({ m, p, d }) => (
              <tr key={p + m} className="hover:bg-slate-50">
                <td className="px-3 py-2"><Method m={m as 'GET' | 'POST' | 'PUT' | 'DELETE'} /></td>
                <td className="px-3 py-2 font-mono text-xs text-slate-800">{p}</td>
                <td className="px-3 py-2 text-slate-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Profiles ──────────────────────────────────────────────── */}

      <h2>Profiles</h2>
      <p>
        Profiles define the cookie categories and all UI copy (banners, modal, buttons) served to
        visitors. The UI widget fetches the active profile on page load using the profile ID you
        supply in <code>core.profileId</code>.
      </p>

      <Callout type="info">
        There is no public list endpoint — clients must know the profile ID in advance (copy it
        from the admin dashboard or pass it from your backend).
      </Callout>

      <p>
        Both profile endpoints return the same response shape. The only difference is which locale
        is resolved: <code>/profiles/:id</code> uses the profile&apos;s <code>defaultLocale</code>,
        while <code>/profiles/:id/:locale</code> uses the requested locale (falling back to{' '}
        <code>defaultLocale</code> if no translation exists for the requested locale).
      </p>

      <h3>Response shape</h3>
      <p>
        Both endpoints return a fully-resolved profile — banner text, modal copy, and button labels
        are already merged for the active locale. There is no raw <code>translations</code> map.
      </p>

      <div className="not-prose overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Field</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {[
              { f: 'id', t: 'string', d: 'Profile UUID' },
              { f: 'version', t: 'number', d: 'Schema version — bump triggers re-consent' },
              { f: 'defaultLocale', t: 'string', d: 'BCP 47 locale used as the translation fallback' },
              { f: 'currentLocale', t: 'string', d: 'Locale whose content is present in this response' },
              { f: 'locales', t: 'string[]', d: 'All locale keys defined on the profile' },
              { f: 'cookies', t: 'Cookie[]', d: 'Cookies/purposes managed by this profile' },
              { f: 'mainBanner', t: 'MainBanner', d: 'Banner config resolved for currentLocale' },
              { f: 'preferenceModal', t: 'PreferenceModal', d: 'Modal config resolved for currentLocale' },
              { f: 'gpcBanner?', t: 'GpcBanner', d: 'GPC-specific banner variant (omitted if not configured)' },
            ].map(({ f, t, d }) => (
              <tr key={f} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-slate-800">{f}</td>
                <td className="px-3 py-2 font-mono text-violet-700">{t}</td>
                <td className="px-3 py-2 text-slate-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>
        <Method m="GET" /> <code>/profiles/:id</code>
      </h3>
      <p>
        Returns the profile resolved in its <code>defaultLocale</code>.{' '}
        <code>currentLocale</code> will equal <code>defaultLocale</code>.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/my-profile-id HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "my-profile-id",
  "version": 3,
  "defaultLocale": "en",
  "currentLocale": "en",
  "locales": ["en", "fr"],
  "cookies": [
    { "id": "necessary", "mandatory": true },
    { "id": "analytics", "listenGpc": true, "expiry": 365 }
  ],
  "mainBanner": {
    "position": "bottom",
    "heading": "We use cookies",
    "htmlText": "This site uses cookies to improve your experience.",
    "buttons": [
      { "text": "Accept All", "type": "primary", "cookies": "*" },
      { "text": "Reject Optional", "type": "primary", "cookies": "!" },
      { "text": "Customize", "type": "manage" }
    ]
  },
  "preferenceModal": {
    "heading": "Cookie Preferences",
    "showClose": true,
    "buttons": [
      { "text": "Accept All", "type": "primary", "cookies": "*" },
      { "text": "Save Preferences", "type": "submit" },
      { "text": "Reject Optional", "type": "primary", "cookies": "!" }
    ],
    "categories": [
      {
        "id": "cat-necessary",
        "heading": "Necessary",
        "htmlText": "Required for the site to function.",
        "mandatory": true,
        "cookies": ["necessary"]
      },
      {
        "id": "cat-analytics",
        "heading": "Analytics",
        "htmlText": "Help us understand how visitors use the site.",
        "cookies": ["analytics"]
      }
    ]
  }
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/profiles/:id/:locale</code>
      </h3>
      <p>
        Same response shape as <code>/profiles/:id</code>, but <code>currentLocale</code> is set to{' '}
        <code>:locale</code> and all banner/modal strings are resolved for that locale. If the
        requested locale has no translation, the response falls back to <code>defaultLocale</code>{' '}
        (and <code>currentLocale</code> reflects the requested locale regardless).
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/my-profile-id/fr HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "my-profile-id",
  "version": 3,
  "defaultLocale": "en",
  "currentLocale": "fr",
  "locales": ["en", "fr"],
  "cookies": [
    { "id": "necessary", "mandatory": true },
    { "id": "analytics", "listenGpc": true, "expiry": 365 }
  ],
  "mainBanner": {
    "position": "bottom",
    "heading": "Nous utilisons des cookies",
    "htmlText": "Ce site utilise des cookies pour améliorer votre expérience.",
    "buttons": [
      { "text": "Tout accepter", "type": "primary", "cookies": "*" },
      { "text": "Tout refuser", "type": "primary", "cookies": "!" },
      { "text": "Gérer les préférences", "type": "manage" }
    ]
  },
  "preferenceModal": {
    "heading": "Préférences de cookies",
    "showClose": true,
    "buttons": [
      { "text": "Tout accepter", "type": "primary", "cookies": "*" },
      { "text": "Enregistrer", "type": "submit" },
      { "text": "Tout refuser", "type": "primary", "cookies": "!" }
    ],
    "categories": [
      {
        "id": "cat-necessary",
        "heading": "Nécessaires",
        "htmlText": "Requis pour le fonctionnement du site.",
        "mandatory": true,
        "cookies": ["necessary"]
      },
      {
        "id": "cat-analytics",
        "heading": "Analytique",
        "htmlText": "Nous aide à comprendre comment les visiteurs utilisent le site.",
        "cookies": ["analytics"]
      }
    ]
  }
}`,
          },
        ]}
      />

      <Callout type="tip">
        Use <code>locales</code> in the response to build a locale switcher — it lists every locale
        key the profile has translations for, so you can offer only the languages that are actually
        configured.
      </Callout>

      {/* ── Consent ──────────────────────────────────────────────── */}

      <h2>Consent</h2>
      <p>
        Consent records are keyed by <code>visitorId</code>. The visitor ID is persisted in a
        cookie (<code>consenti_vid</code>) set by the widget after the first submission.
      </p>

      <h3>
        <Method m="POST" /> <code>/consent</code>
      </h3>
      <p>
        Creates or updates a consent record. If <code>visitorId</code> is omitted, the server
        generates one and sets it as a cookie in the response.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/api/v1/consent HTTP/1.1
// Content-Type: application/json

{
  "profileId": "my-profile-id",  // required
  "consentJson": {               // required
    "necessary": "granted",
    "analytics": "granted",
    "marketing": "denied"
  },
  "visitorId": "uuid-v4",        // optional — generated if omitted
  "profileVersion": 3,           // optional — defaults to 1
  "locale": "en",                // optional — defaults to "en"
  "gpcDetected": false,          // optional — defaults to false
  "source": "banner"             // optional — "banner" | "api" | "import"
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile-id",
  "profileVersion": 3,
  "locale": "en",
  "consentJson": {
    "necessary": "granted",
    "analytics": "granted",
    "marketing": "denied"
  },
  "gpcDetected": false,
  "source": "banner",
  "createdAt": "2026-06-24T10:00:00.000Z",
  "updatedAt": "2026-06-24T10:00:00.000Z"
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/consent/:visitorId</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/consent/visitor-uuid HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile-id",
  "profileVersion": 3,
  "locale": "en",
  "consentJson": {
    "necessary": "granted",
    "analytics": "granted",
    "marketing": "denied"
  },
  "gpcDetected": false,
  "source": "banner",
  "createdAt": "2026-06-24T10:00:00.000Z",
  "updatedAt": "2026-06-24T10:00:00.000Z"
}`,
          },
        ]}
      />

      <h3>
        <Method m="PUT" /> <code>/consent/:visitorId</code>
      </h3>
      <p>Updates an existing consent record. Only the supplied fields are applied.</p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// PUT /consenti/api/v1/consent/visitor-uuid HTTP/1.1
// Content-Type: application/json

{
  "consentJson": {          // required
    "necessary": "granted",
    "analytics": "denied",
    "marketing": "denied"
  },
  "locale": "fr",           // optional
  "gpcDetected": true       // optional
}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile-id",
  "profileVersion": 3,
  "locale": "fr",
  "consentJson": {
    "necessary": "granted",
    "analytics": "denied",
    "marketing": "denied"
  },
  "gpcDetected": true,
  "source": "banner",
  "createdAt": "2026-06-24T10:00:00.000Z",
  "updatedAt": "2026-06-24T11:00:00.000Z"
}`,
          },
        ]}
      />

      <h3>
        <Method m="DELETE" /> <code>/consent/:visitorId</code>
      </h3>
      <p>
        GDPR right-to-erasure. Deletes the consent record, consent history, and visitor record for
        the given visitor ID. Also expires the consent cookie in the response.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// DELETE /consenti/api/v1/consent/visitor-uuid HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "success": true
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/consent/:visitorId/verify</code>
      </h3>
      <p>
        Checks whether the stored consent record is still valid — i.e., the profile version matches
        and the record has not expired. The UI widget calls this on page load to decide whether to
        re-show the banner.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/consent/visitor-uuid/verify HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `// Consent is still valid:
{ "valid": true }

// Consent is stale (profile version bumped):
{
  "valid": false,
  "reason": "profile_version_mismatch"
}

// Other possible reasons:
// "consent_expired" — past retention window
// "missing_cookies" — cookie categories changed`,
          },
        ]}
      />

      <Callout type="tip">
        The widget automatically calls <code>POST /consent</code> after the visitor accepts, then
        calls <code>GET /consent/:visitorId/verify</code> on subsequent page loads to skip the banner
        if consent is still valid.
      </Callout>
    </div>
  )
}
