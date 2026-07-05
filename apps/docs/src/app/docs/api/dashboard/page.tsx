import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function APIDashboardPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Admin Dashboard</h1>
      <p>
        Consenti ships a full admin SPA (Preact + Tailwind CSS) baked directly into the{' '}
        <code>@consenti/api</code> package. No separate deployment or build step is needed —
        it is served from <code>dist/dashboard/</code> inside the package.
      </p>

      <h2>Enabling the dashboard</h2>
      <CodeBlock lang="ts" code={`createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: process.env.CONSENTI_ADMIN_PASSWORD! },
  dashboard: true,   // ← enables the SPA
})`} />
      <p>The dashboard is then available at <code>/consenti/</code> (or your configured <code>basePath</code>).</p>

      <h2>Dashboard sections</h2>
      <table>
        <thead>
          <tr><th>Section</th><th>Description</th><th>Access</th></tr>
        </thead>
        <tbody>
          <tr><td>Dashboard</td><td>Consent overview, timeline chart, country breakdown, GPC stats</td><td>All users</td></tr>
          <tr><td>Profiles</td><td>Create / edit / copy / delete / activate / deactivate consent profiles</td><td>All users</td></tr>
          <tr><td>Profile History</td><td>Version history viewer — compare locale JSON per version</td><td>All users</td></tr>
          <tr><td>Cookie Templates</td><td>Reusable cookie/purpose definitions</td><td>All users</td></tr>
          <tr><td>UI Templates</td><td>Reusable banner + modal layout settings</td><td>All users</td></tr>
          <tr><td>Consents</td><td>Browse, filter, and export consent records; per-visitor history</td><td>All users</td></tr>
          <tr><td>Visitors</td><td>Visitor list with geographic data (IPs are SHA-256 hashed, never raw)</td><td>All users</td></tr>
          <tr><td>Users</td><td>Admin user management with tenant scoping</td><td>All users</td></tr>
          <tr><td>Roles</td><td>RBAC roles and fine-grained permission assignment</td><td>All users</td></tr>
          <tr><td>Sites</td><td>Multi-tenant site management</td><td><strong>Superadmin only</strong></td></tr>
          <tr><td>TCF Vendors</td><td>IAB Global Vendor List (when <code>tcf.enabled: true</code>)</td><td>All users</td></tr>
          <tr><td>Audit Log</td><td>Immutable log of all admin actions</td><td>All users</td></tr>
          <tr><td>Settings / API</td><td>API keys, branding, OpenAPI docs</td><td><strong>Superadmin only</strong></td></tr>
        </tbody>
      </table>

      <Callout type="info">
        The <strong>Sites</strong> and <strong>API/Settings</strong> menu items are hidden for
        non-superadmin users. TCF Vendors is hidden unless <code>tcf.enabled: true</code>.
      </Callout>

      <h2>Auth modes</h2>
      <table>
        <thead>
          <tr><th>Mode</th><th>Config</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>local</code></td>
            <td><code>auth: &#123; mode: &apos;local&apos;, adminEmail, adminPassword &#125;</code></td>
            <td>Built-in email + password. Passwords hashed with scrypt via <code>node:crypto</code>. Brute-force protection built in.</td>
          </tr>
          <tr>
            <td><code>jwt</code></td>
            <td><code>auth: &#123; mode: &apos;jwt&apos;, jwtSecret &#125;</code></td>
            <td>Validate externally issued JWTs (HS256). Your auth service issues tokens; Consenti verifies them.</td>
          </tr>
          <tr>
            <td><code>oidc</code></td>
            <td><code>auth: &#123; mode: &apos;oidc&apos;, oidc: &#123; issuer, clientId, ... &#125; &#125;</code></td>
            <td>OpenID Connect Authorization Code + PKCE. Supports RS256 / ES256 from any OIDC provider (Auth0, Keycloak, Google).</td>
          </tr>
          <tr>
            <td><code>saml</code></td>
            <td><code>auth: &#123; mode: &apos;saml&apos;, saml: &#123; issuer, entryPoint, cert, ... &#125; &#125;</code></td>
            <td>SAML 2.0 SP-initiated SSO. Requires <code>samlify</code> peer dep.</td>
          </tr>
          <tr>
            <td><code>custom</code></td>
            <td><code>auth: &#123; mode: &apos;custom&apos;, validateUser: async (req) =&gt; AdminUser | null &#125;</code></td>
            <td>Bring your own authentication. Consenti still enforces RBAC on the returned user&apos;s roles.</td>
          </tr>
        </tbody>
      </table>

      <h2>Profile creation wizard</h2>
      <p>
        Creating a profile follows a 4-step wizard:
      </p>

      <h3>Step 1 — Profile metadata</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>name</code></td><td>string</td><td>Human-readable profile name</td></tr>
          <tr><td><code>defaultLocale</code></td><td>BCP 47 (searchable select)</td><td>Locale used when visitor locale is unavailable; written as <code>default.json</code></td></tr>
          <tr><td><code>complianceGroup</code></td><td>radio card grid</td><td>Regulation group for geo-routing — selects one of the 8 built-in groups</td></tr>
          <tr><td><code>gpcMode</code></td><td><code>&apos;ignore&apos; | &apos;honor&apos; | &apos;strict&apos;</code></td><td>GPC signal handling. Overrides the compliance group default.</td></tr>
          <tr><td><code>darkMode</code></td><td>boolean</td><td>Enable dark mode in the consent banner</td></tr>
          <tr><td><code>hidePoweredBy</code></td><td>boolean</td><td>Hide "Powered by Consenti" badge</td></tr>
          <tr><td><code>allowReceipt</code></td><td>boolean</td><td>Allow visitors to download a PDF consent receipt</td></tr>
          <tr><td><code>allowedOrigins</code></td><td>string[]</td><td>Allowlisted domains for CORS on this profile&apos;s consent endpoints</td></tr>
          <tr><td><code>complianceConfig</code></td><td>Record&lt;string, string&gt;</td><td>Per-compliance extra config (e.g. DPDPA data fiduciary name). Only shown when the compliance group requires it.</td></tr>
        </tbody>
      </table>

      <h3>Step 2 — Cookie Template</h3>
      <p>
        Select or create a Cookie Template. Clicking <strong>Next</strong> calls{' '}
        <code>POST /admin/profiles/validate</code> with the template&apos;s cookies and the chosen
        compliance group:
      </p>
      <ul>
        <li><strong>Compliance errors</strong> (red): block advancing to Step 3 until resolved</li>
        <li><strong>Compliance warnings</strong> (amber): show an acknowledgment checkbox — must be checked to proceed, but do not block saving</li>
      </ul>

      <h3>Step 3 — UI Template and locale authoring</h3>
      <p>
        Select or create a UI Template. New templates start <strong>blank</strong>; click{' '}
        <strong>Load Defaults</strong> in the amber callout to populate a starter structure.
      </p>
      <ul>
        <li><strong>+ Add locale</strong> opens a searchable BCP 47 locale selector</li>
        <li>Non-default locale tabs show the default locale&apos;s copy as placeholder text in heading, subheading, and category-heading inputs</li>
        <li><strong>Import / Export</strong>: JSON exports all locale tabs as <code>locales.json</code>; CSV exports the current locale tab; Import accepts both formats and auto-creates missing locale tabs</li>
      </ul>

      <h3>Step 4 — Content and readability</h3>
      <p>
        Enter localised copy (heading, body HTML) for the main banner, GPC banner, and preference
        modal categories. Inline advisory warnings appear when:
      </p>
      <ul>
        <li>Heading exceeds 80 characters</li>
        <li>Average sentence length in body exceeds 25 words</li>
        <li>Total word count in body exceeds 150 words</li>
      </ul>
      <p>These are informational only — the profile can still be saved.</p>

      <h2>Profile activation and hot-serve</h2>
      <p>
        Profiles are <strong>inactive</strong> after creation. To serve them via geo-routing:
      </p>
      <ol>
        <li>Click <strong>Activate</strong> in the profile list or call <code>POST /admin/profiles/:id/activate</code></li>
        <li>Consenti copies locale JSON files from <code>{`\${profileId}/\${version}/`}</code> to <code>{`\${complianceGroup}/`}</code></li>
        <li>The static file route serves these files immediately — zero DB on the hot path</li>
      </ol>
      <p>
        Only one profile per compliance group can be active. Activating a new profile automatically
        deactivates the existing one.
      </p>

      <h2>Profile version history</h2>
      <p>
        Every profile save creates an immutable snapshot. The version history page shows:
      </p>
      <ul>
        <li>Left panel: list of all versions with dates</li>
        <li>Right panel: prettified JSON for the selected version; locale switcher dropdown</li>
      </ul>

      <h2>Template save safety</h2>
      <p>
        When saving a Cookie Template or UI Template that is used by one or more profiles, a
        confirmation dialog lists the affected profiles. You must confirm before changes are applied.
      </p>
      <ul>
        <li>Deleting a Cookie Template used by active profiles is <strong>blocked (422)</strong> — deactivate the profiles first</li>
        <li>Removing cookies from a Cookie Template is blocked if any profile&apos;s compliance group requires those cookies</li>
      </ul>

      <h2>Serving behind a reverse proxy</h2>
      <CodeBlock lang="nginx" filename="nginx.conf" code={`location /consenti/ {
    proxy_pass http://localhost:3001/consenti/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`} />
      <Callout type="info">
        When behind a reverse proxy that terminates HTTPS, add the proxy IP to{' '}
        <code>trustedProxies</code> in <code>createConsenti()</code> so that IP hashing and rate
        limiting use the real client IP from <code>X-Forwarded-For</code>.
      </Callout>
    </div>
  )
}
