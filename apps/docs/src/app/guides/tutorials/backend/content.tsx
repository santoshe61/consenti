import Link from 'next/link'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

async function Step1InstallBackend() {
  return (
    <>
      <Terminal code="npm install @consenti/api" />
      <p>
        Zero runtime dependencies — only Node.js built-ins. <code>createConsenti()</code> returns a
        router, a handler, and adapters for every major framework — pick the one that matches your
        stack.
      </p>

      <h3>Express</h3>
      <CodeBlock
        lang="ts"
        filename="app.ts"
        code={`import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()
const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: process.env.CONSENTI_ADMIN_PASSWORD! },
  dashboard: true,
})
app.use(consenti.router)
app.listen(3000)`}
      />

      <h3>Standalone — no existing server</h3>
      <CodeBlock
        lang="ts"
        filename="server.ts"
        code={`import { createConsenti } from '@consenti/api'
import http from 'node:http'

const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

http.createServer(consenti.handler).listen(3001)
// Admin dashboard → http://localhost:3001/consenti/
// REST API        → http://localhost:3001/consenti/api/v1/`}
      />

      <h3>Fastify</h3>
      <CodeBlock
        lang="ts"
        filename="app.ts"
        code={`import Fastify from 'fastify'
import { createConsenti } from '@consenti/api'

const fastify = Fastify()
const consenti = createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: process.env.CONSENTI_ADMIN_PASSWORD! },
  dashboard: true,
})

await fastify.register(consenti.fastifyHandler)
await fastify.listen({ port: 3000 })`}
      />

      <h3>Next.js App Router</h3>
      <CodeBlock
        lang="ts"
        filename="app/consenti/[...path]/route.ts"
        code={`import { createConsenti } from '@consenti/api'
import type { NextRequest } from 'next/server'

let consenti: Awaited<ReturnType<typeof createConsenti>>

async function getConsenti() {
  if (!consenti) {
    consenti = createConsenti({
      storage: { driver: 'node:sqlite', path: './consenti-data' },
      auth: {
        mode: 'local',
        adminEmail: process.env.CONSENTI_ADMIN_EMAIL!,
        adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
      },
    })
  }
  return consenti
}

async function consentiHandler(req: NextRequest) {
  const c = await getConsenti()
  return c.handleRequest(req)
}

export { consentiHandler as GET, consentiHandler as POST, consentiHandler as PUT, consentiHandler as DELETE, consentiHandler as PATCH }`}
      />

      <h3>Hono / Cloudflare Workers / Deno / Bun (edge runtimes)</h3>
      <p>
        <code>consenti.honoApp</code> is a WinterCG-compatible <code>{'{ fetch }'}</code> handler —
        works with Hono directly, or anywhere that accepts a standard <code>fetch</code> handler.
      </p>
      <CodeBlock
        lang="ts"
        filename="Hono"
        code={`import { Hono } from 'hono'
import { createConsenti } from '@consenti/api'

const consenti = createConsenti({ /* ... */ })

const app = new Hono()
app.all('/consenti/*', (c) => consenti.honoApp.fetch(c.req.raw))`}
      />

      <Callout type="tip">
        <code>consenti.handler</code> is a standard{' '}
        <code>http.IncomingMessage → http.ServerResponse</code> handler — any Node.js HTTP
        framework not listed above can still wrap it directly. Full reference on the{' '}
        <Link href="/docs/api/installation/">Backend Installation</Link> and{' '}
        <Link href="/docs/api/methods/">API Methods</Link> pages.
      </Callout>
    </>
  )
}

