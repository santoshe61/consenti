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
  --consenti-primary-text: #1a3460;
  --consenti-secondary-text: #555555;
  --consenti-primary-bg: #ffffff;
  --consenti-secondary-bg: #f5f5f5;
  --consenti-overlay-bg: rgba(0, 0, 0, 0.5);

  /* Buttons */
  --consenti-btn-primary-bg: #1565c0;
  --consenti-btn-primary-text: #ffffff;
  --consenti-btn-secondary-bg: #f5f5f5;
  --consenti-btn-secondary-text: #1a3460;
  --consenti-btn-text-color: #1565c0;
  --consenti-btn-radius: 6px;
  --consenti-btn-padding: 0.5rem 1.25rem;
  --consenti-btn-font-weight: 600;

  /* Banner */
  --consenti-banner-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  --consenti-banner-radius: 0;
  --consenti-banner-padding: 1.5rem;
  --consenti-banner-max-width: 960px;

  /* Modal */
  --consenti-modal-radius: 12px;
  --consenti-modal-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  --consenti-modal-width: 560px;
  --consenti-modal-max-height: 80vh;

  /* Toggle (preference modal) */
  --consenti-toggle-on: #1565c0;
  --consenti-toggle-off: #ccc;
  --consenti-toggle-disabled: #e0e0e0;

  /* Typography */
  --consenti-font-size-base: 14px;
  --consenti-font-size-mult: 1;
  --consenti-font-family: system-ui, -apple-system, sans-serif;
  --consenti-heading-weight: 700;
}`}
      />

      <h2>Via JS theme config</h2>
      <p>
        Set theme tokens directly in the <code>ConsentiSetup</code> config (inlined as CSS vars on
        the host element):
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  core: { regulation: 'gdpr' },
  theme: {
    primaryTextColor: '#0f172a',
    secondaryTextColor: '#475569',
    primaryBgColor: '#ffffff',
    secondaryBgColor: '#f8fafc',
    buttonBorderRadius: '9999px',    // pill-shaped buttons
    modalBorderRadius: '20px',
    fontSizeMultiplier: 1.1,
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
      <CodeBlock
        lang="css"
        code={`@media (prefers-color-scheme: dark) {
  :root {
    --consenti-primary-bg: #1e293b;
    --consenti-secondary-bg: #0f172a;
    --consenti-primary-text: #f1f5f9;
    --consenti-secondary-text: #94a3b8;
    --consenti-btn-secondary-bg: #334155;
    --consenti-btn-secondary-text: #f1f5f9;
  }
}`}
      />

      <Callout type="tip">
        Set <code>core.disableCssTemplate: true</code> and define all styles yourself for maximum
        control. You can use the BEM class names as-is or remap them entirely with custom CSS.
      </Callout>
    </div>
  )
}
