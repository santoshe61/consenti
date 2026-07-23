import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'UI Installation',
  description:
    'Install the Consenti UI widget with npm — styles are injected automatically, no CSS import needed.',
  alternates: { canonical: '/docs/ui/installation' },
  openGraph: {
    title: 'UI Installation',
    description:
      'Install the Consenti UI widget with npm — styles are injected automatically, no CSS import needed.',
    url: 'https://consenti.dev/docs/ui/installation',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UI Installation',
    description:
      'Install the Consenti UI widget with npm — styles are injected automatically, no CSS import needed.',
    images: ['/og-image.jpg'],
  },
}

export default function UIInstallationPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Installation</h1>

      <h2>npm (recommended)</h2>
      <Terminal code="npm install @consenti/ui" />

      <p>Then import and initialise — no CSS import needed, styles are injected automatically:</p>
      <CodeBlock lang="ts" code={`import { ConsentiSetup } from '@consenti/ui'`} />

      <h2>CDN / UMD (no build step)</h2>
      <p>
        Load the UMD bundle from a CDN for sites without a build pipeline. The bundle exposes a
        global <code>ConsentiUI</code> object. No stylesheet link is needed — styles inject
        automatically.
      </p>
      <CodeBlock
        lang="html"
        filename="index.html"
        code={`<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
<script>
  const { ConsentiSetup } = ConsentiUI
  new ConsentiSetup({ core: { regulation: 'gdpr' } })
</script>`}
      />

      <h2>ESM in the browser (no bundler)</h2>
      <CodeBlock
        lang="html"
        code={`<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({ core: { regulation: 'gdpr' } })
</script>`}
      />

      <h2>CSS options</h2>
      <table>
        <thead>
          <tr>
            <th>Approach</th>
            <th>How</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Auto-inject (default)</td>
            <td>
              Nothing to do — <code>ConsentiSetup</code> injects a <code>&lt;style&gt;</code> tag on
              first render
            </td>
          </tr>
          <tr>
            <td>Preload CSS (optional, avoids FOUC)</td>
            <td>
              <code>import '@consenti/ui/dist/index.css'</code> in your bundler entry, or a{' '}
              <code>&lt;link&gt;</code> tag
            </td>
          </tr>
          <tr>
            <td>Disable auto-inject (bring your own styles)</td>
            <td>
              Set <code>core.disableCssTemplate: true</code> — no <code>&lt;style&gt;</code> tag is
              injected at all
            </td>
          </tr>
          <tr>
            <td>Token overrides only</td>
            <td>
              Leave auto-inject on, override <code>--consenti-*</code> CSS custom properties in your
              stylesheet
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="tip">
        If you use <code>disableCssTemplate: true</code>, you own 100% of the styling. All elements
        use BEM class names like <code>.consenti-banner</code>,
        <code>.consenti-banner__heading</code>, <code>.consenti-btn--primary</code>. See the{' '}
        <a href="/docs/ui/themes/">Themes guide</a> for the full class reference.
      </Callout>

      <h2>TypeScript</h2>
      <p>
        The package ships full TypeScript definitions. No <code>@types</code> package needed. Use in
        strict mode:
      </p>
      <CodeBlock
        lang="ts"
        code={`import type { ConsentiConfig, ConsentValue, ConsentiProfile } from '@consenti/ui'

const config: ConsentiConfig = {
  core: { regulation: 'gdpr' },
}`}
      />

      <h2>Package structure</h2>
      <CodeBlock
        lang="text"
        code={`@consenti/ui/
├── dist/
│   ├── index.mjs           ← ESM entry
│   ├── index.umd.js        ← UMD entry (CDN)
│   ├── index.d.ts          ← TypeScript types
│   ├── index.css           ← Default styles
│   ├── react.mjs           ← React hook
│   ├── vue.mjs             ← Vue composable
│   └── angular.mjs         ← Angular service`}
      />
    </div>
  )
}
