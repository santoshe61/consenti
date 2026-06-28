import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = { title: 'CPRA Compliance Guide (California 2023)' }

export default function CPRAPage() {
  return (
    <div className="prose max-w-none">
      <h1>CPRA Compliance Guide</h1>
      <p>
        The California Privacy Rights Act (CPRA) superseded CCPA on 1 January 2023.
        It is enforced by the California Privacy Protection Agency (CPPA) — a dedicated regulatory body,
        not just the Attorney General.
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a href="https://cppa.ca.gov/" target="_blank" rel="noopener noreferrer">
            California Privacy Protection Agency (CPPA)
          </a>
          {' '}— the regulatory body that enforces CPRA
        </li>
        <li>
          <a href="https://cppa.ca.gov/regulations/" target="_blank" rel="noopener noreferrer">
            CPPA — CPRA regulations (Title 11, Division 22)
          </a>
        </li>
        <li>
          <a href="https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.100" target="_blank" rel="noopener noreferrer">
            Cal. Civ. Code § 1798.100 et seq — CPRA statute text
          </a>
        </li>
        <li>
          <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer">
            Global Privacy Control (GPC) specification
          </a>
          {' '}— required signal under CPRA
        </li>
      </ul>

      <h2>CCPA vs. CPRA</h2>
      <table>
        <thead>
          <tr><th></th><th>CCPA (2020)</th><th>CPRA (Jan 2023)</th></tr>
        </thead>
        <tbody>
          <tr><td>Enforcer</td><td>Attorney General</td><td>CPPA (dedicated agency)</td></tr>
          <tr><td>GPC obligation</td><td>Required</td><td>Required</td></tr>
          <tr><td>Do Not Sell</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Do Not Share (cross-context behavioural advertising)</td><td>No</td><td>Yes</td></tr>
          <tr><td>Sensitive personal data opt-in</td><td>No</td><td>Yes</td></tr>
          <tr><td>Data minimisation</td><td>No</td><td>Yes</td></tr>
          <tr><td>Correction right</td><td>No</td><td>Yes</td></tr>
        </tbody>
      </table>

      <h2>Enabling CPRA mode</h2>
      <CodeBlock lang="ts" code={`new ConsentiSetup({
  core: {
    regulation: 'cpra',
    autoHonorGPC: true,  // required — GPC denies sale and sharing cookies automatically
  },
})`} />

      <h2>Per-cookie category</h2>
      <p>
        In the dashboard <strong>Cookie Template Editor</strong>, enable the <strong>CPRA Category</strong> column
        and assign each data-selling or sharing cookie a category:
      </p>
      <table>
        <thead>
          <tr><th>Value</th><th>Meaning</th><th>GPC effect</th><th>First-visit default</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sale</code></td>
            <td>Personal data sold to third parties</td>
            <td>Always denied on GPC</td>
            <td>Denied</td>
          </tr>
          <tr>
            <td><code>sharing</code></td>
            <td>Cross-context behavioural advertising</td>
            <td>Always denied on GPC</td>
            <td>Denied</td>
          </tr>
          <tr>
            <td><code>sensitive</code></td>
            <td>Sensitive personal data (health, race, religion, precise geo…)</td>
            <td>Always opt-in regardless of GPC</td>
            <td>Denied</td>
          </tr>
          <tr>
            <td><em>(unset)</em></td>
            <td>Standard cookie</td>
            <td>Standard GPC behaviour</td>
            <td>Granted</td>
          </tr>
        </tbody>
      </table>

      <h2>GPC — Global Privacy Control</h2>
      <p>
        When the GPC signal (<code>navigator.globalPrivacyControl === true</code>) is detected under CPRA,
        Consenti automatically:
      </p>
      <ol>
        <li>Denies all cookies with <code>cpraCategory: 'sale'</code></li>
        <li>Denies all cookies with <code>cpraCategory: 'sharing'</code></li>
        <li>Leaves other cookies at their submitted value</li>
        <li>Stores <code>gpc_detected: true</code> on the consent record</li>
      </ol>
      <Callout type="info">
        Cookies with <code>cpraCategory: 'sensitive'</code> always require an explicit opt-in —
        GPC is not required for this, it is mandatory under CPRA Section 1798.121.
      </Callout>

      <h2>Server-side enforcement</h2>
      <p>
        The backend re-applies CPRA rules on every <code>POST /consent</code> and <code>PUT /consent/:id</code>
        regardless of what the client sends, so a compromised widget cannot bypass the rules:
      </p>
      <CodeBlock lang="ts" code={`// consent.service.ts — enforced server-side on every write
if (gpcDetected && regulation === 'cpra') {
  if (cookie.cpraCategory === 'sale' || cookie.cpraCategory === 'sharing') {
    effectiveConsent[cookie.id] = 'denied'
  }
}`} />

      <h2>Do Not Sell / Do Not Share button</h2>
      <p>
        Add a visible opt-out link on your site (required by CPRA for businesses that sell or share data).
        Use the <code>'!'</code> action to deny all non-mandatory cookies:
      </p>
      <CodeBlock lang="json" code={`{
  "text": "Do Not Sell or Share My Personal Information",
  "type": "reject",
  "cookies": "!"
}`} />

      <h2>Migration from CCPA</h2>
      <p>Change <code>regulation: 'ccpa'</code> to <code>regulation: 'cpra'</code> and add <code>cpraCategory</code> to cookies
      that involve selling or sharing. Existing consent records remain valid — no forced re-consent unless
      your cookie categories change.</p>
      <CodeBlock lang="diff" code={`- regulation: 'ccpa'
+ regulation: 'cpra'`} />
    </div>
  )
}
