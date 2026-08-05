import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Custom Themes & Dark Mode — Frontend Guide — Consenti',
  description:
    'Override CSS custom properties, swap themes at runtime, and toggle dark mode for the Consenti widget.',
  alternates: { canonical: '/guides/frontend/themes' },
  openGraph: {
    title: 'Custom Themes & Dark Mode — Frontend Guide — Consenti',
    description:
      'Override CSS custom properties, swap themes at runtime, and toggle dark mode for the Consenti widget.',
    url: 'https://consenti.dev/guides/frontend/themes',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Themes & Dark Mode — Frontend Guide — Consenti',
    description:
      'Override CSS custom properties, swap themes at runtime, and toggle dark mode for the Consenti widget.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendThemesGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Custom Themes & Dark Mode</h1>
      <p className="lead">
        Consenti&apos;s entire visual layer is built on CSS custom properties. You can match it to
        your brand by overriding a handful of variables in your stylesheet — no build step, no
        Shadow DOM to pierce, no specificity battles.
      </p>

      <h2>How theming works</h2>
      <p>
        The widget reads CSS custom properties from the <code>:root</code> scope at render time.
        Override any <code>--consenti-*</code> token in your own stylesheet and the widget picks it
        up automatically. You can also pass a <code>core.theme</code> object to{' '}
        <code>ConsentiSetup</code> to set tokens via JavaScript — useful when your brand colours
        come from an API or theme context.
      </p>

      <h2>Option A — CSS custom property override</h2>
      <p>
        This is the recommended approach for static brand customisation. No CSS import is required —
        <code>ConsentiSetup</code> injects its own default <code>&lt;style&gt;</code> tag at
        runtime. Add your overrides in your own stylesheet, loaded normally in your page.
      </p>

      <CodeBlock
        lang="css"
        filename="styles/consent-theme.css"
        code={`:root {
  /* Primary button and active states */
  --consenti-color-primary: #7c3aed;
  --consenti-color-primary-text: #ffffff;

  /* Secondary button */
  --consenti-color-secondary: #f5f0ff;
  --consenti-color-secondary-text: #7c3aed;

  /* Banner & modal background */
  --consenti-color-bg: #ffffff;
  --consenti-color-text: #1a1a2e;

  /* Border radius — pill buttons, rounded modal/banner corners */
  --consenti-border-radius-btn: 999px;
  --consenti-border-radius: 16px;

  /* Typography */
  --consenti-font-family: 'Inter', system-ui, sans-serif;
  --consenti-font-size-base: 14px;

  /* Toggle colours */
  --consenti-toggle-bg-on: #7c3aed;
  --consenti-toggle-bg-off: #d1d5db;
}`}
      />

      <h2>Option B — JS theme config</h2>
      <p>
        Pass a <code>core.theme</code> object to <code>ConsentiSetup</code>. The widget translates
        each field into the corresponding CSS custom property at initialisation.
      </p>

      <CodeBlock
        lang="typescript"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-in' },
  core: {
    theme: {
      colorPrimary: '#7c3aed',       // maps to --consenti-color-primary
      colorPrimaryText: '#ffffff',
      colorSecondary: '#f5f0ff',
      colorSecondaryText: '#7c3aed',
      borderRadius: '12px',
      borderRadiusBtn: '999px',   // pill buttons
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSizeBase: '14px',
      colorBg: '#ffffff',
      colorText: '#1a1a2e',
    },
  },
})`}
      />

      <h2>Runtime theme swapping</h2>
      <p>
        Use <code>widget.setTheme()</code> to hot-swap tokens after the widget is initialised. This
        merges the new values into the current theme — you don&apos;t need to pass the full theme
        object.
      </p>

      <CodeBlock
        lang="typescript"
        code={`const widget = new ConsentiSetup({ /* ... */ })

