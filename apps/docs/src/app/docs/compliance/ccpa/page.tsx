import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'CCPA / US State Privacy Laws' }

export default function CCPAPage() {
  return (
    <div className="prose max-w-none">
      <h1>CCPA / US State Privacy Laws Guide</h1>
      <p>
        Consenti supports opt-out consent models required by CCPA, VCDPA, CPA, CTDPA, TDPSA, and similar US state laws.
      </p>
      <Callout type="info">
        <strong>CCPA was superseded by CPRA on 1 January 2023.</strong> If you operate in California,
        see the <a href="/docs/compliance/cpra/">CPRA guide</a> for the current requirements,
        including the new &quot;Do Not Share&quot; obligation and sensitive data categories.
      </Callout>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer">
            California Attorney General — CCPA page
          </a>
        </li>
        <li>
          <a href="https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.100" target="_blank" rel="noopener noreferrer">
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
          <tr><th></th><th>GDPR</th><th>CCPA / US States</th></tr>
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
      <CodeBlock lang="ts" code={`createConsenti({
  compliance: { ccpa: true, gpc: true },
})`} />
      <p>In your frontend widget:</p>
      <CodeBlock lang="ts" code={`new ConsentiSetup({
  core: {
    profileId: 'my-profile',
    regulation: 'ccpa',  // sets all cookies to 'granted' on first load
    autoHonorGPC: true,  // required for CCPA compliance
  },
})`} />

      <h2>GPC — Global Privacy Control</h2>
      <p>
        The GPC signal (<code>navigator.globalPrivacyControl === true</code>) is treated as an opt-out under
        CCPA (required by California AG guidance). When <code>autoHonorGPC: 'strict'</code> is set:
      </p>
      <ol>
        <li>Widget detects GPC signal</li>
        <li>Automatically denies all <code>listenGpc: true</code> cookies</li>
        <li>Writes consent record immediately without showing banner</li>
        <li><code>gpc_detected: true</code> is stored on the consent record</li>
      </ol>

      <h2>&quot;Do Not Sell&quot; / Opt-out button</h2>
      <p>Add a <code>'!'</code> button to let users opt out at any time:</p>
      <CodeBlock lang="json" code={`{
  "text": "Do Not Sell My Data",
  "type": "reject",
  "cookies": "!"
}`} />
      <p>
        The <code>'!'</code> action sets all non-mandatory cookies to <code>'denied'</code> and writes the consent record.
      </p>

      <h2>State-by-state coverage</h2>
      <table>
        <thead>
          <tr><th>Law</th><th>Jurisdiction</th><th>Opt-out mechanism</th></tr>
        </thead>
        <tbody>
          <tr><td>CCPA / CPRA</td><td>California</td><td>GPC + <code>'!'</code> button</td></tr>
          <tr><td>VCDPA</td><td>Virginia</td><td>Same as CCPA</td></tr>
          <tr><td>CPA</td><td>Colorado</td><td>GPC required + opt-out UI</td></tr>
          <tr><td>CTDPA</td><td>Connecticut</td><td>Same as CCPA</td></tr>
          <tr><td>TDPSA</td><td>Texas</td><td>Same as CCPA</td></tr>
          <tr><td>MHMDA</td><td>Washington (health data)</td><td>Requires explicit consent for health data</td></tr>
        </tbody>
      </table>

      <Callout type="info">
        All of these use the same consent record structure. No additional backend configuration is required
        beyond <code>regulation: 'ccpa'</code> in the frontend widget.
      </Callout>
    </div>
  )
}
