import type { Metadata } from 'next'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Admin API Routes',
  description:
    'Admin API routes at /consenti/admin — every route requires a valid JWT passed as an Authorization: Bearer token.',
  alternates: { canonical: '/docs/api/routes/admin' },
  openGraph: {
    title: 'Admin API Routes',
    description:
      'Admin API routes at /consenti/admin — every route requires a valid JWT passed as an Authorization: Bearer token.',
    url: 'https://consenti.dev/docs/api/routes/admin',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin API Routes',
    description:
      'Admin API routes at /consenti/admin — every route requires a valid JWT passed as an Authorization: Bearer token.',
    images: ['/og-image.jpg'],
  },
}

function Method({ m }: { m: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' }) {
  const colors = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold font-mono ${colors[m]}`}>
      {m}
    </span>
  )
}

const AUTH_HEADER = `// Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...`

export default function AdminRoutesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Admin API Routes</h1>
      <p>
        Base path: <code>/consenti/admin</code> (default — set via <code>basePath</code> in{' '}
        <code>createConsenti()</code>). All routes require a valid JWT passed as{' '}
        <code>Authorization: Bearer &lt;token&gt;</code>.
      </p>

      <Callout type="info">
        Obtain a token via <code>POST /consenti/admin/auth/login</code>. Include it in the{' '}
        <code>Authorization</code> header of every subsequent request.
      </Callout>

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
          <tbody className="divide-y divide-slate-100 text-xs">
            {[
              ['POST', '/auth/login', 'Authenticate — returns a JWT'],
              ['GET', '/auth/me', 'Get current authenticated user'],
              ['POST', '/auth/logout', 'Invalidate session'],
              ['GET', '/profiles', 'List all profiles'],
              [
                'GET',
                '/profiles?summary=1',
                'List profiles as ProfileSummary[] (lightweight, with template names)',
              ],
              [
                'POST',
                '/profiles',
                'Create a profile — 422 on compliance errors; conflict detection on active group',
              ],
              ['GET', '/profiles/:id', 'Get a profile'],
              ['PUT', '/profiles/:id', 'Update a profile — stable id, increments version in place'],
              [
                'DELETE',
                '/profiles/:id',
                'Delete a profile — removes the DB row only; on-disk version snapshots remain (see Archived Profiles)',
              ],
              [
                'POST',
                '/profiles/:id/activate',
                'Activate a profile — writes locale JSONs to compliance group directory',
              ],
              [
                'POST',
                '/profiles/:id/deactivate',
                'Deactivate a profile — removes compliance group locale files',
              ],
              [
                'GET',
                '/profiles/archived',
                'List profile-id directories on disk with no matching DB row (deleted profiles) — id, version count, last-modified',
              ],
              [
                'GET',
                '/profiles/:id/versions',
                'List every saved version of this profile (newest first) — works for archived ids too',
              ],
              [
                'GET',
                '/profiles/:id/versions/:entryId',
                "Read a specific version's locale file — works for archived ids too",
              ],
              [
                'POST',
                '/profiles/validate',
                'Validate cookies + categories against a compliance group (no save)',
              ],
              ['GET', '/compliance-coverage', 'Active profile per compliance group'],
              ['GET', '/consent-templates', 'List consent templates'],
              ['GET', '/consent-templates/:id', 'Get a consent template'],
              ['POST', '/consent-templates', 'Create a consent template'],
              ['PUT', '/consent-templates/:id', 'Update a consent template'],
              [
                'DELETE',
                '/consent-templates/:id',
                'Delete a consent template — 422 if active profiles use it',
              ],
              ['POST', '/consent-templates/:id/copy', 'Duplicate a consent template'],
              ['GET', '/consent-templates/:id/profile-usage', 'List profiles using this template'],
              ['GET', '/ui-templates', 'List UI templates'],
              ['GET', '/ui-templates/:id', 'Get a UI template'],
              ['POST', '/ui-templates', 'Create a UI template'],
              ['PUT', '/ui-templates/:id', 'Update a UI template'],
              ['DELETE', '/ui-templates/:id', 'Delete a UI template'],
              ['POST', '/ui-templates/:id/copy', 'Duplicate a UI template'],
              ['GET', '/ui-templates/:id/profile-usage', 'List profiles using this template'],
              ['GET', '/analytics/opt-in', 'Opt-in rate stats by locale and date'],
              ['GET', '/consents', 'List consent records (paginated)'],
              ['GET', '/consents/:visitorId', 'Get consent record for a visitor'],
              ['GET', '/consents/:visitorId/history', 'Get consent change history for a visitor'],
              ['GET', '/visitors', 'List visitor records (paginated)'],
              ['GET', '/users', 'List admin users'],
              ['POST', '/users', 'Create an admin user'],
              ['PUT', '/users/:id', 'Update an admin user (including allowedTenants)'],
              ['GET', '/roles', 'List roles'],
              ['POST', '/roles', 'Create a role'],
              ['GET', '/roles/:id/permissions', 'Get permissions assigned to a role'],
              ['POST', '/roles/:id/permissions', 'Assign a permission to a role'],
              ['DELETE', '/roles/:id/permissions/:permId', 'Revoke a permission from a role'],
              ['GET', '/permissions', 'List all available permissions'],
              ['GET', '/apikeys', 'List API keys'],
              ['POST', '/apikeys', 'Create an API key'],
              ['DELETE', '/apikeys/:id', 'Revoke an API key'],
              ['POST', '/apikeys/:id/reactivate', 'Re-enable a revoked API key'],
              ['DELETE', '/apikeys/:id/permanent', 'Permanently delete an API key'],
              ['GET', '/settings', 'Get tenant-wide dashboard settings'],
              ['PATCH', '/settings', 'Update tenant-wide dashboard settings'],
              ['GET', '/setup/status', 'Whether the first-run setup wizard is complete'],
              [
                'GET',
                '/setup/config',
                'Resolved server config (secrets redacted) + readiness flags',
              ],
              ['GET', '/setup/compliance-groups', 'The 8 built-in compliance groups with metadata'],
              [
                'POST',
                '/setup/seed-profiles',
                'Seed default profiles for the given compliance groups',
              ],
              ['POST', '/setup/complete', 'Mark the first-run setup wizard complete'],
              ['GET', '/audit', 'Get audit log (paginated)'],
              ['GET', '/stats/overview', 'Consent overview statistics'],
              ['GET', '/stats/timeline', 'Daily consent counts'],
              ['GET', '/stats/categories', 'Per-category acceptance rates'],
              ['GET', '/stats/countries', 'Consents by country'],
              ['GET', '/stats/gpc', 'GPC detection statistics'],
              ['GET', '/export/consents', 'Export consent records (CSV or JSON)'],
              ['GET', '/export/consents/xlsx', 'Export consent records as XLSX'],
              ['GET', '/export/audit', 'Export audit log (CSV or JSON)'],
              ['GET', '/export/translations/:profileId', 'Export all translatable fields as CSV'],
              ['GET', '/tenants', 'List tenants (multi-tenant mode)'],
              ['POST', '/tenants', 'Create a tenant'],
              ['PUT', '/tenants/:id', 'Update a tenant'],
              ['DELETE', '/tenants/:id', 'Delete a tenant'],
              ['GET', '/tcf/vendors', 'List IAB TCF vendors'],
              ['GET', '/tcf/purposes', 'List IAB TCF purposes'],
            ].map(row => {
              const [m, p, d] = row as [string, string, string]
              return (
                <tr key={p + m} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Method m={m as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} />
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-800">{p}</td>
                  <td className="px-3 py-2 text-slate-600">{d}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Auth ─────────────────────────────────────────────────── */}

      <h2>Auth</h2>

      <h3>
        <Method m="POST" /> <code>/auth/login</code>
      </h3>
      <p>
        Authenticates with email and password. Returns a JWT for use in all subsequent admin
        requests.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/auth/login HTTP/1.1
// Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLXV1aWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.sig"
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/auth/me</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/auth/me HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "user-uuid",
  "email": "admin@example.com",
  "name": "Admin",
  "isActive": true,
  "totpEnabled": false,
  "roles": ["admin"],
  "permissions": [
    "profile:view", "profile:create", "profile:update", "profile:delete",
    "consent:view", "user:view", "user:create", "audit:view", "export:run"
  ]
}`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/auth/logout</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/auth/logout HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 200', lang: 'json', code: `{ "success": true }` },
        ]}
      />

      {/* ── Profiles ─────────────────────────────────────────────── */}

      <h2>Profiles</h2>

      <h3>
        <Method m="GET" /> <code>/profiles</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/profiles HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "prof-a1b2c3",
    "name": "Default Profile",
    "version": 1,
    "defaultLocale": "en",
    "tenantId": "default",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-24T10:00:00.000Z",
    "profileJson": {
      "locales": ["en"],
      "cookies": {
        "necessary": {},
        "analytics": { "listenGpc": true }
      },
      "mainBanner": { "heading": "We use cookies", "htmlText": "This site uses cookies to improve your experience.", "buttons": {...} },
      "preferenceModal": {
        "buttons": {...},
        "categories": {
          "necessary": { "heading": "Necessary", "htmlText": "Required.", "legalBasis": "mandatory", "cookies": ["necessary"] },
          "analytics": { "heading": "Analytics", "htmlText": "Usage stats.", "legalBasis": "consent", "cookies": ["analytics"] }
        }
      }
    }
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/profiles</code>
      </h3>
      <p>
        Creates a profile. When the <code>profileJson.complianceGroup</code> field is set, Consenti
        runs server-side compliance validation before saving. Returns <code>422</code> if there are
        blocking errors, or if any locale is missing mandatory content (body text, button labels,
        modal heading, category headings — see{' '}
        <a href="#mandatory-content">Mandatory content validation</a> below); returns{' '}
        <code>201</code> with a <code>warnings</code> array for soft warnings.
      </p>
      <p>
        <code>profileJson.mainBanner</code>/<code>gpcBanner</code>/<code>preferenceModal</code> hold
        the <strong>default locale&apos;s</strong> resolved content only — this is what&apos;s
        stored in the DB row. Every other locale listed in <code>profileJson.locales</code> is
        submitted via a sibling <code>localeContent</code> field (
        <code>{'{ [locale]: { mainBanner, gpcBanner?, preferenceModal } }'}</code>) and is written
        directly to that locale&apos;s on-disk version file — never persisted in the DB row. This
        keeps the row small regardless of how many locales a profile has.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/profiles HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "GDPR Profile",         // required
  "defaultLocale": "en",          // required
  "profileJson": {                // required
    "complianceGroup": "opt-in",  // optional — enables compliance validation + geo-routing
    "isActive": true,             // optional — marks this profile active for the complianceGroup
    "gpcMode": "ignore",          // optional — "ignore" | "honor" | "strict"
    "expiryDays": 365,            // optional — profile-wide consent expiry, default 365
    "enhanceAccessibility": true, // optional — 44px buttons, 3px focus ring, WCAG 2.1 AA
    "showFooterMetadata": true,   // optional — shows Consent ID, Date, Privacy Settings link in banner/modal footer
    "locales": ["en", "fr"],      // every locale this profile has content for
    "cookies": {
      "necessary": {},
      "analytics": { "listenGpc": true }
    },
    "mainBanner": {                // defaultLocale ("en") content only — stored on the row
      "position": "bottom",
      "heading": "We use cookies",
      "htmlText": "This site uses cookies to improve your experience.",
      "buttons": {
        "accept-all": { "text": "Accept All", "style": "primary", "action": "custom", "cookies": "*" }
      }
    },
    "preferenceModal": {
      "heading": "Cookie Preferences",
      "buttons": {
        "save-preferences": { "text": "Save Preferences", "style": "primary", "action": "submit" }
      },
      "categories": {
        "necessary": { "heading": "Necessary", "htmlText": "Required.", "legalBasis": "mandatory", "cookies": ["necessary"] },
        "analytics": { "heading": "Analytics", "htmlText": "Usage stats.", "legalBasis": "consent", "cookies": ["analytics"] }
      }
    }
  },
  "localeContent": {               // every OTHER locale in profileJson.locales — written to disk, never stored in the DB row
    "fr": {
      "mainBanner": {
        "position": "bottom",
        "heading": "Nous utilisons des cookies",
        "htmlText": "Ce site utilise des cookies pour améliorer votre expérience.",
        "buttons": {
          "accept-all": { "text": "Tout accepter", "style": "primary", "action": "custom", "cookies": "*" }
        }
      },
      "preferenceModal": {
        "heading": "Préférences de cookies",
        "buttons": {
          "save-preferences": { "text": "Enregistrer", "style": "primary", "action": "submit" }
        },
        "categories": {
          "necessary": { "heading": "Nécessaires", "htmlText": "Requis.", "legalBasis": "mandatory", "cookies": ["necessary"] },
          "analytics": { "heading": "Analytique", "htmlText": "Statistiques d'utilisation.", "legalBasis": "consent", "cookies": ["analytics"] }
        }
      }
    }
  }
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "profile": {
    "id": "prof-a1b2c3",
    "name": "GDPR Profile",
    "version": 1,
    "defaultLocale": "en",
    "tenantId": "default",
    "createdAt": "2026-06-24T10:00:00.000Z",
    "updatedAt": "2026-06-24T10:00:00.000Z",
    "profileJson": { "locales": ["en", "fr"], "cookies": {...}, "mainBanner": {...}, "preferenceModal": {...} }
  },
  "warnings": []
}`,
          },
          {
            label: 'Response 422 — missing content',
            lang: 'json',
            code: `{
  "error": "Profile content is missing required fields",
  "details": {
    "errors": [
      { "locale": "fr", "section": "mainBanner", "field": "htmlText", "message": "Body text is required" }
    ]
  }
}`,
          },
          {
            label: 'Response 422 — errors',
            lang: 'json',
            code: `{
  "error": "Profile does not meet compliance requirements",
  "errors": [
    {
      "cookieId": "analytics",
      "field": "cpraCategory",
      "message": "Cookie \\"analytics\\" must have a CPRA category assigned.",
      "rule": "cpra-category-required"
    }
  ],
  "warnings": []
}`,
          },
        ]}
      />

      <h3 id="mandatory-content">Mandatory content validation</h3>
      <p>
        Every locale submitted (the default locale on <code>profileJson</code>, plus each entry in{' '}
        <code>localeContent</code>) must have non-blank body text on the main/GPC banner, a
        non-blank label on every button, a non-blank preference-modal heading, and a non-blank
        heading on every category. Banner/GPC heading and the modal&apos;s intro text are the only
        optional fields — the dashboard wizard nudges but never blocks on those. A failing save
        returns <code>422</code> with which locale/section/field is blank (see the response tab
        above) instead of silently accepting a blank banner.
      </p>

      <h3>
        <Method m="GET" /> <code>/profiles/:id</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/profiles/my-profile HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "prof-a1b2c3",
  "name": "Default Profile",
  "version": 1,
  "defaultLocale": "en",
  "tenantId": "default",
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-24T10:00:00.000Z",
  "profileJson": {
    "locales": ["en", "fr"],
    "cookies": {...},
    "mainBanner": {...},
    "preferenceModal": { "categories": {...} }
  }
}`,
          },
        ]}
      />
      <Callout type="info">
        <code>profileJson</code> only ever holds <code>defaultLocale</code>&apos;s (here,{' '}
        <code>en</code>&apos;s) content directly — <code>fr</code>&apos;s content isn&apos;t
        included in this response at all, even though it&apos;s listed in <code>locales</code>. It
        lives only in that locale&apos;s on-disk version file; fetch it with{' '}
        <code>GET /profiles/:id/versions/:entryId?locale=fr</code> (using the current{' '}
        <code>version</code> as <code>:entryId</code>).
      </Callout>

      <h3>
        <Method m="PUT" /> <code>/profiles/:id</code>
      </h3>
      <p>
        All fields are optional — only supplied fields are applied. <code>id</code> is stable — the
        row is mutated in place and <code>version</code> is incremented, so the response&apos;s{' '}
        <code>id</code> always matches the <code>:id</code> in the URL. A new resolved-JSON snapshot
        is written under the incremented <code>version</code> for audit/history purposes. Accepts
        the same sibling <code>localeContent</code> field as <code>POST /profiles</code>; any locale
        already on the profile but not included in this request&apos;s <code>localeContent</code> is
        carried forward unchanged from the previous version, not dropped.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// PUT /consenti/admin/profiles/prof-a1b2c3 HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "Updated Profile Name",   // optional
  "defaultLocale": "fr",            // optional
  "profileJson": { ... }            // optional — replaces entire profileJson
}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "prof-a1b2c3",
  "name": "Updated Profile Name",
  "version": 2,
  "defaultLocale": "fr",
  "updatedAt": "2026-06-24T11:00:00.000Z"
}`,
          },
        ]}
      />
      <Callout type="info">
        When <code>profileJson.complianceGroup</code> is set, the response is instead wrapped as{' '}
        <code>&#123; profile, warnings &#125;</code> — same shape as <code>POST /profiles</code>.
      </Callout>

      <h3>
        <Method m="DELETE" /> <code>/profiles/:id</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// DELETE /consenti/admin/profiles/my-profile HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 200', lang: 'json', code: `{ "success": true }` },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/profiles/:id/copy</code>
      </h3>
      <p>
        Duplicates a profile as a brand new, always-inactive profile — own <code>id</code>,{' '}
        <code>version</code> resets to 1. Optional <code>{`{ name }`}</code> body; defaults to{' '}
        <code>Copy of {`{name}`}</code>. Copying an active profile does not deactivate the original
        or touch its compliance group — only the new copy&apos;s <code>isActive</code> is forced{' '}
        <code>false</code>.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/profiles/prof-a1b2c3/copy HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{ "name": "GDPR Profile (draft)" }   // optional`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "id": "prof-d4e5f6",
  "name": "GDPR Profile (draft)",
  "version": 1,
  "defaultLocale": "en",
  "tenantId": "default",
  "createdAt": "2026-07-18T12:00:00.000Z",
  "updatedAt": "2026-07-18T12:00:00.000Z",
  "profileJson": { "isActive": false, ... }
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/profiles?summary=1</code>
      </h3>
      <p>
        Returns a lightweight <code>ProfileSummary[]</code> — no blob, includes template names. Used
        by the dashboard profile list view. Without <code>?summary=1</code>, the full profile
        including <code>profileJson</code> blob is returned.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/profiles?summary=1 HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "prof-a1b2c3",
    "name": "GDPR Profile",
    "defaultLocale": "en",
    "complianceGroup": "opt-in",
    "customComplianceGroup": null,
    "isActive": true,
    "consentTemplateName": "Standard Consent Template",
    "uiTemplateName": "Default Banner",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T10:00:00.000Z"
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/profiles/:id/activate</code>
      </h3>
      <p>
        Activates a profile for its <code>complianceGroup</code>. Consenti copies locale JSON files
        from <code>{`\${profileId}/\${version}/`}</code> to <code>{`\${complianceGroup}/`}</code> —
        the static hot-serve path. Only one profile per compliance group can be active at a time;
        activating a new one deactivates the previous one automatically.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/profiles/prof-a1b2c3/activate HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 200', lang: 'json', code: `{ "success": true }` },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/profiles/:id/deactivate</code>
      </h3>
      <p>
        Deactivates a profile. Removes <code>{`\${complianceGroup}/`}</code> locale files from disk
        so the profile is no longer served on the hot path. The version snapshot under{' '}
        <code>{`\${profileId}/\${version}/`}</code> is preserved for history/audit.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/profiles/prof-a1b2c3/deactivate HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 200', lang: 'json', code: `{ "success": true }` },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/profiles/archived</code>
      </h3>
      <p>
        Lists profile-id directories on disk with no matching DB row — profiles <code>DELETE</code>{' '}
        removed the row for, but whose version-snapshot tree it never touches. Directory-listing
        only: no file content is read building this list, so it&apos;s cheap even with a large
        history. <code>lastModified</code> is the newest version directory&apos;s mtime.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/profiles/archived HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "id": "prof-a1b2c3", "versionCount": 4, "lastModified": "2026-06-01T00:00:00.000Z" }
]`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/profiles/:id/versions</code>
      </h3>
      <p>
        Returns every version snapshot of this profile on disk, newest first — read straight from
        the version-directory tree, no DB query. <code>version</code> is a plain incrementing
        integer, matching <code>Profile.version</code> at the point that snapshot was written. Works
        for archived ids too — it never actually depended on the DB row existing.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/profiles/prof-a1b2c3/versions HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "version": 3, "createdAt": "2026-07-01T00:00:00.000Z", "locales": ["en", "fr-FR", "de"] },
  { "version": 2, "createdAt": "2026-06-15T00:00:00.000Z", "locales": ["en", "fr-FR"] },
  { "version": 1, "createdAt": "2026-06-01T00:00:00.000Z", "locales": ["en"] }
]`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/profiles/:id/versions/:entryId</code>
      </h3>
      <p>
        Reads the resolved locale JSON for one entry from <code>versions</code> above (
        <code>entryId</code> is that entry&apos;s <code>version</code> number). Accepts an optional{' '}
        <code>?locale=en</code> query param; falls back to <code>default.json</code> when omitted.
        Returns the raw JSON file content — not wrapped in an envelope.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/profiles/prof-a1b2c3/versions/2?locale=fr-FR HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "mainBanner": { "heading": "Nous utilisons des cookies", "buttons": {...} },
  "preferenceModal": { "heading": "Préférences de cookies", "categories": {...}, ... }
}`,
          },
        ]}
      />

      <h3>Profile save conflict detection</h3>
      <p>
        Only one profile per <code>complianceGroup</code> can be active at a time. When creating or
        updating a profile with <code>isActive: true</code> and another active profile already
        exists for the same compliance group, the backend returns <strong>200</strong> with:
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Conflict response (200)',
            lang: 'json',
            code: `{
  "conflict": { "id": "existing-uuid", "name": "GDPR Profile v1" },
  "requiresChoice": true
}`,
          },
          {
            label: 'Re-submit with choice',
            lang: 'json',
            code: `// Re-send the original request body with one of:
{ "choice": "deactivate" }   // deactivate the conflicting profile, activate this one
{ "choice": "inactive" }     // save this profile as inactive (no conflict)`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/profiles/validate</code>
      </h3>
      <p>
        Validates a set of cookies against a compliance group without saving anything. Returns the
        same <code>errors</code> / <code>warnings</code> structure that <code>POST /profiles</code>{' '}
        uses server-side. The dashboard wizard calls this at step 2 for a server-round-trip
        confirmation before allowing the operator to proceed.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/profiles/validate HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "complianceGroup": "opt-out-strict",   // required — ComplianceGroupId
  "cookies": {                            // required — CookieMap from the linked Consent Template
    "necessary": { "purpose": "necessary" },
    "analytics": { "purpose": "analytics", "listenGpc": false }
  },
  "categories": {                         // required — CategoryMap from the linked Consent Template
    "necessary": { "heading": "Necessary", "htmlText": "Required.", "legalBasis": "mandatory", "cookies": ["necessary"] },
    "analytics": { "heading": "Analytics", "htmlText": "Usage stats.", "legalBasis": "consent", "cookies": ["analytics"] }
  }
}`,
          },
          {
            label: 'Response 200 — valid',
            lang: 'json',
            code: `{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "cookieId": "analytics",
      "field": "listenGpc",
      "message": "Cookie \\"analytics\\" does not listen for the GPC signal. Under CPRA, non-mandatory cookies must honor GPC.",
      "suggestion": "Enable \\"Listen for GPC signal\\" on this cookie."
    }
  ]
}`,
          },
          {
            label: 'Response 200 — errors',
            lang: 'json',
            code: `{
  "valid": false,
  "errors": [
    {
      "cookieId": "analytics",
      "field": "cpraCategory",
      "message": "Cookie \\"analytics\\" must have a CPRA category (Sale, Sharing, or Sensitive) assigned.",
      "rule": "cpra-category-required"
    }
  ],
  "warnings": []
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/compliance-coverage</code>
      </h3>
      <p>
        Returns one entry per compliance group showing which profile is currently active for that
        group. Used by the dashboard&apos;s compliance coverage panel to surface groups that have no
        active profile.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/compliance-coverage HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "groups": {
    "opt-in": {
      "label": "Standard Opt-in (GDPR)",
      "compliances": ["gdpr", "eprivacy", "uk-gdpr", "kvkk"],
      "activeProfile": { "id": "my-gdpr-profile", "name": "GDPR Profile" },
      "usingDefault": false,
      "defaultProfileId": "default-profile"
    },
    "opt-out": {
      "label": "Opt-out (US State Laws)",
      "compliances": ["ccpa", "vcdpa", "cpa-co"],
      "activeProfile": { "id": "my-ccpa-profile", "name": "CCPA Profile" },
      "usingDefault": false,
      "defaultProfileId": "default-profile"
    },
    "opt-out-strict": {
      "label": "Opt-out Strict (CPRA / California)",
      "compliances": ["cpra"],
      "activeProfile": null,
      "usingDefault": true,
      "defaultProfileId": "default-profile"
    },
    "opt-in-dpdpa": {
      "label": "Opt-in (India DPDPA)",
      "compliances": ["dpdpa"],
      "activeProfile": null,
      "usingDefault": true,
      "defaultProfileId": "default-profile"
    }
  }
}`,
          },
        ]}
      />

      {/* ── Consent Templates ─────────────────────────────────────── */}

      <h2>Consent Templates</h2>
      <p>
        Reusable parameter definitions plus the categories that own their legal basis, edited
        together. A consent template is attached to a profile in the wizard; the profile inherits
        its <code>cookies</code>/<code>categories</code> for compliance validation and consent
        storage.
      </p>

      <h3>
        <Method m="GET" /> <code>/consent-templates</code> &amp; <code>/consent-templates/:id</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'List response',
            lang: 'json',
            code: `[
  {
    "id": "template-uuid",
    "name": "Standard Consent Template",
    "tenantId": "default",
    "cookies": {
      "necessary": { "purpose": "necessary", "listenGpc": false },
      "analytics": { "purpose": "analytics", "listenGpc": true }
    },
    "categories": {
      "necessary": { "heading": "Necessary", "htmlText": "Required.", "legalBasis": "mandatory", "cookies": ["necessary"] },
      "analytics": { "heading": "Analytics", "htmlText": "Usage stats.", "legalBasis": "consent", "cookies": ["analytics"] }
    },
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T10:00:00.000Z"
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/consent-templates</code>
      </h3>
      <p>
        New templates start <strong>blank</strong> — no prefilled cookies or categories. Use the
        dashboard <strong>Load Defaults</strong> button to populate a starter set, then customise.
      </p>
      <p>
        Every parameter requires a <code>purpose</code> —{' '}
        <code>necessary | functional | preferences | analytics | marketing</code> — and a boolean{' '}
        <code>listenGpc</code>. Legal basis is <strong>not</strong> set per-parameter — every
        parameter must be listed in exactly one category&apos;s <code>cookies</code> array, and that
        category&apos;s <code>legalBasis</code> applies. Requests violating any of this, or leaving
        a parameter in zero or multiple categories, are rejected with <code>400</code>.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/consent-templates HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "E-commerce Consent Template",
  "cookies": {
    "necessary": { "purpose": "necessary", "listenGpc": false },
    "analytics": { "purpose": "analytics", "listenGpc": true },
    "marketing": { "purpose": "marketing", "listenGpc": true, "cpraCategory": "sharing" }
  },
  "categories": {
    "necessary": { "heading": "Necessary", "htmlText": "Required for the site to function.", "legalBasis": "mandatory", "cookies": ["necessary"] },
    "analytics": { "heading": "Analytics", "htmlText": "Usage stats.", "legalBasis": "consent", "cookies": ["analytics"] },
    "marketing": { "heading": "Marketing", "htmlText": "Personalised ads.", "legalBasis": "consent", "cookies": ["marketing"] }
  }
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{ "id": "template-uuid", "name": "E-commerce Consent Template", ... }`,
          },
        ]}
      />

      <h3>Consent Template safety guards</h3>
      <p>
        <strong>Deletion guard:</strong> <code>DELETE /consent-templates/:id</code> returns{' '}
        <code>422</code> when active profiles reference the template. Deactivate those profiles
        first.
      </p>
      <CodeTabs
        tabs={[
          {
            label: '422 — active profiles',
            lang: 'json',
            code: `{
  "error": "Template is in use by active profiles",
  "activeProfiles": [
    { "id": "profile-uuid", "name": "GDPR Profile", "complianceGroup": "opt-in" }
  ]
}`,
          },
        ]}
      />
      <p>
        <strong>Parameter removal guard:</strong> When updating a template and parameters are
        removed, the backend runs compliance validation across all profiles using the template. If
        any profile&apos;s compliance group requires a removed parameter, the save is blocked with{' '}
        <code>422</code>:
      </p>
      <CodeTabs
        tabs={[
          {
            label: '422 — compliance broken',
            lang: 'json',
            code: `{
  "error": "Removing these parameters breaks compliance for affected profiles",
  "blockingProfiles": [
    { "id": "profile-uuid", "name": "GDPR Profile", "complianceGroup": "opt-in" }
  ],
  "removedCookieIds": ["analytics"]
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/consent-templates/:id/profile-usage</code>
      </h3>
      <p>
        Returns all profiles (<code>ProfileSummary[]</code>) that use this template.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "profile-uuid",
    "name": "GDPR Profile",
    "complianceGroup": "opt-in",
    "isActive": true
  }
]`,
          },
        ]}
      />

      {/* ── UI Templates ─────────────────────────────────────────── */}

      <h2>UI Templates</h2>
      <p>
        Reusable banner and modal layout settings. A UI template is attached to a profile in the
        wizard; the profile inherits button arrays, position, and overlay settings.
      </p>
      <p>
        New templates start <strong>blank</strong>. Use the dashboard <strong>Load Defaults</strong>{' '}
        amber callout to populate a sensible starter structure, then customise.
      </p>
      <p>
        The same safety guards as consent templates apply: <code>PUT</code> and <code>DELETE</code>{' '}
        check profile usage and block destructive operations when active profiles would be affected.
        Use <code>GET /ui-templates/:id/profile-usage</code> to preview impact before saving. UI
        templates are visuals only — categories are owned by the Consent Template, not here.
      </p>
      <p>
        Button <code>id</code> is a machine identifier (e.g. <code>&quot;accept-all&quot;</code>),
        not display text — UI templates never carry text. The visitor-facing label for each button
        is authored per-locale on the profile (matched to the template&apos;s <code>buttons</code>{' '}
        array by position) and shown as <code>id (action)</code> in the profile editor so authors
        know which button they&apos;re labeling.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'GET /ui-templates/:id',
            lang: 'json',
            code: `{
  "id": "template-uuid",
  "name": "Default Banner",
  "mainBanner": {
    "position": "bottom",
    "overlayOpacity": 0.4,
    "showClose": false,
    "headingTag": "h2",
    "stackButtonsOnBreakpoint": 576,
    "buttons": {
      "accept-all": { "type": "primary", "action": "custom", "cookies": "*" },
      "reject-optional": { "type": "secondary", "action": "custom", "cookies": "!" },
      "customize": { "type": "secondary", "action": "manage" }
    }
  },
  "preferenceModal": {
    "position": "center",
    "showClose": true,
    "persistent": false,
    "trapFocus": true,
    "buttons": {
      "accept-all": { "type": "primary", "action": "custom", "cookies": "*" },
      "save-preferences": { "type": "primary", "action": "submit" },
      "reject-optional": { "type": "text", "action": "custom", "cookies": "!" }
    }
  }
}`,
          },
        ]}
      />

      {/* ── Analytics ────────────────────────────────────────────── */}

      <h2>Analytics</h2>

      <h3>
        <Method m="GET" /> <code>/analytics/opt-in</code>
      </h3>
      <p>Opt-in rate statistics aggregated by locale and date. All query params are optional.</p>
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
              <code>tenantId</code>
            </td>
            <td>Filter by tenant (default: all).</td>
          </tr>
          <tr>
            <td>
              <code>profileId</code>
            </td>
            <td>Filter by profile ID.</td>
          </tr>
          <tr>
            <td>
              <code>complianceGroup</code>
            </td>
            <td>Filter by compliance group.</td>
          </tr>
          <tr>
            <td>
              <code>from</code>
            </td>
            <td>
              Start date (ISO 8601, e.g. <code>2026-01-01</code>).
            </td>
          </tr>
          <tr>
            <td>
              <code>to</code>
            </td>
            <td>End date (ISO 8601).</td>
          </tr>
          <tr>
            <td>
              <code>locale</code>
            </td>
            <td>Filter by BCP 47 locale.</td>
          </tr>
        </tbody>
      </table>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/analytics/opt-in?from=2026-01-01&to=2026-07-01 HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "total": 12400,
  "granted": 6800,
  "denied": 4100,
  "managed": 1500,
  "grantedPct": 54.8,
  "deniedPct": 33.1,
  "managedPct": 12.1,
  "byLocale": {
    "en": { "total": 8000, "granted": 4400, "denied": 2700, "managed": 900 },
    "fr-FR": { "total": 4400, "granted": 2400, "denied": 1400, "managed": 600 }
  },
  "byDate": [
    { "date": "2026-07-01", "total": 400, "granted": 220, "denied": 130, "managed": 50 }
  ]
}`,
          },
        ]}
      />

      {/* ── Consents ─────────────────────────────────────────────── */}

      <h2>Consents</h2>

      <h3>
        <Method m="GET" /> <code>/consents</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/consents HTTP/1.1
