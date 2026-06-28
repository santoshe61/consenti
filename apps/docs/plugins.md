# Consenti Plugin Authoring Guide

Plugins extend Consenti's backend with custom lifecycle hooks. They run server-side and are instantiated once per `createConsenti()` call.

## Plugin contract

All plugins extend `ConsentiServerPlugin` from `@consenti/api`:

```ts
import { ConsentiServerPlugin } from '@consenti/api'
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
    // Mutate or validate the consent payload before it hits the database.
    return data
  }

  async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    // Runs after the consent record is persisted. Good place for webhooks,
    // analytics events, or notifications.
  }

  async afterConsentUpdate(record: ConsentDbRecord): Promise<void> {
    // Same as afterConsentSave but for PUT /consent/:visitorId.
  }
}
```

## Registering a plugin

Pass instances in the `plugins` array of `createConsenti()`:

```ts
import { createConsenti } from '@consenti/api'
import { WebhookPlugin } from '@consenti-plugin-webhook'
import { SlackPlugin } from '@consenti-plugin-slack'

const app = createConsenti({
  storage: { driver: 'sqlite', path: './consenti.db' },
  auth: { mode: 'local', adminEmail: 'admin@example.com', adminPassword: 'secret' },
  plugins: [
    new WebhookPlugin('https://your-endpoint.example.com/hook'),
    new SlackPlugin({ webhookUrl: process.env.SLACK_WEBHOOK }),
  ],
})
```

---

## Example: Webhook Notifier

Posts the consent record as JSON to a webhook URL after every save or update.

```ts
// @consenti-plugin-webhook/src/index.ts
import { ConsentiServerPlugin } from '@consenti/api'
import type { ConsentDbRecord } from '@consenti/api'

export class WebhookPlugin extends ConsentiServerPlugin {
  name = 'webhook'

  constructor(private webhookUrl: string, private secret?: string) { super() }

  async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    await this.post(record)
  }

  async afterConsentUpdate(record: ConsentDbRecord): Promise<void> {
    await this.post(record)
  }

  private async post(record: ConsentDbRecord): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.secret) {
      // HMAC-SHA256 signature so the receiver can verify authenticity.
      const { createHmac } = await import('node:crypto')
      headers['x-consenti-signature'] = createHmac('sha256', this.secret)
        .update(JSON.stringify(record))
        .digest('hex')
    }
    await fetch(this.webhookUrl, { method: 'POST', headers, body: JSON.stringify(record) })
  }
}
```

**Package structure:**

```
@consenti-plugin-webhook/
├── src/
│   └── index.ts
├── package.json
└── README.md
```

```json
{
  "name": "@consenti-plugin-webhook",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "@consenti/api": ">=0.1.0"
  }
}
```

---

## Example: Slack Notifier

Sends a Slack message via Incoming Webhook after each consent submission.

```ts
// @consenti-plugin-slack/src/index.ts
import { ConsentiServerPlugin } from '@consenti/api'
import type { ConsentDbRecord, PluginContext } from '@consenti/api'

interface SlackOptions {
  webhookUrl: string
  channel?: string
}

export class SlackPlugin extends ConsentiServerPlugin {
  name = 'slack'
  private webhookUrl: string
  private channel?: string

  constructor(options: SlackOptions) {
    super()
    this.webhookUrl = options.webhookUrl
    this.channel = options.channel
  }

  async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    const grantedCount = Object.values(record.consentJson).filter(s => s === 'granted').length
    const total = Object.keys(record.consentJson).length
    const text = `New consent recorded: ${grantedCount}/${total} categories granted${record.gpcDetected ? ' (GPC signal)' : ''}`

    const body: Record<string, unknown> = { text }
    if (this.channel) body['channel'] = this.channel

    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }
}
```

---

## Plugin registry concept

Consenti plugins are published as independent npm packages under the `@consenti-plugin-*` namespace. Consumers install only the plugins they need:

```bash
npm install @consenti-plugin-webhook
npm install @consenti-plugin-slack
```

### Planned official plugins

| Package | Description |
|---|---|
| `@consenti-plugin-webhook` | Post consent records to any HTTP endpoint |
| `@consenti-plugin-slack` | Notify a Slack channel on new consent |
| `@consenti-plugin-bigquery` | Stream consent events to Google BigQuery |
| `@consenti-plugin-segment` | Fire `Consent Given` events to Segment |
| `@consenti-plugin-snowflake` | Write consent records to Snowflake |

### Community plugins

Publish your own under any package name. The only requirement is extending `ConsentiServerPlugin` and declaring `@consenti/api` as a peer dependency.

---

## Available hooks

| Hook | When it fires |
|---|---|
| `initialize(ctx)` | After `storage.connect()` resolves — once at startup |
| `destroy()` | On graceful shutdown |
| `beforeConsentSave(data)` | Before a new consent record is written — can mutate the payload |
| `afterConsentSave(record)` | After a new consent record is persisted |
| `beforeConsentUpdate(data)` | Before an existing consent record is updated |
| `afterConsentUpdate(record)` | After an existing consent record is updated |
| `beforeProfileFetch(id)` | Before a profile is fetched — can redirect to a different profile ID |
| `afterProfileFetch(profile)` | After a profile is fetched — can mutate the profile |
| `beforeUserCreate(data)` | Before an admin user is created |
| `afterUserCreate(user)` | After an admin user is created |

All hooks are optional. Hooks that return values (`before*` hooks) must return the same type they receive.

---

## Error handling

If a plugin throws in any hook, Consenti logs the error with `console.warn` and continues — a broken plugin never blocks consent from being recorded.
