# Segment Plugin Guide

Forward consent events to Segment (now Twilio Engage) as track calls, enabling downstream destinations like Amplitude, Mixpanel, and customer data platforms.

## Installation

```bash
npm install @segment/analytics-node
```

## Configuration

```ts
import { SegmentPlugin } from '@consenti/api/plugins'

createConsenti({
  plugins: [
    new SegmentPlugin({
      writeKey: 'YOUR_SEGMENT_WRITE_KEY',
    }),
  ],
})
```

## Events emitted

| Event | Fired when |
|---|---|
| `Consent Given` | `afterConsentSave` (new consent) |
| `Consent Updated` | `afterConsentUpdate` (preference change) |
| `Consent Withdrawn` | `afterConsentUpdate` where all choices become `denied` |

Each event includes:

```json
{
  "anonymousId": "<visitor UUID>",
  "event": "Consent Given",
  "properties": {
    "profileId": "...",
    "profileVersion": 3,
    "source": "banner",
    "gpcDetected": false,
    "consentJson": { "analytics": "granted", "ads": "denied" }
  }
}
```

No PII is sent — the anonymous ID is the visitor UUID, which is a random UUID with no link to personal data.

## Building a custom Segment plugin

```ts
import { ConsentiPlugin } from '@consenti/api'
import type { ConsentDbRecord } from '@consenti/types'
import { Analytics } from '@segment/analytics-node'

export class SegmentPlugin extends ConsentiPlugin {
  name = 'segment'
  private analytics: Analytics

  constructor(opts: { writeKey: string }) {
    super()
    this.analytics = new Analytics({ writeKey: opts.writeKey })
  }

  override async afterConsentSave(record: ConsentDbRecord): Promise<void> {
    this.analytics.track({
      anonymousId: record.visitorId,
      event: 'Consent Given',
      properties: {
        profileId: record.profileId,
        profileVersion: record.profileVersion,
        source: record.source,
        gpcDetected: record.gpcDetected ?? false,
        consentJson: record.consentJson,
      },
    })
  }

  override async afterConsentUpdate(record: ConsentDbRecord): Promise<void> {
    const allDenied = Object.values(record.consentJson as Record<string, string>)
      .every(v => v === 'denied' || v === 'objected')
    this.analytics.track({
      anonymousId: record.visitorId,
      event: allDenied ? 'Consent Withdrawn' : 'Consent Updated',
      properties: {
        profileId: record.profileId,
        source: record.source,
        consentJson: record.consentJson,
      },
    })
  }

  override async destroy(): Promise<void> {
    await this.analytics.closeAndFlush()
  }
}
```

## Segment Consent Manager integration

If you use Segment's own Consent Manager UI, you can skip the widget's banner and use Segment as the sole consent UI. In that case, disable the Consenti banner (`bannerEnabled: false`) and use Segment events to write consent records via the Consenti API on the server side.
