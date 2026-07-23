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
  --consenti-btn-primary-bg: #7c3aed;
  --consenti-btn-primary-text: #ffffff;

  /* Secondary button */
  --consenti-btn-secondary-bg: #f5f0ff;
  --consenti-btn-secondary-text: #7c3aed;

  /* Banner background */
  --consenti-primary-bg: #ffffff;
  --consenti-primary-text: #1a1a2e;

  /* Border radius — pill buttons */
  --consenti-btn-radius: 999px;
  --consenti-banner-radius: 12px;
  --consenti-modal-radius: 16px;

  /* Typography */
  --consenti-font-family: 'Inter', system-ui, sans-serif;
  --consenti-font-size-base: 14px;

  /* Toggle colours */
  --consenti-toggle-on: #7c3aed;
  --consenti-toggle-off: #d1d5db;
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
      primaryColor: '#7c3aed',       // maps to --consenti-btn-primary-bg
      primaryTextColor: '#ffffff',
      secondaryColor: '#f5f0ff',
      secondaryTextColor: '#7c3aed',
      borderRadius: '12px',
      buttonBorderRadius: '999px',   // pill buttons
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSizeBase: '14px',
      bgColor: '#ffffff',
      textColor: '#1a1a2e',
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
widget.setTheme({ primaryColor: '#e11d48' }) // swap accent colour only`}
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
              ['--consenti-primary-bg', '#ffffff', 'Banner & modal background'],
              ['--consenti-primary-text', '#1a1a1a', 'Main text colour'],
              ['--consenti-secondary-bg', '#f5f5f5', 'Secondary surfaces'],
              ['--consenti-secondary-text', '#555555', 'Secondary text'],
              ['--consenti-btn-primary-bg', '#1565c0', 'Primary button background'],
              ['--consenti-btn-primary-text', '#ffffff', 'Primary button text'],
              ['--consenti-btn-secondary-bg', '#f5f5f5', 'Secondary button background'],
              ['--consenti-btn-secondary-text', '#1a3460', 'Secondary button text'],
              ['--consenti-btn-radius', '6px', 'Button border radius'],
              ['--consenti-btn-padding', '0.5rem 1.25rem', 'Button padding'],
              ['--consenti-banner-padding', '1.5rem', 'Banner inner padding'],
              ['--consenti-banner-radius', '0', 'Banner border radius'],
              ['--consenti-banner-shadow', '0 -4px 24px rgba(0,0,0,.12)', 'Banner box shadow'],
              ['--consenti-modal-width', '560px', 'Modal max width'],
              ['--consenti-modal-radius', '12px', 'Modal border radius'],
              ['--consenti-modal-shadow', '0 8px 32px rgba(0,0,0,.24)', 'Modal box shadow'],
              ['--consenti-toggle-on', '#1565c0', 'Toggle on-state colour'],
              ['--consenti-toggle-off', '#ccc', 'Toggle off-state colour'],
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
                The modal and banner share most tokens, but modal-specific ones (
                <code>--consenti-modal-radius</code>, <code>--consenti-modal-shadow</code>,{' '}
                <code>--consenti-modal-width</code>) let you style them independently. For deeper
                per-element customisation, target BEM classes directly in your stylesheet — e.g.{' '}
                <code>.consenti-modal {'{ background: #f8f0ff; }'}</code>.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
