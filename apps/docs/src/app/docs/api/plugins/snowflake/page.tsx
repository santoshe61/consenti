import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Snowflake Plugin',
  description:
    'Load consent records into Snowflake for enterprise data warehousing, compliance reporting, and cross-system joins.',
  alternates: { canonical: '/docs/api/plugins/snowflake' },
  openGraph: {
    title: 'Snowflake Plugin',
    description:
      'Load consent records into Snowflake for enterprise data warehousing, compliance reporting, and cross-system joins.',
    url: 'https://consenti.dev/docs/api/plugins/snowflake',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snowflake Plugin',
    description:
      'Load consent records into Snowflake for enterprise data warehousing, compliance reporting, and cross-system joins.',
    images: ['/og-image.jpg'],
  },
}

export default function SnowflakePluginPage() {
  return (
    <div className="prose max-w-none">
      <h1>Snowflake Plugin</h1>
      <p>
        Load consent records into Snowflake for enterprise data warehousing, compliance reporting,
        and cross-system joins.
      </p>

      <h2>Installation</h2>
      <Terminal code="npm install snowflake-sdk" />

      <h2>Configuration</h2>
      <CodeBlock
        lang="ts"
        code={`import { SnowflakePlugin } from '@consenti/api/plugins'

createConsenti({
  plugins: [
    new SnowflakePlugin({
      account: 'xy12345.us-east-1',
      username: 'CONSENT_SERVICE',
      password: process.env.SNOWFLAKE_PASSWORD,
      database: 'CONSENTI',
      schema: 'PUBLIC',
      warehouse: 'COMPUTE_WH',
      table: 'CONSENT_RECORDS',
    }),
  ],
})`}
      />

      <h2>Recommended Snowflake table</h2>
      <CodeBlock
        lang="sql"
        code={`CREATE TABLE CONSENTI.PUBLIC.CONSENT_RECORDS (
  VISITOR_ID VARCHAR(36) NOT NULL,
  PROFILE_ID VARCHAR(128) NOT NULL,
  TENANT_ID VARCHAR(128) NOT NULL DEFAULT 'default',
  CONSENT_JSON VARIANT,
  SOURCE VARCHAR(32),
  GPC_DETECTED BOOLEAN DEFAULT FALSE,
  CREATED_AT TIMESTAMP_TZ NOT NULL,
  UPDATED_AT TIMESTAMP_TZ
)
CLUSTER BY (TENANT_ID, DATE_TRUNC('DAY', CREATED_AT));`}
      />

      <h2>Building a custom Snowflake plugin</h2>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiPlugin, type ConsentDbRecord } from '@consenti/api'
import Snowflake from 'snowflake-sdk'

export class SnowflakePlugin extends ConsentiPlugin {
  name = 'snowflake'
  private connection: Snowflake.Connection

  constructor(private opts: SnowflakePluginOptions) {
    super()
    this.connection = Snowflake.createConnection({
      account: opts.account,
      username: opts.username,
      password: opts.password,
      database: opts.database,
      schema: opts.schema,
      warehouse: opts.warehouse,
    })
  }

  override async initialize(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.connection.connect(err => err ? reject(err) : resolve())
    })
  }

  override async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    const sql = \`
      INSERT INTO \${this.opts.table}
        (VISITOR_ID, PROFILE_ID, TENANT_ID, CONSENT_JSON, SOURCE, GPC_DETECTED, CREATED_AT)
      VALUES (:1, :2, :3, PARSE_JSON(:4), :5, :6, :7::TIMESTAMP_TZ)
    \`
    await new Promise<void>((resolve, reject) => {
      this.connection.execute({
        sqlText: sql,
        binds: [
          record.visitorId, record.profileId,
          record.tenantId ?? 'default',
          JSON.stringify(record.consentJson),
          record.source, record.gpcDetected ? 'true' : 'false',
          record.createdAt,
        ],
        complete: err => err ? reject(err) : resolve(),
      })
    })
  }

  override async destroy(): Promise<void> {
    await new Promise<void>(resolve => {
      this.connection.destroy(() => resolve())
    })
  }
}`}
      />

      <h2>Batch loading</h2>
      <p>For high-volume sites (&gt;10k consents/day), prefer batch loading:</p>
      <ol>
        <li>Buffer records in memory (or an in-process queue)</li>
        <li>
          Flush every 60 seconds via <code>setInterval</code> in <code>initialize()</code>
        </li>
        <li>
          Use Snowflake's <code>COPY INTO</code> from an S3/GCS stage for maximum throughput
        </li>
      </ol>

      <Callout type="info">
        Snowflake's Time Travel (default: 1 day, max 90 days on Enterprise) provides point-in-time
        rollback for regulatory investigations. Set <code>DATA_RETENTION_TIME_IN_DAYS = 90</code> on
        the consent table to maximise your audit window.
      </Callout>
    </div>
  )
}
