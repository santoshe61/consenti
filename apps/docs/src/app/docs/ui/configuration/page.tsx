import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'UI Widget — Configuration',
  description:
    "How to configure the Consenti UI widget with ConsentiSetup(config) — every field is optional and auto-detects the visitor's compliance group.",
  alternates: { canonical: 'https://consenti.dev/docs/ui/configuration' },
  openGraph: {
    title: 'UI Widget — Configuration',
    description:
      "How to configure the Consenti UI widget with ConsentiSetup(config) — every field is optional and auto-detects the visitor's compliance group.",
    url: 'https://consenti.dev/docs/ui/configuration',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI Widget — Configuration',
    description:
      "How to configure the Consenti UI widget with ConsentiSetup(config) — every field is optional and auto-detects the visitor's compliance group.",
    images: ['/og-image.jpg'],
  },
}

export default function UIConfigurationPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Configuration</h1>
      <p>
        <code>new ConsentiSetup(config)</code> accepts a single <code>ConsentiConfig</code> object.
        All top-level keys are optional — the widget works with an empty config object,
        auto-detecting the compliance group from the browser. This page covers the handful of
        options most sites need.
      </p>

      <h2>Minimal config to get started</h2>
      <p>This is all you need for a fully working consent banner. Everything below is optional.</p>
      <CodeBlock
        lang="ts"
        filename="main.ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

// Auto-detects compliance from browser locale (GDPR, CCPA, etc.)
const widget = new ConsentiSetup({})

// Or pin a specific compliance group:
// new ConsentiSetup({ compliance: { type: 'opt-in' } })   // GDPR
// new ConsentiSetup({ compliance: { type: 'opt-out' } })  // CCPA`}
      />

      <h2>The options you'll change first</h2>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Default</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>compliance.type</code>
            </td>
            <td>auto-detected</td>
            <td>
              Pin one of the 8 built-in compliance groups instead of geo-detecting — see the{' '}
              <a href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</a>{' '}
              for every country and its assigned group.
            </td>
          </tr>
          <tr>
            <td>
              <code>core.locale</code>
            </td>
            <td>
              <code>'en'</code>
            </td>
            <td>
              BCP 47 locale code for banner/modal text, e.g. <code>'fr'</code>, <code>'fr-CA'</code>
              .
            </td>
          </tr>
          <tr>
            <td>
              <code>core.theme</code>
            </td>
            <td>built-in blue theme</td>
            <td>Colours, fonts, and border radius via CSS custom properties.</td>
          </tr>
          <tr>
            <td>
              <code>api.enabled</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Connect to a running <code>@consenti/api</code> backend for server-recorded consent
              and admin-managed profiles.
            </td>
          </tr>
          <tr>
            <td>
              <code>profileOverride</code>
            </td>
            <td>
              <code>undefined</code>
            </td>
            <td>
              Patch banner copy, buttons, or position without defining a full profile — see below.
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        To tweak copy, buttons, or position without defining a full profile, use{' '}
        <code>profileOverride</code>:
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  profileOverride: {
    mainBanner: {
      heading: 'We value your privacy',
      htmlText: 'We use cookies to improve your experience.',
      buttons: {
        'accept-all': { text: 'Accept All',     style: 'primary',   action: 'custom', cookies: '*' },
        'reject-optional': { text: 'Reject Optional',style: 'secondary', action: 'custom', cookies: '!' },
        'customize': { text: 'Customize',      style: 'secondary', action: 'manage' },
      },
    },
  },
})`}
      />
      <p>
        Setting a key to <code>null</code> instead of a value deletes it from the merged result
        (removing a single category or parameter from a keyed map, for example) — see{' '}
        <a href="/docs/ui/advanced-configuration/#profileoverride">
          profileOverride in the Advanced Configuration reference
        </a>{' '}
        for the full deep-merge and delete semantics.
      </p>

      <Callout type="info">
        This page covers the common cases. For every field — <code>core</code>, <code>api</code>,{' '}
        <code>utils.gtm</code>, <code>plugins</code>, theming tokens, TCF, age gate, and more — see
        the <a href="/docs/ui/advanced-configuration/">Advanced Configuration reference</a>.
      </Callout>
    </div>
  )
}
