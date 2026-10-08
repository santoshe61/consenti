import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'Profile — UI Widget',
  description:
    'How Consenti profiles define the cookies, banner layout, button labels, and locale text the UI widget renders.',
  alternates: { canonical: 'https://consenti.dev/docs/ui/profiles' },
  openGraph: {
    title: 'Profile — UI Widget',
    description:
      'How Consenti profiles define the cookies, banner layout, button labels, and locale text the UI widget renders.',
    url: 'https://consenti.dev/docs/ui/profiles',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profile — UI Widget',
    description:
      'How Consenti profiles define the cookies, banner layout, button labels, and locale text the UI widget renders.',
    images: ['/og-image.jpg'],
  },
}

export default function UIProfilesPage() {
  return (
    <div className="prose max-w-none">
      <h1>Profile</h1>
      <p>
        A <strong>profile</strong> defines everything the Consenti widget renders: which cookies /
        purposes it manages, the banner and modal layout, all button labels and actions, and the
        text copy for every supported locale. It is the single source of truth for the UI — not the
        widget config itself.
      </p>

      <h2>Get a working banner fast</h2>
      <p>
        You don&apos;t need to define a profile to get started. The widget ships 8 pre-built
        profiles (one per compliance group) that load automatically.
      </p>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

// Pre-built GDPR profile loads automatically — no extra code needed.
new ConsentiSetup({ compliance: { type: 'opt-in' } })`}
      />
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
        'reject-optional': { text: 'Reject Optional',style: 'primary', action: 'custom', cookies: '!' },
        'customize': { text: 'Customize',      style: 'secondary', action: 'manage' },
      },
    },
  },
})`}
      />
      <p>
        Setting a cookie, category, or button to <code>null</code> instead of an object removes it
        from the resolved profile — e.g. <code>cookies: {'{'} marketing: null {'}'}</code> drops the
        &quot;marketing&quot; cookie entirely. See{' '}
        <a href="/docs/ui/advanced-profiles/#removing-a-key">Removing a key</a> for the full rules,
        and <a href="/docs/ui/advanced-profiles/#replacing-a-map">Replacing a whole map</a> for{' '}
        <code>{"'*': null"}</code>, which swaps every built-in button or category for your own in
        one line.
      </p>

      <h2>Three ways to get a profile</h2>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>When to use it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Built-in default</td>
            <td>
              Omit everything — a fully working English GDPR-model profile ships with the package.
            </td>
          </tr>
          <tr>
            <td>
              <code>ConsentiProfile</code>
            </td>
            <td>
              Define your own cookies, copy, and categories in code for frontend-only installations.
            </td>
          </tr>
          <tr>
            <td>API profile</td>
            <td>
              Create profiles in the admin dashboard; the widget fetches them at runtime when{' '}
              <code>api.enabled: true</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        This page covers the common cases. For resolution order, every <code>ConsentiProfile</code>{' '}
        field, multi-locale profiles, the GPC banner variant, and overriding a built-in compliance
        group, see the <a href="/docs/ui/advanced-profiles/">Advanced Profile reference</a>.
      </Callout>
    </div>
  )
}