async function Step2ConfigureBackend() {
  return (
    <>
      <p>
        The <code>json</code> driver above works with zero installation — good for local dev. Swap
        the <code>storage.driver</code> before going to production:
      </p>
      <CodeBlock
        lang="ts"
        code={`storage: { driver: 'node:sqlite', path: './consenti-data' }   // built-in, Node 22.5+
// or
storage: { driver: 'postgresql', uri: process.env.DATABASE_URL, path: './consenti-data' }
// or
storage: { driver: 'mysql', uri: process.env.DATABASE_URL, path: './consenti-data' }
// or
storage: { driver: 'mongodb', uri: process.env.MONGODB_URI, path: './consenti-data' }`}
      />
      <p>
        <code>auth.mode: 'local'</code> is a username/password admin login — good for a single team.
        Switch to <code>'jwt'</code> for API consumers or <code>'oidc'</code>/<code>'saml'</code>{' '}
        for enterprise SSO — see <Link href="/guides/backend/auth/">Auth Modes</Link>.
      </p>

      <p>
        Storage and auth are just two of the config sections <code>createConsenti()</code> takes.
        Pick whichever of these your project needs — none are required, all are independent.
      </p>

      <h2>compliance — geo-routing and custom resolvers</h2>
      <p>
        Controls which cookie Compliance Group applies to a visitor. <code>type: &apos;auto&apos;</code>{' '}
        (the default) geo-resolves per visitor; a fixed group ID applies one group to everyone.
      </p>
      <CodeBlock
        lang="ts"
        filename="compliance examples"
        code={`// Zero-dep geo routing (timezone + Accept-Language heuristic) — the default
compliance: { type: 'auto', geoDataProvider: 'default' }

// IP-based, local lookup (npm install geoip-lite)
compliance: { type: 'auto', geoDataProvider: 'geoip' }

// IP-based, official MaxMind SDK — most accurate, requires a .mmdb file
compliance: { type: 'auto', geoDataProvider: 'maxmind' }

// Fixed group — e.g. a GDPR-only product serving only EU visitors
compliance: { type: 'opt-in' }

// Your own resolver — integrate any GeoIP SaaS
compliance: {
  type: 'auto',
  geoDataProvider: async ({ ip, timezone, language }) => {
    const res = await fetch(\`https://api.mygeoip.com/\${ip}\`)
    const data = await res.json()
    return { country: data.country_code, region: data.region, locale: data.locale ?? null }
  },
}`}
      />
      <p>
        See <Link href="/guides/backend/geo-routing/">Geo-Routing &amp; Auto-Detection</Link> for a
        full comparison of every resolver.
      </p>

      <h2>tcf — IAB Transparency &amp; Consent Framework v2.2</h2>
      <CodeBlock
        lang="ts"
        filename="tcf example"
        code={`compliance: {
  tcf: {
    enabled: true,
    cmpId: 42,        // your IAB-registered CMP ID — required
    cmpVersion: 1,     // your CMP software version — required
  },
}`}
      />
      <Callout type="warning">
        <code>cmpId</code>/<code>cmpVersion</code> here must match the widget&apos;s own{' '}
        <code>compliance.tcf</code> config, and must be a real IAB-registered ID in production.
      </Callout>

      <h2>handleCache — CDN / edge cache integration</h2>
      <p>
        Called whenever Consenti writes or removes locale JSON files on disk — wire it up to purge
        or warm a CDN, nginx proxy cache, or any edge layer.
      </p>
      <CodeBlock
        lang="ts"
        filename="handleCache example"
        code={`handleCache: (paths, version, isPurge) => {
  if (isPurge) {
    for (const p of paths) cdnClient.purge(p)
  } else {
    for (const p of paths) cdnClient.warm(p)
  }
}`}
      />

      <h2>rateLimit — public API throttling</h2>
      <CodeBlock
        lang="ts"
        filename="rateLimit examples"
        code={`// Tighter limit for high-traffic sites
rateLimit: { windowMs: 60_000, maxRequests: 30 } // 30 req/min per IP

// Disable entirely (you handle rate limiting upstream)
rateLimit: { enabled: false }`}
      />

      <h2>dataRetention — automatic GDPR data minimisation</h2>
      <CodeBlock
        lang="ts"
        filename="dataRetention example"
        code={`// Keep consent records for 1 year, then purge automatically (nightly job)
compliance: { dataRetention: { purgeAfterDays: 365 } }`}
      />

      <h2>multiTenant — one deployment, many tenants</h2>
      <CodeBlock
        lang="ts"
        filename="multiTenant example"
        code={`multiTenant: { enabled: true }

// Clients must then pass:
// X-Tenant-ID: acme-corp
// or: GET /consenti/api/v1/consent?tenantId=acme-corp`}
      />

      <h2>basePath — change the /consenti prefix</h2>
      <CodeBlock lang="ts" code={`basePath: '/cmp' // dashboard now at /cmp/, API at /cmp/api/v1/`} />

      <Callout type="info">
        See <Link href="/docs/api/advanced-configuration/">API Advanced Configuration</Link> for
        every section above plus <code>plugins</code>, <code>branding</code>,{' '}
        <code>compliance.dataSigningHash</code>, <code>s3Api</code>, and{' '}
        <code>trustedProxies</code> — and{' '}
        <Link href="/guides/backend/storage/">Choosing a Storage Driver</Link> for the storage
        comparison.
      </Callout>
    </>
  )
}