// Later — e.g. when a theme switcher is toggled
widget.setTheme({ colorPrimary: '#e11d48' }) // swap accent colour only`}
      />

      <h2>Dark mode</h2>
      <p>
        Set <code>darkMode: true</code> in config, or let the widget follow the system preference:
      </p>

      <CodeBlock
        lang="typescript"
        code={`// Follow system preference
new ConsentiSetup({
  compliance: { type: 'opt-in' },
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
})

// Or toggle at runtime
widget.setDarkMode()        // toggle
widget.setDarkMode(true)    // force dark
widget.setDarkMode(false)   // force light`}
      />

      <Callout type="tip">
        To keep dark mode in sync with a theme switcher in your own UI, listen to the toggle event
        and call <code>widget.setDarkMode(isDark)</code> whenever your theme changes.
      </Callout>

      <h2>Full CSS token reference</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Token
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Default
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                What it controls
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-xs font-mono">
            {[
              ['--consenti-color-bg', '#ffffff', 'Banner & modal background'],
              ['--consenti-color-text', '#1a2e4a', 'Main text colour'],
              ['--consenti-color-text-muted', '#949dab', 'Secondary/muted text'],
              ['--consenti-color-primary', '#04111f', 'Primary button background & accents'],
              ['--consenti-color-primary-text', '#ffffff', 'Primary button text'],
              ['--consenti-color-secondary', '#f0f4f8', 'Secondary button/surface background'],
              ['--consenti-color-secondary-text', '#1a2e4a', 'Secondary button/surface text'],
              ['--consenti-color-border', '#dbe4ee', 'Default border colour'],
              ['--consenti-color-overlay', '#04111f', 'Full-screen modal backdrop'],
              ['--consenti-color-accent', '#d32f2f', 'Destructive/attention accent'],
              ['--consenti-border-radius', '8px', 'Banner & modal corner radius'],
              ['--consenti-border-radius-btn', '0', 'Button corner radius'],
              ['--consenti-shadow', '0 4px 24px rgba(21,101,192,.14)', 'Banner & modal box shadow'],
              ['--consenti-toggle-bg-on', '#43a047', 'Toggle on-state colour'],
              ['--consenti-toggle-bg-off', '#9ca3af', 'Toggle off-state colour'],
              ['--consenti-font-family', 'system-ui, sans-serif', 'Widget font family'],
              ['--consenti-font-size-base', '14px', 'Base font size'],
            ].map(([token, defaultVal, desc], i) => (
              <tr
                key={token}
                className={
                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800'
                }
              >
                <td className="px-4 py-2.5 text-brand-700 dark:text-brand-400">{token}</td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-gray-400">{defaultVal}</td>
                <td className="px-4 py-2.5 font-sans text-slate-600 dark:text-gray-300">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RelatedDocs
        items={[
          {
            href: '/docs/ui/themes/',
            label: 'Themes & CSS',
            desc: 'The complete CSS custom property reference',
          },
          {
            href: '/docs/ui/methods/',
            label: 'API Methods',
            desc: 'widget.setTheme() and widget.setDarkMode() in detail',
          },
          {
            href: '/docs/ui/configuration/',
            label: 'Configuration',
            desc: 'core.theme and darkMode as top-level setup options',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Can I use Tailwind classes to style the widget?',
            answer: (
              <p className="m-0">
                Not directly — the widget generates its own HTML and uses BEM class names like{' '}
                <code>.consenti-banner__heading</code>. You can write Tailwind-style CSS in a{' '}
                <code>@layer utilities</code> block targeting those classes, but it&apos;s easier to
                just override the CSS custom properties as shown above. The widget was intentionally
                built without Shadow DOM so you can reach any element.
              </p>
            ),
          },
          {
            question: 'Why is my CSS override not working?',
            answer: (
              <>
                <p className="m-0 mb-2">Three common causes:</p>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    <code>ConsentiSetup</code> injects its default styles into{' '}
                    <code>&lt;head&gt;</code> at runtime — after your own stylesheet has already
                    loaded. For equal-specificity <code>:root</code> rules, whichever rule is later
                    in the DOM wins, so the injected defaults can override your CSS. Add{' '}
                    <code>!important</code> to the custom property to guarantee it wins regardless
                    of order.
                  </li>
                  <li>
                    You&apos;re targeting a scoped custom property. All Consenti tokens are on{' '}
                    <code>:root</code> — that&apos;s the correct selector.
                  </li>
                  <li>
                    You&apos;re passing <code>core.theme</code> in JS, which sets inline custom
                    properties and wins over stylesheet tokens. Remove the JS theme config and rely
                    solely on CSS overrides.
                  </li>
                </ul>
              </>
            ),
          },
          {
            question: 'How do I theme the modal differently from the banner?',
            answer: (
              <p className="m-0">
                The modal and banner share every CSS custom property — there&apos;s no
                modal-specific token. For per-element customisation, target BEM classes directly
                in your stylesheet — e.g.{' '}
                <code>.consenti-modal {'{ background: #f8f0ff; }'}</code> — while leaving the
                banner&apos;s <code>.consenti-banner</code> rules untouched.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
