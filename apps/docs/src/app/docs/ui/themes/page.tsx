import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Themes & CSS',
  description:
    'Consenti uses BEM class names and CSS custom properties for theming — no Shadow DOM, your stylesheets apply directly.',
  alternates: { canonical: '/docs/ui/themes' },
  openGraph: {
    title: 'Themes & CSS',
    description:
      'Consenti uses BEM class names and CSS custom properties for theming — no Shadow DOM, your stylesheets apply directly.',
    url: 'https://consenti.dev/docs/ui/themes',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Themes & CSS',
    description:
      'Consenti uses BEM class names and CSS custom properties for theming — no Shadow DOM, your stylesheets apply directly.',
    images: ['/og-image.jpg'],
  },
}

export default function UIThemesPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Themes &amp; CSS</h1>
      <p>
        Consenti uses BEM class names with a <code>.consenti-</code> prefix and CSS custom
        properties for all themeable values. No Shadow DOM — your stylesheets apply directly.
      </p>

      <h2>CSS custom properties</h2>
      <p>Override any of these in your own stylesheet:</p>
      <CodeBlock
        lang="css"
        code={`:root {
  /* Colors */
  --consenti-color-bg: #ffffff;
  --consenti-color-text: #1a2e4a;
  --consenti-color-text-muted: #949dab;
  --consenti-color-primary: #04111f;
  --consenti-color-primary-text: #ffffff;
  --consenti-color-secondary: #f0f4f8;
  --consenti-color-secondary-text: #1a2e4a;
  --consenti-color-border: #dbe4ee;
  --consenti-color-secondary-border: #1a2e4a;
  --consenti-color-overlay: #04111f;
  --consenti-color-accent: #d32f2f;
  --consenti-color-accent-text: #ffffff;

  /* Typography */
  --consenti-font-family: system-ui, -apple-system, sans-serif;
  --consenti-font-family-mono: ui-monospace, monospace;
  --consenti-font-size-base: 14px;
  --consenti-font-size-heading: 16px;
  --consenti-font-weight-heading: 600;
  --consenti-line-height: 1.5;

  /* Spacing */
  --consenti-spacing-xs: 5px;
  --consenti-spacing-sm: 8px;
  --consenti-spacing-md: 16px;
  --consenti-spacing-lg: 24px;

  /* Shape */
  --consenti-border-radius: 8px;
  --consenti-border-radius-btn: 0;
  --consenti-shadow: 0 4px 24px rgba(21, 101, 192, 0.14);

  /* Toggle (preference modal) */
  --consenti-toggle-bg-on: #43a047;
  --consenti-toggle-bg-partial: #97c098;
  --consenti-toggle-bg-off: #9ca3af;
  --consenti-toggle-knob: #ffffff;
  --consenti-toggle-width: 52px;
  --consenti-toggle-height: 28px;

  /* Stacking */
  --consenti-z-banner: 9999;
  --consenti-z-overlay: 9998;
  --consenti-z-modal: 10000;
}`}
      />

      <h2>Via JS theme config</h2>
      <p>
        Set theme tokens directly in the <code>ConsentiSetup</code> config instead of (or in
        addition to) a stylesheet — <code>theme</code> keys are inlined as the CSS custom
        properties above on the host element. Every key is the camelCase form of its{' '}
        <code>--consenti-*</code> variable (e.g. <code>--consenti-color-primary-text</code>{' '}
        becomes <code>colorPrimaryText</code>), so the two lists always match 1:1.
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: {
    theme: {
      colorPrimaryText: '#0f172a',
      colorSecondaryText: '#475569',
      colorBg: '#ffffff',
      colorSecondary: '#f8fafc',
      borderRadiusBtn: '9999px',   // pill-shaped buttons
      borderRadius: '20px',        // modal/banner corner radius
      fontSizeMultiplier: '1.1',   // scales font-size-base and font-size-heading
    },
  },
})`}
      />

      <h2>BEM class reference</h2>

      <h3>Banner</h3>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Element</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>.consenti-banner</code>
            </td>
            <td>Banner root element</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner--top</code>
            </td>
            <td>Position modifier (top / middle / left-bottom / right-bottom)</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner--gpc</code>
            </td>
            <td>GPC banner modifier</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__inner</code>
            </td>
            <td>Inner container (max-width centred)</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__heading</code>
            </td>
            <td>Banner heading</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__text</code>
            </td>
            <td>Banner HTML text</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__link</code>
            </td>
            <td>Auto-added to action: 'link'</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__link--privacy</code>
            </td>
            <td>Auto-added privacy policy link</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__buttons</code>
            </td>
            <td>Button row</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-banner__close</code>
            </td>
            <td>Close X button</td>
          </tr>
        </tbody>
      </table>

      <h3>Modal</h3>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Element</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>.consenti-overlay</code>
            </td>
            <td>Full-screen overlay backdrop</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal</code>
            </td>
            <td>Modal root</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal__heading</code>
            </td>
            <td>Modal heading</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal__subheading</code>
            </td>
            <td>Modal subheading</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal__text</code>
            </td>
            <td>Modal HTML text</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal__categories</code>
            </td>
            <td>Category list</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-category</code>
            </td>
            <td>Single category block</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-category__toggle</code>
            </td>
            <td>Category enable/disable toggle</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-category__toggle--mandatory</code>
            </td>
            <td>Disabled toggle for mandatory categories</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal__buttons</code>
            </td>
            <td>Button row</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-modal__close</code>
            </td>
            <td>Close X button</td>
          </tr>
        </tbody>
      </table>

      <h3>Buttons</h3>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>.consenti-btn</code>
            </td>
            <td>Base button class</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-btn--primary</code>
            </td>
            <td>Primary CTA (filled)</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-btn--secondary</code>
            </td>
            <td>Secondary (outlined or light)</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-btn--text</code>
            </td>
            <td>Text/link style button</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-btn--submit</code>
            </td>
            <td>Primary submit in modal</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-btn--manage</code>
            </td>
            <td>Opens preference modal</td>
          </tr>
          <tr>
            <td>
              <code>.consenti-btn--close</code>
            </td>
            <td>Closes banner or modal</td>
          </tr>
        </tbody>
      </table>

      <h2>Dark mode</h2>
      <p>
        Consenti doesn&apos;t follow <code>prefers-color-scheme</code> automatically. Set{' '}
        <code>darkMode: true</code> in the <code>ConsentiSetup</code> config (or via{' '}
        <code>setDarkMode()</code>) to add a <code>.consenti-root--dark</code> class to the host
        element, which overrides the token values below:
      </p>
      <CodeBlock
        lang="css"
        code={`.consenti-root--dark {
  --consenti-color-bg: #1e2535;
  --consenti-color-text: #e2e8f0;
  --consenti-color-text-muted: #a4acb9;
  --consenti-color-primary: #e2e8f0;
  --consenti-color-primary-text: #2a3447;
  --consenti-color-secondary: #2a3447;
  --consenti-color-secondary-text: #cbd5e1;
  --consenti-color-border: #374151;
  --consenti-color-overlay: rgba(0, 0, 0, 0.65);
  --consenti-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  --consenti-toggle-bg-off: #6b7280;
}`}
      />

      <Callout type="tip">
        Set <code>core.disableCssTemplate: true</code> and define all styles yourself for maximum
        control. You can use the BEM class names as-is or remap them entirely with custom CSS.
      </Callout>
    </div>
  )
}
