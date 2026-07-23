import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Server-Side Enforcement — Backend Guide — Consenti',
  description:
    "Gate a tag, pixel, or backend event pipeline on a visitor's actual consent decision using GET /consent/:visitorId/verify — including an edge-worker example.",
  alternates: { canonical: '/guides/backend/server-side-enforcement' },
  openGraph: {
    title: 'Server-Side Enforcement — Backend Guide — Consenti',
    description:
      "Gate a tag, pixel, or backend event pipeline on a visitor's actual consent decision using GET /consent/:visitorId/verify — including an edge-worker example.",
    url: 'https://consenti.dev/guides/backend/server-side-enforcement',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Server-Side Enforcement — Backend Guide — Consenti',
    description:
      "Gate a tag, pixel, or backend event pipeline on a visitor's actual consent decision using GET /consent/:visitorId/verify — including an edge-worker example.",
    images: ['/og-image.jpg'],
  },
}

export default function BackendServerSideEnforcementGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Server-Side Enforcement</h1>
      <p className="lead">
        Client-side blocking (Consenti&apos;s widget not loading a script until consent is granted)
        covers the browser. It doesn&apos;t cover a server-side tag manager, an edge-injected pixel,
        or a backend event pipeline forwarding events to an ad platform — those need to ask
        Consenti&apos;s API directly before firing. <code>GET /consent/:visitorId/verify</code> is
        built for exactly this: it&apos;s <code>fetch</code>
        -based, has no server-side SDK dependency, and works identically from a Node backend, a
        Cloudflare Worker, or a Vercel Edge Function.
      </p>

      <h2>The endpoint</h2>
      <CodeBlock lang="bash" code={`GET /consenti/api/v1/consent/:visitorId/verify`} />
      <p>
        Returns <code>{'{ valid: boolean, reasons: string[], ... }'}</code>. <code>valid</code> is{' '}
        <code>false</code> whenever the profile has changed since the visitor decided, the consent
        has expired, or — when <code>consentSigningKey</code> is configured — the stored signature
        doesn&apos;t match (<code>hmac_invalid</code>). Treat any of these the same way you&apos;d
        treat &quot;no valid consent&quot;: don&apos;t fire the tag.
      </p>
      <Callout type="warning">
        This route requires the visitor&apos;s own ownership cookie (the same one the widget sets on
        submit) to prove the caller is the actual visitor, not someone probing another
        visitor&apos;s id. Server-side callers acting on a visitor&apos;s behalf need to forward
        that cookie — see the edge-worker example below, which does this via the incoming
        request&apos;s own <code>Cookie</code> header.
      </Callout>

      <h2>Pattern: gate a tag before firing it</h2>
      <CodeBlock
        lang="typescript"
        filename="gate-tag.ts"
        code={`async function isConsentValid(visitorId: string, cookieHeader: string): Promise<boolean> {
  const res = await fetch(
    \`https://your-domain.com/consenti/api/v1/consent/\${visitorId}/verify\`,
    { headers: { Cookie: cookieHeader } },
  )
  if (!res.ok) return false
  const { valid } = await res.json() as { valid: boolean }
  return valid
}

// Before forwarding an event to an ad platform's server-side API:
if (await isConsentValid(visitorId, req.headers.get('cookie') ?? '')) {
  await adPlatform.sendServerEvent(payload)
}`}
      />

      <h2>Edge-worker example</h2>
      <p>
        Both Cloudflare Workers and Vercel Edge Functions run on the standard Fetch API (the same{' '}
        <code>Request</code>/<code>Response</code> globals Consenti itself is built on), so the
        pattern above needs no adaptation — only the surrounding handler shape differs:
      </p>
      <CodeTabs
        tabs={[
          {
            label: 'Cloudflare Worker',
            lang: 'typescript',
            code: `export default {
  async fetch(req: Request): Promise<Response> {
    const visitorId = new URL(req.url).searchParams.get('vid')
    if (!visitorId) return new Response('Missing vid', { status: 400 })

    const verifyRes = await fetch(
      \`https://your-domain.com/consenti/api/v1/consent/\${visitorId}/verify\`,
      { headers: { Cookie: req.headers.get('cookie') ?? '' } },
    )
    const { valid } = await verifyRes.json() as { valid: boolean }

    if (!valid) {
      return new Response(null, { status: 204 }) // no-op: consent not valid, don't fire the pixel
    }

    // Forward to the actual pixel/tag endpoint only when valid
    return fetch('https://ad-platform.example.com/pixel', { method: 'POST', body: req.body })
  },
}`,
          },
          {
            label: 'Vercel Edge Function',
            lang: 'typescript',
            code: `export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const visitorId = new URL(req.url).searchParams.get('vid')
  if (!visitorId) return new Response('Missing vid', { status: 400 })

  const verifyRes = await fetch(
    \`https://your-domain.com/consenti/api/v1/consent/\${visitorId}/verify\`,
    { headers: { Cookie: req.headers.get('cookie') ?? '' } },
  )
  const { valid } = await verifyRes.json() as { valid: boolean }

  if (!valid) {
    return new Response(null, { status: 204 })
  }

  return fetch('https://ad-platform.example.com/pixel', { method: 'POST', body: req.body })
}`,
          },
        ]}
      />

      <h2>Pattern: gate a backend event pipeline</h2>
      <p>
        The same check works as a guard clause anywhere in a server-side event pipeline — before
        writing to a data warehouse row, before publishing to a Kafka topic, before calling a
        CDP&apos;s server-side API. Cache the verify result for the lifetime of a single
        request/batch rather than calling it per-event if you&apos;re processing many events for the
        same visitor at once.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/docs/api/routes/public/',
            label: 'Public Routes',
            desc: 'The verify endpoint and every other unauthenticated route',
          },
          {
            href: '/docs/api/routes/admin/',
            label: 'Admin Routes',
            desc: 'The admin-auth alternative for callers with no visitor cookie',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Do I need an API key to call the verify endpoint?',
            answer: (
              <p className="m-0">
                No — it&apos;s a public route (part of <code>/consenti/api/v1/*</code>), gated by
                the visitor&apos;s own ownership cookie instead of a Bearer token. If your
                server-side caller isn&apos;t forwarding a real browser request (e.g. a scheduled
                batch job with no visitor cookie to hand), use the admin API&apos;s{' '}
                <code>GET /consenti/admin/consents/:visitorId</code> with a Bearer token instead —
                it returns the same record without the cookie-ownership requirement, since admin
                auth already proves who&apos;s asking.
              </p>
            ),
          },
          {
            question: 'How fast is this — can I call it on every request?',
            answer: (
              <p className="m-0">
                It&apos;s a single indexed lookup, no heavier than any other Consenti API route. For
                very high-volume paths, cache the result for a short TTL (a few seconds) keyed by
                visitorId rather than calling it on every single event — consent state doesn&apos;t
                change often enough to justify a fresh lookup on every request.
              </p>
            ),
          },
          {
            question: 'What if the profile is edited while a batch job is running?',
            answer: (
              <p className="m-0">
                <code>valid</code> becomes <code>false</code> with reason{' '}
                <code>profile_changed</code> as soon as the edit is live — a batch job that checks
                per-event (rather than caching a single result for the whole batch) picks this up
                immediately, no restart needed.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