${AUTH_HEADER}

// Query params (all optional):
// ?page=1&limit=50&profileId=my-profile&from=2026-01-01&to=2026-12-31&q=search-term
// q searches across visitorId, profileId, locale, source`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "record-uuid",
    "visitorId": "visitor-uuid",
    "profileId": "my-profile",
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
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/consents/:visitorId</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/consents/visitor-uuid HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "id": "record-uuid",
  "visitorId": "visitor-uuid",
  "profileId": "my-profile",
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
        <Method m="GET" /> <code>/consents/:visitorId/history</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/consents/visitor-uuid/history HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "history-uuid",
    "consentRecordId": "record-uuid",
    "visitorId": "visitor-uuid",
    "oldJson": null,
    "newJson": { "necessary": "granted", "analytics": "denied" },
    "action": "created",
    "createdAt": "2026-06-20T09:00:00.000Z"
  },
  {
    "id": "history-uuid-2",
    "consentRecordId": "record-uuid",
    "visitorId": "visitor-uuid",
    "oldJson": { "necessary": "granted", "analytics": "denied" },
    "newJson": { "necessary": "granted", "analytics": "granted" },
    "action": "updated",
    "createdAt": "2026-06-24T10:00:00.000Z"
  }
]`,
          },
        ]}
      />

      {/* ── Visitors ─────────────────────────────────────────────── */}

      <h2>Visitors</h2>

      <h3>
        <Method m="GET" /> <code>/visitors</code>
      </h3>
      <p>
        IPs are never stored raw — only a SHA-256 hash. The <code>ipHash</code> field is included
        for audit purposes only.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/visitors HTTP/1.1
${AUTH_HEADER}

// Query params (all optional):
// ?page=1&limit=50&from=2026-01-01&to=2026-12-31&q=search-term
// q searches across visitorId, country`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "visitor-uuid",
    "ipHash": "a3f2c1d4...",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
    "tenantId": "default",
    "createdAt": "2026-06-24T10:00:00.000Z"
  }
]`,
          },
        ]}
      />

      <Callout type="info">
        A proof-of-notice endpoint (<code>GET /visitors/:visitorId/notice-shown</code>) exists in
        the codebase but is disabled and not used by the widget — see{' '}
        <a href="/docs/upcoming-features">Upcoming Features</a> for why.
      </Callout>

      {/* ── Users ────────────────────────────────────────────────── */}

      <h2>Users</h2>

      <h3>
        <Method m="GET" /> <code>/users</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/users HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "user-uuid",
    "email": "admin@example.com",
    "name": "Admin",
    "isActive": true,
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/users</code>
      </h3>
      <p>
        The optional <code>allowedTenants</code> array scopes the user to specific tenants — they
        can only view and manage data for those tenants. An empty array (or omitting the field)
        grants access to all tenants. Users with role <code>superadmin</code> always have access to
        all tenants regardless of this field.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/users HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "Jane Smith",                           // required
  "email": "jane@example.com",                    // required
  "password": "secure-password",                  // required
  "roleId": "role-uuid",                          // optional
  "allowedTenants": ["tenant-uuid-1", "tenant-uuid-2"]  // optional — empty = all tenants
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "id": "new-user-uuid",
  "email": "jane@example.com",
  "name": "Jane Smith",
  "isActive": true,
  "allowedTenants": ["tenant-uuid-1", "tenant-uuid-2"],
  "createdAt": "2026-06-24T10:00:00.000Z"
}`,
          },
        ]}
      />

      <Callout type="info">
        Tenant scoping enforcement: list routes (profiles, consents, visitors, audit) silently
        return empty results for out-of-scope tenants. Individual resource routes (
        <code>GET /consents/:visitorId</code>, etc.) return <code>403 Forbidden</code> instead.
      </Callout>

      {/* ── Roles ────────────────────────────────────────────────── */}

      <h2>Roles</h2>

      <h3>
        <Method m="GET" /> <code>/roles</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/roles HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "role-uuid",
    "name": "admin",
    "description": "Full admin access",
    "tenantId": "default"
  },
  {
    "id": "role-uuid-2",
    "name": "viewer",
    "description": "Read-only access",
    "tenantId": "default"
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/roles</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/roles HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "editor",               // required
  "description": "Can edit profiles but not manage users"  // optional
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "id": "role-uuid",
  "name": "editor",
  "description": "Can edit profiles but not manage users",
  "tenantId": "default"
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/roles/:id/permissions</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/roles/role-uuid/permissions HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "id": "perm-uuid", "name": "profile:view" },
  { "id": "perm-uuid-2", "name": "profile:create" },
  { "id": "perm-uuid-3", "name": "profile:update" }
]`,
          },
        ]}
      />

      {/* ── API Keys ─────────────────────────────────────────────── */}

      <h2>API Keys</h2>
      <p>
        API keys allow server-to-server access to the public API without user credentials. The raw
        key is only returned on creation — store it immediately.
      </p>

      <h3>
        <Method m="GET" /> <code>/apikeys</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/apikeys HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "key-uuid",
    "name": "Production Widget",
    "isActive": true,
    "createdBy": "user-uuid",
    "expireBy": "2027-06-01T00:00:00.000Z",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z"
  }
]

// isActive/expireBy are checked lazily on every list load and on every request that
// presents the key — an expired key is flipped to isActive:false the first time either
// happens, no background job required.`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/apikeys</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/apikeys HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "Production Widget",       // required
  "expireBy": "2027-06-01T00:00:00.000Z"  // optional — omit for a key that never expires
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{
  "id": "key-uuid",
  "name": "Production Widget",
  "key": "ck_live_a1b2c3d4e5f6...",
  "createdAt": "2026-06-24T10:00:00.000Z"
}

