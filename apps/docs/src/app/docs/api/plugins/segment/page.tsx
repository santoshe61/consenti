import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'

export const metadata: Metadata = {
  title: 'Segment Plugin',
  description:
    'Forward consent events to Segment (now Twilio Engage) as track calls, enabling downstream destinations like Amplitude and Mixpanel.',
  alternates: { canonical: '/docs/api/plugins/segment' },
  openGraph: {
    title: 'Segment Plugin',
    description:
      'Forward consent events to Segment (now Twilio Engage) as track calls, enabling downstream destinations like Amplitude and Mixpanel.',
    url: 'https://consenti.dev/docs/api/plugins/segment',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Segment Plugin',
    description:
      'Forward consent events to Segment (now Twilio Engage) as track calls, enabling downstream destinations like Amplitude and Mixpanel.',
    images: ['/og-image.jpg'],
  },
}

export default function SegmentPluginPage() {
  return (
    <div className="prose max-w-none">
      <h1>Segment Plugin</h1>
      <p>
        Forward consent events to Segment (now Twilio Engage) as track calls, enabling downstream
        destinations like Amplitude, Mixpanel, and customer data platforms.
      </p>

      <h2>Installation</h2>
      <Terminal code="npm install @segment/analytics-node" />

      <h2>Configuration</h2>
      <CodeBlock
        lang="ts"
        code={`import { SegmentPlugin } from '@consenti/api/plugins'

createConsenti({
  plugins: [
    new SegmentPlugin({
      writeKey: 'YOUR_SEGMENT_WRITE_KEY',
    }),
  ],
})`}
      />

      <h2>Events emitted</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Fired when</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>Consent Given</code>
            </td>
            <td>
              <code>afterConsentSave</code> (new consent)
            </td>
          </tr>
          <tr>
            <td>
              <code>Consent Updated</code>
            </td>
            <td>
              <code>afterConsentUpdate</code> (preference change)
            </td>
          </tr>
          <tr>
            <td>
              <code>Consent Withdrawn</code>
            </td>
            <td>
              <code>afterConsentUpdate</code> where all choices become <code>denied</code>
            </td>
          </tr>
        </tbody>
      </table>

      <p>Each event includes:</p>
      <CodeBlock
        lang="json"
        code={`{
  "anonymousId": "<visitor UUID>",
  "event": "Consent Given",
  "properties": {
    "profileId": "...",
    "source": "banner",
    "gpcDetected": false,
    "consentJson": { "analytics": "granted", "ads": "denied" }
  }
}`}
      />
      <p>
        No PII is sent — the anonymous ID is the visitor UUID, which is a random UUID with no link
        to personal data.
      </p>

      <h2>Building a custom Segment plugin</h2>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiPlugin, type ConsentDbRecord } from '@consenti/api'
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
}`}
      />
    </div>
  )
}