async function Step3UpdateProfiles() {
  return (
    <>
      <p>
        Open <code>http://localhost:3001/consenti/</code> and log in with the{' '}
        <code>adminEmail</code> / <code>adminPassword</code> from Step 1. On first run the{' '}
        <strong>Setup Wizard</strong> walks you through creating your first profiles.
      </p>
      <p>
        From the <strong>Profiles</strong> section you can create, edit, copy, delete, activate, and
        deactivate as many profiles as you need — one per compliance group, region, or brand. Every
        save increments the profile&apos;s version in place, and <strong>Profile History</strong>{' '}
        lets you diff and roll back to a previous version.
      </p>

      <h2>How compliance groups decide which profile a visitor sees</h2>
      <p>
        Every profile belongs to a <strong>compliance group</strong>, which decides its consent
        model (opt-in vs opt-out), default GPC handling, and Legitimate Interest validity. Eight
        groups are built in:
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
          <tr><td><code>opt-in</code></td><td>Opt-in (GDPR)</td><td>GDPR, UK-GDPR, nFADP, KVKK, PDPA-TH</td></tr>
          <tr><td><code>opt-out</code></td><td>Opt-out (US state laws)</td><td>CCPA, VCDPA, CPA-CO, 15 other US state laws</td></tr>
          <tr><td><code>opt-out-strict</code></td><td>Opt-out strict</td><td>CPRA / California — GPC mandatory</td></tr>
          <tr><td><code>opt-in-dpdpa</code></td><td>Opt-in (India)</td><td>DPDPA — no Legitimate Interest</td></tr>
          <tr><td><code>opt-in-china</code></td><td>Opt-in (China)</td><td>PIPL, DSL, CSL — strict opt-in</td></tr>
          <tr><td><code>opt-in-brazil</code></td><td>Opt-in (Brazil)</td><td>LGPD</td></tr>
          <tr><td><code>general-privacy-consent</code></td><td>General consent</td><td>PIPEDA, POPIA, APPI, PDPA-SG/MY, 40+ others</td></tr>
          <tr><td><code>notice-only</code></td><td>Notice only</td><td>Jurisdictions with notice but no consent mandate</td></tr>
        </tbody>
      </table>
      <p>
        The backend maps each visitor to a group via the embedded 190+ country/territory map (see{' '}
        <Link href="/docs/compliance/jurisdiction-coverage-map/">
          Jurisdiction Coverage Map
        </Link>
        ), then serves whichever profile is <em>active</em> for that group.
      </p>

      <h3>Custom compliance groups</h3>
      <p>
        Need a Compliance Group that doesn&apos;t map to any of the 8 — a bespoke internal policy, an
        A/B test variant, a jurisdiction not yet in the map? Set{' '}
        <code>customComplianceGroup</code> on the profile instead of one of the 8 built-in IDs, and
        target it from the widget by setting <code>compliance.type</code> to that same free-form,
        lower-kebab-case string. Requires API mode (<code>api.enabled: true</code>) — there is no
        client-side equivalent.
      </p>

      <Callout type="tip">
        The backend automatically resolves the best profile per visitor via geo-routing — you
        rarely need to hardcode a profile ID on the frontend. See{' '}
        <Link href="/guides/backend/geo-routing/">Geo-Routing &amp; Auto-Detection</Link>.
      </Callout>
      <p>
        Prefer to manage profiles as code instead of clicking through the UI? Everything the
        dashboard does is also available over REST — see{' '}
        <Link href="/docs/api/routes/admin/">Admin Routes</Link> (<code>POST /profiles</code>,{' '}
        <code>PUT /profiles/:id</code>, <code>POST /profiles/:id/activate</code>, …).
      </p>
    </>
  )
}

