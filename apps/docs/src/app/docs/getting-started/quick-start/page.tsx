import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Quick Start' }

export default function QuickStartPage() {
  return (
    <div className="prose max-w-none">
      <h1>Quick Start</h1>
      <p>
        Pick the path that matches your setup. Both are complete — no prior reading needed.
      </p>

      <hr />

      <h2>Path A — Frontend only (no backend)</h2>
      <p>
        Consent stays in the browser. Profiles are defined in code.
        No server required.
      </p>

      <h3>1. Install</h3>
      <Terminal code="npm install @consenti/ui" />

      <h3>2. Zero-config (built-in GDPR profile)</h3>
      <p>
        The shortest path. The widget shows a fully working GDPR banner using the built-in
        default profile covering the four Google Consent Mode v2 purposes.
      </p>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

new ConsentiSetup({ core: { regulation: 'gdpr' } })`}
      />

      <h3>2 (alt). Custom profile</h3>
      <p>
        Use <code>ConsentiProfile</code> when you want your own cookie purposes, copy, or
        categories. Define it once before the widget initialises.
      </p>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiProfile, ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

const profile = new ConsentiProfile({
  defaultLocale: 'en',
  cookies: [
    { id: 'necessary',  mandatory: true },
    { id: 'analytics',  listenGpc: true, expiry: 365 },
    { id: 'marketing',  listenGpc: true, expiry: 365 },
  ],
  translations: {
    en: {
      mainBanner: {
        position: 'bottom',
        heading: 'We value your privacy',
        htmlText: 'We use cookies to improve your experience.',
        buttons: [
          { text: 'Accept All',         style: 'primary',   action: 'custom', cookies: '*' },
          { text: 'Reject Optional',         style: 'secondary', action: 'custom', cookies: '!' },
          { text: 'Customize', style: 'secondary', action: 'manage' },
        ],
      },
      preferenceModal: {
        heading: 'Cookie Preferences',
        subheading: 'Choose which cookies you allow.',
        showClose: true,
        overlayOpacity: 50,
        buttons: [
          { text: 'Accept All',       style: 'primary', action: 'custom', cookies: '*' },
          { text: 'Save Preferences', style: 'primary', action: 'submit' },
          { text: 'Reject Optional',       style: 'text',    action: 'custom', cookies: '!' },
        ],
        categories: [
          {
            id: 'cat-necessary',
            heading: 'Strictly Necessary',
            htmlText: 'Required for the site to function.',
            mandatory: true,
            cookies: ['necessary'],
          },
          {
            id: 'cat-analytics',
            heading: 'Analytics',
            htmlText: 'Helps us understand how visitors use the site.',
            cookies: ['analytics'],
          },
          {
            id: 'cat-marketing',
            heading: 'Marketing',
            htmlText: 'Used to deliver relevant ads.',
            cookies: ['marketing'],
          },
        ],
      },
    },
  },
})

new ConsentiSetup({
  core: { profileId: profile.getId(), regulation: 'gdpr' },
})`}
      />

      <h3>3. Listen for consent</h3>
      <p>
        Gate third-party scripts behind user consent by listening to{' '}
        <code>consenti:consentSubmitted</code>. Also check on page load via{' '}
        <code>onReady</code> for returning visitors who already have consent.
      </p>
      <CodeBlock
        lang="ts"
        code={`const widget = new ConsentiSetup({ core: { regulation: 'gdpr' } })

// Returning visitors — consent already stored
widget.onReady(() => {
  const consent = widget.getConsent()
  if (consent?.analytics === 'granted') loadAnalytics()
  if (consent?.marketing === 'granted') loadAds()
})

// New consent submitted this session
window.addEventListener('consenti:consentSubmitted', (e) => {
  const { consentJson } = (e as CustomEvent).detail
  if (consentJson.analytics === 'granted') loadAnalytics()
  if (consentJson.marketing === 'granted') loadAds()
})`}
      />

      <Callout type="tip">
        Add a &quot;Cookie Settings&quot; link anywhere on your site and wire it to{' '}
        <code>widget.showModal()</code> — it opens the preference modal without re-showing the
        banner.
      </Callout>

      <h3>4. GTM / Google Consent Mode v2 (optional)</h3>
      <p>
        Add your container ID and Consenti handles all dataLayer pushes automatically.
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: { regulation: 'gdpr' },
  utils: {
    gtm: {
      containerId: 'GTM-XXXXXX',
      urlPassthrough: true,   // cookieless conversion modelling
      adsDataRedaction: true, // redact ad pings when denied
    },
  },
})`}
      />

      <hr />

      <h2>Path B — With backend</h2>
      <p>
        Consent records are stored server-side. Profiles are managed in the admin dashboard —
        no code changes needed to update copy or buttons.
      </p>

      <h3>1. Install both packages</h3>
      <Terminal code={`
# 1. If your frontend and backend is separate nodejs app
# For example Express backend and vue/react/plain html etc. frontend

# On backend app
npm install @consenti/api  # server-side only

# On frontend app
npm install @consenti/ui

# OR

# 2. If your frontend and backend is same nodejs app
# For example Next / Nuxt etc. app

npm install @consenti/ui
npm install @consenti/api


`} />

      <h3>2. Start the backend</h3>
      <CodeBlock
        lang="ts"
        filename="server.ts"
        code={`import { createConsenti } from '@consenti/api'
import http from 'node:http'

const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@yoursite.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

http.createServer(consenti.handler).listen(3001)
// Admin dashboard → http://localhost:3001/consenti/
// REST API        → http://localhost:3001/consenti/api/v1/`}
      />

      <p>Using Express?</p>
      <CodeBlock
        lang="ts"
        filename="app.ts"
        code={`import express from 'express'
import { createConsenti } from '@consenti/api'

const app = express()
const consenti = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  dashboard: true,
})

app.use(consenti.router)  // mounts at /consenti/
app.listen(3000)`}
      />

      <h3>3. Create a profile in the dashboard</h3>
      <p>
        Open <code>/consenti/</code>, log in, and create a profile. Copy its numeric ID from
        the Profiles list — you will pass it to <code>core.profileId</code>.
      </p>

      <h3>4. Connect the frontend</h3>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'

const widget = new ConsentiSetup({
  core: { profileId: 3, regulation: 'gdpr' }, // ID from the dashboard
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com', // where the backend is mounted
  },
})

widget.onReady(() => {
  const consent = widget.getConsent()
  if (consent?.analytics === 'granted') loadAnalytics()
})`}
      />

      <Callout type="info">
        If the API request fails (network error, server down), the widget automatically falls back
        to the local profile registry and then to the built-in default — it never breaks the page.
      </Callout>

      <hr />

      <h2>What to read next</h2>
      <ul>
        <li><a href="/docs/ui/profiles/">Profiles</a> — full <code>ConsentiProfile</code> reference, multi-locale, <code>profileOverride</code></li>
        <li><a href="/docs/ui/configuration/">Configuration</a> — every <code>ConsentiSetup</code> option explained</li>
        <li><a href="/docs/ui/events/">Events</a> — all <code>consenti:</code> events and their detail payloads</li>
        <li><a href="/docs/ui/methods/">API Methods</a> — every widget method with examples</li>
        <li><a href="/docs/ui/frameworks/">Frameworks</a> — React, Vue, Angular, Next.js, Nuxt</li>
        <li><a href="/docs/api/configuration/">Backend configuration</a> — storage drivers, auth, RBAC</li>
      </ul>
    </div>
  )
}
