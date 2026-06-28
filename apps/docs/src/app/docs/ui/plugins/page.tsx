import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'UI Widget Plugins' }

export default function UIPluginsPage() {
  return (
    <div className="prose max-w-none">
      <h1>UI Widget — Plugin System</h1>
      <p>
        Plugins let you extend the Consenti widget without modifying its source. Each plugin
        receives the full typed <code>ConsentiWidgetAPI</code> in <code>initialize()</code> — call
        any public method, read the resolved profile, access DOM elements, and listen to events.
      </p>

      <Callout type="info">
        A broken plugin never blocks the consent flow. Errors in <code>initialize()</code>,{' '}
        <code>destroy()</code>, and all lifecycle hooks are caught and logged as{' '}
        <code>console.warn</code> — the widget continues normally.
      </Callout>

      <h2>Minimal plugin</h2>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin, ConsentiSetup } from '@consenti/ui'
import type { ConsentiWidgetAPI } from '@consenti/ui'

class MyPlugin extends ConsentiPlugin {
  initialize(widget: ConsentiWidgetAPI): void {
    // widget is the live ConsentiSetup instance — call anything on it
    console.log('Widget ready. Has consent:', widget.hasConsent())
  }

  destroy(): void {
    // clean up here — runs when widget.destroy() is called
  }
}

const widget = new ConsentiSetup({
  core: { profileId: 0 },
  plugins: [new MyPlugin()],
})`} />

      <h2>ConsentiWidgetAPI reference</h2>
      <p>
        The <code>ConsentiWidgetAPI</code> interface is what your plugin receives.
        <code>ConsentiSetup</code> implements it, so every method is always available.
      </p>

      <h3>State inspection</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Returns</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>hasConsent()</code></td><td><code>boolean</code></td><td>True if a valid consent record exists</td></tr>
          <tr><td><code>getConsent()</code></td><td><code>ConsentValue | null</code></td><td>The stored consent map keyed by cookie ID</td></tr>
          <tr><td><code>getConsentDate()</code></td><td><code>Date | false</code></td><td>Date of the most recent consent submission</td></tr>
          <tr><td><code>getGTMConsent()</code></td><td><code>Record&lt;string,string&gt; | null</code></td><td>Consent in Google Consent Mode v2 format</td></tr>
          <tr><td><code>bannerVisibility()</code></td><td><code>&apos;main&apos; | &apos;gpc&apos; | false</code></td><td>Which banner variant is currently visible</td></tr>
          <tr><td><code>modalVisibility()</code></td><td><code>&apos;preference&apos; | false</code></td><td>Whether the preference modal is open</td></tr>
          <tr><td><code>getProfile()</code></td><td><code>ResolvedProfile | null</code></td><td>The resolved profile: cookies, banners, modal config, version</td></tr>
        </tbody>
      </table>

      <h3>UI control</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>showBanner(gpc?)</code></td><td>Show the main or GPC banner</td></tr>
          <tr><td><code>hideBanner()</code></td><td>Hide the banner</td></tr>
          <tr><td><code>showModal(triggerEl?)</code></td><td>Open the preference modal</td></tr>
          <tr><td><code>hideModal()</code></td><td>Close the preference modal</td></tr>
          <tr><td><code>submitConsent(consent)</code></td><td>Submit consent programmatically</td></tr>
          <tr><td><code>deleteConsent()</code></td><td>Delete the consent record</td></tr>
          <tr><td><code>reConsent()</code></td><td>Delete consent and re-open the banner</td></tr>
        </tbody>
      </table>

      <h3>DOM access</h3>
      <table>
        <thead>
          <tr><th>Method</th><th>Returns</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>getRootElement()</code></td><td><code>HTMLElement | null</code></td><td><code>#consenti-root</code> — the container for all widget DOM</td></tr>
          <tr><td><code>getBannerElement()</code></td><td><code>HTMLElement | null</code></td><td><code>#consenti-banner</code> — the banner element (may be hidden)</td></tr>
          <tr><td><code>getModalElement()</code></td><td><code>HTMLElement | null</code></td><td><code>#consenti-modal</code> — the preference modal element</td></tr>
        </tbody>
      </table>

      <h3>Lifecycle hooks (optional)</h3>
      <p>
        Override these methods to react to consent events. All hooks are optional — only define the ones you need.
      </p>
      <table>
        <thead>
          <tr><th>Hook</th><th>When it fires</th></tr>
        </thead>
        <tbody>
          <tr><td><code>initialize(widget)</code></td><td><strong>Required.</strong> After <code>ConsentiSetup.init()</code> completes. May be async.</td></tr>
          <tr><td><code>destroy()</code></td><td><strong>Required.</strong> When <code>widget.destroy()</code> is called.</td></tr>
          <tr><td><code>onConsentSubmit(consent)</code></td><td>After consent is saved to storage and POSTed to the API</td></tr>
          <tr><td><code>onBannerShow()</code></td><td>After the banner becomes visible</td></tr>
          <tr><td><code>onBannerHide()</code></td><td>After the banner is hidden</td></tr>
          <tr><td><code>onModalShow()</code></td><td>After the preference modal opens</td></tr>
          <tr><td><code>onModalHide()</code></td><td>After the preference modal closes</td></tr>
        </tbody>
      </table>

      <h2>Example: Analytics plugin</h2>
      <p>Track consent events with your analytics provider:</p>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin } from '@consenti/ui'
import type { ConsentiWidgetAPI, ConsentValue } from '@consenti/ui'

class AnalyticsPlugin extends ConsentiPlugin {
  private widget!: ConsentiWidgetAPI

  initialize(widget: ConsentiWidgetAPI): void {
    this.widget = widget
  }

  destroy(): void {}

  onConsentSubmit(consent: ConsentValue): void {
    const profile = this.widget.getProfile()
    myAnalytics.track('consent_saved', {
      profileId: profile?.id,
      profileVersion: profile?.version,
      ...consent,
    })
  }

  onBannerShow(): void {
    myAnalytics.track('consent_banner_shown')
  }
}`} />

      <h2>Example: DOM extension plugin</h2>
      <p>Add custom content or styles to the banner without touching Consenti source:</p>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin } from '@consenti/ui'