async function Step4InstallFrontend() {
  return (
    <>
      <p>
        Same three install options as the frontend-only tutorial — pick whichever matches your
        client project.
      </p>

      <h3>Option A — npm (recommended)</h3>
      <Terminal code="npm install @consenti/ui" />

      <h3>Option B — CDN / UMD (no build step)</h3>
      <CodeBlock
        lang="html"
        filename="index.html"
        code={`<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
<script>
  const { ConsentiSetup } = ConsentiUI
  new ConsentiSetup({ api: { enabled: true, baseUrl: 'https://your-site.com' } })
</script>`}
      />

      <h3>Option C — ESM in the browser (no bundler)</h3>
      <CodeBlock
        lang="html"
        filename="index.html"
        code={`<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({ api: { enabled: true, baseUrl: 'https://your-site.com' } })
</script>`}
      />

      <p>
        Install this on the client — or the same app, for a full-stack framework like Next.js.
      </p>
    </>
  )
}

async function Step5ConfigureFrontend() {
  return (
    <>
      <p>
        Point the widget at your backend. The compliance group is resolved automatically per
        visitor via <code>/resolve-profile</code> — no need to hardcode it:
      </p>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com', // where your backend is mounted
  },
})

widget.onReady(() => {
  if (widget.isCookieGranted('analytics')) initAnalytics()
})`}
      />
      <Callout type="info">
        If the API request fails (network error, server down), the widget automatically falls back
        to the matching pre-built profile — it never breaks the page.
      </Callout>
      <p>
        Already configured a custom <code>geoDataProvider</code> in{' '}
        <Link href="/guides/tutorials/backend/configure-backend/">Configure Backend</Link>? Nothing
        changes here — the frontend always delegates resolution to whatever the backend decides.
      </p>
    </>
  )
}

async function Step6Events() {
  return (
    <>
      <p>
        Both halves fire their own typed events. Subscribe to whichever your integration needs —
        each snippet is independent.
      </p>

      <h2>Frontend events (widget.on)</h2>

      <h3>consentSubmitted</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('consentSubmitted', ({ consentJson, visitorId, apiResponse }) => {
  console.log('Saved server-side as:', apiResponse.id, 'for visitor', visitorId)
})`}
      />

      <h3>bannerInitialized / bannerVisibility / modalVisibility</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('bannerInitialized', ({ complianceGroup, willShow }) => {
  console.log('Compliance group:', complianceGroup, '— will show banner:', willShow)
})

widget.on('bannerVisibility', ({ visible, variant }) => {
  console.log(variant, 'banner is now', visible ? 'visible' : 'hidden')
})

widget.on('modalVisibility', ({ visible }) => {
  console.log('Preference modal is now', visible ? 'open' : 'closed')
})`}
      />

      <h3>consentBeingSubmitted / parentalConsentRequired</h3>
      <CodeBlock
        lang="ts"
        code={`widget.on('consentBeingSubmitted', ({ consentAction }) => {
  console.log('About to save:', consentAction) // fires before the API call
})

widget.on('parentalConsentRequired', ({ parentalConsentToken, visitorId }) => {
  sendParentalConsentEmail(visitorId, parentalConsentToken)
})`}
      />
      <p>
        Full payload shapes in the <Link href="/docs/ui/events/">UI Events</Link> reference.
      </p>

      <h2>Backend events (eventBus)</h2>
      <p>
        <code>createConsenti()</code> returns an <code>eventBus</code> — a standard Node.js{' '}
        <code>EventEmitter</code> — for hooking into every data lifecycle step without touching
        routes.
      </p>

      <h3>consent:created / consent:updated / consent:erased</h3>
      <CodeBlock
        lang="ts"
        code={`const { eventBus } = createConsenti({ /* ... */ })

