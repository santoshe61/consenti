import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function APIDashboardPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Admin Dashboard</h1>
      <p>
        Consenti ships a full admin SPA (Preact + Tailwind) baked directly into the <code>@consenti/api</code> package.
        No separate deployment or build step is needed — it's served from within the package's <code>dist/dashboard/</code> directory.
      </p>

      <h2>Enabling the dashboard</h2>
      <CodeBlock lang="ts" code={`createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  dashboard: true,   // ← enables the SPA
})`} />
      <p>The dashboard is then available at <code>/consenti/</code> (or your configured <code>basePath</code>).</p>

      <h2>Dashboard routes</h2>
      <table>
        <thead>
          <tr><th>Path</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>/consenti/</code></td><td>Dashboard home — stats overview</td></tr>
          <tr><td><code>/consenti/profiles</code></td><td>Manage consent profiles</td></tr>
          <tr><td><code>/consenti/profiles/:id/editor</code></td><td>Locale editor for profile i18n strings</td></tr>
          <tr><td><code>/consenti/profiles/:id/preview</code></td><td>Live preview of banner and modal</td></tr>
          <tr><td><code>/consenti/submissions</code></td><td>Consent records viewer (paginated, filterable)</td></tr>
          <tr><td><code>/consenti/users</code></td><td>Admin user management</td></tr>
          <tr><td><code>/consenti/audit</code></td><td>Audit log for admin actions</td></tr>
          <tr><td><code>/consenti/api/docs</code></td><td>Swagger UI for the REST API</td></tr>
        </tbody>
      </table>

      <h2>Auth modes</h2>
      <table>
        <thead>
          <tr><th>Mode</th><th>Config</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>local</code></td>
            <td><code>auth: &#123; mode: 'local', adminEmail, adminPassword &#125;</code></td>
            <td>Local username/password stored in SQLite. Passwords hashed with scrypt.</td>
          </tr>
          <tr>
            <td><code>oauth</code></td>
            <td><code>auth: &#123; mode: 'oauth', provider: 'google', ... &#125;</code></td>
            <td>OAuth 2.0 via Google, GitHub, or any OIDC provider.</td>
          </tr>
          <tr>
            <td><code>saml</code></td>
            <td><code>auth: &#123; mode: 'saml', ... &#125;</code></td>
            <td>SAML 2.0 SSO for enterprise deployments. Requires <code>samlify</code> peer dep.</td>
          </tr>
          <tr>
            <td><code>none</code></td>
            <td><code>auth: &#123; mode: 'none' &#125;</code></td>
            <td>No auth — development only. Never use in production.</td>
          </tr>
        </tbody>
      </table>

      <Callout type="danger">
        <code>auth.mode: 'none'</code> disables all authentication on the admin dashboard and API.
        Only use this locally. Never deploy with auth disabled.
      </Callout>

      <h2>RBAC roles</h2>
      <table>
        <thead>
          <tr><th>Role</th><th>Permissions</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>super_admin</code></td>
            <td>All permissions including creating/deleting admin users and managing all tenants</td>
          </tr>
          <tr>
            <td><code>admin</code></td>
            <td>Manage profiles, view consent records, view audit logs. Cannot manage users.</td>
          </tr>
          <tr>
            <td><code>analyst</code></td>
            <td>Read-only access to consent records and stats. Cannot modify profiles.</td>
          </tr>
          <tr>
            <td><code>compliance_officer</code></td>
            <td>View consent records, process erasure requests, view audit logs. Cannot modify profiles.</td>
          </tr>
        </tbody>
      </table>

      <h2>Sidebar navigation</h2>
      <p>
        The dashboard sidebar supports a collapse/expand toggle. Click the <code>◀</code> button in the
        sidebar header to collapse it to icon-only mode (<code>w-14</code>), freeing up horizontal space
        for wider content. Click <code>▶</code> to expand it back. Hovering any icon while collapsed
        shows the item label as a tooltip via the native <code>title</code> attribute.
      </p>

      <h2>Profile editor</h2>
      <p>
        From the dashboard you can create and edit consent profiles — the JSON configs that define what the
        banner and modal look like, what cookies require consent, and what text is shown in each locale.
      </p>
      <ul>
        <li>Visual locale editor with side-by-side i18n string editing</li>
        <li>Live preview of the banner and modal as you change settings</li>
        <li>Version history — each save increments the version and triggers re-consent for existing visitors</li>
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
        When behind a reverse proxy that terminates HTTPS, set <code>trustProxy: true</code> in
        <code>createConsenti()</code> so that IP hashing uses the real client IP from
        <code>X-Forwarded-For</code>, not the proxy address.
      </Callout>
    </div>
  )
}
