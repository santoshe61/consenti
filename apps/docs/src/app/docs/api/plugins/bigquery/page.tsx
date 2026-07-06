import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'BigQuery Plugin' }

export default function BigQueryPluginPage() {
  return (
    <div className="prose max-w-none">
      <h1>BigQuery Plugin</h1>
      <p>Stream consent records to Google BigQuery for analytics and compliance reporting.</p>

      <h2>Installation</h2>
      <Terminal code="npm install @google-cloud/bigquery" />

      <h2>Configuration</h2>
      <CodeBlock lang="ts" code={`import { BigQueryPlugin } from '@consenti/api/plugins'

createConsenti({
  plugins: [
    new BigQueryPlugin({
      projectId: 'my-gcp-project',
      datasetId: 'consenti',
      tableId: 'consent_records',
      keyFilename: '/path/to/service-account.json',
    }),
  ],
})`} />

      <h2>What gets streamed</h2>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>visitor_id</code></td><td>STRING</td><td>Anonymous visitor UUID</td></tr>
          <tr><td><code>profile_id</code></td><td>STRING</td><td>Cookie profile ID</td></tr>
          <tr><td><code>profile_version</code></td><td>INTEGER</td><td>Version at time of consent</td></tr>
          <tr><td><code>tenant_id</code></td><td>STRING</td><td>Tenant slug</td></tr>
          <tr><td><code>consent_json</code></td><td>JSON</td><td>Full consent choices</td></tr>
          <tr><td><code>source</code></td><td>STRING</td><td><code>banner</code>, <code>api</code>, or <code>import</code></td></tr>
          <tr><td><code>gpc_detected</code></td><td>BOOLEAN</td><td>Whether GPC signal was present</td></tr>
          <tr><td><code>created_at</code></td><td>TIMESTAMP</td><td>ISO 8601 timestamp</td></tr>
        </tbody>
      </table>

      <h2>Recommended BigQuery schema</h2>
      <CodeBlock lang="sql" code={`CREATE TABLE \`project.consenti.consent_records\` (
  visitor_id STRING NOT NULL,
  profile_id STRING NOT NULL,
  profile_version INT64 NOT NULL,
  tenant_id STRING NOT NULL,
  consent_json JSON,
  source STRING,
  gpc_detected BOOL,
  created_at TIMESTAMP NOT NULL
)
PARTITION BY DATE(created_at)
CLUSTER BY tenant_id, profile_id;`} />

      <h2>Building a custom BigQuery plugin</h2>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin } from '@consenti/api'
import type { ConsentDbRecord } from '@consenti/types'
import { BigQuery } from '@google-cloud/bigquery'

export class BigQueryPlugin extends ConsentiPlugin {
  name = 'bigquery'
  private bq: BigQuery
  private table: ReturnType<BigQuery['dataset']>['table']

  constructor(private opts: BigQueryPluginOptions) {
    super()
    this.bq = new BigQuery({ projectId: opts.projectId, keyFilename: opts.keyFilename })
    const dataset = this.bq.dataset(opts.datasetId)
    this.table = dataset.table(opts.tableId)
  }

  override async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    try {
      await this.table.insert({
        visitor_id: record.visitorId,
        profile_id: record.profileId,
        profile_version: record.profileVersion,
        tenant_id: record.tenantId ?? 'default',
        consent_json: record.consentJson,
        source: record.source,
        gpc_detected: record.gpcDetected ?? false,
        created_at: record.createdAt,
      })
    } catch (err) {
      console.warn('[consenti:bigquery] Insert failed:', err)
    }
  }
}`} />

      <Callout type="info">
        BigQuery streaming inserts are available in near real-time (seconds) but are not immediately queryable
        with consistency guarantees. For regulatory audit trails, the primary source of truth remains the
        Consenti SQLite/PostgreSQL database — BigQuery is for analytics only.
      </Callout>
    </div>
  )
}
