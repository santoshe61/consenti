import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Minimal Setup — Frontend Guide — Consenti',
  description:
    'Get a GDPR-compliant consent banner on screen in under 5 minutes with no backend required.',
  alternates: { canonical: '/guides/frontend/minimal-setup' },
  openGraph: {
    title: 'Minimal Setup — Frontend Guide — Consenti',
    description:
      'Get a GDPR-compliant consent banner on screen in under 5 minutes with no backend required.',
    url: 'https://consenti.dev/guides/frontend/minimal-setup',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minimal Setup — Frontend Guide — Consenti',
    description:
      'Get a GDPR-compliant consent banner on screen in under 5 minutes with no backend required.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendMinimalSetupGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Minimal Setup</h1>
      <p className="lead">
        You can have a working consent banner on any website in under 5 minutes. No backend, no
        database, no build tool required if you prefer CDN. This guide walks you through the fastest
        path to a live banner and explains what each step does.
      </p>

      <h2>Step 1 — Install the package</h2>
      <p>
        Choose the installation method that fits your project. All three produce the same widget —
        the only difference is how it gets to the browser.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'npm (recommended)',
            lang: 'bash',
            code: `npm install @consenti/ui`,
          },
          {
            label: 'CDN / UMD',
            lang: 'html',
            code: `<!-- Add to your <head> or before </body> -->
<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>`,
          },
          {
            label: 'ESM (no bundler)',
            lang: 'html',
            code: `<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({ compliance: { type: 'opt-in' } })
</script>`,
          },
        ]}
      />

      <Callout type="tip">
        No CSS import needed — <code>ConsentiSetup</code> injects its own <code>&lt;style&gt;</code>{' '}
        tag on first render. If you already have a design system and want full control over the
        look, set <code>core.disableCssTemplate: true</code> to skip all style injection and style
        from scratch using BEM class names.
      </Callout>

      <h2>Step 2 — Instantiate the widget</h2>
      <p>
        Import <code>ConsentiSetup</code> and call it with a compliance type. The simplest possible
        setup auto-detects the visitor&apos;s region from their browser timezone and language, then
        shows the right banner automatically.
      </p>

      <CodeBlock
        lang="typescript"
        filename="consent.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

// Auto-detects region from browser timezone + language
const widget = new ConsentiSetup({})

// Or pin a specific regulation — GDPR for all visitors
const widget = new ConsentiSetup({ compliance: { type: 'opt-in' } })`}
      />

      <p>
        On first visit, a banner appears at the bottom of the screen. The visitor accepts, rejects,
        or customises. On every subsequent visit, Consenti reads the stored cookie and the banner
        stays hidden.
      </p>

      <h2>What just happened?</h2>
      <p>
        When you call <code>new ConsentiSetup()</code>, the widget:
      </p>
      <ol>
        <li>Checks whether a consent cookie already exists for this visitor.</li>
        <li>
          If no cookie exists, determines which compliance profile to load (geo-resolved or fixed).
        </li>
        <li>Downloads only the relevant profile chunk — typically a few KB.</li>
        <li>Injects the banner DOM into the page.</li>
        <li>Waits for the visitor to interact, then writes the consent cookie.</li>
      </ol>

      <Callout type="info">
        The widget is SSR-safe by default. Calling <code>new ConsentiSetup()</code> during
        server-side rendering is a silent no-op — it never touches the DOM. You never need to guard
        the import.
      </Callout>

      <h2>Next steps</h2>
      <p>
        Now that the banner is live, you probably want to react to consent decisions in your own
        code:
      </p>

      <CodeBlock
        lang="typescript"
        code={`widget.on('consentSubmitted', (data) => {
  if (data.consent.analytics === 'granted') {
    initAnalytics()
  }
})`}
      />

      <p>
        For a full picture of the consent lifecycle — from first visit to cookie expiry — read{' '}
        <a href="/guides/frontend/consent-flow/">How Consent Flow Works</a>.
      </p>

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/installation/',
            label: 'Installation',
            desc: 'npm, CDN/UMD, and ESM setup in full detail',
          },
          {
            href: '/docs/ui/configuration/',
            label: 'Configuration',
            desc: 'The options most sites need — compliance, core, callbacks',
          },
          {
            href: '/docs/ui/events/',
            label: 'Events',
            desc: 'Every consenti:* DOM event the widget fires',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'widget.on, showModal, getConsent, and every other instance method',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Do I need a backend to use Consenti?',
            answer: (
              <p className="m-0">
                No. The widget works entirely in the browser. It ships 8 pre-built compliance
                profiles (GDPR, CCPA, CPRA, LGPD, DPDPA, PIPL, and more) as dynamic-import chunks.
                Only the chunk matching the visitor&apos;s region downloads at runtime. A backend (
                <code>@consenti/api</code>) is optional — it adds dashboard-managed profiles,
                server-side geo-resolution, and a consent audit log.
              </p>
            ),
          },
          {
            question: 'Do I need to import any CSS?',
            answer: (
              <p className="m-0">
                No. <code>ConsentiSetup</code> injects its own <code>&lt;style&gt;</code> tag on
                first render — no import, no <code>&lt;link&gt;</code> tag, nothing to configure.
                Only import <code>@consenti/ui/dist/index.css</code> yourself if you want to preload
                it to avoid a flash of unstyled content, or set{' '}
                <code>core.disableCssTemplate: true</code> if you want to skip Consenti&apos;s
                styles entirely and bring your own.
              </p>
            ),
          },
          {
            question: 'Why is nothing showing on screen?',
            answer: (
              <>
                <p className="m-0 mb-2">Three common causes:</p>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    A consent cookie from a previous session already exists. Open DevTools →
                    Application → Cookies and delete any <code>consenti_*</code> cookie, then
                    reload.
                  </li>
                  <li>
                    <code>core.disableCssTemplate</code> is set to <code>true</code> but you
                    haven&apos;t supplied your own styles yet — the banner renders in the DOM but
                    has no visible styling.
                  </li>
                  <li>
                    You called <code>new ConsentiSetup()</code> before the DOM was ready. Wrap it in
                    a <code>DOMContentLoaded</code> listener or move the script to the end of{' '}
                    <code>&lt;body&gt;</code>.
                  </li>
                </ul>
              </>
            ),
          },
          {
            question: 'How do I stop the banner from showing on every page load?',
            answer: (
              <p className="m-0">
                The banner only shows when no valid consent cookie exists. Once the visitor submits
                their preferences, Consenti writes a <code>consenti_*</code> cookie that persists
                for the duration configured in the profile (default: the shortest cookie expiry in
                the profile). If the banner keeps appearing, the cookie is either missing, expired,
                or being blocked by a browser extension.
              </p>
            ),
          },
          {
            question: 'Can I use Consenti without a build tool?',
            answer: (
              <p className="m-0">
                Yes — use the CDN/UMD tab above. Add the <code>&lt;script&gt;</code> tag to your
                HTML, then access <code>ConsentiUI.ConsentiSetup</code> from the global namespace.
                No npm, no bundler, no build step.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
