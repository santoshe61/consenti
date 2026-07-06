import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Quick Start' }

interface QuickStartPageProps {
  searchParams: Promise<{ path?: string }>
}

export default async function QuickStartPage({ searchParams }: QuickStartPageProps) {
  const { path } = await searchParams
  const activePath = path === 'frontend' ? 'frontend' : path === 'both' ? 'both' : null

  if (!activePath) {
    return <PathChooser />
  }

  return (
    <div className="prose max-w-none">
      {/* Path switcher pill */}
      <div className="not-prose flex items-center gap-3 mb-6 p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl">
        <span className="text-sm text-slate-500 dark:text-gray-400">Showing:</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">
          {activePath === 'frontend' ? 'Frontend Only' : 'Frontend + Backend'}
        </span>
        <Link
          href="/docs/getting-started/quick-start/"
          className="ml-auto text-xs text-brand-600 hover:text-brand-700 font-medium no-underline"
        >
          Change →
        </Link>
      </div>

      {activePath === 'frontend' ? <FrontendPath /> : <BothPath />}
    </div>
  )
}

function PathChooser() {
  return (
    <div className="prose max-w-none">
      <h1>Quick Start</h1>
      <p className="lead">
        How do you want to use Consenti? Pick the setup that fits your project.
      </p>

      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
        {/* Frontend Only card */}
        <Link
          href="?path=frontend"
          className="group block no-underline rounded-2xl border-2 border-slate-200 dark:border-gray-700 p-6 hover:border-brand-400 hover:shadow-md transition-all bg-white dark:bg-gray-800"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/20 flex items-center justify-center mb-4 text-xl">
            🌐
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">Frontend Only</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            Drop in the widget. Consent stays in the browser — no server needed.
          </p>
          <ul className="text-sm text-slate-600 dark:text-gray-300 space-y-1.5 mb-5">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Banner + preference modal</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> GDPR, CCPA &amp; 8 compliance groups</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Consent stored in browser cookie</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> No server, no database</li>
          </ul>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
            Start with Frontend Only →
          </span>
        </Link>

        {/* Both card */}
        <Link
          href="?path=both"
          className="group block no-underline rounded-2xl border-2 border-slate-200 dark:border-gray-700 p-6 hover:border-brand-400 hover:shadow-md transition-all bg-white dark:bg-gray-800"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-700/20 flex items-center justify-center mb-4 text-xl">
            🖥️
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">Frontend + Backend</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            Widget + Node.js backend + admin dashboard. Manage profiles without redeploying.
          </p>
          <ul className="text-sm text-slate-600 dark:text-gray-300 space-y-1.5 mb-5">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Everything in Frontend Only, plus…</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Admin dashboard to manage profiles</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Server-side consent records + audit log</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Geo-routing — right profile per country</li>
          </ul>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
            Start with Frontend + Backend →
          </span>
        </Link>
      </div>

      <p className="mt-6 text-sm text-slate-400 dark:text-gray-500 text-center">
        Not sure? Start with Frontend Only — you can add the backend later without changing your frontend code.
      </p>
    </div>
  )
}

