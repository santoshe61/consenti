import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'UI Installation' }

export default function UIInstallationPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Installation</h1>

      <h2>npm (recommended)</h2>
      <Terminal code="npm install @consenti/ui" />

      <p>Then import the CSS and the class:</p>
      <CodeBlock lang="ts" code={`import { ConsentiSetup } from '@consenti/ui'
import '@consenti/ui/dist/index.css'`} />

      <h2>CDN / UMD (no build step)</h2>
      <p>
        Load the UMD bundle from a CDN for sites without a build pipeline.
        The bundle exposes a global <code>ConsentiUI</code> object.
      </p>
      <CodeBlock lang="html" filename="index.html" code={`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.css" />
<script src="https://cdn.jsdelivr.net/npm/@consenti/ui/dist/index.umd.js"></script>
<script>
  const { ConsentiSetup } = ConsentiUI
  new ConsentiSetup({ core: { regulation: 'gdpr' } })
</script>`} />

      <h2>ESM in the browser (no bundler)</h2>
      <CodeBlock lang="html" code={`<script type="module">
  import { ConsentiSetup } from 'https://esm.sh/@consenti/ui'
  new ConsentiSetup({ core: { regulation: 'gdpr' } })
</script>`} />

      <h2>CSS options</h2>
      <table>
        <thead>
          <tr><th>Approach</th><th>How</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Import from package (recommended)</td>
            <td><code>import '@consenti/ui/dist/index.css'</code></td>
          </tr>
          <tr>
            <td>Skip all CSS (bring your own)</td>
            <td>Set <code>core.disableCssTemplate: true</code> in config — no styles injected at all</td>
          </tr>
          <tr>
            <td>CSS custom properties only</td>
            <td>Import CSS, then override <code>--consenti-*</code> variables in your own stylesheet</td>
          </tr>
        </tbody>
      </table>

      <Callout type="tip">
        If you use <code>disableCssTemplate: true</code>, you own 100% of the styling.
        All elements use BEM class names like <code>.consenti-banner</code>,
        <code>.consenti-banner__heading</code>, <code>.consenti-btn--primary</code>.
        See the <a href="/docs/ui/themes/">Themes guide</a> for the full class reference.
      </Callout>

      <h2>TypeScript</h2>
      <p>
        The package ships full TypeScript definitions. No <code>@types</code> package needed.
        Use in strict mode:
      </p>
      <CodeBlock lang="ts" code={`import type { ConsentiConfig, ConsentValue, ConsentiProfile } from '@consenti/ui'

const config: ConsentiConfig = {
  core: { regulation: 'gdpr' },
}`} />

      <h2>Package structure</h2>
      <CodeBlock lang="text" code={`@consenti/ui/
├── dist/
│   ├── index.mjs           ← ESM entry
│   ├── index.umd.js        ← UMD entry (CDN)
│   ├── index.d.ts          ← TypeScript types
│   ├── index.css           ← Default styles
│   ├── react.mjs           ← React hook
│   ├── vue.mjs             ← Vue composable
│   └── angular.mjs         ← Angular service`} />
    </div>
  )
}
