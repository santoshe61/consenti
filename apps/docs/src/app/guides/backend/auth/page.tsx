import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Auth Modes — Backend Guide — Consenti',
  description:
    'Configure local password auth for dev, JWT for API consumers, or OIDC/SAML for enterprise SSO.',
  alternates: { canonical: '/guides/backend/auth' },
  openGraph: {
    title: 'Auth Modes — Backend Guide — Consenti',
    description:
      'Configure local password auth for dev, JWT for API consumers, or OIDC/SAML for enterprise SSO.',
    url: 'https://consenti.dev/guides/backend/auth',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auth Modes — Backend Guide — Consenti',
    description:
      'Configure local password auth for dev, JWT for API consumers, or OIDC/SAML for enterprise SSO.',
    images: ['/og-image.jpg'],
  },
}

export default function BackendAuthGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Auth Modes</h1>
      <p className="lead">
        Consenti&apos;s admin dashboard and API support four authentication modes. Local password
        auth works out of the box for development. For production you&apos;ll want to configure a
        proper secret, and for enterprise deployments you can delegate auth to your existing
        identity provider via OIDC or SAML.
      </p>

      <h2>Mode overview</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Mode
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Best for
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Requires
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
            {[
              ['local', 'Development, small teams', 'Email + password in config'],
              ['jwt', 'API-first, programmatic access', 'A stable jwtSecret env var'],
              ['oidc', 'Auth0, Keycloak, Google Workspace', 'OIDC provider config'],
              ['saml', 'Okta, Azure AD, Ping', 'SAML IdP config + cert'],
              ['custom', 'Any other identity system', 'A validateUser function'],
            ].map(([mode, best, req], i) => (
              <tr
                key={mode}
                className={
                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800'
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">
                  {mode}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{best}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{req}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Local (default)</h2>
      <p>
        Consenti stores a scrypt-hashed password in the database. The admin logs in at{' '}
        <code>/consenti/admin/auth/login</code>, receives a JWT, and uses it as a Bearer token for
        all subsequent admin API calls.
      </p>

      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
    // jwtSecret is auto-generated if omitted — sessions expire on restart
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET,
  },
})`}
      />

      <Callout type="warning">
        Always set <code>jwtSecret</code> (or the <code>CONSENTI_ADMIN_JWT_SECRET</code> env var) in
        production. Without it, Consenti generates a random secret on start — all admin sessions are
        invalidated on every restart, which is fine for dev but unacceptable in production.
      </Callout>

      <h2>How to obtain and use a JWT</h2>

      <CodeBlock
        lang="bash"
        code={`# 1. Log in
curl -X POST https://your-domain.com/consenti/admin/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{ "email": "admin@example.com", "password": "your-password" }'
# → { "token": "eyJhbGci..." }

# 2. Use the token on admin routes
curl https://your-domain.com/consenti/admin/profiles \\
  -H 'Authorization: Bearer eyJhbGci...'`}
      />

      <h2>OIDC (Auth0, Keycloak, Google)</h2>
      <p>
        OIDC mode redirects admin users to your identity provider for authentication. After a
        successful login, the IdP sends a code that Consenti exchanges for user info. Consenti maps
        IdP claims to admin roles using <code>claimsMapping</code>.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'Auth0',
            lang: 'typescript',
            code: `createConsenti({
  auth: {
    mode: 'oidc',
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,
    oidc: {
      issuer: 'https://your-tenant.auth0.com',
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      redirectUri: 'https://your-domain.com/consenti/admin/auth/oidc/callback',
      claimsMapping: {
        email: 'email',
        roles: 'consenti_roles',  // custom claim in your Auth0 token
      },
    },
  },
})`,
          },
          {
            label: 'Keycloak',
            lang: 'typescript',
            code: `createConsenti({
  auth: {
    mode: 'oidc',
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,
    oidc: {
      issuer: 'https://keycloak.example.com/realms/my-realm',
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      redirectUri: 'https://your-domain.com/consenti/admin/auth/oidc/callback',
      claimsMapping: {
        email: 'email',
        roles: 'resource_access.consenti.roles',
      },
    },
  },
})`,
          },
        ]}
      />

      <h2>SAML (Okta, Azure AD)</h2>

      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  auth: {
    mode: 'saml',
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,
    saml: {
      issuer: 'https://idp.example.com',
      entryPoint: 'https://idp.example.com/sso/saml',
      cert: process.env.SAML_IDP_CERT!,  // IdP signing cert (PEM, no headers)
      callbackUrl: 'https://your-domain.com/consenti/admin/auth/saml/callback',
    },
  },
})`}
      />

      <h2>Custom auth</h2>
      <p>
        If your identity system doesn&apos;t fit OIDC or SAML, pass a <code>validateUser</code>{' '}
        function. It receives the raw request and must return an <code>AdminUser</code> object or{' '}
        <code>null</code>:
      </p>

      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  auth: {
    mode: 'custom',
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,
    validateUser: async (req) => {
      const token = req.headers.get('Authorization')?.replace('Bearer ', '')
      if (!token) return null
      const user = await myAuthSystem.verifyToken(token)
      return user ? { email: user.email, role: user.role } : null
    },
  },
})`}
      />

      <RelatedDocs
        items={[
          {
            href: '/docs/api/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'Full auth option reference — local, jwt, oidc, saml, and custom',
          },
          {
            href: '/docs/api/routes/admin/',
            label: 'Admin Routes',
            desc: 'RBAC roles, permissions, and every protected endpoint',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'How do I rotate the JWT secret in production?',
            answer: (
              <p className="m-0">
                Update the <code>CONSENTI_ADMIN_JWT_SECRET</code> environment variable and restart
                the server. All existing sessions are immediately invalidated — admin users must log
                in again. If you need zero-downtime rotation, generate a new secret, run two server
                instances briefly (old secret + new secret), then retire the old one.
              </p>
            ),
          },
          {
            question: 'Can I use Auth0 with Consenti?',
            answer: (
              <p className="m-0">
                Yes — use OIDC mode with Auth0 as the provider. Set the issuer to your Auth0 tenant
                URL (<code>https://your-tenant.auth0.com</code>), configure the client ID and secret
                from your Auth0 application, and set up a custom claim in Auth0 for{' '}
                <code>consenti_roles</code> that maps to the roles you want Consenti to assign.
              </p>
            ),
          },
          {
            question: 'What happens if the OIDC provider is down?',
            answer: (
              <p className="m-0">
                Admin users with active sessions (valid JWTs) can continue to access the dashboard
                until their token expires. New logins will fail with a 503 error while the OIDC
                provider is unreachable. The public consent API (<code>/consenti/api/v1/*</code>) is
                unaffected — it has no auth dependency.
              </p>
            ),
          },
          {
            question: 'Can multiple admin users have different permission levels?',
            answer: (
              <p className="m-0">
                Yes. Consenti has a full RBAC system — create roles, assign granular permissions
                (e.g. <code>profile:read</code>, <code>profile:write</code>,{' '}
                <code>user:update</code>), and assign roles to admin users. Users with{' '}
                <code>role: &apos;superadmin&apos;</code> have unrestricted access. Tenant-scoped
                admins can be restricted to specific tenants via <code>allowedTenants</code>. Manage
                this from the admin dashboard under Roles and Users.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
