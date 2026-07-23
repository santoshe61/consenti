import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'API — Advanced Configuration',
  description:
    'createConsenti(config) accepts a single configuration object — every field is optional, and an empty object still gives you a running server.',
  alternates: { canonical: 'https://consenti.dev/docs/api/advanced-configuration' },
  openGraph: {
    title: 'API — Advanced Configuration',
    description:
      'createConsenti(config) accepts a single configuration object — every field is optional, and an empty object still gives you a running server.',
    url: 'https://consenti.dev/docs/api/advanced-configuration',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API — Advanced Configuration',
    description:
      'createConsenti(config) accepts a single configuration object — every field is optional, and an empty object still gives you a running server.',
    images: ['/og-image.jpg'],
  },
}

export default function APIAdvancedConfigurationPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Advanced Configuration</h1>
      <p>
        <code>createConsenti(config)</code> accepts a single configuration object. Every field is
        optional — calling it with an empty object is valid and gives you a running server
        immediately. New here? Start with the{' '}
        <a href="/docs/api/configuration/">Configuration quick start</a> instead — this page is the
        complete reference, every field with its default value.
      </p>

      <h2>Full configuration reference</h2>
      <p>Every available option shown with its default value.</p>

      <CodeBlock
        lang="ts"
        filename="Full config example"
        code={`import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  // Optional but recommended
  storage: {
    driver: 'json',            // not recommended for production
    path: './consenti-data',   // directory path — Consenti creates db/, profiles/, logs/ inside
  },
  auth: {
    mode: 'local',
    adminEmail: process.env.CONSENTI_ADMIN_EMAIL ?? 'user@consenti.dev',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD ?? 'Consenti@123',
    jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET ?? 'random-jwt-secret',
  },

  // Optional
  basePath: '/consenti',       // URL prefix for all routes
  dashboard: true,             // serve admin SPA at basePath

  rateLimit: {
    windowMs: 60_000,          // 1-minute window
    maxRequests: 60,           // requests per window per IP
  },

  compliance: {
    type: 'auto',                 // 'auto' = geo-resolve per visitor | ComplianceGroupId = fixed group
    geoDataProvider: 'default',   // 'default' | 'hosted-geoip-lite' | 'geoip' | 'maxmind' | CountryResolverFn
  },

  // S3 sync for profile locale JSON files (optional)
  s3Api: {
    enabled: false,
    region: 'us-east-1',
    bucketName: 'consenti-profiles',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    // sessionToken: process.env.AWS_SESSION_TOKEN,  // for temporary credentials
  },

  // CDN / cache invalidation hook (optional)
  handleCache: (paths, version, isPurge) => {
    // paths: locale file paths written or removed
    // isPurge: true = files removed (deactivate/delete); false = files written (create/activate)
  },

  tcf: {
    enabled: false,
    cmpId: 0,
    cmpVersion: 1,
  },

  ageGate: {
    enabled: false,
    minimumAge: 13,
    requireParentalConsent: false,
  },

  dataRetention: {
    purgeAfterDays: 365,       // delete consent records older than this
  },

  multiTenant: {
    enabled: false,
  },

  maxBodySize: 1_048_576,      // 1 MB request body limit
  trustedProxies: [],          // IPs / CIDRs of reverse proxies (nginx, Cloudflare…)

  branding: {
    appName: 'My CMP',         // dashboard header, login page, browser tab
    appLogoPath: './logo.svg', // local file or https:// URL
    hidePoweredBy: false,      // true = hide "Powered by Consenti" badge
  },

  plugins: [],
})`}
      />

      {/* ── storage ───────────────────────────────────────────────────────── */}
      <h2 id="storage">storage</h2>
      <p>
        Controls which database backend Consenti uses. The <code>driver</code> field selects the
        engine; the remaining fields depend on which driver you choose.
      </p>

      <h3>storage.path is a directory</h3>
      <p>
        <code>storage.path</code> is a <strong>directory path</strong>, not a file path. Consenti
        creates the following layout inside it automatically:
      </p>
      <CodeBlock
        lang="text"
        code={`\${storage.path}/
  db/
    consenti-data.json     ← JSON adapter
    consenti.db            ← SQLite adapters
  profiles/
    \${tenantId}/
      \${profileId}/
        1/                 ← version 1 (immutable once written)
          en.json
          fr-FR.json
          default.json     ← copy of defaultLocale content
        2/                 ← version 2 on next edit
      \${complianceGroup}/ → symlink to the active profile's version dir (hot-serve path)`}
      />
      <Callout type="info">
        Backward compat: if <code>storage.path</code> has a file extension (<code>.json</code>,{' '}
        <code>.db</code>), the parent directory is used and a deprecation warning is logged.
      </Callout>
      <Callout type="info">
        <code>{`\${complianceGroup}/`}</code> is a directory symlink pointing at whichever version
        directory is currently active, not a copy — activating a profile repoints it atomically (one
        filesystem rename), so there's never a moment where it's empty or a mix of two versions. On
        Windows this is created as a directory <strong>junction</strong> (no admin rights or
        Developer Mode required), which requires an NTFS volume and works only when{' '}
        <code>storage.path</code> and its containing drive are on the same volume — both are true
        for any normal local install.
      </Callout>

      <h3>Default driver — json</h3>
      <p>
        When no <code>storage</code> config is provided, Consenti uses the built-in JSON file
        adapter. It requires zero installation — only <code>node:fs</code> and{' '}
        <code>node:crypto</code>, both Node.js built-ins. Data is kept in memory and written to disk
        atomically after every mutation (temp-file + rename, same guarantee as <em>steno</em>).
      </p>
      <CodeBlock
        lang="ts"
        filename="JSON driver"
        code={`storage: { driver: 'json', path: './consenti-data' } // path is a directory`}
      />
      <Callout type="warning">
        The <code>json</code> driver loads the entire dataset into memory and is single-process
        only. It is designed for development, prototyping, and low-traffic single-instance
        deployments. <strong>Use a SQLite or server driver in production.</strong>
      </Callout>

      <h3>SQLite drivers</h3>
      <p>
        Three SQLite drivers are available. All create the same schema; choose based on your Node.js
        version and whether you can compile native addons.
      </p>
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Requires</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>node:sqlite</code>
            </td>
            <td>Node 22.5+</td>
            <td>Built-in, zero compilation. Recommended for Node 22.5+.</td>
          </tr>
          <tr>
            <td>
              <code>better-sqlite3</code> / <code>sqlite</code>
            </td>
            <td>Node 20+, native addon</td>
            <td>
              Fastest option. Requires a prebuilt binary or build toolchain. <code>sqlite</code> is
              an alias.
            </td>
          </tr>
          <tr>
            <td>
              <code>node-sqlite3-wasm</code>
            </td>
            <td>Node 20+</td>
            <td>
              WASM bundle, no compilation. Use when <code>node:sqlite</code> is unavailable and
              native addons are blocked.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>node:sqlite</code> is built into Node 22.5+ and requires no installation. The other
        two drivers are optional peer dependencies — install whichever one you need:
      </p>
      <CodeBlock
        lang="bash"
        filename="Install SQLite peer dep"
        code={`# Node 20+ native addon (fastest; needs build toolchain or prebuilt binary)
npm install better-sqlite3

# Node 20+ WASM fallback (no compilation required)
npm install node-sqlite3-wasm`}
      />
      <CodeBlock
        lang="ts"
        filename="SQLite config examples"
        code={`// Node 22.5+ — built-in, no install needed
storage: { driver: 'node:sqlite', path: './consenti.db' }

// Node 20+ with native addon
storage: { driver: 'better-sqlite3', path: './consenti.db' }

// Node 20+ WASM fallback
storage: { driver: 'node-sqlite3-wasm', path: './consenti.db' }`}
      />

      <h3>Server drivers</h3>
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Connection field</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>postgresql</code>
            </td>
            <td>
              <code>uri</code>
            </td>
            <td>
              PostgreSQL 13+. Connection pool via <code>pool</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>mysql</code>
            </td>
            <td>
              <code>uri</code>
            </td>
            <td>
              MySQL 8+ / MariaDB 10.6+. Connection pool via <code>pool</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>mongodb</code>
            </td>
            <td>
              <code>uri</code>
            </td>
            <td>
              MongoDB 6+. Optional <code>database</code> override.
            </td>
          </tr>
        </tbody>
      </table>
      <p>Each server driver is an optional peer dependency — install the one you need:</p>
      <CodeBlock
        lang="bash"
        filename="Install server driver peer dep"
        code={`npm install pg         # PostgreSQL
npm install mysql2     # MySQL / MariaDB
npm install mongodb    # MongoDB`}
      />
      <CodeBlock
        lang="ts"
        filename="Server driver config examples"
        code={`// PostgreSQL
storage: { driver: 'postgresql', uri: process.env.CONSENTI_DATABASE_URL }

// MySQL
storage: { driver: 'mysql', uri: process.env.CONSENTI_DATABASE_URL }

// MongoDB
storage: { driver: 'mongodb', uri: process.env.CONSENTI_DATABASE_URL, database: 'consenti' }`}
      />

      <h3>storage field reference</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>driver</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'json'</code> (when <code>storage</code> omitted)
            </td>
            <td>
              Required within the <code>storage</code> object. Selects the storage engine (see
              tables above).
            </td>
          </tr>
          <tr>
            <td>
              <code>path</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'./consenti-data'</code>
            </td>
            <td>
              <strong>Directory path</strong> for local drivers (<code>json</code>, SQLite).
              Consenti creates <code>db/</code>, <code>profiles/</code>, and <code>logs/</code>{' '}
              subdirectories inside. Relative paths resolve from <code>process.cwd()</code>. Must
              not be inside the package installation directory.
            </td>
          </tr>
          <tr>
            <td>
              <code>uri</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>—</td>
            <td>Server drivers only. Full connection string including credentials.</td>
          </tr>
          <tr>
            <td>
              <code>database</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              name in <code>uri</code>
            </td>
            <td>MongoDB only. Database name override.</td>
          </tr>
          <tr>
            <td>
              <code>host</code> / <code>port</code>
            </td>
            <td>
              <code>string / number</code>
            </td>
            <td>—</td>
            <td>
              Alternative to <code>uri</code> for server drivers.
            </td>
          </tr>
          <tr>
            <td>
              <code>user</code> / <code>password</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>—</td>
            <td>
              Credentials when not embedded in <code>uri</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>database</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>—</td>
            <td>
              Database name for PostgreSQL / MySQL when not in <code>uri</code>.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── auth ─────────────────────────────────────────────────────────── */}
      <h2>auth</h2>
      <p>
        The <code>auth</code> object controls how the admin dashboard authenticates its users. Pick
        one <code>mode</code> and supply the fields that mode requires.
      </p>

      <p>
        When <code>auth</code> is omitted entirely, Consenti defaults to <code>mode: 'local'</code>{' '}
        and reads credentials from environment variables:
      </p>
      <table>
        <thead>
          <tr>
            <th>Env var</th>
            <th>Default fallback</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>CONSENTI_ADMIN_EMAIL</code>
            </td>
            <td>
              <code>user@consenti.dev</code>
            </td>
            <td>
              Bootstrap super-admin email when no <code>auth.adminEmail</code> is set.
            </td>
          </tr>
          <tr>
            <td>
              <code>CONSENTI_ADMIN_PASSWORD</code>
            </td>
            <td>
              <code>Consenti@123</code>
            </td>
            <td>
              Bootstrap super-admin password when no <code>auth.adminPassword</code> is set.
            </td>
          </tr>
          <tr>
            <td>
              <code>CONSENTI_ADMIN_JWT_SECRET</code>
            </td>
            <td>random per restart</td>
            <td>
              JWT signing secret. Takes precedence over <code>auth.jwtSecret</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <Callout type="warning">
        A random <code>CONSENTI_ADMIN_JWT_SECRET</code> means all sessions are invalidated on
        restart. Always set a stable secret in production.
      </Callout>

      <h3>Shared options (all modes)</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>mode</code>
            </td>
            <td>
              <code>'local' | 'jwt' | 'oidc' | 'saml' | 'custom'</code>
            </td>
            <td>
              <code>'local'</code>
            </td>
            <td>Authentication strategy for the admin dashboard.</td>
          </tr>
          <tr>
            <td>
              <code>jwtSecret</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>random on start</td>
            <td>
              HMAC-SHA256 secret used to sign session JWTs. Omit in dev; set a stable value in
              production or sessions expire on restart.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>mode: 'local'</h3>
      <p>
        Built-in email + password login. On first boot, Consenti creates a super-admin account using{' '}
        <code>adminEmail</code> / <code>adminPassword</code>. The password is hashed with scrypt (
        <code>node:crypto</code>) and never stored in plain text. Subsequent logins issue a signed
        JWT stored in an <code>HttpOnly</code> cookie.
      </p>
      <p>
        Brute-force protection is built in: 5 failed attempts within 15 minutes lock the account for
        the remainder of that window.
      </p>
      <CodeBlock
        lang="ts"
        filename="local auth"
        code={`auth: {
  mode: 'local',
  adminEmail: 'user@consenti.dev',
  adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!, // min 12 chars; 16+ recommended
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,         // stable secret for production
}`}
      />
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Required</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>adminEmail</code>
            </td>
            <td>yes</td>
            <td>
              <code>env.CONSENTI_ADMIN_EMAIL</code> → <code>'user@consenti.dev'</code>
            </td>
            <td>Email address for the bootstrapped super-admin user.</td>
          </tr>
          <tr>
            <td>
              <code>adminPassword</code>
            </td>
            <td>yes</td>
            <td>
              <code>env.CONSENTI_ADMIN_PASSWORD</code> → <code>'Consenti@123'</code>
            </td>
            <td>
              Password for the bootstrapped super-admin user. Must be ≥ 12 characters; ≥ 16
              recommended. Hashed with scrypt on first boot; ignored on subsequent starts.
            </td>
          </tr>
        </tbody>
      </table>
      <Callout type="info">
        The bootstrap user is only created when the database has zero admin users. Adding more users
        via the dashboard after first boot does not require restarting the server.
      </Callout>

      <h3>mode: 'jwt'</h3>
      <p>
        Validate JWTs issued by an external system (e.g. your own auth service). Consenti verifies
        the token signature with <code>jwtSecret</code> and extracts <code>sub</code>,{' '}
        <code>email</code>, <code>roles</code>, and <code>tenantId</code>
        from the payload.
      </p>
      <CodeBlock
        lang="ts"
        filename="jwt auth"
        code={`auth: {
  mode: 'jwt',
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!, // must match the secret used to sign your tokens
}`}
      />
      <p>Your auth service must issue tokens with at least these claims:</p>
      <CodeBlock
        lang="json"
        filename="expected JWT payload"
        code={`{
  "sub": "user-id",
  "email": "admin@example.com",
  "roles": ["super_admin"],
  "tenantId": "default"
}`}
      />
      <Callout type="warning">
        Only HMAC-SHA256 (<code>alg: "HS256"</code>) tokens are supported in this mode. Tokens
        signed with RS256 / ES256 require <code>mode: 'oidc'</code>.
      </Callout>

      <h3>mode: 'oidc'</h3>
      <p>
        OpenID Connect Authorization Code flow with PKCE. Consenti auto-discovers endpoints from the
        issuer&apos;s <code>/.well-known/openid-configuration</code> and verifies the ID token
        signature using the provider&apos;s JWKS. Supports RS256, RS384, RS512, ES256, ES384, and
        ES512.
      </p>
      <CodeBlock
        lang="ts"
        filename="oidc auth"
        code={`auth: {
  mode: 'oidc',
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!, // signs the session cookie after OIDC login
  oidc: {
    issuer: 'https://accounts.google.com',  // or any OIDC-compliant provider
    clientId: process.env.OIDC_CLIENT_ID!,
    clientSecret: process.env.OIDC_CLIENT_SECRET!,
    redirectUri: 'https://yourapp.com/consenti/auth/oidc/callback',
    claimsMapping: {
      email: 'email',           // default; override if your IdP uses a different claim
      roles: 'consenti_roles',  // default; the claim that carries Consenti role names
    },
  },
}`}
      />
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Required</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>oidc.issuer</code>
            </td>
            <td>yes</td>
            <td>—</td>
            <td>
              OIDC provider base URL. Must expose <code>/.well-known/openid-configuration</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>oidc.clientId</code>
            </td>
            <td>yes</td>
            <td>—</td>
            <td>OAuth 2.0 client ID registered with the provider.</td>
          </tr>
          <tr>
            <td>
              <code>oidc.clientSecret</code>
            </td>
            <td>yes</td>
            <td>—</td>
            <td>OAuth 2.0 client secret.</td>
          </tr>
          <tr>
            <td>
              <code>oidc.redirectUri</code>
            </td>
            <td>yes</td>
            <td>—</td>
            <td>
              Callback URL registered with the provider. Must be:{' '}
              <code>{'{basePath}'}/auth/oidc/callback</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>oidc.claimsMapping.email</code>
            </td>
            <td>no</td>
            <td>
              <code>"email"</code>
            </td>
            <td>JWT claim that holds the user&apos;s email.</td>
          </tr>
          <tr>
            <td>
              <code>oidc.claimsMapping.roles</code>
            </td>
            <td>no</td>
            <td>
              <code>"consenti_roles"</code>
            </td>
            <td>JWT claim that holds an array of Consenti role names.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="info">
        The PKCE <code>state</code> / <code>verifier</code> pairs are held in memory. For
        multi-instance deployments, replace the in-memory store with a shared cache (Redis, etc.) by
        extending the auth handler.
      </Callout>

      <h3>mode: 'saml'</h3>
      <p>
        SAML 2.0 SP-initiated SSO. Consenti acts as the Service Provider; your Identity Provider
        handles authentication. Assertion validation is delegated to the <code>samlify</code> peer
        dependency, which you must install separately.
      </p>
      <CodeBlock lang="bash" filename="install peer dependency" code={`npm install samlify`} />
      <CodeBlock
        lang="ts"
        filename="saml auth"
        code={`auth: {
  mode: 'saml',
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,
  saml: {
    issuer: 'https://idp.example.com',
    entryPoint: 'https://idp.example.com/sso/saml',  // IdP SSO URL
    cert: process.env.IDP_CERT!,                      // IdP signing certificate (PEM, without headers)
    callbackUrl: 'https://yourapp.com/consenti/auth/saml/callback',
  },
}`}
      />
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>saml.issuer</code>
            </td>
            <td>yes</td>
            <td>IdP entity ID / issuer string.</td>
          </tr>
          <tr>
            <td>
              <code>saml.entryPoint</code>
            </td>
            <td>yes</td>
            <td>IdP SSO endpoint URL (HTTP-Redirect binding).</td>
          </tr>
          <tr>
            <td>
              <code>saml.cert</code>
            </td>
            <td>yes</td>
            <td>
              IdP X.509 signing certificate in PEM format (without the{' '}
              <code>-----BEGIN CERTIFICATE-----</code> headers).
            </td>
          </tr>
          <tr>
            <td>
              <code>saml.callbackUrl</code>
            </td>
            <td>yes</td>
            <td>
              Your ACS (Assertion Consumer Service) URL. Must be:{' '}
              <code>{'{basePath}'}/auth/saml/callback</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Consenti exposes an SP metadata endpoint at <code>{'{basePath}'}/auth/saml/metadata</code>.
        Register this URL with your IdP or download the XML to configure the SP manually.
      </p>
      <p>
        The SAML assertion must contain a <code>NameID</code> in email format and an optional{' '}
        <code>roles</code> attribute holding an array of Consenti role names.
      </p>

      <h3>mode: 'custom'</h3>
      <p>
        Bring your own authentication logic. Supply a <code>validateUser</code> async function that
        receives the raw <code>Request</code> object and returns an <code>AdminUser</code>
        (or <code>null</code> if the request is unauthenticated). Consenti calls this function on
        every protected admin route.
      </p>
      <CodeBlock
        lang="ts"
        filename="custom auth"
        code={`import type { AdminUser } from '@consenti/api'

auth: {
  mode: 'custom',
  validateUser: async (req: Request): Promise<AdminUser | null> => {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return null

    // call your own auth service, validate a session cookie, etc.
    const user = await myAuthService.verifyToken(token)
    if (!user) return null

    return {
      id: user.id,
      tenantId: 'default',
      name: user.name,
      email: user.email,
      passwordHash: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
}`}
      />
      <Callout type="info">
        In <code>custom</code> mode you own the entire authentication step. Consenti still enforces
        RBAC on the returned user&apos;s roles — the custom handler only decides
        <em>who</em> the user is, not what they are allowed to do.
      </Callout>

      <h3>TOTP / Two-factor authentication</h3>
      <p>
        TOTP (RFC 6238) is available as an optional second factor in <code>local</code> mode. It is
        implemented entirely with <code>node:crypto</code> — no external dependency.
      </p>
      <CodeBlock
        lang="ts"
        filename="TOTP helpers (server-side)"
        code={`import {
  generateTotpSecret,
  totpQrUrl,
  verifyTotp,
} from '@consenti/api'

// 1. Generate and persist a secret per user
const secret = generateTotpSecret() // base32 string

// 2. Show the QR code to the user during setup
const otpauthUrl = totpQrUrl(secret, 'admin@example.com', 'MyApp')
// → otpauth://totp/MyApp:admin%40example.com?secret=...

// 3. Verify a submitted 6-digit code (window = ±1 time-step)
const ok = verifyTotp(secret, submittedCode)
`}
      />
      <Callout type="info">
        Each TOTP token is single-use: <code>verifyTotp</code> rejects a token that has already been
        accepted, preventing replay attacks within the same 30-second window.
      </Callout>

      {/* ── basePath ─────────────────────────────────────────────────────── */}
      <h2>basePath</h2>
      <p>
        URL prefix for all Consenti routes. Defaults to <code>/consenti</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>basePath</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'/consenti'</code>
            </td>
            <td>All public API, admin API, and dashboard routes are mounted under this prefix.</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="basePath examples"
        code={`// Default — routes at /consenti/api/v1/...
basePath: '/consenti'

// Custom prefix
basePath: '/cmp'
// → public API:  /cmp/api/v1/consent
// → admin API:   /cmp/admin/...
// → dashboard:   /cmp  (SPA)
// → OpenAPI UI:  /cmp/api/docs`}
      />

      {/* ── dashboard ────────────────────────────────────────────────────── */}
      <h2>dashboard</h2>
      <p>
        Controls whether Consenti serves the built-in Preact admin SPA. Accepts a boolean or a
        config object.
      </p>
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>true</code>
            </td>
            <td>
              Serve the dashboard at <code>{'{basePath}'}</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>false</code> / omitted
            </td>
            <td>Dashboard files are not served; admin API routes remain active.</td>
          </tr>
          <tr>
            <td>
              <code>{"{ enabled: true, path: '/admin' }"}</code>
            </td>
            <td>
              Serve at a custom sub-path instead of <code>basePath</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="dashboard examples"
        code={`// Simplest — serve at /consenti
dashboard: true

// Disable (headless / API-only mode)
dashboard: false

// Serve at a custom path
dashboard: { enabled: true, path: '/admin' }`}
      />
      <Callout type="info">
        The dashboard SPA is a static bundle bundled into the package. No separate build step is
        needed — it is served directly from the <code>@consenti/api</code> package directory.
      </Callout>

      {/* ── rateLimit ────────────────────────────────────────────────────── */}
      <h2>rateLimit</h2>
      <p>
        In-memory sliding-window rate limiter applied to public API routes (consent reads / writes).
        Admin routes use a separate, fixed-window limiter (10 requests / 15 min) that cannot be
        configured.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>enabled</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>true</code>
            </td>
            <td>
              Set to <code>false</code> to disable rate limiting entirely (e.g. behind your own
              proxy that already rate-limits).
            </td>
          </tr>
          <tr>
            <td>
              <code>windowMs</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>60000</code>
            </td>
            <td>Rolling window duration in milliseconds.</td>
          </tr>
          <tr>
            <td>
              <code>maxRequests</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>60</code>
            </td>
            <td>
              Maximum requests per IP per window. Requests over the limit receive{' '}
              <code>429 Too Many Requests</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="rateLimit examples"
        code={`// Tighter limit for high-traffic sites
rateLimit: {
  windowMs: 60_000,    // 1-minute window
  maxRequests: 30,     // 30 req/min per IP
}

// Disable entirely (you handle rate limiting upstream)
rateLimit: { enabled: false }`}
      />
      <Callout type="info">
        Rate-limit counters live in process memory. For multi-instance deployments, disable the
        built-in limiter and implement a shared counter (Redis, etc.) at your load balancer or API
        gateway layer.
      </Callout>

      {/* ── compliance ───────────────────────────────────────────────────── */}
      <h2>compliance</h2>
      <p>
        Controls which cookie consent model is applied to visitors. The recommended approach is
        automatic geo-routing (<code>type: &apos;auto&apos;</code>) — Consenti resolves the
        visitor&apos;s jurisdiction from geo signals and selects the correct compliance group.
      </p>

      <h3>Compliance groups</h3>
      <p>
        All behaviour (opt-in vs opt-out, GPC handling, LI validity) is determined by the
        visitor&apos;s <strong>compliance group</strong>. Eight groups are built in:
      </p>
      <table>
        <thead>
          <tr>
            <th>Group ID</th>
            <th>Model</th>
            <th>Key regulations</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>opt-in</code>
            </td>
            <td>Opt-in (GDPR)</td>
            <td>GDPR, UK-GDPR, nFADP, KVKK, PDPA-TH, Middle East laws</td>
          </tr>
          <tr>
            <td>
              <code>opt-out</code>
            </td>
            <td>Opt-out (US state laws)</td>
            <td>CCPA, VCDPA, CPA-CO, CTDPA, UCPA, 15 other US state laws</td>
          </tr>
          <tr>
            <td>
              <code>opt-out-strict</code>
            </td>
            <td>Opt-out strict (CPRA)</td>
            <td>CPRA / California — GPC mandatory, sale/sharing categories</td>
          </tr>
          <tr>
            <td>
              <code>opt-in-dpdpa</code>
            </td>
            <td>Opt-in (India)</td>
            <td>DPDPA — no Legitimate Interest, data fiduciary disclosure</td>
          </tr>
          <tr>
            <td>
              <code>opt-in-china</code>
            </td>
            <td>Opt-in (China)</td>
            <td>PIPL, DSL, CSL — strict opt-in, no LI</td>
          </tr>
          <tr>
            <td>
              <code>opt-in-brazil</code>
            </td>
            <td>Opt-in (Brazil)</td>
            <td>LGPD — opt-in with LI allowed under impact assessment</td>
          </tr>
          <tr>
            <td>
              <code>general-privacy-consent</code>
            </td>
            <td>General consent</td>
            <td>PIPEDA, POPIA, APPI, PDPA-SG/MY, 40+ others</td>
          </tr>
          <tr>
            <td>
              <code>notice-only</code>
            </td>
            <td>Notice only</td>
            <td>Jurisdictions with notice requirements but no consent mandate</td>
          </tr>
        </tbody>
      </table>

      <h3>compliance field reference</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>type</code>
            </td>
            <td>
              <code>&apos;auto&apos; | ComplianceGroupId</code>
            </td>
            <td>
              <code>&apos;auto&apos;</code>
            </td>
            <td>
              <code>&apos;auto&apos;</code> geo-resolves per visitor; a fixed{' '}
              <code>ComplianceGroupId</code> applies one group to every visitor globally.
            </td>
          </tr>
          <tr>
            <td>
              <code>geoDataProvider</code>
            </td>
            <td>
              <code>
                &apos;default&apos; | &apos;hosted-geoip-lite&apos; | &apos;geoip&apos; |
                &apos;maxmind&apos; | CountryResolverFn
              </code>
            </td>
            <td>
              <code>&apos;default&apos;</code>
            </td>
            <td>
              Source used to resolve the visitor&apos;s country. <code>&apos;default&apos;</code> —
              timezone + Accept-Language heuristic, zero deps, least accurate.{' '}
              <code>&apos;hosted-geoip-lite&apos;</code> — calls <code>ipinfo.io</code> via{' '}
              <code>node:https</code>, no install, requires outbound internet.{' '}
              <code>&apos;geoip&apos;</code> — local lookup via optional <code>geoip-lite</code>{' '}
              peer dep. <code>&apos;maxmind&apos;</code> — official MaxMind SDK, most accurate,
              requires <code>.mmdb</code> file. Pass a <code>CountryResolverFn</code> to use any
              custom source — must return{' '}
              <code>
                {'{ country: string | null, region: string | null, locale: string | null }'}
              </code>
              .
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        GPC handling (<code>ignore</code> / <code>honor</code> / <code>strict</code>) is a
        per-profile setting configured in the dashboard profile wizard (<code>gpcMode</code>) — not
        a global compliance config option. The compliance group provides a default GPC behaviour;
        the profile can override it.
      </Callout>

      <CodeBlock
        lang="ts"
        filename="compliance examples"
        code={`// Zero-dep geo routing (timezone + Accept-Language heuristic)
compliance: {
  type: 'auto',
  geoDataProvider: 'default',
}

// IP-based — no install, calls ipinfo.io (requires outbound internet)
compliance: {
  type: 'auto',
  geoDataProvider: 'hosted-geoip-lite',
}

// IP-based — local lookup via geoip-lite (npm install geoip-lite)
compliance: {
  type: 'auto',
  geoDataProvider: 'geoip',
}

// Fixed group — GDPR-only product serving only EU visitors
compliance: {
  type: 'opt-in',
}

// Custom geo resolver — integrate your own GeoIP SaaS
compliance: {
  type: 'auto',
  geoDataProvider: async ({ ip, timezone, language }) => {
    const res = await fetch(\`https://api.mygeoip.com/\${ip}\`)
    const data = await res.json()
    return { country: data.country_code, region: data.region, locale: data.locale ?? null }
  },
}`}
      />

      <Callout type="info">
        The embedded compliance map covers 195+ countries and territories with 8 compliance groups
        and is fixed — there is no config option to supply your own map today. See the{' '}
        <a href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</a> for the
        full country list, and <code>customComplianceGroup</code> (documented on that page) for
        routing a profile outside the 8 built-in groups.
      </Callout>

      {/* ── s3Api ────────────────────────────────────────────────────────── */}
      <h2>s3Api</h2>
      <p>
        When enabled, Consenti mirrors every locale JSON file to S3 in addition to writing it
        locally. Two kinds of object get written:
      </p>
      <ul>
        <li>
          <code>{`profiles/\${tenantId}/\${profileId}/\${version}/\${locale}.json`}</code> — the
          resolved content for one version snapshot, written whenever that version is saved (mirrors
          the local <code>profiles/{`{tenantId}/{profileId}/{version}/`}</code> directory).
        </li>
        <li>
          <code>{`profiles/\${tenantId}/\${complianceGroup}/pointer.json`}</code> — a tiny{' '}
          <code>{`{ profileId, version }`}</code> object, written on activate and removed on
          deactivate. S3 has no directory-symlink equivalent to the local hot-serve swap, so this
          pointer plays the same role: it names which version is currently live for a compliance
          group without duplicating the locale content a second time.
        </li>
      </ul>
      <Callout type="info">
        Consenti&apos;s own <code>/resolve-profile</code> route does <strong>not</strong> read from
        S3 or resolve this pointer for you — it only checks the local <code>profilesDir</code>. If
        you&apos;re fronting S3 with a CDN or edge function and want it to serve directly from S3
        (bypassing the Node process on the hot path), read <code>pointer.json</code> for the
        compliance group there and fetch the versioned key it names — that&apos;s the wireable
        contract this config produces.
      </Callout>
      <p>
        S3 signing is implemented with <code>node:crypto</code> and <code>fetch</code> — no AWS SDK
        dependency.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>enabled</code>
            </td>
            <td>yes</td>
            <td>
              Set to <code>true</code> to activate S3 sync.
            </td>
          </tr>
          <tr>
            <td>
              <code>region</code>
            </td>
            <td>yes</td>
            <td>
              AWS region, e.g. <code>&apos;us-east-1&apos;</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>bucketName</code>
            </td>
            <td>yes</td>
            <td>
              S3 bucket name. Must allow <code>PutObject</code> on <code>profiles/*</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>accessKeyId</code>
            </td>
            <td>yes</td>
            <td>AWS access key ID.</td>
          </tr>
          <tr>
            <td>
              <code>secretAccessKey</code>
            </td>
            <td>yes</td>
            <td>AWS secret access key.</td>
          </tr>
          <tr>
            <td>
              <code>sessionToken</code>
            </td>
            <td>no</td>
            <td>AWS session token. Required only for temporary credentials (STS assume-role).</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="s3Api example"
        code={`s3Api: {
  enabled: true,
  region: 'us-east-1',
  bucketName: 'my-cmp-profiles',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
}`}
      />

      {/* ── handleCache ──────────────────────────────────────────────────── */}
      <h2>handleCache</h2>
      <p>
        A callback invoked whenever Consenti writes or removes locale JSON files on disk. Use it to
        integrate with a CDN, nginx proxy cache, or any reverse proxy that caches the hot-serve
        profile files.
      </p>
      <p>
        This is the config-based alternative to listening on the <code>cache:warm</code> and{' '}
        <code>cache:purge</code> EventBus events — use whichever fits your integration style.
      </p>
      <table>
        <thead>
          <tr>
            <th>Argument</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>paths</code>
            </td>
            <td>
              <code>string[]</code>
            </td>
            <td>Absolute file paths written or removed in this operation.</td>
          </tr>
          <tr>
            <td>
              <code>version</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>Current profile version at the time of the operation.</td>
          </tr>
          <tr>
            <td>
              <code>isPurge</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>true</code> — files were removed (deactivate / delete / update);{' '}
              <code>false</code> — files were written (create / activate).
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="handleCache example"
        code={`handleCache: (paths, version, isPurge) => {
  if (isPurge) {
    // Purge these paths from your CDN / nginx proxy cache
    for (const p of paths) {
      cdnClient.purge(p)
    }
  } else {
    // Warm the cache at these paths
    for (const p of paths) {
      cdnClient.warm(p)
    }
  }
}`}
      />

      {/* ── tcf ──────────────────────────────────────────────────────────── */}
      <h2>tcf</h2>
      <p>
        IAB Transparency & Consent Framework v2.2 integration. When enabled, Consenti fetches the
        Global Vendor List and stores TC strings on consent records. <code>cmpId</code>/
        <code>cmpVersion</code> here must match the widget's own <code>compliance.tcf</code> config
        — the client-side <code>window.__tcfapi</code> stub lives in <code>@consenti/ui</code>, not
        here; see the &quot;TCF v2.2 Implementation Guide&quot;.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>enabled</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code> (omit <code>tcf</code> to disable)
            </td>
            <td>Enable TCF mode. Starts the GVL refresh background job on boot.</td>
          </tr>
          <tr>
            <td>
              <code>cmpId</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>—</td>
            <td>
              Your IAB-registered CMP ID. Required when <code>enabled: true</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>cmpVersion</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>—</td>
            <td>
              Your CMP software version number. Required when <code>enabled: true</code>. Included
              in TC strings.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="tcf example"
        code={`tcf: {
  enabled: true,
  cmpId: 42,        // your IAB CMP ID
  cmpVersion: 1,
}`}
      />
      <Callout type="warning">
        TCF mode requires an IAB-registered CMP ID. Do not use a placeholder CMP ID in production —
        the GVL and downstream DSPs validate it.
      </Callout>

      {/* ── ageGate ──────────────────────────────────────────────────────── */}
      <h2>ageGate</h2>
      <p>
        This block only needs to exist so the <code>POST /consent</code> endpoint accepts
        <code>ageVerified</code>/<code>parentalConsentToken</code> off the request body and stores
        them — it does not itself validate or reject anything. The actual age-confirmation prompt,
        and the decision to deny-all when the visitor is under age, both happen widget-side; see
        <code>compliance.ageGate</code> in the &quot;Age Gate&quot; section of the{' '}
        <code>@consenti/ui</code> README, which needs the same shape configured there too.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>enabled</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>Enable age gating.</td>
          </tr>
          <tr>
            <td>
              <code>minimumAge</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>13</code>
            </td>
            <td>
              Minimum age required to record consent. Common values: 13 (COPPA), 16 (GDPR Article 8
              default).
            </td>
          </tr>
          <tr>
            <td>
              <code>requireParentalConsent</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              When <code>true</code>, the widget also fires{' '}
              <code>consenti:parentalConsentRequired</code> with a token on decline, instead of just
              denying all.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="ageGate examples"
        code={`// COPPA — block users under 13
ageGate: {
  enabled: true,
  minimumAge: 13,
}

// GDPR Article 8 — require parental consent for users 13–15
ageGate: {
  enabled: true,
  minimumAge: 16,
  requireParentalConsent: true,
}`}
      />

      {/* ── dataRetention ────────────────────────────────────────────────── */}
      <h2>dataRetention</h2>
      <p>
        Automatic GDPR data minimisation. When configured, Consenti runs a nightly background job
        that hard-deletes consent records older than <code>purgeAfterDays</code>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>purgeAfterDays</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>— (omit to disable)</td>
            <td>
              Delete consent records older than this many days. The purge runs once at startup and
              then every 24 hours.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="dataRetention example"
        code={`// Keep consent records for 1 year, then purge automatically
dataRetention: {
  purgeAfterDays: 365,
}`}
      />
      <Callout type="info">
        Audit log entries (<code>audit_logs</code>) are never purged — they are append-only by
        design. Only consent records are affected by this setting.
      </Callout>

      {/* ── multiTenant ──────────────────────────────────────────────────── */}
      <h2>multiTenant</h2>
      <p>
        When enabled, Consenti resolves the tenant from the request and scopes all data operations
        to that tenant. The tenant identifier is extracted from the <code>X-Tenant-ID</code> header
        or the <code>tenantId</code> query parameter.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>enabled</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Enable multi-tenant mode. All requests without a valid tenant ID fall back to{' '}
              <code>"default"</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="multiTenant example"
        code={`multiTenant: { enabled: true }

// Clients must then pass:
// X-Tenant-ID: acme-corp
// or: GET /consenti/api/v1/consent?tenantId=acme-corp`}
      />

      {/* ── maxBodySize ──────────────────────────────────────────────────── */}
      <h2>maxBodySize</h2>
      <p>
        Maximum allowed request body size in bytes. Requests exceeding this limit receive a{' '}
        <code>413 Payload Too Large</code> response before any parsing occurs.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>maxBodySize</code>
            </td>
            <td>
              <code>number</code>
            </td>
            <td>
              <code>1048576</code> (1 MB)
            </td>
            <td>Body size limit in bytes.</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="maxBodySize example"
        code={`maxBodySize: 512_000   // 512 KB`}
      />

      {/* ── trustedProxies ───────────────────────────────────────────────── */}
      <h2>trustedProxies</h2>
      <p>
        List of IP addresses or CIDR ranges for reverse proxies that sit in front of Consenti
        (nginx, Cloudflare, AWS ALB, etc.). When set, Consenti reads the real client IP from the{' '}
        <code>X-Forwarded-For</code> header instead of the TCP connection address. This ensures rate
        limiting and IP hashing target the actual visitor, not the proxy.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>trustedProxies</code>
            </td>
            <td>
              <code>string[]</code>
            </td>
            <td>
              <code>[]</code>
            </td>
            <td>IP addresses or CIDR blocks of trusted reverse proxies.</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="trustedProxies examples"
        code={`// Single proxy
trustedProxies: ['127.0.0.1']

// Private network (e.g. Kubernetes cluster)
trustedProxies: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']`}
      />
      <Callout type="warning">
        Only list IPs you actually control. A spoofed <code>X-Forwarded-For</code> from an untrusted
        source could bypass rate limiting.
      </Callout>

      {/* ── plugins ──────────────────────────────────────────────────────── */}
      <h2>plugins</h2>
      <p>
        Consenti ships a plugin system that lets you hook into the data lifecycle without modifying
        the package. Plugins are class instances that extend <code>ConsentiServerPlugin</code>.
      </p>
      <CodeBlock
        lang="ts"
        filename="plugin skeleton"
        code={`import {
  ConsentiServerPlugin,
  type PluginContext,
  type CreateConsentInput,
  type ConsentDbRecord,
} from '@consenti/api'

export class AuditWebhookPlugin extends ConsentiServerPlugin {
  name = 'audit-webhook'

  async initialize(ctx: PluginContext): Promise<void> {
    // ctx.storage — direct StorageAdapter access
    // ctx.config  — full ConsentiServerConfig
    console.log('AuditWebhookPlugin ready')
  }

  async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    await fetch('https://webhook.example.com/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
  }

  async destroy(): Promise<void> {
    // clean up connections, timers, etc.
  }
}

// Register it:
plugins: [new AuditWebhookPlugin()]`}
      />

      <h3>Available hooks</h3>
      <table>
        <thead>
          <tr>
            <th>Hook</th>
            <th>When it fires</th>
            <th>Can mutate?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>initialize(ctx)</code>
            </td>
            <td>After storage connects, before first request.</td>
            <td>—</td>
          </tr>
          <tr>
            <td>
              <code>destroy()</code>
            </td>
            <td>On server shutdown.</td>
            <td>—</td>
          </tr>
          <tr>
            <td>
              <code>beforeConsentSave(data)</code>
            </td>
            <td>Before a new consent record is written.</td>
            <td>
              yes — return modified <code>data</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>afterConsentSave(record)</code>
            </td>
            <td>After a new consent record is persisted.</td>
            <td>no</td>
          </tr>
          <tr>
            <td>
              <code>beforeConsentUpdate(data)</code>
            </td>
            <td>Before an existing consent record is updated.</td>
            <td>
              yes — return modified <code>data</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>afterConsentUpdate(record)</code>
            </td>
            <td>After an existing consent record is updated.</td>
            <td>no</td>
          </tr>
          <tr>
            <td>
              <code>beforeProfileFetch(id)</code>
            </td>
            <td>Before a profile is loaded by ID.</td>
            <td>
              yes — return a different <code>id</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>afterProfileFetch(profile)</code>
            </td>
            <td>After a profile is loaded.</td>
            <td>
              yes — return modified <code>profile</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>beforeUserCreate(data)</code>
            </td>
            <td>Before a new admin user is created.</td>
            <td>
              yes — return modified <code>data</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>afterUserCreate(user)</code>
            </td>
            <td>After a new admin user is persisted.</td>
            <td>no</td>
          </tr>
        </tbody>
      </table>
      <Callout type="info">
        Hooks that return a value (<em>before*</em> hooks) must return the complete modified object
        — not a partial. Hooks that do not return a value (<em>after*</em> hooks) receive a
        read-only snapshot; mutating it has no effect on the stored data.
      </Callout>

      {/* ── branding ─────────────────────────────────────────────────────── */}
      <h2>branding</h2>
      <p>
        Customises the appearance of the admin dashboard — login page, sidebar, and browser tab
        title. All fields are optional; defaults give you a standard Consenti-branded experience.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>appName</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>'Consenti'</code>
            </td>
            <td>Product name shown in the dashboard header, login page, and browser tab.</td>
          </tr>
          <tr>
            <td>
              <code>appLogoPath</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>Consenti default logo</td>
            <td>
              Path to your logo file or a public URL (<code>https://…</code>). When a local file
              path is given, the file is automatically copied into the dashboard bundle and served
              as a static asset — no extra route needed.
            </td>
          </tr>
          <tr>
            <td>
              <code>hidePoweredBy</code>
            </td>
            <td>
              <code>boolean</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              When <code>true</code>, removes the "Powered by Consenti" badge from the dashboard
              footer.
            </td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="branding examples"
        code={`// Minimal — just change the app name
branding: {
  appName: 'Acme CMP',
}

// Full white-label — custom name, logo, and hide badge
branding: {
  appName: 'Acme CMP',
  appLogoPath: './assets/acme-logo.svg',  // local file — copied and served automatically
  hidePoweredBy: true,
}

// Logo from a public CDN
branding: {
  appName: 'Acme CMP',
  appLogoPath: 'https://cdn.acme.com/logo.svg',
}`}
      />
      <Callout type="info">
        Branding is applied once at startup — changing it requires a server restart. The logo and
        config are written to the built dashboard directory so they are available immediately when
        the first request hits the SPA.
      </Callout>

      {/* ── consentSigningKey ────────────────────────────────────────────── */}
      <h2>consentSigningKey</h2>
      <p>
        Opt-in tamper-evidence for server-stored consent records. When set, every consent record is
        HMAC-SHA256 signed (via <code>node:crypto</code> <code>createHmac</code>) at create and
        update time — hex-encoded into a <code>signature</code> field, mirroring the widget&apos;s
        own cookie-signing pattern (<code>core.cookieSigningKey</code>) but for the server-side
        record rather than the visitor&apos;s cookie. No-op and no schema burden when unset.
      </p>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>consentSigningKey</code>
            </td>
            <td>
              <code>string</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>Signing key. Unset by default — no records are signed unless this is provided.</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock
        lang="ts"
        filename="consentSigningKey example"
        code={`createConsenti({
  consentSigningKey: process.env.CONSENTI_CONSENT_SIGNING_KEY,
})`}
      />
      <p>
        The signature covers <code>tenantId</code>, <code>visitorId</code>, <code>profileId</code>,{' '}
        <code>locale</code>, and the sorted <code>consentJson</code> entries — not the
        database-generated <code>id</code>/<code>createdAt</code>/<code>updatedAt</code>.{' '}
        <code>GET /consent/:visitorId/verify</code> checks the signature when both a key is
        configured and the record has one, adding <code>hmac_invalid</code> to the response&apos;s{' '}
        <code>reasons</code> array on mismatch. <code>signature</code> is included in CSV/JSON/XLSX
        exports and shown in the dashboard&apos;s Consents detail view.
      </p>
      <Callout type="info">
        Hash-chaining between records (a full tamper-evident log, not just per-record integrity) is
        not implemented — out of scope for now.
      </Callout>

      {/* ── Security rules ───────────────────────────────────────────────── */}
      <h2>Security rules (built-in)</h2>
      <ul>
        <li>
          Raw IP addresses are never stored — SHA-256 hashed:{' '}
          <code>createHash(&apos;sha256&apos;).update(ip).digest(&apos;hex&apos;)</code>
        </li>
        <li>
          Passwords hashed with scrypt via <code>node:crypto</code> — not bcrypt (external dep)
        </li>
        <li>
          JWT signed with <code>node:crypto</code> HMAC-SHA256 — not jsonwebtoken package
        </li>
        <li>
          Admin routes always go through <code>auth.middleware.ts</code>
        </li>
        <li>
          Security headers (<code>X-Content-Type-Options</code>, <code>X-Frame-Options</code>,{' '}
          <code>Referrer-Policy</code>) added to every response
        </li>
        <li>
          Stack traces hidden in production (<code>NODE_ENV === &apos;production&apos;</code>)
        </li>
      </ul>
    </div>
  )
}
