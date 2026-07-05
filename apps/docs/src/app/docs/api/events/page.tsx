import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'API Events' }

export default function APIEventsPage() {
  return (
    <div className="prose max-w-none">
      <h1>Backend — Events</h1>
      <p>
        <code>createConsenti()</code> returns an <code>eventBus</code> — a standard Node.js{' '}
        <code>EventEmitter</code> — that emits typed events at every data lifecycle step.
        Subscribe to hook into consent saves, profile changes, and the server ready signal
        without polling the database or modifying routes.
      </p>

      <CodeBlock lang="ts" filename="Basic usage" code={`import { createConsenti } from '@consenti/api'

const { eventBus, ready } = createConsenti({ /* ... */ })

eventBus.on('consent.created', (record) => {
  console.log('New consent from visitor', record.visitorId)
})

// Wait for storage + bootstrap to complete before accepting requests
await ready`} />

      {/* ── Event reference ───────────────────────────────────────────────── */}
      <h2>Event reference</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Emitted when</th><th>Payload</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ready</code></td>
            <td>Storage connected and admin user bootstrapped</td>
            <td>none</td>
          </tr>
          <tr>
            <td><code>consent.created</code></td>
            <td>A new consent record is saved for the first time</td>
            <td><code>ConsentDbRecord</code></td>
          </tr>
          <tr>
            <td><code>consent.updated</code></td>
            <td>An existing consent record is updated</td>
            <td><code>{'{ previous: ConsentDbRecord, current: ConsentDbRecord }'}</code></td>
          </tr>
          <tr>
            <td><code>consent.erased</code></td>
            <td>A visitor&apos;s data is erased (GDPR right to erasure)</td>
            <td><code>{'{ visitorId: string }'}</code></td>
          </tr>
          <tr>
            <td><code>visitor.created</code></td>
            <td>A new visitor record is created</td>
            <td><code>Visitor</code></td>
          </tr>
          <tr>
            <td><code>profile.created</code></td>
            <td>A consent profile is created</td>
            <td><code>Profile</code></td>
          </tr>
          <tr>
            <td><code>profile.updated</code></td>
            <td>A consent profile is updated (version bumped)</td>
            <td><code>{'{ previous: Profile, current: Profile }'}</code></td>
          </tr>
          <tr>
            <td><code>profile.deleted</code></td>
            <td>A consent profile is deleted</td>
            <td><code>{'{ id: string, previous: Profile }'}</code></td>
          </tr>
          <tr>
            <td><code>cache:warm</code></td>
            <td>Locale JSON files are written to disk (profile create or activate)</td>
            <td><code>{'{ paths: string[], version: number }'}</code></td>
          </tr>
          <tr>
            <td><code>cache:purge</code></td>
            <td>Locale JSON files are removed (profile update, deactivate, or delete)</td>
            <td><code>{'{ paths: string[], version: number }'}</code></td>
          </tr>
        </tbody>
      </table>

      {/* ── ready ─────────────────────────────────────────────────────────── */}
      <h2>ready</h2>
      <p>
        Emitted once after the storage adapter connects, migrations run, and the bootstrap
        admin user is created (if needed). This maps to the <code>ready</code> Promise returned
        by <code>createConsenti()</code> — they resolve at the same time.
      </p>
      <p>
        Use the Promise form when you need to <code>await</code> startup before accepting
        requests. Use the event form when you want a fire-and-forget side effect.
      </p>
      <CodeBlock lang="ts" code={`// Promise form (preferred for startup sequencing)
const consenti = createConsenti({ /* ... */ })
await consenti.ready
server.listen(3000)

// Event form (fire-and-forget side effects)
consenti.eventBus.on('ready', () => {
  console.log('[consenti] backend ready')
})`} />

      {/* ── consent.created ───────────────────────────────────────────────── */}
      <h2>consent.created</h2>
      <p>
        Fires after a new <code>ConsentDbRecord</code> is persisted — after plugins&apos;{' '}
        <code>afterConsentSave</code> hooks run. Useful for webhooks, audit side-cars, or
        real-time analytics.
      </p>
      <CodeBlock lang="ts" code={`import type { ConsentDbRecord } from '@consenti/api'

eventBus.on('consent.created', async (record: ConsentDbRecord) => {
  await fetch('https://webhook.example.com/consent-created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitorId: record.visitorId,
      profileId: record.profileId,
      consent: record.consentJson,
      gpc: record.gpcDetected,
      timestamp: record.createdAt,
    }),
  })
})`} />

      {/* ── consent.updated ───────────────────────────────────────────────── */}
      <h2>consent.updated</h2>
      <p>
        Fires when a visitor submits new consent choices that differ from their existing
        record. The payload includes both the previous and current state so you can compute
        a diff.
      </p>
      <CodeBlock lang="ts" code={`import type { ConsentDbRecord } from '@consenti/api'

eventBus.on('consent.updated', ({ previous, current }: {
  previous: ConsentDbRecord
  current: ConsentDbRecord
}) => {
  const prev = previous.consentJson
  const next = current.consentJson

  for (const cookieId of Object.keys(next)) {
    if (prev[cookieId] !== next[cookieId]) {
      console.log(\`\${cookieId}: \${prev[cookieId]} → \${next[cookieId]}\`)
    }
  }
})`} />

      {/* ── consent.erased ────────────────────────────────────────────────── */}
      <h2>consent.erased</h2>
      <p>
        Fires after a visitor exercises their GDPR right to erasure. The visitor&apos;s consent
        record and visitor row are deleted from storage before this event fires.
      </p>
      <CodeBlock lang="ts" code={`eventBus.on('consent.erased', ({ visitorId }: { visitorId: string }) => {
  // Mirror the deletion to a data warehouse or external DMP
  myDmpClient.deleteVisitor(visitorId)
})`} />

      {/* ── visitor.created ───────────────────────────────────────────────── */}
      <h2>visitor.created</h2>
      <p>
        Fires when Consenti creates a new visitor row — typically on first consent submission
        from that visitor. IPs are never available here; the record stores only the SHA-256
        hash (<code>ipHash</code>).
      </p>
      <CodeBlock lang="ts" code={`import type { Visitor } from '@consenti/api'

eventBus.on('visitor.created', (visitor: Visitor) => {
  console.log('New visitor in region:', visitor.region ?? 'unknown')
})`} />

      {/* ── profile.* ─────────────────────────────────────────────────────── */}
      <h2>profile.created / profile.updated / profile.deleted</h2>
      <p>
        Profile lifecycle events. <code>profile.updated</code> fires whenever a profile
        version is bumped — useful for cache invalidation in edge deployments. The previous
        profile is included so you can compare changes.
      </p>
      <CodeBlock lang="ts" code={`import type { Profile } from '@consenti/api'

eventBus.on('profile.created', (profile: Profile) => {
  console.log('New profile:', profile.id, 'v' + profile.version)
})

eventBus.on('profile.updated', ({ previous, current }: {
  previous: Profile
  current: Profile
}) => {
  console.log('Profile', current.id, 'bumped from v' +
    previous.version + ' to v' + current.version)
})

eventBus.on('profile.deleted', ({ id, previous }: { id: string; previous: Profile }) => {
  console.log('Profile deleted:', id, '(was v' + previous.version + ')')
})`} />

      {/* ── cache:warm / cache:purge ───────────────────────────────────────── */}
      <h2>cache:warm / cache:purge</h2>
      <p>
        Fired after Consenti writes or removes locale JSON files on disk. Use these to
        integrate with a CDN, nginx cache, or any edge layer that needs to be invalidated
        or pre-warmed when a profile changes.
      </p>
      <p>
        <code>cache:warm</code> fires when new files are written (profile created or activated).{' '}
        <code>cache:purge</code> fires when files are removed (profile updated, deactivated, or deleted).
        Both mirror the <code>handleCache</code> config callback — use whichever suits your integration.
      </p>
      <CodeBlock lang="ts" code={`eventBus.on('cache:warm', ({ paths, version }: { paths: string[]; version: number }) => {
  // paths — array of locale file paths written to disk, e.g.
  // ['./consenti-data/profiles/default/opt-in/en.json', '...fr-FR.json']
  for (const p of paths) {
    cdnClient.warmPath(p)
  }
})

eventBus.on('cache:purge', ({ paths, version }: { paths: string[]; version: number }) => {
  for (const p of paths) {
    cdnClient.purge(p)
  }
})`} />

      <Callout type="info">
        The <code>handleCache</code> config option is equivalent to listening on both{' '}
        <code>cache:warm</code> and <code>cache:purge</code>:
        <code>isPurge: false</code> → <code>cache:warm</code>, <code>isPurge: true</code> → <code>cache:purge</code>.
        Use whichever style fits your integration.
      </Callout>

      <Callout type="info">
        All event handlers that perform async work should handle their own errors. Unhandled
        rejections inside event listeners are not caught by Consenti — use a try/catch or
        attach a <code>.catch()</code> to avoid crashing the process.
      </Callout>
    </div>
  )
}
