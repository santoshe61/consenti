import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What consenti.dev collects, why, and how to reach us about it.',
  alternates: { canonical: 'https://consenti.dev/privacy' },
  openGraph: {
    title: 'Privacy Policy',
    description: 'What consenti.dev collects, why, and how to reach us about it.',
    url: 'https://consenti.dev/privacy',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy',
    description: 'What consenti.dev collects, why, and how to reach us about it.',
    images: ['/og-image.jpg'],
  },
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="prose max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: 2026-07-22</p>

        <p>
          This policy covers <strong>consenti.dev</strong> — the documentation and marketing site
          you are reading right now. It does not cover the Consenti software itself: what a site
          that installs <code>@consenti/ui</code> or <code>@consenti/api</code> collects from its
          own visitors is entirely up to that site&apos;s own configuration and its own privacy
          policy. See the <Link href="/docs/getting-started/">documentation</Link> if that&apos;s
          what you&apos;re looking for.
        </p>

        <p>
          Consenti is built and maintained solo, in spare time (see{' '}
          <Link href="/support/">Support Consenti</Link>). This is a good-faith description of what
          this site actually does — not a template, and not legal advice. If something here looks
          wrong or incomplete, please open an issue on{' '}
          <a
            href="https://github.com/santoshe61/consenti"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>

        <h2>What this site collects</h2>

        <h3>The &quot;request hosted SaaS&quot; interest form</h3>
        <p>
          If you fill in the SaaS-interest form (the floating badge asking whether you&apos;d use a
          hosted version of Consenti), we store: your email address, organization name (if you
          provide one), the tool you currently use (if you provide one), whether you&apos;ve tried
          Consenti, a 1–5 satisfaction score and free-text feedback (if you&apos;ve tried it), a
          timestamp, and your IP address with the last segment zeroed out (e.g.{' '}
          <code>192.0.2.55</code> → <code>192.0.2.0</code>) so it&apos;s never stored precisely
          enough to identify a single device. This is used only to gauge interest in a hosted
          offering and to prioritize what to build next — never sold, shared, or used for
          advertising.
        </p>
        <p>
          This form is protected by <strong>Google reCAPTCHA v3</strong>, which runs invisibly and
          sends signals to Google to score the request as human or automated. That&apos;s subject to{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Google&apos;s Privacy Policy
          </a>
          .
        </p>

        <h3>Search</h3>
        <p>
          The documentation search box is powered by <strong>Algolia DocSearch</strong>. Search
          queries you type are sent to Algolia to return results; see{' '}
          <a
            href="https://www.algolia.com/policies/privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Algolia&apos;s Privacy Policy
          </a>
          .
        </p>

        <h3>Everything else</h3>
        <p>
          Dark/light theme preference is stored in your browser&apos;s <code>localStorage</code>{' '}
          only — it never leaves your device and isn&apos;t a cookie. This site sets no advertising
          or cross-site tracking cookies, and runs no analytics beyond standard server access logs
          (request path, timestamp, user agent) kept for operational purposes.
        </p>

        <h2>How long we keep it</h2>
        <p>
          SaaS-interest form submissions are kept until you ask us to delete them — there is no
          automatic expiry today. Server access logs rotate on a standard operational schedule.
        </p>

        <h2>Your rights</h2>
        <p>
          You can ask what we hold about you, ask us to correct it, or ask us to delete it, at any
          time. See <Link href="/support/">Support Consenti</Link> for contact details, or open an
          issue on{' '}
          <a
            href="https://github.com/santoshe61/consenti"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>

        <h2>Changes to this policy</h2>
        <p>
          This page may change as the site changes. Material changes will update the &quot;Last
          updated&quot; date above.
        </p>

        <p>
          Related: <Link href="/terms/">Terms of Use</Link> · <Link href="/license/">License</Link>
        </p>
      </div>
    </main>
  )
}
