import Link from 'next/link'
import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'

export const metadata: Metadata = {
  title: 'UI Widget',
  description:
    '@consenti/ui is a zero-dependency TypeScript library that owns the complete frontend consent lifecycle.',
  alternates: { canonical: '/docs/ui' },
  openGraph: {
    title: 'UI Widget',
    description:
      '@consenti/ui is a zero-dependency TypeScript library that owns the complete frontend consent lifecycle.',
    url: 'https://consenti.dev/docs/ui',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI Widget',
    description:
      '@consenti/ui is a zero-dependency TypeScript library that owns the complete frontend consent lifecycle.',
    images: ['/og-image.jpg'],
  },
}

export default function UIOverviewPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget</h1>
      <p>
        <code>@consenti/ui</code> is a zero-dependency TypeScript library that owns the complete
        frontend consent lifecycle. You call <code>new ConsentiSetup(config)</code> once and the
        widget handles everything else automatically.
      </p>
      <p>
        New here? Start with the <a href="/docs/getting-started/quick-start/">Quick Start</a> for
        working code. This page explains <em>how the widget thinks</em> so the rest of the docs make
        sense.
      </p>

      <hr />

      <h2>Lifecycle</h2>
      <p>
        Every time <code>new ConsentiSetup(config)</code> runs in the browser, it executes these
        steps in order:
      </p>
      <CodeBlock
        lang="text"
        code={` 1  SSR guard          exit silently if not running in a browser
 2  Profile resolve    API fetch  →  local ConsentiProfile  →  built-in default
 3  profileOverride    deep-merge any runtime overrides on top
 4  Consent check      read stored record from cookie / localStorage
 5  GPC detection      read navigator.globalPrivacyControl
 6  Banner decision    show main banner, GPC banner, or nothing
 7  DOM mount          inject #consenti-root, render banner and modal
 8  onReady fires      your callbacks run
 9  User interacts     button click or modal toggle
10  Consent written    cookie / localStorage  +  API POST (if enabled)
11  Events fire        consenti:consentSubmitted  +  GTM dataLayer push
12  Cross-tab sync     BroadcastChannel closes banner in all open tabs`}
      />

      <hr />

      <h2>Three things you configure</h2>

      <h3>1. Profile — what the widget shows</h3>
      <p>
        A profile defines which cookie purposes the widget manages, all banner and modal copy,
        button labels and actions, and locale-specific translations. You have three options:
      </p>
      <ul>
        <li>
          <strong>Built-in default</strong> — omit <code>profileId</code>. A fully working English
          GDPR profile ships with the package. No code needed.
        </li>
        <li>
          <strong>
            <code>ConsentiProfile</code>
          </strong>{' '}
          — define your own cookies, copy, and categories in code for frontend-only installations.
        </li>
        <li>
          <strong>API profile</strong> — create profiles in the admin dashboard; the widget fetches
          them at runtime when <code>api.enabled: true</code>.
        </li>
      </ul>
      <p>
        <code>profileOverride</code> lets you patch any profile field at runtime — useful for
        per-page banner positions or A/B testing copy without touching the base profile.
      </p>
      <p>
        → <a href="/docs/ui/advanced-profiles/">Full Profile reference</a>
      </p>

      <h3>2. Config — how the widget behaves</h3>
      <p>
        <code>ConsentiSetup</code> accepts one config object with five top-level keys:
      </p>
      <ul>
        <li>
          <strong>
            <code>core</code>
          </strong>{' '}
          — regulation, locale, storage mode, GPC handling, cookie signing, theme tokens
        </li>
        <li>
          <strong>
            <code>api</code>
          </strong>{' '}
          — backend URL and auth token (omit entirely when not using the backend)
        </li>
        <li>
          <strong>
            <code>utils.gtm</code>
          </strong>{' '}
          — GTM container ID and Google Consent Mode v2 options
        </li>
        <li>
          <strong>
            <code>plugins</code>
          </strong>{' '}
          — frontend plugin instances
        </li>
        <li>
          <strong>
            <code>profileOverride</code>
          </strong>{' '}
          — runtime profile patches
        </li>
      </ul>
      <p>
        → <a href="/docs/ui/advanced-configuration/">Full Configuration reference</a>
      </p>

      <h3>3. Events &amp; methods — how you react</h3>
      <p>After initialisation the widget runs on its own. You interact with it in two ways:</p>
      <ul>
        <li>
          <strong>Listen to events</strong> — <code>consenti:consentSubmitted</code> fires every
          time consent changes. Gate your analytics and ad scripts here. Other events cover banner
          visibility and modal open/close.
        </li>
        <li>
          <strong>Call methods</strong> — <code>widget.showModal()</code> opens the preference modal
          from a &quot;Cookie Settings&quot; link. <code>widget.getConsent()</code> reads the
          current record. <code>widget.reConsent()</code> clears consent and re-shows the banner.
        </li>
      </ul>
      <p>
        → <a href="/docs/ui/events/">Events reference</a> &nbsp;·&nbsp;{' '}
        <a href="/docs/ui/methods/">API Methods reference</a>
      </p>

      <hr />

      <h2>Package exports</h2>
      <table>
        <thead>
          <tr>
            <th>Import path</th>
            <th>Exports</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@consenti/ui</code>
            </td>
            <td>
              <code>ConsentiSetup</code>, <code>ConsentiProfile</code>, all types
            </td>
            <td>Main entry point</td>
          </tr>
          <tr>
            <td>
              <code>@consenti/ui/react</code>
            </td>
            <td>
              <code>useConsent</code>, <code>ConsentProvider</code>
            </td>
            <td>React / Next.js</td>
          </tr>
          <tr>
            <td>
              <code>@consenti/ui/vue</code>
            </td>
            <td>
              <code>useConsent</code> composable
            </td>
            <td>Vue / Nuxt</td>
          </tr>
          <tr>
            <td>
              <code>@consenti/ui/angular</code>
            </td>
            <td>
              <code>ConsentiService</code>, <code>ConsentiModule</code>
            </td>
            <td>Angular</td>
          </tr>
          <tr>
            <td>
              <code>@consenti/ui/testing</code>
            </td>
            <td>
              <code>mockConsent</code>, test helpers
            </td>
            <td>Unit tests</td>
          </tr>
          <tr>
            <td>
              <code>@consenti/ui/dist/index.css</code>
            </td>
            <td>Default styles</td>
            <td>Auto-injected at runtime; import explicitly only to preload or override</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2>In this section</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose mt-4">
        {[
          {
            href: '/docs/ui/installation/',
            title: 'Installation',
            desc: 'npm, CDN UMD, ESM in browser — all install methods and CSS options',
          },
          {
            href: '/docs/ui/profiles/',
            title: 'Profile',
            desc: 'Quick start — pre-built profiles and profileOverride',
          },
          {
            href: '/docs/ui/configuration/',
            title: 'Configuration',
            desc: 'Quick start — the config options most sites need',
          },
          {
            href: '/docs/ui/advanced-profiles/',
            title: 'Advanced Profile',
            desc: 'ConsentiProfile, multi-locale support, full type reference',
          },
          {
            href: '/docs/ui/advanced-configuration/',
            title: 'Advanced Configuration',
            desc: 'Every ConsentiConfig field — core, api, gtm, theme',
          },
          {
            href: '/docs/compliance/jurisdiction-coverage-map/',
            title: 'Jurisdiction Coverage Map',
            desc: 'Every country, its law(s), and its compliance group',
          },
          {
            href: '/docs/ui/events/',
            title: 'Events',
            desc: 'All consenti: DOM events, detail payloads, and GTM dataLayer pushes',
          },
          {
            href: '/docs/ui/methods/',
            title: 'API Methods',
            desc: 'Every widget instance method with signatures and examples',
          },
          {
            href: '/docs/ui/themes/',
            title: 'Themes & CSS',
            desc: 'CSS custom properties, BEM class names, bring-your-own CSS',
          },
          {
            href: '/docs/ui/frameworks/',
            title: 'Frameworks',
            desc: 'React, Vue, Angular, Next.js, Nuxt integration guides',
          },
          {
            href: '/docs/ui/plugins/',
            title: 'Plugins',
            desc: 'Extend the widget with custom hooks and third-party forwarding',
          },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-sm transition-all no-underline"
          >
            <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
