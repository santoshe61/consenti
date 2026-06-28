# Snowflake Plugin Guide

Load consent records into Snowflake for enterprise data warehousing, compliance reporting, and cross-system joins.

## Installation

```bash
npm install snowflake-sdk
```

## Configuration

```ts
import { SnowflakePlugin } from '@consenti/api/plugins'

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
})
```

## Recommended Snowflake table

```sql
CREATE TABLE CONSENTI.PUBLIC.CONSENT_RECORDS (
  VISITOR_ID VARCHAR(36) NOT NULL,
  PROFILE_ID VARCHAR(128) NOT NULL,
  PROFILE_VERSION NUMBER NOT NULL,
  TENANT_ID VARCHAR(128) NOT NULL DEFAULT 'default',
  CONSENT_JSON VARIANT,
  SOURCE VARCHAR(32),
  GPC_DETECTED BOOLEAN DEFAULT FALSE,
  CREATED_AT TIMESTAMP_TZ NOT NULL,
  UPDATED_AT TIMESTAMP_TZ
)
CLUSTER BY (TENANT_ID, DATE_TRUNC('DAY', CREATED_AT));
```

## Building a custom Snowflake plugin

```ts
import { ConsentiPlugin } from '@consenti/api'
import type { ConsentDbRecord } from '@consenti/types'
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
    const sql = `
      INSERT INTO ${this.opts.table}
        (VISITOR_ID, PROFILE_ID, PROFILE_VERSION, TENANT_ID, CONSENT_JSON, SOURCE, GPC_DETECTED, CREATED_AT)
      SELECT
        PARSE_JSON(:1):visitor_id::VARCHAR,
        :2, :3, :4,
        PARSE_JSON(:5),
        :6, :7, :8::TIMESTAMP_TZ
    `
    await new Promise<void>((resolve, reject) => {
      this.connection.execute({
        sqlText: sql,
        binds: [
          record.visitorId, record.profileId,
          record.profileVersion, record.tenantId ?? 'default',
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
}
```

## Batch loading alternative

For high-volume sites (>10k consents/day), prefer batch loading over per-record inserts:

1. Buffer records in memory (or an in-process queue)
2. Flush every 60 seconds via `setInterval` in `initialize()`
3. Use Snowflake's `COPY INTO` from an S3/GCS stage for maximum throughput

## Data retention in Snowflake

Snowflake's Time Travel (default: 1 day, max 90 days on Enterprise) provides point-in-time rollback for regulatory investigations. Set `DATA_RETENTION_TIME_IN_DAYS = 90` on the consent table to maximise your audit window.