import type { ConsentiWidgetAPI } from '@consenti/ui'

class BrandingPlugin extends ConsentiPlugin {
  private logoEl: HTMLElement | null = null

  initialize(widget: ConsentiWidgetAPI): void {
    // Inject custom CSS variable on the root container
    const root = widget.getRootElement()
    if (root) {
      root.style.setProperty('--consenti-color-primary', '#0057b8')
    }
  }

  onBannerShow(): void {
    const banner = document.getElementById('consenti-banner')
    if (!banner || banner.querySelector('.my-logo')) return

    this.logoEl = document.createElement('img')
    this.logoEl.src = '/logo.png'
    this.logoEl.className = 'my-logo'
    this.logoEl.alt = 'My Brand'
    this.logoEl.style.cssText = 'height:24px;margin-bottom:8px;display:block;'
    banner.prepend(this.logoEl)
  }

  onBannerHide(): void {
    this.logoEl?.remove()
    this.logoEl = null
  }

  destroy(): void {
    this.logoEl?.remove()
    this.logoEl = null
  }
}`} />

      <h2>Example: Profile inspection plugin</h2>
      <p>Use <code>getProfile()</code> to read cookie definitions and make runtime decisions:</p>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin } from '@consenti/ui'
import type { ConsentiWidgetAPI } from '@consenti/ui'

class ConditionalLoadPlugin extends ConsentiPlugin {
  initialize(widget: ConsentiWidgetAPI): void {
    const profile = widget.getProfile()
    if (!profile) return

    const cookieIds = profile.cookies.map((c) => c.id)
    console.log('Profile v' + profile.version + ' manages:', cookieIds)

    // Load a script only when analytics_storage is granted
    if (widget.getConsent()?.analytics_storage === 'granted') {
      this.loadAnalyticsScript()
    }

    window.addEventListener('consenti:consentSubmitted', () => {
      if (widget.getConsent()?.analytics_storage === 'granted') {
        this.loadAnalyticsScript()
      }
    })
  }

  private loadAnalyticsScript(): void {
    if (document.getElementById('analytics-script')) return
    const script = document.createElement('script')
    script.id = 'analytics-script'
    script.src = 'https://analytics.example.com/tracker.js'
    document.head.appendChild(script)
  }

  destroy(): void {}
}`} />

      <h2>Example: Async plugin</h2>
      <p><code>initialize()</code> can be async — the widget awaits it before resolving <code>widget.ready</code>:</p>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin } from '@consenti/ui'
import type { ConsentiWidgetAPI } from '@consenti/ui'

class RemoteConfigPlugin extends ConsentiPlugin {
  async initialize(widget: ConsentiWidgetAPI): Promise<void> {
    const res = await fetch('/api/consent-config')
    const config = await res.json() as { bannerDelay?: number }

    if (config.bannerDelay && !widget.hasConsent()) {
      await new Promise<void>((resolve) => setTimeout(resolve, config.bannerDelay))
      widget.showBanner()
    }
  }

  destroy(): void {}
}`} />

      <h2>Registering plugins</h2>
      <CodeBlock lang="ts" code={`import { ConsentiSetup } from '@consenti/ui'
import { AnalyticsPlugin } from './plugins/analytics'
import { BrandingPlugin } from './plugins/branding'

const widget = new ConsentiSetup({
  core: { profileId: 1, regulation: 'gdpr' },
  plugins: [
    new AnalyticsPlugin(),
    new BrandingPlugin(),
  ],
})`} />

      <Callout type="warning">
        Plugins run in the order they are listed. If an async <code>initialize()</code> is
        slow, it delays the rest of widget startup. Keep remote calls in plugins fast,
        or fire them without <code>await</code> if they are non-blocking.
      </Callout>

      <h2>TypeScript tip</h2>
      <p>
        Import <code>ConsentiWidgetAPI</code> as a type-only import to keep your plugin
        decoupled from the <code>ConsentiSetup</code> class:
      </p>
      <CodeBlock lang="ts" code={`import { ConsentiPlugin } from '@consenti/ui'
import type { ConsentiWidgetAPI } from '@consenti/ui'
//           ^^^^ type-only import — no runtime dependency on ConsentiSetup

class MyPlugin extends ConsentiPlugin {
  initialize(widget: ConsentiWidgetAPI) { /* ... */ }
  destroy() {}
}`} />
    </div>
  )
}