// The "key" field is only returned once — store it now.`,
          },
        ]}
      />

      <h3>
        <Method m="DELETE" /> <code>/apikeys/:id</code>
      </h3>
      <p>
        Revokes the key (soft — sets it inactive). Reversible with <code>reactivate</code> below.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// DELETE /consenti/admin/apikeys/key-uuid HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 204', lang: 'json', code: `// No body` },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/apikeys/:id/reactivate</code>
      </h3>
      <p>
        Re-enables a previously revoked key — same hash, no new secret to distribute. Whatever
        system already has the old raw secret saved starts working again immediately. If the key had
        an <code>expireBy</code> date that has already passed, it&apos;s cleared so the key
        doesn&apos;t immediately re-expire.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/apikeys/key-uuid/reactivate HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 204', lang: 'json', code: `// No body` },
        ]}
      />

      <h3>
        <Method m="DELETE" /> <code>/apikeys/:id/permanent</code>
      </h3>
      <p>
        Permanently removes the key row. Unlike <code>DELETE /apikeys/:id</code>, this cannot be
        undone.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// DELETE /consenti/admin/apikeys/key-uuid/permanent HTTP/1.1
${AUTH_HEADER}`,
          },
          { label: 'Response 204', lang: 'json', code: `// No body` },
        ]}
      />

      {/* ── Settings ─────────────────────────────────────────────── */}

      <h2>Settings</h2>
      <p>
        Tenant-wide dashboard settings — the Public and Admin API origin allowlists shown on the API
        Config page (split into two panels, one per API).
      </p>
      <ul>
        <li>
          <code>allowedOrigins</code> is the <em>fallback</em>{' '}
          <code>POST /consenti/api/v1/consent</code>&apos;s origin check uses when the specific
          profile being submitted to doesn&apos;t set its own{' '}
          <code>profileJson.allowedOrigins</code> (profile-level always takes precedence when
          present). The public API has no auth token, so this is its only access gate.
        </li>
        <li>
          <code>adminAllowedOrigins</code> is an additional CORS-layer check on top of Bearer-token
          auth for browser-originated <code>/consenti/admin/*</code> requests (server-to-server
          callers without an <code>Origin</code> header are unaffected). Unauthenticated static
          assets (<code>widget.js</code>/<code>widget.css</code>) are exempt.{' '}
          <strong>Be careful</strong>: include the dashboard&apos;s own origin, or you&apos;ll lock
          yourself out of the dashboard along with everyone else.
        </li>
      </ul>
      <p>
        Both lists accept full origins (<code>https://example.com</code>) or a wildcard subdomain
        pattern (<code>*.example.com</code>). Empty/unset on either means no restriction.
      </p>

      <h3>
        <Method m="GET" /> <code>/settings</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/settings HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{ "allowedOrigins": ["https://example.com"], "adminAllowedOrigins": ["https://dashboard.example.com"] }`,
          },
        ]}
      />

      <h3>
        <Method m="PATCH" /> <code>/settings</code>
      </h3>
      <p>Partial update — only send fields being changed.</p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// PATCH /consenti/admin/settings HTTP/1.1
${AUTH_HEADER}
Content-Type: application/json

{ "allowedOrigins": ["https://example.com", "https://foo.example.com"] }`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{ "allowedOrigins": ["https://example.com", "https://foo.example.com"] }`,
          },
        ]}
      />

      {/* ── Setup Wizard ─────────────────────────────────────────── */}

      <h2>Setup Wizard</h2>
      <p>
        Backs the dashboard&apos;s one-time first-run wizard (<code>#/setup</code>) — a 4-step
        welcome / resolved-config / default-profiles / confirmation flow shown once, the first time
        any admin logs in, then gated shut by <code>tenant_settings.setup_completed</code> (per
        tenant in multi-tenant mode). Never reset from the dashboard once complete — there is no
        &quot;run it again&quot; entry point. All routes require <code>settings:update</code>, same
        as Settings above.
      </p>

      <h3>
        <Method m="GET" /> <code>/setup/status</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/setup/status HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{ "completed": false }`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/setup/config</code>
      </h3>
      <p>
        The same merged <code>DEFAULT_CONFIG</code> + user config <code>createConsenti</code>{' '}
        computes at boot, with <code>auth.adminPassword</code>, <code>auth.jwtSecret</code>,{' '}
        <code>consentSigningKey</code>, storage credentials, and OIDC/SAML secrets replaced with a
        redaction marker.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/setup/config HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "config": {
    "basePath": "/consenti",
    "storage": { "driver": "json", "path": "./consenti-data" },
    "auth": { "mode": "local", "adminEmail": "admin@example.com", "adminPassword": "••••••••" }
  },
  "usingJsonStorage": true,
  "usingDefaultCredentials": false
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/setup/compliance-groups</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/setup/compliance-groups HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "opt-in",
    "label": "Standard Opt-in (GDPR)",
    "description": "GDPR / ePrivacy style: prior consent required before non-essential cookies...",
    "compliances": ["gdpr", "eprivacy", "uk-gdpr", "..."],
    "defaultGpc": "ignore",
    "allowsTcf": true,
    "requiresCpraCategory": false,
    "requiresDpdpaDisclosure": false
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/setup/seed-profiles</code>
      </h3>
      <p>
        Idempotent — skips any group that already has an active profile. <code>groups</code> must be
        a subset of the 8 built-in compliance group ids; a 400 is returned otherwise.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/setup/seed-profiles HTTP/1.1
${AUTH_HEADER}
Content-Type: application/json

{ "groups": ["opt-in", "opt-out", "notice-only"] }`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{ "seeded": ["opt-in", "opt-out", "notice-only"] }`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/setup/complete</code>
      </h3>
      <p>Called on both wizard finish and skip.</p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/setup/complete HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{ "allowedOrigins": [], "adminAllowedOrigins": [], "setupCompleted": true }`,
          },
        ]}
      />

      {/* ── Audit ────────────────────────────────────────────────── */}

      <h2>Audit Log</h2>

      <h3>
        <Method m="GET" /> <code>/audit</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/audit HTTP/1.1
