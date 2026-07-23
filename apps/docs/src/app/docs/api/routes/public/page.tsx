import type { Metadata } from 'next'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Public API Routes',
  description: 'Public API routes at /consenti/api/v1 — no authentication required.',
  alternates: { canonical: '/docs/api/routes/public' },
  openGraph: {
    title: 'Public API Routes',
    description: 'Public API routes at /consenti/api/v1 — no authentication required.',
    url: 'https://consenti.dev/docs/api/routes/public',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Public API Routes',
    description: 'Public API routes at /consenti/api/v1 — no authentication required.',
    images: ['/og-image.jpg'],
  },
}

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
        <a href="/consenti/api/docs" target="_blank" rel="noopener noreferrer">
          Swagger UI
        </a>
        .
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
              {
                m: 'GET',
                p: '/profiles/:tenantId/:complianceGroup/:locale',
                d: 'Hot-serve — serve locale JSON directly from disk (zero DB)',
              },
              {
                m: 'GET',
                p: '/profiles/:tenantId/:profileId/:entryId/:locale',
                d: "Serve a specific archived edit's locale JSON (dashboard preview)",
              },
              {
                m: 'GET',
                p: '/resolve-profile',
                d: 'Geo-resolve compliance group, return file path + locale',
              },
              { m: 'GET', p: '/profiles/:id', d: 'Get profile by ID (DB-backed, default locale)' },
              {
                m: 'GET',
                p: '/profiles/:id/:locale',
                d: 'Get profile by ID and locale (DB-backed)',
              },
              {
                m: 'GET',
                p: '/profiles/auto/:locale',
                d: 'Legacy: geo-resolve and return matching active profile',
              },
              { m: 'POST', p: '/consent', d: 'Submit a consent record' },
              { m: 'GET', p: '/consent/:visitorId', d: 'Get current consent for a visitor' },
              { m: 'PUT', p: '/consent/:visitorId', d: 'Update consent for a visitor' },
              {
                m: 'DELETE',
                p: '/consent/:visitorId',
                d: 'GDPR erasure — delete all data for visitor',
              },
              { m: 'GET', p: '/consent/:visitorId/verify', d: 'Verify consent is still valid' },
            ].map(({ m, p, d }) => (
              <tr key={p + m} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Method m={m as 'GET' | 'POST' | 'PUT' | 'DELETE'} />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-800">{p}</td>
                <td className="px-3 py-2 text-slate-600">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Static file serving ───────────────────────────────────── */}

      <h2>Static profile file serving (hot path)</h2>
      <p>
        The primary way to serve profiles at scale. Locale JSON files are written to disk when a
        profile is <strong>activated</strong> in the dashboard. These routes serve them directly
        from the filesystem — no DB query on the hot path.
      </p>

      <h3>
        <Method m="GET" /> <code>/profiles/:tenantId/:complianceGroup/:locale</code>
      </h3>
      <p>
        Serves the active locale JSON for a compliance group from{' '}
        <code>{`\${storage.path}/profiles/\${tenantId}/\${complianceGroup}/\${locale}.json`}</code>.
        Returns <code>Cache-Control: public, max-age=3600, stale-while-revalidate=60</code> — safe
        for CDN caching.
      </p>
      <p>
        If the requested locale file does not exist, responds with <code>303 See Other</code> to{' '}
        <code>.../default</code>, which serves <code>default.json</code> (the{' '}
        <code>defaultLocale</code> content).
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/default/opt-in/en HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `// Content-Type: application/json
// Cache-Control: public, max-age=3600, stale-while-revalidate=60

{
  "id": "my-gdpr-profile",
  "defaultLocale": "en",
  "complianceGroup": "opt-in",
  "cookies": {...},
  "mainBanner": { ... },
  "preferenceModal": { ... }
}`,
          },
          {
            label: '303 — locale missing',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/default/opt-in/hi-IN HTTP/1.1
// → 303 See Other
// Location: /consenti/api/v1/profiles/default/opt-in/default`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/profiles/:tenantId/:profileId/:entryId/:locale</code>
      </h3>
      <p>
        Serves the locale JSON for one version snapshot — used by the dashboard edit-history viewer.
        These files are written once and never modified. <code>:profileId</code> is the
        profile&apos;s stable id; <code>:entryId</code> is the version number (from{' '}
        <code>GET /admin/profiles/:id/versions</code>).
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/default/prof-a1b2c3/2/fr-FR HTTP/1.1`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `// Serves: \${storage.path}/profiles/default/prof-a1b2c3/2/fr-FR.json`,
          },
        ]}
      />

      {/* ── /resolve-profile ─────────────────────────────────────── */}

      <h2>Resolve profile</h2>

      <h3>
        <Method m="GET" /> <code>/resolve-profile</code>
      </h3>
      <p>
        Used by widgets configured with <code>{"compliance.type: 'auto'"}</code>. Call this once on
        page load to discover which compliance group and locale file the visitor should receive. The
        widget then fetches that file directly — zero subsequent DB queries.
      </p>
      <p>
        Geo resolution uses the <code>geoDataProvider</code> configured in{' '}
        <code>createConsenti()</code>. The returned <code>path</code> is always a path on this
        server (<code>/consenti/api/v1/profiles/...</code>), even when S3 sync is enabled — see the{' '}
        <code>s3Api</code> config docs if you want an external CDN or edge function to serve
        straight from S3 instead.
      </p>
      <table>
        <thead>
          <tr>
            <th>Query param</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>data</code>
            </td>
            <td>Preferred</td>
            <td>
              Base64-encoded JSON with keys <code>timezone</code>, <code>languages</code>,{' '}
              <code>language</code>, <code>locale</code>. Sent automatically by the widget via{' '}
              <code>encodeGeoHints()</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>tz</code>
            </td>
            <td>Legacy</td>
            <td>
              IANA timezone string (e.g. <code>Europe/Paris</code>). Used when <code>data</code> is
              absent.
            </td>
          </tr>
          <tr>
            <td>
              <code>lang</code>
            </td>
            <td>Legacy</td>
            <td>
              Accept-Language value (e.g. <code>fr-FR,fr;q=0.9</code>).
            </td>
          </tr>
          <tr>
            <td>
              <code>locale</code>
            </td>
            <td>Legacy</td>
            <td>
              Preferred BCP 47 locale (e.g. <code>fr-FR</code>).
            </td>
          </tr>
        </tbody>
      </table>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// Widget encodes automatically — equivalent manual call:
