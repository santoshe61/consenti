import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'API Configuration',
  description:
    'createConsenti(config) accepts a single configuration object. This page covers the handful of options most developers need to set.',
  alternates: { canonical: 'https://consenti.dev/docs/api/configuration' },
  openGraph: {
    title: 'API Configuration',
    description:
      'createConsenti(config) accepts a single configuration object. This page covers the handful of options most developers need to set.',
    url: 'https://consenti.dev/docs/api/configuration',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Configuration',
    description:
      'createConsenti(config) accepts a single configuration object. This page covers the handful of options most developers need to set.',
    images: ['/og-image.jpg'],
  },
}

export default function APIConfigurationPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Configuration</h1>
      <p>
        <code>createConsenti(config)</code> accepts a single configuration object. Every field is
        optional — calling it with an empty object is valid and gives you a running server
        immediately. This page covers the handful of options most deployments need.
      </p>

      <h2>Minimal config to get started</h2>
      <p>
        This is all you need. Copy it, set your password via an env var, and you have a working
        server with admin dashboard.
      </p>
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
// Admin → http://localhost:3001/consenti/
// API   → http://localhost:3001/consenti/api/v1/`}
      />

      <Callout type="warning">
        The <code>json</code> driver stores data in memory and flushes to disk. It is fine for
        development, but <strong>switch to SQLite or a server database before production</strong>.
        See <a href="/docs/api/advanced-configuration/#storage">storage</a> in the advanced
        reference.
      </Callout>

      <h2>The options you'll change first</h2>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Default</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>storage.driver</code>
            </td>
            <td>
              <code>'json'</code>
            </td>
            <td>
              Database engine — <code>json</code> for dev, SQLite/PostgreSQL/MySQL/MongoDB for
              production.
            </td>
          </tr>
          <tr>
            <td>
              <code>auth.mode</code>
            </td>
            <td>
              <code>'local'</code>
            </td>
            <td>
              Admin dashboard authentication — <code>local</code>, <code>jwt</code>,{' '}
              <code>oidc</code>, <code>saml</code>, or <code>custom</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>dashboard</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Serve the built-in Preact admin SPA at <code>basePath</code>.
            </td>
          </tr>
          <tr>
            <td>
              <code>compliance.type</code>
            </td>
            <td>
              <code>'auto'</code>
            </td>
            <td>
              Pin one of the 8 built-in compliance groups instead of geo-detecting — see the{' '}
              <a href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</a>{' '}
              for every country and its assigned group.
            </td>
          </tr>
          <tr>
            <td>
              <code>basePath</code>
            </td>
            <td>
              <code>'/consenti'</code>
            </td>
            <td>URL prefix for all Consenti routes.</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        This page covers the common cases. For every field — storage drivers, all five auth modes,
        rate limiting, S3 sync, plugins, TCF, age gate, data retention, and more — see the{' '}
        <a href="/docs/api/advanced-configuration/">Advanced Configuration reference</a>.
      </Callout>
    </div>
  )
}
