import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Self-hosting a CMP — Consenti',
  description:
    'What it actually takes to self-host a consent management platform: the pieces you need, storage options, deployment shape, and when a hosted CMP is the better call instead.',
  keywords: [
    'self-hosted CMP',
    'Self-hosted CMP',
    'Consent Management Platform Node.js',
    'open source CMP',
    'self-host cookie consent',
  ],
  alternates: { canonical: '/guides/hot-topics/self-hosting-a-cmp' },
  openGraph: {
    title: 'Self-hosting a CMP — Consenti',
    description:
      'What it actually takes to self-host a consent management platform — the pieces you need, storage options, and deployment shape.',
    url: 'https://consenti.dev/guides/hot-topics/self-hosting-a-cmp',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self-hosting a CMP — Consenti',
    description:
      'What it actually takes to self-host a consent management platform — the pieces you need, storage options, and deployment shape.',
    images: ['/og-image.jpg'],
  },
}

export default function SelfHostingACmpPage() {
  return (
    <div className="prose max-w-none">
      <h1>Self-hosting a CMP</h1>
      <p className="lead">
        Most cookie consent tools are SaaS: you drop in a script tag, and consent records, banner
        config, and traffic data all live on the vendor&apos;s servers. Self-hosting flips that —
        the banner, the storage, and the audit trail all run on infrastructure you control.
        Here&apos;s what that actually involves.
      </p>

      <h2>Why teams self-host</h2>
      <ul>
        <li>
          <strong>No monthly fee, no pageview caps.</strong> Most hosted CMPs price by domain or
          monthly pageviews; a self-hosted, open-source CMP has no such meter running.
        </li>
        <li>
          <strong>Consent data never leaves your infrastructure.</strong> No third party sees who
          consented to what, which matters if you&apos;re already minimising vendor data flows for
          compliance reasons.
        </li>
        <li>
          <strong>No cross-origin script dependency.</strong> A vendor-hosted banner script is a
          runtime dependency on someone else&apos;s uptime. Self-hosted code ships with your build.
        </li>
        <li>
          <strong>Full control over storage and retention.</strong> You choose the database, the
          retention window, and who can query the audit log.
        </li>
      </ul>

      <h2>The four pieces you actually need</h2>
      <ol>
        <li>
          <strong>A banner/widget</strong> — the frontend piece that shows the notice, records the
          visitor&apos;s choice, and exposes it to your own scripts and tag managers.
        </li>
        <li>
          <strong>Storage</strong> — somewhere the consent decision persists beyond a single page
          load. SQLite is enough for most sites; move to PostgreSQL, MySQL, or MongoDB once you
          need multi-instance writes or heavier reporting.
        </li>
        <li>
          <strong>An append-only audit log</strong> — a record that&apos;s written once and never
          edited or deleted, which is what makes a consent trail defensible under GDPR-style
          evidentiary requirements.
        </li>
        <li>
          <strong>An admin surface</strong> — somewhere to edit banner copy, review consent records,
          and manage who on your team can do that (RBAC), without touching the database by hand.
        </li>
      </ol>

      <Callout type="info">
        Most &ldquo;open-source cookie banners&rdquo; only cover piece #1. If you need the record,
        the audit log, and the admin surface too, check whether the project ships a backend at all
        before committing to it — many are frontend-only by design.
      </Callout>

      <h2>Example — a self-hosted stack in two installs</h2>
      <p>
        Consenti is one option built specifically to cover all four pieces as a Node.js Consent
        Management Platform, with zero external runtime dependencies on either side:
      </p>
      <Terminal code="npm install @consenti/ui @consenti/api" />
      <CodeBlock
        lang="typescript"
        filename="server.ts"
        code={`import { createConsenti } from '@consenti/api'
import express from 'express'

const app = express()
const consenti = createConsenti({
  storage: { driver: 'sqlite' }, // swap to postgres/mysql/mongo later, same API
})

app.use('/consenti', consenti.middleware) // REST API + admin dashboard, mounted directly
app.listen(3000)`}
      />
      <p>
        The admin dashboard, the REST API, and the audit log all run inside that one process — no
        separate service to deploy, no vendor console to log into.
      </p>

      <h2>Deployment shape</h2>
      <ul>
        <li>
          <strong>Single server / container.</strong> The common case — the backend runs alongside
          your app, SQLite file on local disk, no extra infra.
        </li>
        <li>
          <strong>Multiple instances behind a load balancer.</strong> Switch storage to Postgres,
          MySQL, or MongoDB so every instance reads/writes the same consent table.
        </li>
        <li>
          <strong>Frontend-only.</strong> If you don&apos;t need server-side records at all, the
          widget half can run standalone against <code>localStorage</code>/cookies with no backend
          — useful for static sites or a first pass before wiring up storage.
        </li>
      </ul>

      <h2>Data residency (PIPL, FZ-152)</h2>
      <p>
        Self-hosting gives you control over <em>where</em> consent records live — but "self-hosted"
        is not automatically "compliant" for laws that require data to physically stay inside a
        specific country. China's PIPL and Russia's FZ-152 (Federal Law No. 152 on Personal Data)
        both have in-country storage/localization requirements for data on their citizens.
      </p>
      <Callout type="warning">
        Running <code>@consenti/api</code> on a server in the US or EU and calling it "self-hosted"
        does <strong>not</strong> satisfy PIPL or FZ-152 localization requirements — those laws care
        about the server's physical jurisdiction, not who operates it. If you have PIPL or FZ-152
        exposure, deploy a geo-distributed <code>@consenti/api</code> instance (with its own storage)
        physically located in China / Russia respectively for that traffic, rather than routing all
        visitors to a single global instance.
      </Callout>

      <h2>When self-hosting is the wrong call</h2>
      <p>
        Self-hosting isn&apos;t free of cost, it just moves the cost from a subscription to
        engineering time — someone has to run migrations, monitor the database, and keep the
        package updated. If you have no backend team, need built-in IAB vendor-list management for
        thousands of ad-tech partners, or want a vendor to hold liability for the compliance
        mapping, a hosted CMP is often the better trade, at least to start.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/guides/backend/minimal-setup/',
            label: 'Minimal Setup (Backend)',
            desc: 'Mount the Consenti API on Express, Fastify, Hono, or raw Node HTTP',
          },
          {
            href: '/guides/backend/storage/',
            label: 'Choosing a Storage Driver',
            desc: 'JSON, SQLite, PostgreSQL, MySQL, MongoDB — when to use each',
          },
          {
            href: '/guides/backend/auth/',
            label: 'Auth Modes',
            desc: 'Local passwords, JWT, OIDC/SAML for the admin dashboard',
          },
          {
            href: '/guides/hot-topics/open-source-alternatives-to-cookiebot/',
            label: 'Open-source alternatives to Cookiebot',
            desc: 'Comparing self-hosted options against a hosted CMP',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Can I self-host just the frontend widget without a backend?',
            answer: (
              <p className="m-0">
                Yes — a widget can store consent client-side (cookie or localStorage) with no
                server component at all. You lose a durable, queryable audit log and admin
                dashboard, but for a static site or an early-stage project that&apos;s often
                enough to start.
              </p>
            ),
          },
          {
            question: 'Does self-hosting work with React, Vue, or Angular?',
            answer: (
              <p className="m-0">
                A framework-agnostic core with subpath exports (a React hook, a Vue composable, an
                Angular service) means the same self-hosted backend works no matter which frontend
                framework renders the banner — you&apos;re not locked into one stack on either
                side.
              </p>
            ),
          },
          {
            question: 'Is self-hosting harder to keep GDPR/DPDPA compliant than a SaaS CMP?',
            answer: (
              <p className="m-0">
                Not inherently — compliance depends on what the banner shows and how consent is
                recorded, not on who hosts the code. Self-hosting does mean you&apos;re responsible
                for keeping the package updated as regulations evolve, which a SaaS vendor would
                otherwise handle on your behalf.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