eventBus.on('consent:created', (record) => {
  console.log('New consent record:', record.visitorId)
})
eventBus.on('consent:updated', ({ previous, current }) => {
  console.log('Consent changed for', current.visitorId)
})
eventBus.on('consent:erased', ({ visitorId }) => {
  myDmpClient.deleteVisitor(visitorId) // GDPR right-to-erasure fired
})`}
      />

      <h3>visitor:created</h3>
      <CodeBlock
        lang="ts"
        code={`eventBus.on('visitor:created', (visitor) => {
  console.log('New visitor in region:', visitor.region ?? 'unknown')
})`}
      />

      <h3>profile:created / profile:updated / profile:deleted</h3>
      <CodeBlock
        lang="ts"
        code={`eventBus.on('profile:created', (profile) => {
  console.log('New profile:', profile.id, 'v' + profile.version)
})
eventBus.on('profile:updated', ({ previous, current }) => {
  console.log('Profile', current.id, 'bumped to v' + current.version)
})
eventBus.on('profile:deleted', ({ id, previous }) => {
  console.log('Profile deleted:', id, '(was v' + previous.version + ')')
})`}
      />

      <h3>cache:warm / cache:purge — CDN invalidation</h3>
      <CodeBlock
        lang="ts"
        code={`eventBus.on('cache:warm', ({ paths }) => {
  for (const p of paths) cdnClient.warmPath(p)
})
eventBus.on('cache:purge', ({ paths }) => {
  for (const p of paths) cdnClient.purge(p)
})`}
      />

      <h3>ready</h3>
      <CodeBlock
        lang="ts"
        code={`// Promise form (preferred for startup sequencing)
await consenti.ready
server.listen(3000)

// Event form (fire-and-forget side effects)
eventBus.on('ready', () => console.log('[consenti] backend ready'))`}
      />
      <p>
        Full reference for every event and payload shape in{' '}
        <Link href="/docs/api/events/">API Events</Link>.
      </p>
    </>
  )
}

async function Step7GateScript() {
  return (
    <>
      <p>
        Everything from the frontend-only tutorial works identically here — gating reacts to the
        widget&apos;s own consent state, whether or not the backend is connected. Pick whichever
        fits what you&apos;re gating.
      </p>

      <h3>ConsentScript — inject/remove a &lt;script&gt; tag, keyed to one cookie</h3>
      <CodeBlock
        lang="ts"
        code={`import { ConsentScript } from '@consenti/ui'

new ConsentScript({
  cookieId: 'analytics',
  widget,
  src: 'https://cdn.example.com/analytics.js',
  onLoad: () => console.log('Analytics loaded'),
  onRevoke: () => console.log('Analytics removed'),
})`}
      />

      <h3>CategoryScript — same, keyed to a whole category</h3>
      <CodeBlock
        lang="ts"
        code={`import { CategoryScript } from '@consenti/ui'

new CategoryScript({
  categoryId: 'marketing',
  widget,
  src: 'https://example.com/ad-pixel.js',
})`}
      />

      <h3>ConsentAction / CategoryAction — callback instead of a script tag</h3>
      <CodeBlock
        lang="ts"
        code={`import { ConsentAction, CategoryAction } from '@consenti/ui'

new ConsentAction({
  id: 'analytics',
  widget,
  onGrant: () => analyticsSdk.optIn(),
  onDeny: () => analyticsSdk.optOut(),
})

new CategoryAction({
  id: 'marketing',
  widget,
  onGrant: () => adSdk.enableAll(),
  onDeny: () => adSdk.disableAll(),
})`}
      />

      <h3>scanConsentScripts — declarative, zero-JS gating</h3>
      <CodeBlock
        lang="html"
        code={`<script type="text/plain" data-consenti-category-script="marketing" src="https://example.com/pixel.js"></script>`}
      />
      <CodeBlock lang="ts" code={`import { scanConsentScripts } from '@consenti/ui'

