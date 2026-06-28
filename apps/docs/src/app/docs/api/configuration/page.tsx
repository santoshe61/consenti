import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'API Configuration' }

export default function APIConfigurationPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Configuration</h1>
      <p>
        <code>createConsenti(config)</code> accepts a single configuration object. Every field
        is optional — calling it with an empty object is valid and gives you a running server
        immediately.
      </p>

      <CodeBlock lang="ts" filename="Zero-config quickstart" code={`import { createConsenti } from '@consenti/api'

// No config required — works out of the box
const consenti = createConsenti({})

// Set credentials via environment variables (recommended even for dev)
// CONSENTI_ADMIN_EMAIL=user@consenti.dev
// CONSENTI_ADMIN_PASSWORD=Consenti@123
// CONSENTI_ADMIN_JWT_SECRET=your-jwt-secret`} />

      <Callout type="warning">
        The zero-config defaults use an in-process JSON file store (<code>./consenti-data.json</code>)
        and demo credentials. This is fine for local development and prototyping, but{' '}
        <strong>not suitable for production or medium-to-large applications</strong>. Switch to a
        SQLite or server database driver and set real credentials before deploying.
      </Callout>

      <CodeBlock lang="ts" filename="Full config example" code={`import { createConsenti } from '@consenti/api'

const consenti = createConsenti({
  // Optional but recommended
  storage: {
    driver: 'json',   // not recommended for production
    path: './consenti-data.json',
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
    gdpr: true,
    ccpa: false,
    gpc: true,
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

  plugins: [],
})`} />

      {/* ── storage ───────────────────────────────────────────────────────── */}
      <h2>storage</h2>
      <p>
        Controls which database backend Consenti uses. The <code>driver</code> field selects
        the engine; the remaining fields depend on which driver you choose.
      </p>

      <h3>Default driver — json</h3>
      <p>
        When no <code>storage</code> config is provided, Consenti uses the built-in JSON file
        adapter. It requires zero installation — only <code>node:fs</code> and{' '}
        <code>node:crypto</code>, both Node.js built-ins. Data is kept in memory and written to
        disk atomically after every mutation (temp-file + rename, same guarantee as <em>steno</em>).
      </p>
      <CodeBlock lang="ts" filename="JSON driver" code={`storage: { driver: 'json', path: './consenti-data.json' } // default when storage is omitted`} />
      <Callout type="warning">
        The <code>json</code> driver loads the entire dataset into memory and is single-process
        only. It is designed for development, prototyping, and low-traffic single-instance
        deployments. <strong>Use a SQLite or server driver in production.</strong>
      </Callout>

      <h3>SQLite drivers</h3>
      <p>
        Three SQLite drivers are available. All create the same schema; choose based on your
        Node.js version and whether you can compile native addons.
      </p>
      <table>
        <thead>
          <tr><th>Driver</th><th>Requires</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>node:sqlite</code></td><td>Node 22.5+</td><td>Built-in, zero compilation. Recommended for Node 22.5+.</td></tr>
          <tr><td><code>better-sqlite3</code> / <code>sqlite</code></td><td>Node 20+, native addon</td><td>Fastest option. Requires a prebuilt binary or build toolchain. <code>sqlite</code> is an alias.</td></tr>
          <tr><td><code>node-sqlite3-wasm</code></td><td>Node 20+</td><td>WASM bundle, no compilation. Use when <code>node:sqlite</code> is unavailable and native addons are blocked.</td></tr>
        </tbody>
      </table>
      <p>
        <code>node:sqlite</code> is built into Node 22.5+ and requires no installation.
        The other two drivers are optional peer dependencies — install whichever one you need:
      </p>
      <CodeBlock lang="bash" filename="Install SQLite peer dep" code={`# Node 20+ native addon (fastest; needs build toolchain or prebuilt binary)
npm install better-sqlite3

# Node 20+ WASM fallback (no compilation required)
npm install node-sqlite3-wasm`} />
      <CodeBlock lang="ts" filename="SQLite config examples" code={`// Node 22.5+ — built-in, no install needed
storage: { driver: 'node:sqlite', path: './consenti.db' }

// Node 20+ with native addon
storage: { driver: 'better-sqlite3', path: './consenti.db' }

// Node 20+ WASM fallback
storage: { driver: 'node-sqlite3-wasm', path: './consenti.db' }`} />

      <h3>Server drivers</h3>
      <table>
        <thead>
          <tr><th>Driver</th><th>Connection field</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>postgresql</code></td><td><code>uri</code></td><td>PostgreSQL 13+. Connection pool via <code>pool</code>.</td></tr>
          <tr><td><code>mysql</code></td><td><code>uri</code></td><td>MySQL 8+ / MariaDB 10.6+. Connection pool via <code>pool</code>.</td></tr>
          <tr><td><code>mongodb</code></td><td><code>uri</code></td><td>MongoDB 6+. Optional <code>dbName</code> override.</td></tr>
        </tbody>
      </table>
      <p>Each server driver is an optional peer dependency — install the one you need:</p>
      <CodeBlock lang="bash" filename="Install server driver peer dep" code={`npm install pg         # PostgreSQL
npm install mysql2     # MySQL / MariaDB
npm install mongodb    # MongoDB`} />
      <CodeBlock lang="ts" filename="Server driver config examples" code={`// PostgreSQL
storage: { driver: 'postgresql', uri: process.env.CONSENTI_DATABASE_URL }

// MySQL
storage: { driver: 'mysql', uri: process.env.CONSENTI_DATABASE_URL }

// MongoDB
storage: { driver: 'mongodb', uri: process.env.CONSENTI_DATABASE_URL, dbName: 'consenti' }`} />

      <h3>storage field reference</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>driver</code></td><td><code>string</code></td><td><code>'json'</code> (when <code>storage</code> omitted)</td><td>Required within the <code>storage</code> object. Selects the storage engine (see tables above).</td></tr>
          <tr><td><code>path</code></td><td><code>string</code></td><td><code>'./consenti-data.json'</code> (json); none for SQLite</td><td>File path for the <code>json</code> or SQLite driver. Relative paths resolve from <code>process.cwd()</code>.</td></tr>
          <tr><td><code>uri</code></td><td><code>string</code></td><td>—</td><td>Server drivers only. Full connection string including credentials.</td></tr>
          <tr><td><code>dbName</code></td><td><code>string</code></td><td>name in <code>uri</code></td><td>MongoDB only. Database name override.</td></tr>
          <tr><td><code>host</code> / <code>port</code></td><td><code>string / number</code></td><td>—</td><td>Alternative to <code>uri</code> for server drivers.</td></tr>
          <tr><td><code>user</code> / <code>password</code></td><td><code>string</code></td><td>—</td><td>Credentials when not embedded in <code>uri</code>.</td></tr>
          <tr><td><code>database</code></td><td><code>string</code></td><td>—</td><td>Database name for PostgreSQL / MySQL when not in <code>uri</code>.</td></tr>
        </tbody>
      </table>

      {/* ── auth ─────────────────────────────────────────────────────────── */}
      <h2>auth</h2>
      <p>
        The <code>auth</code> object controls how the admin dashboard authenticates its users.
        Pick one <code>mode</code> and supply the fields that mode requires.
      </p>

      <p>
        When <code>auth</code> is omitted entirely, Consenti defaults to{' '}
        <code>mode: 'local'</code> and reads credentials from environment variables:
      </p>
      <table>
        <thead>
          <tr><th>Env var</th><th>Default fallback</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>CONSENTI_ADMIN_EMAIL</code></td><td><code>user@consenti.dev</code></td><td>Bootstrap super-admin email when no <code>auth.adminEmail</code> is set.</td></tr>
          <tr><td><code>CONSENTI_ADMIN_PASSWORD</code></td><td><code>Consenti@123</code></td><td>Bootstrap super-admin password when no <code>auth.adminPassword</code> is set.</td></tr>
          <tr><td><code>CONSENTI_ADMIN_JWT_SECRET</code></td><td>random per restart</td><td>JWT signing secret. Takes precedence over <code>auth.jwtSecret</code>.</td></tr>
        </tbody>
      </table>
      <Callout type="warning">
        A random <code>CONSENTI_ADMIN_JWT_SECRET</code> means all sessions are invalidated on restart.
        Always set a stable secret in production.
      </Callout>

      <h3>Shared options (all modes)</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mode</code></td><td><code>'local' | 'jwt' | 'oidc' | 'saml' | 'custom'</code></td><td><code>'local'</code></td><td>Authentication strategy for the admin dashboard.</td></tr>
          <tr><td><code>jwtSecret</code></td><td><code>string</code></td><td>random on start</td><td>HMAC-SHA256 secret used to sign session JWTs. Omit in dev; set a stable value in production or sessions expire on restart.</td></tr>
        </tbody>
      </table>

      <h3>mode: 'local'</h3>
      <p>
        Built-in email + password login. On first boot, Consenti creates a super-admin account
        using <code>adminEmail</code> / <code>adminPassword</code>. The password is hashed with
        scrypt (<code>node:crypto</code>) and never stored in plain text. Subsequent logins issue
        a signed JWT stored in an <code>HttpOnly</code> cookie.
      </p>
      <p>
        Brute-force protection is built in: 5 failed attempts within 15 minutes lock the account
        for the remainder of that window.
      </p>
      <CodeBlock lang="ts" filename="local auth" code={`auth: {
  mode: 'local',
  adminEmail: 'user@consenti.dev',
  adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!, // min 12 chars; 16+ recommended
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,         // stable secret for production
}`} />
      <table>
        <thead>
          <tr><th>Key</th><th>Required</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>adminEmail</code></td><td>yes</td><td><code>env.CONSENTI_ADMIN_EMAIL</code> → <code>'user@consenti.dev'</code></td><td>Email address for the bootstrapped super-admin user.</td></tr>
          <tr><td><code>adminPassword</code></td><td>yes</td><td><code>env.CONSENTI_ADMIN_PASSWORD</code> → <code>'Consenti@123'</code></td><td>Password for the bootstrapped super-admin user. Must be ≥ 12 characters; ≥ 16 recommended. Hashed with scrypt on first boot; ignored on subsequent starts.</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        The bootstrap user is only created when the database has zero admin users. Adding more
        users via the dashboard after first boot does not require restarting the server.
      </Callout>

      <h3>mode: 'jwt'</h3>
      <p>
        Validate JWTs issued by an external system (e.g. your own auth service). Consenti
        verifies the token signature with <code>jwtSecret</code> and extracts{' '}
        <code>sub</code>, <code>email</code>, <code>roles</code>, and <code>tenantId</code>
        from the payload.
      </p>
      <CodeBlock lang="ts" filename="jwt auth" code={`auth: {
  mode: 'jwt',
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!, // must match the secret used to sign your tokens
}`} />
      <p>Your auth service must issue tokens with at least these claims:</p>
      <CodeBlock lang="json" filename="expected JWT payload" code={`{
  "sub": "user-id",
  "email": "admin@example.com",
  "roles": ["super_admin"],
  "tenantId": "default"
}`} />
      <Callout type="warning">
        Only HMAC-SHA256 (<code>alg: "HS256"</code>) tokens are supported in this mode.
        Tokens signed with RS256 / ES256 require <code>mode: 'oidc'</code>.
      </Callout>

      <h3>mode: 'oidc'</h3>
      <p>
        OpenID Connect Authorization Code flow with PKCE. Consenti auto-discovers endpoints
        from the issuer&apos;s <code>/.well-known/openid-configuration</code> and verifies the
        ID token signature using the provider&apos;s JWKS. Supports RS256, RS384, RS512, ES256,
        ES384, and ES512.
      </p>
      <CodeBlock lang="ts" filename="oidc auth" code={`auth: {
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
}`} />
      <table>
        <thead>
          <tr><th>Key</th><th>Required</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>oidc.issuer</code></td><td>yes</td><td>—</td><td>OIDC provider base URL. Must expose <code>/.well-known/openid-configuration</code>.</td></tr>
          <tr><td><code>oidc.clientId</code></td><td>yes</td><td>—</td><td>OAuth 2.0 client ID registered with the provider.</td></tr>
          <tr><td><code>oidc.clientSecret</code></td><td>yes</td><td>—</td><td>OAuth 2.0 client secret.</td></tr>
          <tr><td><code>oidc.redirectUri</code></td><td>yes</td><td>—</td><td>Callback URL registered with the provider. Must be: <code>{'{basePath}'}/auth/oidc/callback</code>.</td></tr>
          <tr><td><code>oidc.claimsMapping.email</code></td><td>no</td><td><code>"email"</code></td><td>JWT claim that holds the user&apos;s email.</td></tr>
          <tr><td><code>oidc.claimsMapping.roles</code></td><td>no</td><td><code>"consenti_roles"</code></td><td>JWT claim that holds an array of Consenti role names.</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        The PKCE <code>state</code> / <code>verifier</code> pairs are held in memory. For
        multi-instance deployments, replace the in-memory store with a shared cache (Redis, etc.)
        by extending the auth handler.
      </Callout>

      <h3>mode: 'saml'</h3>
      <p>
        SAML 2.0 SP-initiated SSO. Consenti acts as the Service Provider; your Identity
        Provider handles authentication. Assertion validation is delegated to the{' '}
        <code>samlify</code> peer dependency, which you must install separately.
      </p>
      <CodeBlock lang="bash" filename="install peer dependency" code={`npm install samlify`} />
      <CodeBlock lang="ts" filename="saml auth" code={`auth: {
  mode: 'saml',
  jwtSecret: process.env.CONSENTI_ADMIN_JWT_SECRET!,
  saml: {
    issuer: 'https://idp.example.com',
    entryPoint: 'https://idp.example.com/sso/saml',  // IdP SSO URL
    cert: process.env.IDP_CERT!,                      // IdP signing certificate (PEM, without headers)
    callbackUrl: 'https://yourapp.com/consenti/auth/saml/callback',
  },
}`} />
      <table>
        <thead>
          <tr><th>Key</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>saml.issuer</code></td><td>yes</td><td>IdP entity ID / issuer string.</td></tr>
          <tr><td><code>saml.entryPoint</code></td><td>yes</td><td>IdP SSO endpoint URL (HTTP-Redirect binding).</td></tr>
          <tr><td><code>saml.cert</code></td><td>yes</td><td>IdP X.509 signing certificate in PEM format (without the <code>-----BEGIN CERTIFICATE-----</code> headers).</td></tr>
          <tr><td><code>saml.callbackUrl</code></td><td>yes</td><td>Your ACS (Assertion Consumer Service) URL. Must be: <code>{'{basePath}'}/auth/saml/callback</code>.</td></tr>
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
        Bring your own authentication logic. Supply a <code>validateUser</code> async function
        that receives the raw <code>Request</code> object and returns an <code>AdminUser</code>
        (or <code>null</code> if the request is unauthenticated). Consenti calls this function on
        every protected admin route.
      </p>
      <CodeBlock lang="ts" filename="custom auth" code={`import type { AdminUser } from '@consenti/types'

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
}`} />
      <Callout type="info">
        In <code>custom</code> mode you own the entire authentication step. Consenti still
        enforces RBAC on the returned user&apos;s roles — the custom handler only decides
        <em>who</em> the user is, not what they are allowed to do.
      </Callout>

      <h3>TOTP / Two-factor authentication</h3>
      <p>
        TOTP (RFC 6238) is available as an optional second factor in <code>local</code> mode.
        It is implemented entirely with <code>node:crypto</code> — no external dependency.
      </p>
      <CodeBlock lang="ts" filename="TOTP helpers (server-side)" code={`import {
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
`} />
      <Callout type="info">
        Each TOTP token is single-use: <code>verifyTotp</code> rejects a token that has already
        been accepted, preventing replay attacks within the same 30-second window.
      </Callout>

      {/* ── basePath ─────────────────────────────────────────────────────── */}
      <h2>basePath</h2>
      <p>
        URL prefix for all Consenti routes. Defaults to <code>/consenti</code>.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>basePath</code></td><td><code>string</code></td><td><code>'/consenti'</code></td><td>All public API, admin API, and dashboard routes are mounted under this prefix.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="basePath examples" code={`// Default — routes at /consenti/api/v1/...
basePath: '/consenti'

// Custom prefix
basePath: '/cmp'
// → public API:  /cmp/api/v1/consent
// → admin API:   /cmp/admin/...
// → dashboard:   /cmp  (SPA)
// → OpenAPI UI:  /cmp/api/docs`} />

      {/* ── dashboard ────────────────────────────────────────────────────── */}
      <h2>dashboard</h2>
      <p>
        Controls whether Consenti serves the built-in Preact admin SPA. Accepts a boolean or
        a config object.
      </p>
      <table>
        <thead>
          <tr><th>Value</th><th>Effect</th></tr>
        </thead>
        <tbody>
          <tr><td><code>true</code></td><td>Serve the dashboard at <code>{'{basePath}'}</code>.</td></tr>
          <tr><td><code>false</code> / omitted</td><td>Dashboard files are not served; admin API routes remain active.</td></tr>
          <tr><td><code>{'{ enabled: true, path: \'/admin\' }'}</code></td><td>Serve at a custom sub-path instead of <code>basePath</code>.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="dashboard examples" code={`// Simplest — serve at /consenti
dashboard: true

// Disable (headless / API-only mode)
dashboard: false

// Serve at a custom path
dashboard: { enabled: true, path: '/admin' }`} />
      <Callout type="info">
        The dashboard SPA is a static bundle bundled into the package. No separate build step is
        needed — it is served directly from the <code>@consenti/api</code> package
        directory.
      </Callout>

      {/* ── rateLimit ────────────────────────────────────────────────────── */}
      <h2>rateLimit</h2>
      <p>
        In-memory sliding-window rate limiter applied to public API routes
        (consent reads / writes). Admin routes use a separate, fixed-window limiter (10 requests
        / 15 min) that cannot be configured.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>enabled</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Set to <code>false</code> to disable rate limiting entirely (e.g. behind your own proxy that already rate-limits).</td></tr>
          <tr><td><code>windowMs</code></td><td><code>number</code></td><td><code>60000</code></td><td>Rolling window duration in milliseconds.</td></tr>
          <tr><td><code>maxRequests</code></td><td><code>number</code></td><td><code>60</code></td><td>Maximum requests per IP per window. Requests over the limit receive <code>429 Too Many Requests</code>.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="rateLimit examples" code={`// Tighter limit for high-traffic sites
rateLimit: {
  windowMs: 60_000,    // 1-minute window
  maxRequests: 30,     // 30 req/min per IP
}

// Disable entirely (you handle rate limiting upstream)
rateLimit: { enabled: false }`} />
      <Callout type="info">
        Rate-limit counters live in process memory. For multi-instance deployments, disable the
        built-in limiter and implement a shared counter (Redis, etc.) at your load balancer or
        API gateway layer.
      </Callout>

      {/* ── compliance ───────────────────────────────────────────────────── */}
      <h2>compliance</h2>
      <p>
        Enables regulation-specific validation and data handling. All flags default to{' '}
        <code>false</code> except <code>gdpr</code>, which defaults to <code>true</code>.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>gdpr</code></td><td><code>true</code></td><td>Reject pre-ticked consent, validate Legitimate Interest status values, and enforce opt-in semantics.</td></tr>
          <tr><td><code>ccpa</code></td><td><code>false</code></td><td>Enable CCPA opt-out model. Adds <code>do_not_sell</code> flag to consent records.</td></tr>
          <tr><td><code>gpc</code></td><td><code>false</code></td><td>Store <code>gpc_detected: true</code> on consent records when the browser sends the <code>Sec-GPC: 1</code> header, and expose it via the public API.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="compliance examples" code={`// EU-only product
compliance: { gdpr: true }

// US product with CCPA + GPC support
compliance: { gdpr: false, ccpa: true, gpc: true }

// Global product supporting all regulations
compliance: { gdpr: true, ccpa: true, gpc: true }`} />

      {/* ── tcf ──────────────────────────────────────────────────────────── */}
      <h2>tcf</h2>
      <p>
        IAB Transparency & Consent Framework v2.2 integration. When enabled, Consenti fetches
        the Global Vendor List, stores TC strings on consent records, and exposes the{' '}
        <code>__tcfapi</code> stub endpoint.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>enabled</code></td><td><code>boolean</code></td><td><code>false</code> (omit <code>tcf</code> to disable)</td><td>Enable TCF mode. Starts the GVL refresh background job on boot.</td></tr>
          <tr><td><code>cmpId</code></td><td><code>number</code></td><td>—</td><td>Your IAB-registered CMP ID. Required when <code>enabled: true</code>.</td></tr>
          <tr><td><code>cmpVersion</code></td><td><code>number</code></td><td>—</td><td>Your CMP software version number. Required when <code>enabled: true</code>. Included in TC strings.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="tcf example" code={`tcf: {
  enabled: true,
  cmpId: 42,        // your IAB CMP ID
  cmpVersion: 1,
}`} />
      <Callout type="warning">
        TCF mode requires an IAB-registered CMP ID. Do not use a placeholder CMP ID in
        production — the GVL and downstream DSPs validate it.
      </Callout>

      {/* ── ageGate ──────────────────────────────────────────────────────── */}
      <h2>ageGate</h2>
      <p>
        Adds an age-verification step before consent can be recorded. When enabled, the consent
        submission endpoint rejects records that do not carry a valid age attestation.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>enabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Enable age gating.</td></tr>
          <tr><td><code>minimumAge</code></td><td><code>number</code></td><td><code>13</code></td><td>Minimum age required to record consent. Common values: 13 (COPPA), 16 (GDPR Article 8 default).</td></tr>
          <tr><td><code>requireParentalConsent</code></td><td><code>boolean</code></td><td><code>false</code></td><td>When <code>true</code>, users below <code>minimumAge</code> must provide a parental consent token instead of being rejected outright.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="ageGate examples" code={`// COPPA — block users under 13
ageGate: {
  enabled: true,
  minimumAge: 13,
}

// GDPR Article 8 — require parental consent for users 13–15
ageGate: {
  enabled: true,
  minimumAge: 16,
  requireParentalConsent: true,
}`} />

      {/* ── dataRetention ────────────────────────────────────────────────── */}
      <h2>dataRetention</h2>
      <p>
        Automatic GDPR data minimisation. When configured, Consenti runs a nightly background
        job that hard-deletes consent records older than <code>purgeAfterDays</code>.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>purgeAfterDays</code></td><td><code>number</code></td><td>— (omit to disable)</td><td>Delete consent records older than this many days. The purge runs once at startup and then every 24 hours.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="dataRetention example" code={`// Keep consent records for 1 year, then purge automatically
dataRetention: {
  purgeAfterDays: 365,
}`} />
      <Callout type="info">
        Audit log entries (<code>audit_logs</code>) are never purged — they are append-only by
        design. Only consent records are affected by this setting.
      </Callout>

      {/* ── multiTenant ──────────────────────────────────────────────────── */}
      <h2>multiTenant</h2>
      <p>
        When enabled, Consenti resolves the tenant from the request and scopes all data
        operations to that tenant. The tenant identifier is extracted from the{' '}
        <code>X-Tenant-ID</code> header or the <code>tenantId</code> query parameter.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>enabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Enable multi-tenant mode. All requests without a valid tenant ID fall back to <code>"default"</code>.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="multiTenant example" code={`multiTenant: { enabled: true }

// Clients must then pass:
// X-Tenant-ID: acme-corp
// or: GET /consenti/api/v1/consent?tenantId=acme-corp`} />

      {/* ── maxBodySize ──────────────────────────────────────────────────── */}
      <h2>maxBodySize</h2>
      <p>
        Maximum allowed request body size in bytes. Requests exceeding this limit receive a{' '}
        <code>413 Payload Too Large</code> response before any parsing occurs.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>maxBodySize</code></td><td><code>number</code></td><td><code>1048576</code> (1 MB)</td><td>Body size limit in bytes.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="maxBodySize example" code={`maxBodySize: 512_000   // 512 KB`} />

      {/* ── trustedProxies ───────────────────────────────────────────────── */}
      <h2>trustedProxies</h2>
      <p>
        List of IP addresses or CIDR ranges for reverse proxies that sit in front of Consenti
        (nginx, Cloudflare, AWS ALB, etc.). When set, Consenti reads the real client IP from the{' '}
        <code>X-Forwarded-For</code> header instead of the TCP connection address. This ensures
        rate limiting and IP hashing target the actual visitor, not the proxy.
      </p>
      <table>
        <thead>
          <tr><th>Key</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>trustedProxies</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>IP addresses or CIDR blocks of trusted reverse proxies.</td></tr>
        </tbody>
      </table>
      <CodeBlock lang="ts" filename="trustedProxies examples" code={`// Single proxy
trustedProxies: ['127.0.0.1']

// Private network (e.g. Kubernetes cluster)
trustedProxies: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']`} />
      <Callout type="warning">
        Only list IPs you actually control. A spoofed <code>X-Forwarded-For</code> from an
        untrusted source could bypass rate limiting.
      </Callout>

      {/* ── plugins ──────────────────────────────────────────────────────── */}
      <h2>plugins</h2>
      <p>
        Consenti ships a plugin system that lets you hook into the data lifecycle without
        modifying the package. Plugins are class instances that extend{' '}
        <code>ConsentiServerPlugin</code>.
      </p>
      <CodeBlock lang="ts" filename="plugin skeleton" code={`import {
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
plugins: [new AuditWebhookPlugin()]`} />

      <h3>Available hooks</h3>
      <table>
        <thead>
          <tr><th>Hook</th><th>When it fires</th><th>Can mutate?</th></tr>
        </thead>
        <tbody>
          <tr><td><code>initialize(ctx)</code></td><td>After storage connects, before first request.</td><td>—</td></tr>
          <tr><td><code>destroy()</code></td><td>On server shutdown.</td><td>—</td></tr>
          <tr><td><code>beforeConsentSave(data)</code></td><td>Before a new consent record is written.</td><td>yes — return modified <code>data</code></td></tr>
          <tr><td><code>afterConsentSave(record)</code></td><td>After a new consent record is persisted.</td><td>no</td></tr>
          <tr><td><code>beforeConsentUpdate(data)</code></td><td>Before an existing consent record is updated.</td><td>yes — return modified <code>data</code></td></tr>
          <tr><td><code>afterConsentUpdate(record)</code></td><td>After an existing consent record is updated.</td><td>no</td></tr>
          <tr><td><code>beforeProfileFetch(id)</code></td><td>Before a profile is loaded by ID.</td><td>yes — return a different <code>id</code></td></tr>
          <tr><td><code>afterProfileFetch(profile)</code></td><td>After a profile is loaded.</td><td>yes — return modified <code>profile</code></td></tr>
          <tr><td><code>beforeUserCreate(data)</code></td><td>Before a new admin user is created.</td><td>yes — return modified <code>data</code></td></tr>
          <tr><td><code>afterUserCreate(user)</code></td><td>After a new admin user is persisted.</td><td>no</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        Hooks that return a value (<em>before*</em> hooks) must return the complete modified
        object — not a partial. Hooks that do not return a value (<em>after*</em> hooks) receive a
        read-only snapshot; mutating it has no effect on the stored data.
      </Callout>

      {/* ── Security rules ───────────────────────────────────────────────── */}
      <h2>Security rules (built-in)</h2>
      <ul>
        <li>Raw IP addresses are never stored — SHA-256 hashed: <code>createHash(&apos;sha256&apos;).update(ip).digest(&apos;hex&apos;)</code></li>
        <li>Passwords hashed with scrypt via <code>node:crypto</code> — not bcrypt (external dep)</li>
        <li>JWT signed with <code>node:crypto</code> HMAC-SHA256 — not jsonwebtoken package</li>
        <li>Admin routes always go through <code>auth.middleware.ts</code></li>
        <li>Security headers (<code>X-Content-Type-Options</code>, <code>X-Frame-Options</code>, <code>Referrer-Policy</code>) added to every response</li>
        <li>Stack traces hidden in production (<code>NODE_ENV === &apos;production&apos;</code>)</li>
      </ul>
    </div>
  )
}
