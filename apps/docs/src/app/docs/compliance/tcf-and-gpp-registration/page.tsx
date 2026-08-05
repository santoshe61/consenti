import type { Metadata } from 'next'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { ComplianceTierBadge } from '@/components/ComplianceTierBadge'

export const metadata: Metadata = {
  title: 'TCF & GPP Registration Guide',
  description:
    "TCF v2.3 and GPP (US National section) implementation and registration guide for Consenti — IAB Europe's and MSPA's standards for programmatic advertising consent.",
  alternates: { canonical: '/docs/compliance/tcf-and-gpp-registration' },
  openGraph: {
    title: 'TCF & GPP Registration Guide',
    description:
      "TCF v2.3 and GPP (US National section) implementation and registration guide for Consenti — IAB Europe's and MSPA's standards for programmatic advertising consent.",
    url: 'https://consenti.dev/docs/compliance/tcf-and-gpp-registration',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TCF & GPP Registration Guide',
    description:
      "TCF v2.3 and GPP (US National section) implementation and registration guide for Consenti — IAB Europe's and MSPA's standards for programmatic advertising consent.",
    images: ['/og-image.jpg'],
  },
}

export default function TcfAndGppRegistrationPage() {
  return (
    <div className="prose max-w-none">
      <h1>TCF &amp; GPP Registration Guide</h1>

      <Callout type="tip">
        <strong>Most sites don&apos;t need anything on this page.</strong> TCF and GPP only matter if
        you monetize through programmatic/RTB advertising (header bidding, Google Ad Manager EU
        consent mode, any vendor in the IAB Global Vendor List). If you&apos;re only collecting consent
        for first-party analytics, marketing, or functional cookies, Consenti is fully compliant across
        every maintained jurisdiction (GDPR, UK-GDPR, CCPA/CPRA, LGPD, and more) with zero external
        registration — skip straight to the rest of the <a href="/docs/compliance/">compliance docs</a>.
      </Callout>

      <Callout type="warning">
        <strong>Consenti implements the technical spec — it does not register you.</strong> Both TCF
        and GPP require your organization to independently obtain a <code>cmpId</code> from the
        relevant body before you can legally rely on the strings Consenti generates. This page covers
        that registration step, how to tell Consenti it happened, and the technical implementation
        underneath.
      </Callout>

      <h2>Why confirmation is separate from config</h2>
      <p>
        Every framework below follows the same shape: you register externally, put the resulting
        <code>cmpId</code>/<code>cmpVersion</code> in Consenti&apos;s static server config, restart
        the server, then confirm the registration once in the dashboard. Until confirmed, Consenti
        treats the framework as <strong>disabled</strong> everywhere it matters — no TC/GPP string
        is generated, and the widget does not install <code>window.__tcfapi</code> /{' '}
        <code>window.__gpp</code>. This is deliberate: a live <code>cmpId</code> that isn&apos;t
        actually yours (a typo, a config left over from a demo, a deregistered ID) must never
        silently start signing consent strings.
      </p>
      <p>
        <code>compliance.tcf</code> and <code>compliance.gpp</code> live only in your static server
        config file — Consenti never lets these be edited from the dashboard, since a config file
        under version control with a required server restart is a much harder thing to change by
        accident (or by an attacker with dashboard access) than a database row. What Consenti stores
        server-side is a <strong>hash</strong> of the last-confirmed <code>cmpId</code>/
        <code>cmpVersion</code> (and, for TCF, <code>publisherCC</code>) — never the raw values.
        Every relevant request recomputes the hash of the live config and compares it. A mismatch —
        including &quot;never confirmed&quot; — fails closed.
      </p>
      <p>Practically, this means re-confirmation is required whenever:</p>
      <ul>
        <li>You change <code>cmpId</code> or <code>cmpVersion</code> (e.g. after a re-registration)</li>
        <li>TCF: you change <code>publisherCC</code></li>
        <li>You never confirmed in the first place on a fresh install</li>
      </ul>
      <p>
        Turning a framework <em>off</em> (<code>enabled: false</code>) is the one change that always
        takes effect immediately, with no confirmation needed — disabling never requires proof of
        anything.
      </p>

      <hr />

      <h2>TCF v2.3</h2>
      <ComplianceTierBadge tier="partial" />
      <Callout type="info">
        <strong>Compliance group:</strong> <code>general-privacy-consent</code> — full-flexibility
        mode for programmatic advertising consent via IAB Europe&apos;s TCF framework. Use{' '}
        <code>compliance: {"{ type: 'general-privacy-consent' }"}</code> in your{' '}
        <code>ConsentiSetup</code> config.
      </Callout>
      <p>
        IAB Europe&apos;s Transparency and Consent Framework (TCF) v2.3 is the standard for
        programmatic advertising consent. It is required for CMPs operating in the IAB ecosystem
        (RTB, DSPs, SSPs).
      </p>

      <h3>When you need TCF</h3>
      <p>TCF is needed if your site uses:</p>
      <ul>
        <li>Programmatic advertising (RTB / header bidding)</li>
        <li>Google Ad Manager with EU consent mode</li>
        <li>Any ad tech vendor registered in the IAB Global Vendor List (GVL)</li>
      </ul>
      <Callout type="info">
        If you only use first-party analytics and your own tools, you do not need TCF.
      </Callout>

      <Callout type="warning">
        <strong>Status: partial.</strong> The <code>window.__tcfapi</code> interface is fully
        implemented, and the backend fetches/caches the real Global Vendor List. Spec-correct
        binary TC-string encoding is available when you set{' '}
        <code>compliance.tcf.publisherCC</code> and install the optional{' '}
        <code>@iabtechlabtcf/core</code> peer dependency — without both, Consenti falls back to a
        simplified, non-spec format. Known gap: no user-facing legitimate-interest objection
        control yet (legitimate-interest signals are derived from GVL vendor metadata, not a
        per-visitor opt-out). Spec-correct encoding is a prerequisite for ad-exchange acceptance,
        not a substitute for the IAB registration below — &quot;partial&quot; describes encoding
        fidelity, not compliance coverage.
      </Callout>

      <h3>1. Register with IAB Europe</h3>
      <p>
        Registration is free and done directly with IAB Europe, independently of Consenti. You will
        receive a <code>cmpId</code> and a <code>cmpVersion</code> once approved.
      </p>
      <ul>
        <li>
          <a href="https://iabeurope.eu/tcf-for-cmps/" target="_blank" rel="noopener noreferrer">
            IAB Europe — CMP registration portal
          </a>
        </li>
        <li>
          <a href="https://iabeurope.eu/tcf-2-0/" target="_blank" rel="noopener noreferrer">
            IAB Europe — TCF specification
          </a>
        </li>
      </ul>

      <h3>2. Configure Consenti</h3>
      <CodeBlock
        lang="ts"
        code={`// Server config (@consenti/api)
compliance: {
  tcf: {
    enabled: true,
    cmpId: 9999,          // from IAB Europe
    cmpVersion: 1,
    publisherCC: 'DE',    // optional — required for spec-correct binary TC strings
  },
},`}
      />
      <p>Restart the server so the new config is picked up, then mirror it on the widget:</p>
      <CodeBlock
        lang="ts"
        code={`createConsenti({
  compliance: {
    tcf: { enabled: true, cmpId: 9999, cmpVersion: 1 },
  },
})`}
      />

      <h3>3. Confirm registration in the dashboard</h3>
      <p>
        Open <strong>Dashboard → Vendors</strong>. While TCF is enabled and unconfirmed, a
        non-dismissible panel shows your live <code>cmpId</code>/<code>cmpVersion</code> and a
        required checkbox: <em>&quot;TCF enabled, and we have registered this cmpId with IAB
        Europe.&quot;</em> Checking it and confirming validates the <code>cmpId</code> against IAB&apos;s
        cached public CMP List (the same <code>vendor-list.consensu.org</code> host the GVL comes
        from):
      </p>
      <ul>
        <li><strong>Deregistered/expired</strong> — hard error, confirmation is blocked.</li>
        <li>
          <strong>Not found yet</strong> — soft-blocked with a <strong>Refresh Status</strong>{' '}
          button (bypasses the 7-day cache) — registrations can take time to propagate to the list.
        </li>
        <li><strong>Found and active</strong> — confirmed. The panel disappears.</li>
      </ul>
      <p>
        The panel is not dismissible without confirming — it&apos;s computed live from whether the
        stored hash matches the current config, not a flag you can acknowledge-and-hide.
      </p>

      <h3>TCF admin API</h3>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET /consenti/admin/v1/tcf/registration-status</code></td>
            <td>
              Current <code>cmpId</code>/<code>cmpVersion</code>, confirmation state, and a live
              CMP-List lookup. Add <code>?refresh=true</code> to bypass the cache. Requires{' '}
              <code>settings:update</code>.
            </td>
          </tr>
          <tr>
            <td><code>POST /consenti/admin/v1/tcf/confirm-registration</code></td>
            <td>
              Body <code>{'{ acknowledge: true }'}</code>. Validates against the CMP List and, on
              success, stores the confirmation hash. Requires <code>settings:update</code>.
            </td>
          </tr>
          <tr>
            <td><code>GET /consenti/api/v1/tcf/status</code></td>
            <td>
              Public, unauthenticated, always-live. Returns <code>{'{ blocked: boolean }'}</code> —
              this is what the widget checks at init to decide whether to install{' '}
              <code>window.__tcfapi</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>What Consenti implements</h3>
      <h4>Backend</h4>
      <ul>
        <li>
          <code>compliance.tcf.enabled: true</code> — activates TCF mode
        </li>
        <li>Global Vendor List (GVL) is fetched and cached for 7 days</li>
        <li>
          <code>tcf_string</code> column is added to consent records
        </li>
        <li>
          <code>POST /consent</code> accepts <code>tcfString</code> in the payload
        </li>
        <li>
          <code>GET /consent/:visitorId</code> returns <code>tcfString</code> when present
        </li>
      </ul>

      <h4>TC string format</h4>
      <p>
        By default Consenti uses a simplified base64url-encoded JSON format for TC strings — not
        the IAB binary bitfield encoding. For spec-correct binary encoding, set{' '}
        <code>compliance.tcf.publisherCC</code> (your ISO 3166-1 alpha-2 publisher country code)
        and install the optional peer dependency:
      </p>
      <Terminal code="npm install @iabtechlabtcf/core" />
      <p>
        That&apos;s the actively-maintained IAB Tech Lab package — not <code>iabtcf-core</code>, which
        doesn&apos;t exist on npm, and not <code>@iabtcf/core</code>, which hasn&apos;t been
        published since 2023. Once installed, the backend automatically uses it for every consent
        record with <code>publisherCC</code> configured, no code changes needed. Without it
        installed, or without <code>publisherCC</code> set, Consenti falls back to the simplified
        format automatically. Internally, this is what <code>@consenti/api</code> does for you
        (<code>apps/api/src/tcf/real-tc-string.ts</code>):
      </p>
      <CodeBlock
        lang="ts"
        code={`import { TCModel, TCString, GVL } from '@iabtechlabtcf/core'

const model = new TCModel(new GVL(vendorListJson))
model.cmpId = 9999
model.purposeConsents.set([1, 2, 3])
const tcString = TCString.encode(model)`}
      />

      <h4>Frontend (__tcfapi stub)</h4>
      <p>
        The <code>__tcfapi</code> stub lives in <code>@consenti/ui</code> and is enabled by
        <code>compliance.tcf: &#123; enabled: true, cmpId, cmpVersion &#125;</code> (must match the
        backend&apos;s <code>compliance.tcf</code> config above). It implements the four required commands:
      </p>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>getTCData</code>
            </td>
            <td>Returns the TC string and consent status</td>
          </tr>
          <tr>
            <td>
              <code>ping</code>
            </td>
            <td>Returns CMP status (required for IAB compliance)</td>
          </tr>
          <tr>
            <td>
              <code>addEventListener</code>
            </td>
            <td>Registers a listener for consent updates</td>
          </tr>
          <tr>
            <td>
              <code>removeEventListener</code>
            </td>
            <td>Unregisters a listener</td>
          </tr>
        </tbody>
      </table>
      <Callout type="info">
        Only one CMP may own <code>window.__tcfapi</code> per page. If it&apos;s already set — a real
        CMP, or another <code>ConsentiSetup</code> instance on a multi-profile page — Consenti&apos;s
        stub does not overwrite it. The widget doesn&apos;t fetch the GVL itself, so{' '}
        <code>gvlVersion</code>
        in <code>getTCData</code> is a placeholder (<code>0</code>) — only the backend&apos;s admin-only
        <code>/tcf/vendors</code>/<code>/tcf/purposes</code> routes reflect the real GVL.
      </Callout>

      <h4>GVL caching</h4>
      <p>
        The GVL is fetched once at startup and refreshed every 7 days. If the fetch fails, the
        cached version is returned. To force a refresh, restart the server.
      </p>

      <h4>Mapping cookies to GVL vendors</h4>
      <p>
        In the dashboard <strong>Consent Template Editor</strong>, enable the{' '}
        <strong>TCF Vendors</strong> column toggle. Each cookie row gains a vendor picker that
        searches the GVL by name. Selecting a vendor auto-fills <code>tcfVendorId</code> and{' '}
        <code>tcfPurposes</code> on the cookie. Only cookies with a <code>tcfVendorId</code> that
        the visitor granted contribute to the TC string.
      </p>

      <h4>Testing</h4>
      <p>
        Use the IAB TCF Validator to validate your TC string before going live. The validator checks
        that your CMP ID is registered and that the TC string is well-formed.
      </p>

      <h4>Official references</h4>
      <ul>
        <li>
          <a href="https://iabeurope.eu/tcf-2-0/" target="_blank" rel="noopener noreferrer">
            IAB Europe — TCF v2.3 specification
          </a>
        </li>
        <li>
          <a href="https://iabeurope.eu/tcf-for-cmps/" target="_blank" rel="noopener noreferrer">
            IAB Europe — CMP registration portal
          </a>
        </li>
        <li>
          <a
            href="https://vendor-list.consensu.org/v3/vendor-list.json"
            target="_blank"
            rel="noopener noreferrer"
          >
            IAB Global Vendor List (GVL) — live JSON
          </a>
        </li>
        <li>
          <a
            href="https://iabeurope.eu/tcf-supporting-resources/"
            target="_blank"
            rel="noopener noreferrer"
          >
            IAB Europe — TCF supporting resources and policy
          </a>
        </li>
      </ul>

      <hr />

      <h2>GPP (US National section)</h2>
      <Callout type="info">
        <strong>Scope:</strong> Consenti implements the GPP <code>usnat</code> section only —
        the umbrella section most MSPA/programmatic US bidders read. Individual state sections
        (US-CA, US-CO, etc.) aren&apos;t generated separately.
      </Callout>
      <Callout type="warning">
        <strong>Self-attestation only.</strong> Unlike TCF, IAB does not publish a public CMP List
        equivalent for GPP — there is no external registry Consenti can validate your{' '}
        <code>cmpId</code> against. Confirming in the dashboard means you are personally attesting
        the registration is real; it is not independently verified the way TCF&apos;s is.
      </Callout>

      <h3>1. Register</h3>
      <p>
        GPP&apos;s US National section exists to carry MSPA (Multi-State Privacy Agreement) and CCPA/CPRA-style
        opt-out signals. If your data transactions are covered by MSPA, registration/signatory
        status is handled through the Multi-State Privacy Agreement itself, not a Consenti-specific
        step:
      </p>
      <ul>
        <li>
          <a href="https://www.privacyagreement.com/" target="_blank" rel="noopener noreferrer">
            Multi-State Privacy Agreement (MSPA)
          </a>
        </li>
        <li>
          <a
            href="https://github.com/InteractiveAdvertisingBureau/Global-Privacy-Platform"
            target="_blank"
            rel="noopener noreferrer"
          >
            IAB Tech Lab — Global Privacy Platform specification
          </a>
        </li>
      </ul>

      <h3>2. Configure Consenti</h3>
      <CodeBlock
        lang="ts"
        code={`// Server config (@consenti/api)
compliance: {
  gpp: {
    enabled: true,
    cmpId: 9999,
    cmpVersion: 1,
    mspaCoveredTransaction: true,
    // IAB tri-state: 0 = not applicable, 1 = yes, 2 = no
    mspaOptOutOptionMode: 1,
    mspaServiceProviderMode: 2,
  },
},`}
      />
      <CodeBlock
        lang="ts"
        code={`createConsenti({
  compliance: {
    gpp: {
      enabled: true,
      cmpId: 9999,
      cmpVersion: 1,
      mspaCoveredTransaction: true,
      mspaOptOutOptionMode: 1,
      mspaServiceProviderMode: 2,
    },
  },
})`}
      />
      <p>
        The GPP string is only generated for a given consent write when the profile actually
        contains cookies tagged <code>cpraCategory: &apos;sale&apos;</code> or{' '}
        <code>&apos;sharing&apos;</code> — sale/sharing/targeted-advertising opt-out and notice
        fields are derived from those cookie tags. A profile with no such cookies produces no GPP
        string, regardless of config.
      </p>

      <h3>3. Confirm registration in the dashboard</h3>
      <p>
        Same panel location as TCF — <strong>Dashboard → Vendors</strong> — with the same
        non-dismissible-while-unconfirmed behavior and required checkbox, minus the CMP-List lookup
        (there being none to check against) and minus a &quot;Refresh Status&quot; button.
      </p>

      <h3>GPP admin API</h3>
      <table>
        <thead>
          <tr>
            <th>Route</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET /consenti/admin/v1/gpp/registration-status</code></td>
            <td>
              Current <code>cmpId</code>/<code>cmpVersion</code> and confirmation state. Requires{' '}
              <code>settings:update</code>.
            </td>
          </tr>
          <tr>
            <td><code>POST /consenti/admin/v1/gpp/confirm-registration</code></td>
            <td>
              Body <code>{'{ acknowledge: true }'}</code>. Stores the confirmation hash directly —
              no external lookup. Requires <code>settings:update</code>.
            </td>
          </tr>
          <tr>
            <td><code>GET /consenti/api/v1/gpp/status</code></td>
            <td>
              Public, unauthenticated, always-live. Returns <code>{'{ blocked: boolean }'}</code> —
              checked by the widget before installing <code>window.__gpp</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Spec-correct binary encoding</h3>
      <p>
        By default Consenti falls back to a simplified, non-spec base64url-encoded GPP string. For
        real IAB-spec binary encoding, install the optional peer dependency server-side (this
        never affects the widget bundle — the encoder only runs in <code>@consenti/api</code>):
      </p>
      <CodeBlock lang="bash" code="npm install @iabgpp/cmpapi" />
      <p>
        Once installed, every GPP-eligible consent write automatically uses it; without it,
        Consenti logs a one-time warning and falls back to the simplified format. Same fallback
        shape as TCF&apos;s <code>@iabtechlabtcf/core</code>.
      </p>

      <hr />

      <h2>DPDPA (India)</h2>
      <Callout type="tip">
        <strong>Coming soon.</strong> DPDPA doesn&apos;t yet have an equivalent external
        registration/CMP-ID concept in Consenti — the current <code>opt-in-dpdpa</code> compliance
        group (data fiduciary name, grievance officer, age gate) already covers the consent-flow
        requirements. See the{' '}
        <a href="/docs/compliance/dpdpa/">DPDPA compliance guide</a> for what&apos;s implemented
        today. This section will be filled in if/when a registration-governance step is added for
        it.
      </Callout>
    </div>
  )
}
