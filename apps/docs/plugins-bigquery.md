# BigQuery Plugin Guide

Stream consent records to Google BigQuery for analytics and compliance reporting.

## Installation

```bash
npm install @google-cloud/bigquery
```

## Configuration

```ts
import { BigQueryPlugin } from '@consenti/api/plugins'

createConsenti({
  plugins: [
    new BigQueryPlugin({
      projectId: 'my-gcp-project',
      datasetId: 'consenti',
      tableId: 'consent_records',
      // Path to service account key, or use ADC
      keyFilename: '/path/to/service-account.json',
    }),
  ],
})
```

## What gets streamed

The plugin hooks into `afterConsentSave` and streams each new consent record to BigQuery via the streaming insert API. Fields:

| Field | Type | Description |
|---|---|---|
| `visitor_id` | STRING | Anonymous visitor UUID |
| `profile_id` | STRING | Cookie profile ID |
| `profile_version` | INTEGER | Version at time of consent |
| `tenant_id` | STRING | Tenant slug |
| `consent_json` | JSON | Full consent choices |
| `source` | STRING | `banner`, `api`, or `import` |
| `gpc_detected` | BOOLEAN | Whether GPC signal was present |
| `created_at` | TIMESTAMP | ISO 8601 timestamp |

## Recommended BigQuery schema

```sql
CREATE TABLE `project.consenti.consent_records` (
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
CLUSTER BY tenant_id, profile_id;
```

## Building a custom BigQuery plugin

```ts
import { ConsentiPlugin } from '@consenti/api'
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
}
```

## Latency considerations

BigQuery streaming inserts are available in near real-time (seconds) but are not immediately queryable with consistency guarantees. For regulatory audit trails, the primary source of truth remains the Consenti SQLite/PostgreSQL database — BigQuery is for analytics only.
