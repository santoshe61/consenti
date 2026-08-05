import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { RelatedDocs } from '@/components/RelatedDocs'
import { ExampleNav } from '@/components/ExampleNav'

export const metadata: Metadata = {
  title: 'Example — Multi-Region Site (GDPR + CCPA Geo-Routing)',
  description:
    'One backend serving both an opt-in EU profile and an opt-out US/CCPA profile, resolved automatically per visitor.',
  alternates: { canonical: '/guides/examples/multi-region-gdpr-ccpa' },
  openGraph: {
    title: 'Example — Multi-Region Site (GDPR + CCPA Geo-Routing)',
    description:
      'One backend serving both an opt-in EU profile and an opt-out US/CCPA profile, resolved automatically per visitor.',
    url: 'https://consenti.dev/guides/examples/multi-region-gdpr-ccpa',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Example — Multi-Region Site (GDPR + CCPA Geo-Routing)',
    description:
      'One backend serving both an opt-in EU profile and an opt-out US/CCPA profile, resolved automatically per visitor.',
    images: ['/og-image.jpg'],
  },
}

export default function MultiRegionExample() {
  return (
    <div className="prose max-w-none">
      <h1>Multi-Region Marketing Site — GDPR + CCPA Geo-Routing</h1>
      <p className="lead">
        One marketing site, visitors from the EU and California, two very different legal
        defaults — opt-in for the EU, opt-out for CCPA. A single widget snippet ships to every
        visitor; the backend decides which profile applies.
      </p>

      <h2>What this demonstrates</h2>
      <ul>
        <li><code>compliance: {'{ type: \'auto\' }'}</code> — the widget doesn&apos;t hardcode a region</li>
        <li>Two profiles managed independently in the dashboard, one per compliance group</li>
        <li>A geo resolver that maps country → compliance group without a network call per request</li>
      </ul>

      <h2>1. Backend — enable auto-detection</h2>
      <CodeBlock
        lang="ts"
        filename="server.ts"
        code={`import { createConsenti } from '@consenti/api'
import http from 'node:http'

const consenti = createConsenti({
  storage: { driver: 'postgresql', uri: process.env.DATABASE_URL, path: './consenti-data' },
  auth: {
    mode: 'local',
    adminEmail: 'admin@example.com',
    adminPassword: process.env.CONSENTI_ADMIN_PASSWORD!,
  },
  dashboard: true,
})

http.createServer(consenti.handler).listen(3001)`}
      />
      <p>
        <code>geoDataProvider</code> defaults to a free timezone + <code>Accept-Language</code>{' '}
        heuristic — no extra install needed to get started. For higher accuracy, install{' '}
        <code>geoip-lite</code> and switch drivers:
      </p>
      <CodeBlock
        lang="ts"
        code={`// npm install geoip-lite
createConsenti({
  // ...
  compliance: { type: 'auto', geoDataProvider: 'geoip' },
})`}
      />

      <h2>2. Dashboard — one profile per group</h2>
      <p>
        In <strong>Profiles</strong>, create two profiles from the built-in templates:
      </p>
      <ul>
        <li>
          <strong>EU / GDPR</strong> — opt-in type, banner defaults to <em>Reject Optional</em>{' '}
          being just as prominent as <em>Accept All</em>
        </li>
        <li>
          <strong>US / CCPA</strong> — opt-out type, banner defaults to cookies running until the
          visitor opts out via <em>Do Not Sell or Share My Personal Information</em>
        </li>
      </ul>
      <p>
        Activate both. The backend&apos;s geo-resolution pipeline picks the right one per visitor —
        no code change needed when you add a third region later (say, LGPD for Brazil).
      </p>

      <h2>3. Frontend — one snippet for every visitor</h2>
      <CodeBlock
        lang="tsx"
        filename="components/ConsentSetup.tsx"
        code={`'use client'
import { useEffect } from 'react'
import { ConsentiSetup } from '@consenti/ui'

export function ConsentSetup() {
  useEffect(() => {
    const widget = new ConsentiSetup({
      api: { enabled: true, baseUrl: 'https://your-site.com' },
      // No compliance.type set — resolved per visitor by the backend
    })
    return () => widget.destroy()
  }, [])
  return null
}`}
      />

      <Callout type="warning">
        Trusting a proxy&apos;s IP header (Cloudflare, an ALB) requires{' '}
        <code>trustedProxies</code> to be configured — otherwise geo-resolution falls back to
        timezone/locale only. See <code>trustedProxies</code> in{' '}
        <a href="/docs/api/advanced-configuration/">API Advanced Configuration</a>.
      </Callout>

      <RelatedDocs
        items={[
          { href: '/guides/backend/geo-routing/', label: 'Geo-Routing & Auto-Detection', desc: 'All four geoDataProvider resolvers compared' },
          { href: '/docs/compliance/gdpr/', label: 'GDPR (EU / EEA)', desc: 'What the opt-in group requires' },
          { href: '/docs/compliance/ccpa/', label: 'CCPA / US States', desc: 'What the opt-out group requires' },
        ]}
      />

      <ExampleNav currentSlug="multi-region-gdpr-ccpa" />
    </div>
  )
}
