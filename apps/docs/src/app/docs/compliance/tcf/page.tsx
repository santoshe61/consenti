import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'TCF v2.2 Guide' }

export default function TCFPage() {
  return (
    <div className="prose max-w-none">
      <h1>TCF v2.2 Implementation Guide</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>general-privacy-consent</code> — full-flexibility mode for
        programmatic advertising consent via IAB Europe's TCF framework.
        Use <code>compliance: {'{ type: \'general-privacy-consent\' }'}</code> in your <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        IAB Europe's Transparency and Consent Framework (TCF) v2.2 is the standard for programmatic advertising consent.
        It is required for CMPs operating in the IAB ecosystem (RTB, DSPs, SSPs).
      </p>

      <h2>When you need TCF</h2>
      <p>TCF is needed if your site uses:</p>
      <ul>
        <li>Programmatic advertising (RTB / header bidding)</li>
        <li>Google Ad Manager with EU consent mode</li>
        <li>Any ad tech vendor registered in the IAB Global Vendor List (GVL)</li>
      </ul>
      <Callout type="info">
        If you only use first-party analytics and your own tools, you do not need TCF.
      </Callout>

      <h2>Enabling TCF mode</h2>
      <CodeBlock lang="ts" code={`createConsenti({
  tcf: {
    enabled: true,
    cmpId: 9999,        // Your CMP ID from IAB registration
    cmpVersion: 1,
  },
})`} />

      <Callout type="warning">
        You must register as a CMP with IAB Europe before going live. Registration is free.
        See the IAB Europe website for the registration process.
      </Callout>

      <h2>What Consenti implements</h2>

      <h3>Backend</h3>
      <ul>
        <li><code>tcf.enabled: true</code> — activates TCF mode</li>
        <li>Global Vendor List (GVL) is fetched and cached for 7 days</li>
        <li><code>tcf_string</code> column is added to consent records</li>
        <li><code>POST /consent</code> accepts <code>tcfString</code> in the payload</li>
        <li><code>GET /consent/:visitorId</code> returns <code>tcfString</code> when present</li>
      </ul>

      <h3>TC string format</h3>
      <p>
        Consenti uses a simplified base64url-encoded JSON format for TC strings.
        For full IAB TCF v2.2 binary bitfield compliance, install <code>iabtcf-core</code>
        and pre-process the TC string before submitting to the API:
      </p>
      <Terminal code="npm install iabtcf-core" />
      <CodeBlock lang="ts" code={`import { TCModel, TCString } from '@iabtcf/core'

const model = new TCModel(gvl)
model.cmpId = 9999
model.purposeConsents.set([1, 2, 3])
const tcString = TCString.encode(model)`} />

      <h3>Frontend (__tcfapi stub)</h3>
      <p>
        The <code>__tcfapi</code> stub lives in <code>@consenti/ui</code> and is enabled by
        <code>core.tcf: &#123; enabled: true &#125;</code>. It implements the four required commands:
      </p>
      <table>
        <thead>
          <tr><th>Command</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>getTCData</code></td><td>Returns the TC string and consent status</td></tr>
          <tr><td><code>ping</code></td><td>Returns CMP status (required for IAB compliance)</td></tr>
          <tr><td><code>addEventListener</code></td><td>Registers a listener for consent updates</td></tr>
          <tr><td><code>removeEventListener</code></td><td>Unregisters a listener</td></tr>
        </tbody>
      </table>

      <h2>GVL caching</h2>
      <p>
        The GVL is fetched once at startup and refreshed every 7 days.
        If the fetch fails, the cached version is returned.
        To force a refresh, restart the server.
      </p>

      <h2>Mapping cookies to GVL vendors</h2>
      <p>
        In the dashboard <strong>Cookie Template Editor</strong>, enable the <strong>TCF Vendors</strong> column toggle.
        Each cookie row gains a vendor picker that searches the GVL by name.
        Selecting a vendor auto-fills <code>tcfVendorId</code> and <code>tcfPurposes</code> on the cookie.
        Only cookies with a <code>tcfVendorId</code> that the visitor granted contribute to the TC string.
      </p>

      <h2>Testing</h2>
      <p>
        Use the IAB TCF Validator to validate your TC string before going live.
        The validator checks that your CMP ID is registered and that the TC string is well-formed.
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://iabeurope.eu/tcf-2-0/" target="_blank" rel="noopener noreferrer">
            IAB Europe — TCF v2.2 specification
          </a>
        </li>
        <li>
          <a href="https://iabeurope.eu/tcf-for-cmps/" target="_blank" rel="noopener noreferrer">
            IAB Europe — CMP registration portal
          </a>
        </li>
        <li>
          <a href="https://vendor-list.consensu.org/v3/vendor-list.json" target="_blank" rel="noopener noreferrer">
            IAB Global Vendor List (GVL) — live JSON
          </a>
        </li>
        <li>
          <a href="https://iabeurope.eu/tcf-supporting-resources/" target="_blank" rel="noopener noreferrer">
            IAB Europe — TCF supporting resources and policy
          </a>
        </li>
      </ul>
    </div>
  )
}