${AUTH_HEADER}

// Query params (all optional):
// ?page=1&limit=50
// &action=profile.created
// &resourceType=profile
// &from=2026-01-01&to=2026-12-31
// &q=search-term (searches action, resourceType, resourceId, userId)`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": "log-uuid",
    "userId": "user-uuid",
    "tenantId": "default",
    "action": "profile.created",
    "resourceType": "profile",
    "resourceId": "profile-uuid",
    "newData": { "id": "profile-uuid", "name": "Default Profile", "version": 1 },
    "createdAt": "2026-06-24T10:00:00.000Z"
  }
]`,
          },
        ]}
      />

      {/* ── Stats ────────────────────────────────────────────────── */}

      <h2>Stats</h2>

      <h3>
        <Method m="GET" /> <code>/stats/overview</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/stats/overview HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `{
  "totalConsents": 1423,
  "totalVisitors": 1102,
  "gpcDetectedCount": 89
}`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/stats/timeline</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/stats/timeline HTTP/1.1
${AUTH_HEADER}

// ?days=30   (default: 30)`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "date": "2026-06-01", "count": 45 },
  { "date": "2026-06-02", "count": 52 },
  { "date": "2026-06-03", "count": 38 }
]`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/stats/categories</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/stats/categories HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "category": "analytics", "granted": 980, "denied": 443 },
  { "category": "marketing", "granted": 612, "denied": 811 }
]`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/stats/countries</code> &amp; <code>/stats/gpc</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/stats/countries HTTP/1.1
${AUTH_HEADER}

