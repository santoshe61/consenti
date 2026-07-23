import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Policy & Rules Engine Mapping — Backend Guide — Consenti',
  description:
    'How Consenti\'s compliance-group model maps onto enterprise CMP language like "policy by regulation, region, site, and business unit."',
  alternates: { canonical: '/guides/backend/policy-engine-mapping' },
  openGraph: {
    title: 'Policy & Rules Engine Mapping — Backend Guide — Consenti',
    description:
      'How Consenti\'s compliance-group model maps onto enterprise CMP language like "policy by regulation, region, site, and business unit."',
    url: 'https://consenti.dev/guides/backend/policy-engine-mapping',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Policy & Rules Engine Mapping — Backend Guide — Consenti',
    description:
      'How Consenti\'s compliance-group model maps onto enterprise CMP language like "policy by regulation, region, site, and business unit."',
    images: ['/og-image.jpg'],
  },
}

export default function BackendPolicyEngineMappingGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Policy &amp; Rules Engine Mapping</h1>
      <p className="lead">
        Enterprise CMP evaluators often ask for a &quot;policy/rules engine by regulation, region,
        site, app, and business unit.&quot; Consenti doesn&apos;t have a component literally named a
        rules engine — it doesn&apos;t need one, because the same outcome falls out of three pieces
        that already exist for other reasons: compliance groups, geo-resolution, and multi-tenancy.
        This page maps that vocabulary onto Consenti&apos;s actual architecture so it&apos;s
        discoverable during an evaluation.
      </p>

      <h2>&quot;Policy by regulation&quot; → compliance groups</h2>
      <p>
        Rather than branching logic per individual law (GDPR vs. CPRA vs. DPDPA vs. LGPD as separate
        code paths), every supported regulation is bucketed into one of eight{' '}
        <strong>compliance groups</strong> that share identical consent-collection behavior:{' '}
        <code>opt-in</code>, <code>opt-out</code>, <code>opt-out-strict</code>,{' '}
        <code>opt-in-dpdpa</code>, <code>opt-in-china</code>, <code>opt-in-brazil</code>,{' '}
        <code>general-privacy-consent</code>, and <code>notice-only</code>. A profile declares which
        group it belongs to; the group determines default-deny vs. default-grant behavior, GPC
        handling, and CPRA-specific sale/share denial — see the{' '}
        <a href="/docs/compliance">regulation-by-regulation compliance pages</a> for the full
        country-to-group table.
      </p>
      <p>
        This is deliberately coarser than &quot;one policy object per law&quot; — most of the
        world&apos;s ~90 tracked regulations behave identically from a consent-collection standpoint
        once you group them this way, so there is no meaningful behavior difference to configure
        per-law beyond group membership.
      </p>

      <h2>&quot;Policy by region&quot; → geo-resolution</h2>
      <p>
        When a profile is configured with <code>compliance.type: &apos;auto&apos;</code>, the
        visitor&apos;s region determines which compliance group (and therefore which profile)
        applies, resolved from IP geolocation or a timezone+language heuristic — no manual
        region-to-policy mapping to maintain, though a manual override map is supported for edge
        cases.
      </p>
      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  compliance: {
    type: 'auto',              // resolve by visitor region
    geoDataProvider: 'default', // or a custom resolver function
  },
})`}
      />

      <h2>&quot;Policy by site / app&quot; → per-tenant profiles</h2>
      <p>
        Each <code>tenant_id</code> in <code>multiTenant</code> mode has its own independent set of
        profiles, consent templates, and settings — one organization&apos;s config never leaks into
        another&apos;s, and a single deployment can serve multiple sites/apps each with their own
        active compliance group per region.
      </p>
      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  multiTenant: { enabled: true },
})`}
      />
      <p>
        Within one tenant, multiple <em>profiles</em> can coexist for different sites or apps — e.g.
        a marketing site and a checkout app under the same organization, each with its own cookie
        inventory and banner content, both still governed by the same compliance-group rules for a
        given region.
      </p>

      <h2>&quot;Policy by business unit&quot;</h2>
      <p>
        Not a distinct concept in Consenti today — a business unit maps most naturally onto either a
        separate tenant (if it needs fully isolated data/config) or a separate profile within a
        tenant (if it shares infrastructure but needs its own banner/cookie set). There&apos;s no
        third tier between tenant and profile; evaluators asking for business-unit-level policy
        should map that requirement onto whichever of the two fits their actual isolation needs.
      </p>

      <h2>Putting it together</h2>
      <p>
        A concrete example: an org with sites in the EU and California, each needing different
        default behavior:
      </p>
      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  multiTenant: { enabled: true },     // "site/app" axis
  compliance: { type: 'auto' },       // "region" axis — resolves complianceGroup per visitor
})

// Per-tenant profile setup (via the admin dashboard or admin API):
// - EU visitors  → profile with complianceGroup: 'opt-in'          ("regulation" axis: GDPR)
// - CA visitors  → profile with complianceGroup: 'opt-out-strict'  ("regulation" axis: CPRA)
// Both profiles belong to the same tenant if it's one organization's site,
// or separate tenants if "site" isolation is also required.`}
      />

      <Callout type="info">
        There is no single API call that returns &quot;the policy&quot; as one object — the
        effective policy for a given request is the composition of tenant → region-resolved
        compliance group → active profile for that group. This is intentional: it&apos;s the same
        three pieces of config every profile already needs, not a fourth system to keep in sync with
        the other three.
      </Callout>

      <RelatedDocs
        items={[
          {
            href: '/docs/api/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'multiTenant, compliance.type, and every other createConsenti() option',
          },
          {
            href: '/docs/api/routes/admin/',
            label: 'Admin Routes',
            desc: 'The audit log endpoint and other RBAC-protected routes',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: 'Can I write a custom rule that doesn’t fit a compliance group?',
            answer: (
              <p className="m-0">
                Not as a declarative rule — but the plugin system&apos;s{' '}
                <code>beforeConsentSave</code>/<code>afterConsentSave</code> hooks let you run
                arbitrary code against every consent submission, which covers most &quot;custom
                rule&quot; needs without a separate rules-engine abstraction. See the{' '}
                <a href="/docs/api/plugins">Plugins reference</a>.
              </p>
            ),
          },
          {
            question: 'How do I audit which policy applied to a given consent decision?',
            answer: (
              <p className="m-0">
                Every consent record stores its <code>profileId</code>, and every profile stores its{' '}
                <code>complianceGroup</code> at the time — the audit log (append-only,{' '}
                <code>GET /consenti/admin/audit</code>) captures every profile edit, so you can
                reconstruct exactly which policy version was active when any given consent was
                collected.
              </p>
            ),
          },
          {
            question: 'Does compliance-group membership ever change automatically?',
            answer: (
              <p className="m-0">
                No — it&apos;s set explicitly on the profile by whoever configures it (dashboard or
                admin API). Geo-resolution picks which <em>profile</em> (and therefore which
                already-assigned group) applies to a given visitor; it never reassigns a
                profile&apos;s own group.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