async function FrontendPath() {
  return (
    <>
      <h1>Quick Start — Frontend Only</h1>
      <p>
        The widget works standalone with zero backend. Profiles are pre-built and load
        automatically. Consent is stored in a browser cookie.
      </p>

      <h2>1. Install</h2>
      <Terminal code="npm install @consenti/ui" />

      <h2>2. Add to your app</h2>
      <p>
        Pass an empty config and Consenti auto-detects the right compliance group from the
        browser&apos;s locale — GDPR for EU visitors, CCPA for California, etc.
      </p>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({})
// A banner appears on first visit. That's it.`}
      />

      <Callout type="tip">
        Want a specific compliance mode instead of auto-detect? Pass{' '}
        <code>compliance: {'{ type: \'opt-in\' }'}</code> for GDPR or{' '}
        <code>compliance: {'{ type: \'opt-out\' }'}</code> for CCPA.
      </Callout>

      <h2>3. React to consent</h2>
      <p>
        Gate analytics or advertising code behind consent. Check on page load for returning
        visitors, and listen for new submissions.
      </p>
      <CodeBlock
        lang="ts"
        code={`const widget = new ConsentiSetup({})

// Returning visitors — check existing consent on load
widget.onReady(() => {
  if (widget.isCookieGranted('analytics')) initAnalytics()
  if (widget.isCookieGranted('marketing')) initAds()
})

// New submission this session
widget.on('consentSubmitted', ({ consent }) => {
  if (consent.analytics === 'granted') initAnalytics()
})`}
      />

      <Callout type="info">
        That&apos;s enough to be GDPR-compliant. The sections below are optional improvements.
      </Callout>

      <h2>Optional: React / Next.js</h2>
      <CodeBlock
        lang="tsx"
        filename="ConsentSetup.tsx"
        code={`'use client'
import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({})
    return () => widget.destroy()
  }, [])
  return null
}`}
      />

      <h2>Optional: GTM / Google Consent Mode v2</h2>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  utils: {
    gtm: { containerId: 'GTM-XXXXXX', adsDataRedaction: true },
  },
})`}
      />

      <hr />

      <h2>What to read next</h2>
      <ul>
        <li><a href="/docs/ui/configuration/">UI Configuration</a> — every <code>ConsentiSetup</code> option</li>
        <li><a href="/docs/ui/profiles/">Profiles</a> — customize the banner copy, buttons, and cookie categories</li>
        <li><a href="/docs/ui/frameworks/">Frameworks</a> — React, Vue, Angular, Next.js, Nuxt integration</li>
        <li><a href="/docs/ui/events/">Events</a> — all <code>consenti:</code> events and payloads</li>
        <li><a href="/docs/ui/methods/">API Methods</a> — every widget method with examples</li>
        <li><a href="/docs/compliance/gdpr/">Compliance guides</a> — what each group requires</li>
        <li><a href="/docs/getting-started/quick-start/?path=both">Switch to Frontend + Backend →</a></li>
      </ul>
    </>
  )
}

async function BothPath() {
  return (
    <>
      <h1>Quick Start — Frontend + Backend</h1>
      <p>
        The backend module records consent server-side and serves an admin dashboard.
        Profiles are managed through the UI — no code changes needed to update copy or buttons.
      </p>

      <h2>1. Install</h2>
      <Terminal code={`# On your backend (Node.js app)
npm install @consenti/api

# On your frontend (or same app for Next.js / Nuxt)
npm install @consenti/ui`} />

      <h2>2. Start the backend</h2>
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

      <Callout type="info">
        The default <code>json</code> driver works with zero installation. Switch to{' '}
        <code>node:sqlite</code> (Node 22.5+) or <code>postgresql</code> / <code>mysql</code> /
        {' '}<code>mongodb</code> before going to production.
        See <a href="/docs/api/configuration/">API Configuration</a> for all storage options.
      </Callout>

      <p>Using Express?</p>
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

      <h2>3. Create a profile in the dashboard</h2>
      <p>
        Open <code>http://localhost:3001/consenti/</code>, log in, and create a profile for each
        compliance group your site needs. The backend automatically resolves the best profile
        per visitor via geo-routing.
      </p>

      <h2>4. Connect the frontend</h2>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

const widget = new ConsentiSetup({
  api: {
    enabled: true,
    baseUrl: 'https://your-site.com', // where your backend is mounted
  },
  // compliance group resolved automatically per visitor via /resolve-profile
})

widget.onReady(() => {
  if (widget.isCookieGranted('analytics')) initAnalytics()
})`}
      />

      <Callout type="info">
        If the API request fails (network error, server down), the widget automatically falls back
        to the matching pre-built profile — it never breaks the page.
      </Callout>

      <hr />

      <h2>What to read next</h2>
      <ul>
        <li><a href="/docs/api/configuration/">API Configuration</a> — storage drivers, auth modes, all options</li>
        <li><a href="/docs/ui/configuration/">UI Configuration</a> — every <code>ConsentiSetup</code> option</li>
        <li><a href="/docs/ui/profiles/">Profiles</a> — customize banner, modal, and cookie categories</li>
        <li><a href="/docs/ui/frameworks/">Frameworks</a> — React, Vue, Angular, Next.js, Nuxt</li>
        <li><a href="/docs/compliance/gdpr/">Compliance guides</a> — what each group requires</li>
        <li><a href="/docs/getting-started/quick-start/?path=frontend">Switch to Frontend Only →</a></li>
      </ul>
    </>
  )
}