const data = btoa(JSON.stringify({
  timezone: 'Europe/Paris',
  languages: ['fr-FR', 'fr'],
  language: 'fr-FR',
  locale: 'fr-FR',
}))
fetch(\`/consenti/api/v1/resolve-profile?data=\${encodeURIComponent(data)}\`)`,
          },
          {
            label: 'Response 200 — found',
            lang: 'json',
            code: `{
  "path": "/consenti/api/v1/profiles/default/opt-in/fr-FR",
  "complianceGroup": "opt-in",
  "locale": "fr-FR",
  "found": true
}`,
          },
          {
            label: 'Response 200 — not found',
            lang: 'json',
            code: `{
  "path": null,
  "complianceGroup": "opt-in",
  "locale": "fr-FR",
  "found": false
}`,
          },
        ]}
      />
      <Callout type="info">
        When <code>found</code> is <code>false</code>, <code>path</code> is <code>null</code> — the
        tenant has no active profile for this compliance group yet. The widget automatically falls
        back to the embedded profile for the resolved <code>complianceGroup</code>, so no 404 is
        shown to the visitor.
      </Callout>

      {/* ── DB-backed profile routes ──────────────────────────────── */}

      <h2>DB-backed profile routes</h2>
      <p>
        These routes query the database on each request. Use them for server-side rendering or when
        you need a fully resolved profile object including the translations map. For high-traffic
        public-facing widget use, prefer the static file serving routes above.
      </p>

      <Callout type="info">
        There is no public list endpoint — clients must know the profile ID (copy it from the admin
        dashboard or pass it from your backend).
      </Callout>

      <p>
        Both endpoints return the same response shape. The only difference is which locale is
        resolved: <code>/profiles/:id</code> uses the profile&apos;s <code>defaultLocale</code>,
        while <code>/profiles/:id/:locale</code> uses the requested locale (falling back to{' '}
        <code>defaultLocale</code> if no translation exists).
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
              {
                f: 'id',
                t: 'string',
                d: 'Profile UUID — changes on every edit, so it alone signals a stale consent (no separate version field)',
              },
              {
                f: 'expiryDays?',
                t: 'number',
                d: 'Days until consent expires and the visitor is asked again. Default: 365',
              },
              {
                f: 'defaultLocale',
                t: 'string',
                d: 'BCP 47 locale used as the translation fallback',
              },
              {
                f: 'currentLocale',
                t: 'string',
                d: 'Locale whose content is present in this response',
              },
              { f: 'locales', t: 'string[]', d: 'All locale keys defined on the profile' },
              {
                f: 'cookies',
                t: 'CookieMap',
                d: 'Parameters managed by this profile, keyed by id',
              },
              { f: 'mainBanner', t: 'MainBanner', d: 'Banner config resolved for currentLocale' },
              {
                f: 'preferenceModal',
                t: 'PreferenceModal',
                d: 'Modal config resolved for currentLocale',
              },
              {
                f: 'gpcBanner?',
                t: 'GpcBanner',
                d: 'GPC-specific banner variant (omitted if not configured)',
              },
              {
                f: 'resolvedComplianceGroup?',
                t: 'ComplianceGroupId',
                d: 'Present only on /profiles/auto/:locale — the geo-resolved compliance group',
              },
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
        Returns the profile resolved in its <code>defaultLocale</code>. <code>currentLocale</code>{' '}
        will equal <code>defaultLocale</code>.
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
  "defaultLocale": "en",
  "currentLocale": "en",
  "locales": ["en", "fr"],
  "expiryDays": 365,
  "cookies": {
    "necessary": {},
    "analytics": { "listenGpc": true }
  },
  "mainBanner": {
    "position": "bottom",
    "heading": "We use cookies",
    "htmlText": "This site uses cookies to improve your experience.",
    "buttons": {
      "accept-all": { "text": "Accept All", "style": "primary", "action": "custom", "cookies": "*" },
      "reject-optional": { "text": "Reject Optional", "style": "secondary", "action": "custom", "cookies": "!" },
      "customize": { "text": "Customize", "style": "secondary", "action": "manage" }
    }
  },
  "preferenceModal": {
    "heading": "Cookie Preferences",
    "showClose": true,
    "buttons": {
      "accept-all": { "text": "Accept All", "style": "primary", "action": "custom", "cookies": "*" },
      "save-preferences": { "text": "Save Preferences", "style": "primary", "action": "submit" },
      "reject-optional": { "text": "Reject Optional", "style": "text", "action": "custom", "cookies": "!" }
    },
    "categories": {
      "necessary": {
        "heading": "Necessary",
        "htmlText": "Required for the site to function.",
        "legalBasis": "mandatory",
        "cookies": ["necessary"]
      },
      "analytics": {
        "heading": "Analytics",
        "htmlText": "Help us understand how visitors use the site.",
        "legalBasis": "consent",
        "cookies": ["analytics"]
      }
    }
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
  "defaultLocale": "en",
  "currentLocale": "fr",
  "locales": ["en", "fr"],
  "expiryDays": 365,
  "cookies": {
    "necessary": {},
    "analytics": { "listenGpc": true }
  },
  "mainBanner": {
    "position": "bottom",
    "heading": "Nous utilisons des cookies",
    "htmlText": "Ce site utilise des cookies pour améliorer votre expérience.",
    "buttons": {
      "accept-all": { "text": "Tout accepter", "style": "primary", "action": "custom", "cookies": "*" },
      "reject-optional": { "text": "Tout refuser", "style": "secondary", "action": "custom", "cookies": "!" },
      "customize": { "text": "Gérer les préférences", "style": "secondary", "action": "manage" }
    }
  },
  "preferenceModal": {
    "heading": "Préférences de cookies",
    "showClose": true,
    "buttons": {
      "accept-all": { "text": "Tout accepter", "style": "primary", "action": "custom", "cookies": "*" },
      "save-preferences": { "text": "Enregistrer", "style": "primary", "action": "submit" },
      "reject-optional": { "text": "Tout refuser", "style": "text", "action": "custom", "cookies": "!" }
    },
    "categories": {
      "necessary": {
        "heading": "Nécessaires",
        "htmlText": "Requis pour le fonctionnement du site.",
        "legalBasis": "mandatory",
        "cookies": ["necessary"]
      },
      "analytics": {
        "heading": "Analytique",
        "htmlText": "Nous aide à comprendre comment les visiteurs utilisent le site.",
        "legalBasis": "consent",
        "cookies": ["analytics"]
      }
    }
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

      <h3>
        <Method m="GET" /> <code>/profiles/auto/:locale</code>{' '}
        <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700 not-prose">
          Legacy
        </span>
      </h3>
      <p>
        Legacy geo-resolution route — returns a fully resolved profile object from the database.
        Prefer <code>GET /resolve-profile</code> (above) for new integrations: it returns a file
        path so the widget fetches the locale JSON directly from disk or CDN, removing all DB
        overhead from the hot path.
      </p>
      <p>
        Geo-resolves the visitor&apos;s compliance group from geo signals, finds the active profile
        tagged to that group, and returns it resolved for <code>:locale</code>. The response
        includes <code>resolvedComplianceGroup</code>. Falls back to the default profile when no
        active profile exists for the resolved group.
      </p>
      <p>
        Requires <code>compliance.type: &apos;auto&apos;</code> in <code>createConsenti()</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Query param</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>tz</code>
            </td>
            <td>
              IANA timezone string (e.g. <code>Europe/Paris</code>). Used when{' '}
              <code>geoDataProvider: &apos;timezone&apos;</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>lang</code>
            </td>
            <td>
              Accept-Language header value (e.g. <code>fr-FR,fr;q=0.9</code>). Used when{' '}
              <code>geoDataProvider: &apos;language&apos;</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeTabs
        tabs={[
          {
            label: 'Request — Europe/Paris',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/auto/en?tz=Europe/Paris HTTP/1.1`,
          },
          {
            label: 'Response 200 — opt-in',
            lang: 'json',
            code: `{
  "id": "my-gdpr-profile",
  "defaultLocale": "en",
  "currentLocale": "en",
  "resolvedComplianceGroup": "opt-in",
  "locales": ["en", "fr", "de"],
  "expiryDays": 365,
  "cookies": {
    "necessary": { "purpose": "necessary" },
    "analytics": { "purpose": "analytics", "listenGpc": true }
  },
  "mainBanner": { "position": "bottom", "heading": "We use cookies", "buttons": {...} },
  "preferenceModal": { "heading": "Cookie Preferences", "buttons": {...}, "categories": {...} }
}`,
          },
          {
            label: 'Request — California',
            lang: 'javascript',
            code: `// GET /consenti/api/v1/profiles/auto/en?tz=America/Los_Angeles HTTP/1.1`,
          },
          {
            label: 'Response 200 — opt-out-strict',
            lang: 'json',
            code: `{
  "id": "my-cpra-profile",
  "defaultLocale": "en",
  "currentLocale": "en",
  "resolvedComplianceGroup": "opt-out-strict",
  "locales": ["en"],
  "expiryDays": 365,
  "cookies": {
    "necessary": { "purpose": "necessary" },
    "analytics": { "purpose": "analytics", "cpraCategory": "sale", "listenGpc": true }
  },
  "mainBanner": { "position": "bottom", "heading": "Your Privacy Choices", "buttons": {...} },
  "gpcBanner": { "heading": "We detected GPC", "buttons": {...} },
  "preferenceModal": { "heading": "Cookie Preferences", "buttons": {...}, "categories": {...} }
}`,
          },
        ]}
      />
      <Callout type="info">
        The 3-step jurisdiction lookup: (1) country + region override (e.g. California → CPRA), (2)
        country base group (e.g. US → opt-out), (3) country default (most strict) when region is
        unknown (US unknown state → opt-out-strict).
      </Callout>

      {/* ── Consent ──────────────────────────────────────────────── */}

      <h2>Consent</h2>
      <p>
        Consent records are keyed by <code>visitorId</code>. The visitor ID is persisted in a cookie
        (<code>consenti_vid</code>) set by the widget after the first submission.
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
  "locale": "en",                // optional — defaults to "en"
  "gpcDetected": false,          // optional — defaults to false
  "source": "banner",            // optional — "banner" | "api" | "import"
  "ageVerified": true,           // optional — set by the widget's age gate, see UI Events
  "parentalConsentToken": "pcon_..." // optional — set when age gate requires parental consent
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile-id",
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
        Checks whether the stored consent record is still valid — i.e. the consent&apos;s{' '}
        <code>profileId</code> still matches the compliance group&apos;s currently active profile
        id, and the record has not expired. The UI widget calls this on page load to decide whether
        to re-show the banner.
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
{ "valid": true, "reasons": [] }

// Consent is stale — the profile has been edited (a new id is active) since consent was given:
{
  "valid": false,
  "reasons": ["profile_changed"],
  "currentProfileId": "prof-d4e5f6",
  "consentProfileId": "prof-a1b2c3"
}

// Other possible reasons (array can contain more than one):
// "consent_expired" — past the profile's expiryDays retention window
// "hmac_invalid" — the stored record's signature doesn't match its contents.
//   Only checked when consentSigningKey is configured AND the record has a signature.`,
          },
        ]}
      />

      <Callout type="tip">
        The widget automatically calls <code>POST /consent</code> after the visitor accepts, then
        calls <code>GET /consent/:visitorId/verify</code> on subsequent page loads to skip the
        banner if consent is still valid.
      </Callout>
    </div>
  )
}