// GET /consenti/admin/stats/gpc HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response — countries',
            lang: 'json',
            code: `[
  { "country": "US", "count": 540 },
  { "country": "DE", "count": 312 },
  { "country": "FR", "count": 198 }
]`,
          },
        ]}
      />

      {/* ── Export ───────────────────────────────────────────────── */}

      <h2>Export</h2>

      <h3>
        <Method m="GET" /> <code>/export/consents</code>
      </h3>
      <p>
        Streams all consent records. Use <code>format=json</code> for JSON or omit for CSV
        (default). The XLSX endpoint (<code>/export/consents/xlsx</code>) requires the optional{' '}
        <code>xlsx</code> peer dependency.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/export/consents HTTP/1.1
${AUTH_HEADER}

// Query params (all optional):
// ?format=csv           — "csv" (default) | "json"
// &profileId=my-profile
// &from=2026-01-01
// &to=2026-12-31`,
          },
          {
            label: 'Response — CSV',
            lang: 'text',
            code: `// Content-Type: text/csv
// Content-Disposition: attachment; filename="consents.csv"

id,visitor_id,profile_id,locale,consent_json,gpc_detected,source,created_at,updated_at
record-uuid,visitor-uuid,prof-a1b2c3,en,"{""necessary"":""granted""}",0,banner,2026-06-24T10:00:00.000Z,2026-06-24T10:00:00.000Z`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/export/audit</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/export/audit HTTP/1.1
${AUTH_HEADER}

// ?format=csv&from=2026-01-01&to=2026-12-31`,
          },
          {
            label: 'Response — CSV',
            lang: 'text',
            code: `// Content-Type: text/csv
// Content-Disposition: attachment; filename="audit.csv"

id,user_id,action,resource_type,resource_id,created_at
log-uuid,user-uuid,profile.created,profile,profile-uuid,2026-06-24T10:00:00.000Z`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/export/translations/:profileId</code>
      </h3>
      <p>
        Exports all translatable string fields for every locale defined on the profile as a CSV file
        — one row per locale. Useful for bulk-editing translations in a spreadsheet and re-importing
        them.
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/export/translations/my-profile HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response — CSV',
            lang: 'text',
            code: `// Content-Type: text/csv
// Content-Disposition: attachment; filename="translations-my-profile.csv"

locale,bannerTitle,bannerDescription,acceptAllLabel,rejectAllLabel,customizeLabel
en,We use cookies,This site uses cookies to improve your experience.,Accept All,Reject Optional,Customize
fr,Nous utilisons des cookies,Ce site utilise des cookies pour améliorer votre expérience.,Tout accepter,Tout refuser,Gérer les préférences`,
          },
        ]}
      />

      {/* ── Tenants ──────────────────────────────────────────────── */}

      <h2>Tenants (Multi-tenant)</h2>
      <Callout type="info">
        Tenant management is only active when <code>multiTenant.enabled: true</code> is set in{' '}
        <code>createConsenti()</code>. In single-tenant mode these routes still exist but operate on
        the implicit <code>&quot;default&quot;</code> tenant.
      </Callout>

      <h3>
        <Method m="GET" /> <code>/tenants</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/tenants HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "id": "default", "name": "My Site", "slug": "my-site" }
]`,
          },
        ]}
      />

      <h3>
        <Method m="POST" /> <code>/tenants</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// POST /consenti/admin/tenants HTTP/1.1
${AUTH_HEADER}
// Content-Type: application/json

{
  "name": "Partner Site",  // required
  "slug": "partner-site"   // required — used in host-based tenant resolution
}`,
          },
          {
            label: 'Response 201',
            lang: 'json',
            code: `{ "id": "tenant-uuid", "name": "Partner Site", "slug": "partner-site" }`,
          },
        ]}
      />

      {/* ── TCF ──────────────────────────────────────────────────── */}

      <h2>IAB TCF</h2>
      <Callout type="info">
        TCF routes are only active when <code>tcf.enabled: true</code> is set in{' '}
        <code>createConsenti()</code>.
      </Callout>

      <h3>
        <Method m="GET" /> <code>/tcf/vendors</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/tcf/vendors HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  {
    "id": 755,
    "name": "Google Advertising Products",
    "purposes": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
]`,
          },
        ]}
      />

      <h3>
        <Method m="GET" /> <code>/tcf/purposes</code>
      </h3>
      <CodeTabs
        tabs={[
          {
            label: 'Request',
            lang: 'javascript',
            code: `// GET /consenti/admin/tcf/purposes HTTP/1.1
${AUTH_HEADER}`,
          },
          {
            label: 'Response 200',
            lang: 'json',
            code: `[
  { "id": 1, "name": "Store and/or access information on a device" },
  { "id": 2, "name": "Select basic ads" },
  { "id": 3, "name": "Create a personalised ads profile" }
]`,
          },
        ]}
      />
    </div>
  )
}
