import Link from 'next/link'
import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'

export const metadata: Metadata = { title: 'Plugins Overview' }

export default function PluginsOverviewPage() {
  return (
    <div className="prose max-w-none">
      <h1>Plugin System</h1>
      <p>
        Plugins extend the Consenti backend with custom lifecycle hooks. They run server-side,
        are instantiated once per <code>createConsenti()</code> call, and can access the full storage adapter.
      </p>

      <h2>Plugin contract</h2>
      <CodeBlock lang="ts" code={`import { ConsentiServerPlugin } from '@consenti/api'
import type { ConsentDbRecord, CreateConsentInput, PluginContext } from '@consenti/api'

export class MyPlugin extends ConsentiServerPlugin {
  name = 'my-plugin'

  async initialize(ctx: PluginContext): Promise<void> {
    // Called once after storage.connect() resolves.
    // ctx.storage gives you the full StorageAdapter.
    // ctx.config gives you the server config.
  }

  async destroy(): Promise<void> {
    // Called on graceful shutdown — close connections, clear timers.
  }

  // ── Optional hooks ──────────────────────────────────────────────────────────

  async beforeConsentSave(data: CreateConsentInput): Promise<CreateConsentInput> {
    return data  // mutate or validate before DB write
  }

  async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    // fires after consent is persisted — perfect for webhooks, analytics
  }

  async afterConsentUpdate(record: ConsentDbRecord): Promise<void> {
    // fires after PUT /consent/:visitorId
  }
}`} />

      <h2>Registering plugins</h2>
      <CodeBlock lang="ts" code={`import { createConsenti } from '@consenti/api'
import { WebhookPlugin } from '@consenti-plugin-webhook'
import { SlackPlugin } from '@consenti-plugin-slack'

const app = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  plugins: [
    new WebhookPlugin('https://your-endpoint.example.com/hook'),
    new SlackPlugin({ webhookUrl: process.env.SLACK_WEBHOOK }),
  ],
})`} />

      <h2>Available hooks</h2>
      <table>
        <thead>
          <tr><th>Hook</th><th>When it fires</th></tr>
        </thead>
        <tbody>
          <tr><td><code>initialize(ctx)</code></td><td>After storage.connect() resolves — once at startup</td></tr>
          <tr><td><code>destroy()</code></td><td>On graceful shutdown</td></tr>
          <tr><td><code>beforeConsentSave(data)</code></td><td>Before a new consent record is written — can mutate the payload</td></tr>
          <tr><td><code>afterConsentSave(record)</code></td><td>After a new consent record is persisted</td></tr>
          <tr><td><code>beforeConsentUpdate(data)</code></td><td>Before an existing consent record is updated</td></tr>
          <tr><td><code>afterConsentUpdate(record)</code></td><td>After an existing consent record is updated</td></tr>
          <tr><td><code>beforeProfileFetch(id)</code></td><td>Before a profile is fetched — can redirect to a different profile ID</td></tr>
          <tr><td><code>afterProfileFetch(profile)</code></td><td>After a profile is fetched — can mutate the profile</td></tr>
          <tr><td><code>beforeUserCreate(data)</code></td><td>Before an admin user is created</td></tr>
          <tr><td><code>afterUserCreate(user)</code></td><td>After an admin user is created</td></tr>
        </tbody>
      </table>

      <h2>Error handling</h2>
      <p>
        If a plugin throws in any hook, Consenti logs the error with <code>console.warn</code> and continues —
        a broken plugin never blocks consent from being recorded.
      </p>

      <h2>Official plugins</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose mt-4">
        {[
          { href: '/docs/plugins/bigquery/', name: 'BigQuery', desc: 'Stream consent records to Google BigQuery for analytics', pkg: '@consenti-plugin-bigquery' },
          { href: '/docs/plugins/segment/', name: 'Segment', desc: 'Fire Consent Given events to Segment / Twilio Engage', pkg: '@consenti-plugin-segment' },
          { href: '/docs/plugins/snowflake/', name: 'Snowflake', desc: 'Load consent records into Snowflake data warehouse', pkg: '@consenti-plugin-snowflake' },
        ].map((p) => (
          <Link key={p.href} href={p.href} className="block p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition-all no-underline">
            <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
            <div className="text-xs text-slate-500 mt-1 mb-2">{p.desc}</div>
            <code className="text-xs text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded">{p.pkg}</code>
          </Link>
        ))}
      </div>

      <h2>Community plugins</h2>
      <p>
        Publish your own under any package name. The only requirement is extending <code>ConsentiServerPlugin</code>
        and declaring <code>@consenti/api</code> as a peer dependency.
      </p>
      <CodeBlock lang="json" filename="package.json" code={`{
  "name": "@your-scope/consenti-plugin-custom",
  "peerDependencies": {
    "@consenti/api": ">=0.1.0"
  }
}`} />
    </div>
  )
}