scanConsentScripts(widget)`}
      />

      <h2>Bonus — the same pattern on the backend</h2>
      <p>
        Since a backend is connected in this tutorial, you can react to grant/deny transitions
        server-side too — useful for server-only integrations (a CRM, an ad platform&apos;s
        server-to-server API) that have no <code>&lt;script&gt;</code> tag to gate. There is no
        server equivalent of <code>ConsentScript</code>/<code>CategoryScript</code> — injecting a
        tag only makes sense in a browser DOM the server doesn&apos;t have.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { createConsenti, ConsentAction, CategoryAction } from '@consenti/api'

const { eventBus, services } = createConsenti({ /* ... */ })

new ConsentAction({
  id: 'analytics',
  eventBus,
  onGrant: ({ visitorId }) => crm.optIn(visitorId),
  onDeny: ({ visitorId }) => crm.optOut(visitorId),
})

new CategoryAction({
  categoryId: 'marketing',
  eventBus,
  profiles: services.profile, // resolves the category's cookie ids per profile
  onGrant: ({ visitorId }) => adsPlatform.optIn(visitorId),
  onDeny: ({ visitorId }) => adsPlatform.optOut(visitorId),
})`}
      />
      <p>
        Full reference in <Link href="/docs/ui/events/">UI Events</Link> and{' '}
        <Link href="/docs/api/events/">API Events</Link>.
      </p>
    </>
  )
}

async function Step8ConnectVerify() {
  return (
    <>
      <p>Submit consent from the banner, then confirm it was persisted server-side two ways:</p>
      <p>
        <strong>1. In the dashboard</strong> — open the <strong>Consents</strong> section at{' '}
        <code>http://localhost:3001/consenti/</code>. The new record appears immediately, with the
        full per-visitor history.
      </p>
      <p>
        <strong>2. Over the API</strong> — grab <code>visitorId</code> from the{' '}
        <code>consentSubmitted</code> event and query it directly:
      </p>
      <CodeBlock
        lang="bash"
        code={`curl http://localhost:3001/consenti/api/v1/consent/<visitorId>`}
      />
      <Callout type="tip">
        Nothing showing up? Double-check <code>api.baseUrl</code> matches where the backend is
        actually mounted, and that CORS allows your frontend origin — see{' '}
        <Link href="/docs/api/advanced-configuration/">API Advanced Configuration</Link>.
      </Callout>
    </>
  )
}

async function Step9ShipIt() {
  return (
    <>
      <p>
        Override any CSS custom property to match your brand — no Shadow DOM, your stylesheet
        applies directly:
      </p>
      <CodeBlock
        lang="css"
        code={`:root {
  --consenti-color-bg: #ffffff;
  --consenti-color-primary: #1565c0;
  --consenti-border-radius-btn: 6px;
  --consenti-border-radius: 12px;
}`}
      />
      <p>Using React or Next.js on the frontend? Wrap the widget in a small effect-based component:</p>
      <CodeBlock
        lang="tsx"
        filename="ConsentSetup.tsx"
        code={`'use client'
import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({
      api: { enabled: true, baseUrl: 'https://your-site.com' },
    })
    return () => widget.destroy()
  }, [])
  return null
}`}
      />

      <h2>What to read next</h2>
      <ul>
        <li>
          <Link href="/docs/api/advanced-configuration/">API Configuration</Link> — storage
          drivers, auth modes, all options
        </li>
        <li>
          <Link href="/docs/api/routes/">API Routes</Link> — every public and admin endpoint
        </li>
        <li>
          <Link href="/docs/api/plugins/">API Plugins</Link> — BigQuery, Segment, Snowflake
        </li>
        <li>
          <Link href="/guides/backend/webhooks/">Webhook Integration</Link> — forward consent
          decisions to your own endpoint via <code>eventBus</code>
        </li>
        <li>
          <Link href="/docs/compliance/gdpr/">Compliance guides</Link> — what each group requires
        </li>
        <li>
          <Link href="/guides/examples/">Examples</Link> — complete real-life integrations
        </li>
      </ul>
    </>
  )
}

export const BACKEND_TUTORIAL_CONTENT = [
  Step1InstallBackend,
  Step2ConfigureBackend,
  Step3UpdateProfiles,
  Step4InstallFrontend,
  Step5ConfigureFrontend,
  Step6Events,
  Step7GateScript,
  Step8ConnectVerify,
  Step9ShipIt,
]
