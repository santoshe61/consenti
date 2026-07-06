import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'Notice Only — Compliance Guide' }

export default function NoticeOnlyPage() {
  return (
    <div className="prose max-w-none">
      <h1>Notice Only</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>notice-only</code> — consent is written automatically
        as <code>granted</code> for all cookies. The banner is shown once as an informational notice;
        no user action is required.
        Use <code>compliance: {'{ type: \'notice-only\' }'}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        The <strong>Notice Only</strong> mode is for websites that are not subject to opt-in or opt-out
        privacy laws but still want to inform visitors about their use of cookies. It is also appropriate
        for internal tools, intranet sites, and jurisdictions where a simple disclosure is sufficient.
      </p>

      <h2>When to use Notice Only</h2>
      <ul>
        <li>Your site operates in jurisdictions that do not require active consent for analytics cookies</li>
        <li>All cookies you use are strictly necessary (no opt-in / opt-out required)</li>
        <li>You want to show a one-time informational banner without blocking user interaction</li>
        <li>You are running an internal tool or intranet where employees have been informed by policy</li>
      </ul>

      <Callout type="warning">
        Notice Only should not be used for sites serving users in the EU / EEA (GDPR), California (CPRA),
        or other jurisdictions that require explicit opt-in or opt-out consent for non-essential cookies.
        Use the appropriate compliance group for your audience instead.
      </Callout>

      <h2>Behaviour</h2>
      <p>
        In Notice Only mode:
      </p>
      <ul>
        <li>All cookies are automatically granted on first visit — no user action required</li>
        <li>The banner appears once as a disclosure and is dismissed automatically or by clicking any button</li>
        <li>No preference modal is required, though one can still be shown via <code>widget.showModal()</code></li>
        <li>Consent is stored with <code>source: 'notice'</code> in the consent record</li>
      </ul>

      <h2>Configuration example</h2>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'notice-only' },
  profileOverride: {
    mainBanner: {
      position: 'bottom',
      heading: 'Cookie Notice',
      htmlText: 'This site uses cookies for essential functionality and analytics. By continuing to use this site you accept our use of cookies.',
      buttons: [
        { text: 'OK', style: 'primary', action: 'custom', cookies: '*' },
        { text: 'Privacy Policy', style: 'text', action: 'link', url: '/privacy' },
      ],
    },
  },
})`}
      />

      <h2>Combining with a preference modal</h2>
      <p>
        Even in Notice Only mode you can offer a preference modal for transparency. Users who open it
        will see their cookies already granted but can deny specific ones if they choose.
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'notice-only' },
  profileOverride: {
    mainBanner: {
      position: 'bottom',
      htmlText: 'We use cookies to improve your experience.',
      buttons: [
        { text: 'Got it',     style: 'primary',   action: 'custom', cookies: '*' },
        { text: 'Manage',     style: 'secondary', action: 'manage' },
        { text: 'Learn more', style: 'text',      action: 'link', url: '/privacy' },
      ],
    },
    preferenceModal: {
      heading: 'Cookie Preferences',
      subheading: 'All cookies are enabled by default. You may turn off optional ones below.',
      showClose: true,
      buttons: [
        { text: 'Save Preferences', style: 'primary', action: 'submit' },
      ],
      categories: [
        {
          id: 'cat-necessary',
          heading: 'Necessary',
          htmlText: 'Required for the site to function.',
          mandatory: true,
          cookies: ['necessary'],
        },
        {
          id: 'cat-analytics',
          heading: 'Analytics',
          htmlText: 'Helps us understand how the site is used.',
          cookies: ['analytics'],
        },
      ],
    },
  },
})`}
      />

      <h2>Listening for consent events</h2>
      <p>
        Even in Notice Only mode, <code>consenti:consentSubmitted</code> fires when the automatic
        grant is written. Use <code>onReady</code> on subsequent page loads to check stored consent.
      </p>
      <CodeBlock
        lang="ts"
        code={`const widget = new ConsentiSetup({ compliance: { type: 'notice-only' } })

widget.onReady(() => {
  const consent = widget.getConsent()
  if (consent?.analytics === 'granted') loadAnalytics()
})`}
      />
    </div>
  )
}
