import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Webhook Integration — Backend Guide — Consenti',
  description:
    'POST consent decisions to your own webhook URL on grant/deny using the existing eventBus — no new package, no core code change.',
  alternates: { canonical: '/guides/backend/webhooks' },
  openGraph: {
    title: 'Webhook Integration — Backend Guide — Consenti',
    description:
      'POST consent decisions to your own webhook URL on grant/deny using the existing eventBus — no new package, no core code change.',
    url: 'https://consenti.dev/guides/backend/webhooks',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Webhook Integration — Backend Guide — Consenti',
    description:
      'POST consent decisions to your own webhook URL on grant/deny using the existing eventBus — no new package, no core code change.',
    images: ['/og-image.jpg'],
  },
}

export default function BackendWebhooksGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Webhook Integration</h1>
      <p className="lead">
        There is no built-in <code>webhookUrl</code> config field — you don&apos;t need one.{' '}
        <code>createConsenti()</code> already returns an <code>eventBus</code> (a standard{' '}
        <code>EventEmitter</code>) that fires on every consent save. Forwarding decisions to an
        external webhook is a few lines against that event bus, run in your own process.
      </p>

      <Callout type="info">
        This is copy-paste application code, not a Consenti feature — it lives in your own server
        file alongside <code>createConsenti()</code>, not inside the package.
      </Callout>

      <h2>Minimal webhook forwarder</h2>
      <p>
        Fires once per consent save, with the full record and whether it was a create or an update:
      </p>
      <CodeBlock
        lang="typescript"
        filename="webhook.ts"
        code={`import { createConsenti } from '@consenti/api'
import type { ConsentDbRecord } from '@consenti/api'

const WEBHOOK_URL = process.env.CONSENT_WEBHOOK_URL!

async function postToWebhook(event: 'created' | 'updated', record: ConsentDbRecord) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, record }),
    })
  } catch (err) {
    // Never let a webhook failure affect the visitor's request — this runs after the
    // consent record is already saved and the HTTP response already sent.
    console.error('[webhook] delivery failed:', err)
  }
}

const { eventBus } = createConsenti({ /* ... */ })

eventBus.on('consent.created', (record: ConsentDbRecord) => {
  void postToWebhook('created', record)
})

eventBus.on('consent.updated', ({ current }: { previous: ConsentDbRecord; current: ConsentDbRecord }) => {
  void postToWebhook('updated', current)
})`}
      />

      <h2>Only forward grant/deny transitions for one parameter</h2>
      <p>
        Posting on every save is noisy if you only care about one cookie parameter (e.g. only fire
        when <code>analytics_storage</code> actually changes). Use <code>ConsentAction</code> — it
        does the previous-vs-current comparison for you and only calls back on a real transition:
      </p>
      <CodeBlock
        lang="typescript"
        filename="webhook-scoped.ts"
        code={`import { createConsenti, ConsentAction } from '@consenti/api'

const WEBHOOK_URL = process.env.CONSENT_WEBHOOK_URL!

const { eventBus } = createConsenti({ /* ... */ })

new ConsentAction({
  id: 'analytics_storage',
  eventBus,
  onGrant: ({ visitorId }) =>
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'analytics_storage.granted', visitorId }),
    }).catch(err => console.error('[webhook] delivery failed:', err)),
  onDeny: ({ visitorId }) =>
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'analytics_storage.denied', visitorId }),
    }).catch(err => console.error('[webhook] delivery failed:', err)),
})`}
      />
      <p>
        Watching a whole category instead of one parameter works the same way with{' '}
        <code>CategoryAction</code> — see the <a href="/docs/api/events">Events reference</a> for
        both.
      </p>

      <h2>Signing the payload for the receiving end</h2>
      <p>
        If your webhook receiver needs to verify the request actually came from your own server (not
        forged), sign the body yourself before sending — Consenti doesn&apos;t do this for you,
        since the webhook target is entirely your own infrastructure:
      </p>
      <CodeBlock
        lang="typescript"
        filename="webhook-signed.ts"
        code={`import { createHmac } from 'node:crypto'
import { createConsenti } from '@consenti/api'
import type { ConsentDbRecord } from '@consenti/api'

const WEBHOOK_URL = process.env.CONSENT_WEBHOOK_URL!
const WEBHOOK_SECRET = process.env.CONSENT_WEBHOOK_SECRET!

async function postToWebhook(record: ConsentDbRecord) {
  const body = JSON.stringify({ event: 'created', record })
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Consent-Signature': signature,   // receiver: recompute and compare
      },
      body,
    })
  } catch (err) {
    console.error('[webhook] delivery failed:', err)
  }
}

const { eventBus } = createConsenti({ /* ... */ })
eventBus.on('consent.created', postToWebhook)`}
      />

      <Callout type="warning">
        If <code>consentSigningKey</code> is configured, <code>record.signature</code> is already
        present on every <code>ConsentDbRecord</code> — that&apos;s a signature over the
        record&apos;s own contents (tamper-evidence for storage), not a signature of your webhook
        payload. They serve different purposes; use the payload-signing pattern above for the
        webhook itself.
      </Callout>

      <RelatedDocs
        items={[
          {
            href: '/docs/api/events/',
            label: 'Events',
            desc: 'Full eventBus reference — every event name and payload shape',
          },
          {
            href: '/docs/api/plugins/',
            label: 'API Plugins',
            desc: 'beforeConsentSave / afterConsentSave hooks as an alternative to eventBus',
          },
          {
            href: '/docs/api/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'consentSigningKey and every other createConsenti() option',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Does Consenti retry failed webhook deliveries?',
            answer: (
              <p className="m-0">
                No — this is your own code, so retry behavior is entirely up to you. A common
                pattern is to push the event onto a queue (SQS, Redis, etc.) inside the{' '}
                <code>eventBus</code> handler instead of calling <code>fetch()</code> directly, and
                let a separate worker handle retries with backoff.
              </p>
            ),
          },
          {
            question: 'Will a slow or failing webhook block the visitor&apos;s consent submission?',
            answer: (
              <p className="m-0">
                No. The <code>eventBus</code> fires after the consent record is already saved and
                the HTTP response to the visitor&apos;s browser has already been sent. A webhook
                handler that throws or hangs has no effect on that request — it only affects your
                own downstream delivery.
              </p>
            ),
          },
          {
            question: 'Can I forward to multiple webhook URLs?',
            answer: (
              <p className="m-0">
                Yes — register multiple <code>eventBus.on(&apos;consent.created&apos;, ...)</code>{' '}
                listeners, or loop over a list of URLs inside one handler. Each listener runs
                independently.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
