import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

export const metadata: Metadata = {
  title: 'CCPA / US State Privacy Laws',
  description:
    'Implement CCPA, CPRA, and US state privacy law consent with Consenti. Opt-out mode, GPC signal detection, do-not-sell flows, and state-level geo-detection.',
  keywords: [
    'CCPA',
    'CPRA',
    'CCPA compliance',
    'opt-out consent',
    'GPC',
    'do not sell',
    'California privacy',
    'US state privacy laws',
  ],
  alternates: { canonical: 'https://consenti.dev/docs/compliance/ccpa' },
  openGraph: {
    title: 'CCPA / US State Privacy Laws',
    description:
      'Implement CCPA, CPRA, and US state privacy law consent with Consenti. Opt-out mode, GPC signal detection, do-not-sell flows, and state-level geo-detection.',
    url: 'https://consenti.dev/docs/compliance/ccpa',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CCPA / US State Privacy Laws',
    description:
      'Implement CCPA, CPRA, and US state privacy law consent with Consenti. Opt-out mode, GPC signal detection, do-not-sell flows, and state-level geo-detection.',
    images: ['/og-image.jpg'],
  },
}

export default function CCPAPage() {
  return (
    <div className="prose max-w-none">
      <h1>CCPA / US State Privacy Laws Guide</h1>
      <ComplianceTierBadge tier="maintained" />
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-out</code> — consent written silently; no
        banner unless the user visits a "Do Not Sell" page. Use{' '}
        <code>compliance: {"{ type: 'opt-out' }"}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        Consenti supports opt-out Compliance Groups required by CCPA, VCDPA, CPA, CTDPA, TDPSA, and
        similar US state laws.
      </p>
      <Callout type="warning">
        <strong>CCPA was superseded by CPRA on 1 January 2023.</strong> If you operate in
        California, see the <a href="/docs/compliance/cpra/">CPRA guide</a> for the current
        requirements, including the new &quot;Do Not Share&quot; obligation and sensitive data
        categories.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer">
            California Attorney General — CCPA page
          </a>
        </li>
        <li>
          <a
            href="https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.100"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cal. Civ. Code § 1798.100 — CCPA statute text
          </a>
        </li>
        <li>
          <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer">
            Global Privacy Control (GPC) specification
          </a>
        </li>
      </ul>

      <h2>Opt-out model vs. GDPR opt-in</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>GDPR</th>
            <th>CCPA / US States</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Default</td>
            <td>All non-mandatory cookies denied</td>
            <td>All non-mandatory cookies granted</td>
          </tr>
          <tr>
            <td>Trigger</td>
            <td>Banner on first visit</td>
            <td>Silent auto-consent; provide opt-out UI</td>
          </tr>
          <tr>
            <td>GPC</td>
            <td>Optional honour</td>
            <td>Required to honour</td>
          </tr>
        </tbody>
      </table>

      <h2>Enabling CCPA mode</h2>
      <CodeBlock
        lang="ts"
        code={`createConsenti({
  compliance: { type: 'opt-out' },
})`}
      />
      <p>In your frontend widget:</p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: { type: 'opt-out' },  // sets all cookies to 'granted' on first load, GPC denies sale/sharing
})`}
      />

      <h2>GPC — Global Privacy Control</h2>
      <p>
        The GPC signal (<code>navigator.globalPrivacyControl === true</code>) is treated as an
        opt-out under CCPA (required by California AG guidance). The <code>opt-out</code> and{' '}
        <code>opt-out-strict</code> compliance groups already default to{' '}
        <code>gpcMode: 'honor'</code> — set the profile&apos;s <code>gpcMode</code> to{' '}
        <code>'strict'</code> (via <code>profileOverride</code> or the dashboard) for silent
        denial instead of showing the GPC banner variant:
      </p>
      <ol>
        <li>Widget detects GPC signal</li>
        <li>
          Automatically denies all <code>listenGpc: true</code> cookies
        </li>
        <li>Writes consent record immediately without showing banner</li>
        <li>
          <code>gpc_detected: true</code> is stored on the consent record
        </li>
      </ol>

      <h2>&quot;Do Not Sell&quot; / Opt-out button</h2>
      <p>
        Add a <code>'!'</code> button to let users opt out at any time:
      </p>
      <CodeBlock
        lang="json"
        code={`{
  "text": "Do Not Sell My Data",
  "style": "secondary",
  "action": "custom",
  "cookies": "!"
}`}
      />
      <p>
        The <code>'!'</code> action sets all non-mandatory cookies to <code>'denied'</code> and
        writes the consent record.
      </p>
      <Callout type="warning">
        <strong>Operator checklist item:</strong> placing this button somewhere a visitor can
        actually find it — a footer link or equivalent, wired to Consenti — is the site owner&apos;s
        job. Consenti provides the button/action; it does not auto-inject a footer link into your
        site.
      </Callout>

      <h2>State-by-state coverage</h2>
      <table>
        <thead>
          <tr>
            <th>Law</th>
            <th>Jurisdiction</th>
            <th>Opt-out mechanism</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CCPA / CPRA</td>
            <td>California</td>
            <td>
              GPC + <code>'!'</code> button
            </td>
          </tr>
          <tr>
            <td>VCDPA</td>
            <td>Virginia</td>
            <td>Same as CCPA</td>
          </tr>
          <tr>
            <td>CPA</td>
            <td>Colorado</td>
            <td>GPC required + opt-out UI</td>
          </tr>
          <tr>
            <td>CTDPA</td>
            <td>Connecticut</td>
            <td>Same as CCPA</td>
          </tr>
          <tr>
            <td>TDPSA</td>
            <td>Texas</td>
            <td>Same as CCPA</td>
          </tr>
          <tr>
            <td>MHMDA</td>
            <td>Washington (health data)</td>
            <td>Requires explicit consent for health data</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        All of these use the same consent record structure. No additional backend configuration is
        required beyond <code>compliance: {"{ type: 'opt-out' }"}</code> in the frontend widget.
      </Callout>

      <h3 id="colorados-sensitive-data-carve-out">Colorado&apos;s sensitive-data carve-out</h3>
      <p>
        Colorado's CPA requires opt-in consent for sensitive data specifically, even though the
        rest of the <code>opt-out</code> group defaults to granted. Consenti models this as a
        per-region override — Colorado stays in the <code>opt-out</code> group (same banner
        behavior, same GPC handling as every other state above), but any cookie tagged{' '}
        <code>cpraCategory: &apos;sensitive&apos;</code> defaults to denied specifically for
        visitors resolved to Colorado.
      </p>
      <Callout type="warning">
        This only takes effect with server-side geo resolution using a{' '}
        <code>geoDataProvider</code> that returns a US state (<code>'geoip'</code>,{' '}
        <code>'maxmind'</code>, or <code>'hosted-geoip-lite'</code>) — the default
        timezone/language heuristic can't distinguish US states from each other, so it never
        knows a visitor is specifically in Colorado. Tag the cookie itself with{' '}
        <code>cpraCategory: &apos;sensitive&apos;</code> (e.g. biometric or precise-geolocation
        data) for this to matter — it's a no-op for cookies without that tag.
      </Callout>
    </div>
  )
}
