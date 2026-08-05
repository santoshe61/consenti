import type { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock, Terminal } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: '@consenti/scanner — offline cookie & tracker discovery CLI — Consenti',
  description:
    'A local, offline CLI that crawls your site under no-consent/reject-all/accept-all states and reports every third-party cookie, request, and script that fires before consent — the gap between what your profile declares and what the site actually does.',
  keywords: [
    'cookie scanner',
    'tracker scanner',
    'cookie audit CLI',
    'consent scanner',
    'enterprise CMP scanner alternative',
    'GDPR cookie audit tool',
  ],
  alternates: { canonical: '/guides/ecosystem/scanner' },
  openGraph: {
    title: '@consenti/scanner — offline cookie & tracker discovery CLI',
    description:
      'Crawls your site under three consent states and reports undeclared third-party trackers, fully offline — no account, no hosted service.',
    url: 'https://consenti.dev/guides/ecosystem/scanner',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '@consenti/scanner — offline cookie & tracker discovery CLI',
    description:
      'Crawls your site under three consent states and reports undeclared third-party trackers, fully offline — no account, no hosted service.',
    images: ['/og-image.jpg'],
  },
}

const FLAG_ROWS: Array<{ flag: string; default: string; meaning: string }> = [
  { flag: '--depth <n>', default: '1', meaning: 'Link-crawl depth in hops from the start URL' },
  { flag: '--page-limit <n>', default: '10', meaning: 'Max pages scanned, including the start URL' },
  { flag: '--output-dir <dir>', default: './scan-results', meaning: 'Base output directory — each scan gets its own <dir>/<scan-id>/ subdirectory' },
  { flag: '--timeout <ms>', default: '30000', meaning: 'Per-page navigation timeout' },
  { flag: '--headed', default: 'off', meaning: 'Visible browser window, for debugging a scan' },
  { flag: '--verbose', default: 'off', meaning: 'Print every progress step on its own line instead of a single status spinner' },
  { flag: '--skip-robots-txt', default: 'off', meaning: 'Crawl every discovered link regardless of robots.txt disallow rules' },
  { flag: '--skip-user-agent-checks', default: 'off', meaning: 'Neutralize navigator.webdriver and strip "Headless" from the User-Agent — bypasses sites/CMPs that treat detected automation differently' },
  { flag: '--enable-gpc', default: 'off', meaning: 'Set navigator.globalPrivacyControl = true and send Sec-GPC: 1 on every request' },
]

export default function ScannerGuidePage() {
  return (
    <div className="prose max-w-none">
      <h1>@consenti/scanner</h1>
      <p className="lead">
        Every cookie profile <em>declares</em> a set of categorized trackers. What a site actually
        <em> fires</em> in a real browser is a different question — third-party scripts, tag
        managers, and forgotten pixels have a way of drifting out of sync with whatever's written
        down. <code>@consenti/scanner</code> is a local, offline CLI that closes that gap: it
        crawls a site under three consent states — no consent given, reject-all, accept-all — and
        reports every cookie, request, and script it actually saw fire, cross-referenced against
        what state it fired in.
      </p>

      <Callout type="info">
        No account, no server, no hosted service. Everything runs on your machine; the only
        network traffic is the crawl itself. This is the same tool referenced in{' '}
        <Link href="/guides/frontend-only-mode/">Frontend-Only Mode</Link> as the way to discover
        cookies without hand-declaring them.
      </Callout>

      <h2>Install</h2>
      <p>
        <code>@consenti/scanner</code> isn&apos;t published to npm yet — it lives in the Consenti
        monorepo as a workspace package. Clone the repo and build it locally:
      </p>
      <Terminal
        code={`git clone https://github.com/santoshe61/consenti.git
cd consenti
npm install
npm run build --workspace=@consenti/scanner
npm run install-browsers --workspace=@consenti/scanner   # one-time: installs Playwright's Chromium`}
      />

      <h2>Usage</h2>
      <Terminal code="node apps/scanner/dist/cli.js scan https://example.com --depth 2 --output-dir ./scan-results" />
      <p>
        Exits non-zero when the report has unclassified trackers or anything firing before
        consent — usable directly as a CI/CD gate.
      </p>

      <h2>Configuration flags</h2>
      <div className="not-prose overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700 my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Flag</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Default</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-500">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {FLAG_ROWS.map((row, i) => (
              <tr key={row.flag} className={i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : ''}>
                <td className="py-2.5 px-4 align-top"><code>{row.flag}</code></td>
                <td className="py-2.5 px-4 align-top text-slate-500 dark:text-gray-400 whitespace-nowrap">{row.default}</td>
                <td className="py-2.5 px-4 align-top">{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Output layout</h2>
      <p>
        Every scan gets a short random id (e.g. <code>116gltxj</code>) and its own directory, so
        concurrent or historical scans never collide or overwrite each other&apos;s screenshots:
      </p>
      <CodeBlock
        lang="text"
        code={`<output-dir>/<scan-id>/
  scan-results.json
  scan-results.html
  screenshots/
    <page>/no-consent.png
    <page>/reject-all.png
    <page>/accept-all.png`}
      />
      <p>
        The id is embedded in the report itself (<code>ScanReport.id</code>) and shown at the top
        of both the console output and the HTML report.
      </p>

      <h2>Progress output</h2>
      <p>
        A scan can take a while — several page loads × three consent states × settle time each.
        The CLI prints a live spinner with the current activity (crawling, navigating a page,
        detecting/clicking a CMP banner, capturing signals, …) on an interactive terminal, or plain
        one-per-line progress otherwise (piped output, CI logs). Pass <code>--verbose</code> to
        always print every step as its own line — useful when debugging a slow or stuck scan.
      </p>

      <h2>What it does</h2>
      <ul>
        <li><strong>Crawls</strong> same-origin links from the start URL, respecting <code>robots.txt</code> (unless <code>--skip-robots-txt</code>), bounded by <code>--depth</code>/<code>--page-limit</code>.</li>
        <li><strong>Scans each page under three consent states</strong>, clicking through any detected CMP banner (Consenti&apos;s own, or a generic enterprise/open-source-style banner) via multi-locale accept/reject button-label matching. If no banner is detected at all, the report says so explicitly (<code>cmpDetected: false</code>) rather than guessing.</li>
        <li><strong>Captures</strong> cookies, localStorage, sessionStorage, IndexedDB, network requests, script tags, and iframe origins per state.</li>
        <li><strong>Classifies</strong> every third-party cookie/request/script against a bundled offline dataset. Unmatched trackers are never guessed into a category — they land in the report&apos;s manual-review list instead.</li>
        <li><strong>Behavioral detection</strong> — any third-party domain making requests post-load is flagged regardless of what its cookies are named.</li>
        <li><strong>CNAME/first-party-cloaking detection</strong> — subdomains that CNAME to a different registrable domain are flagged, catching server-side-tagging setups that make a third-party tracker look same-site.</li>
        <li><strong>Tag manager detection</strong> — recognizes GTM/Tealium container script tags.</li>
        <li><strong>Fingerprinting heuristics</strong> — flags canvas, audio, and font-enumeration API usage as a separate non-cookie tracking category.</li>
      </ul>

      <h2>HTML report</h2>
      <p>
        Alongside the machine-readable <code>scan-results.json</code>, the CLI writes a
        self-contained <code>scan-results.html</code> — no fetch, no CDN, no external assets, so
        the file works standalone once written. Every section is independently scrollable and also
        exposes its underlying data as raw JSON for programmatic use:
      </p>
      <ul>
        <li><strong>Summary</strong> — totals plus the site-wide list of trackers flagged for manual review.</li>
        <li><strong>Pages</strong> — one collapsible card per scanned page: findings, cloaking, fingerprinting, tag managers, screenshots.</li>
        <li><strong>Crawl metadata</strong> — pages scanned, pages skipped by <code>robots.txt</code>.</li>
        <li><strong>Suggested setup</strong> — a consent template, UI template, and profile generated from the site&apos;s actual discovered trackers (see below).</li>
        <li><strong>Frontend-only profile</strong> — the same suggestion as a self-contained <code>ConsentiProfile({'{'}...{'}'})</code> snippet, ready to paste into a site running <code>@consenti/ui</code> with no backend at all.</li>
        <li><strong>Full report (raw JSON)</strong> — the complete <code>ScanReport</code>, identical to the sibling <code>.json</code> file.</li>
      </ul>

      <h2>Suggested setup: from raw findings to a Consenti profile</h2>
      <p>
        A scan&apos;s findings are grouped by purpose (necessary/functional/preferences/analytics/
        marketing) into one of Consenti&apos;s 8 built-in{' '}
        <Link href="/docs/compliance/compliance-groups/">compliance groups</Link>, chosen
        heuristically from what was found — opt-in (GDPR/ePrivacy-style) whenever any non-essential
        tracker turns up, since it&apos;s the safe universal default: it satisfies opt-in
        jurisdictions outright and is a strict superset of what opt-out jurisdictions require.
        Anything that couldn&apos;t be confidently classified is excluded from the suggestion and
        called out for manual review — consistent with the scanner never auto-assigning{' '}
        <code>necessary</code> or writing to a live profile on its own. Treat the output as a
        starting point for the dashboard&apos;s consent-template/UI-template/profile authoring
        flow, not something to import blindly.
      </p>

      <h2>Bypassing bot-averse CMPs, and checking GPC behavior</h2>
      <p>
        Some CMPs alter what they show based on trivial automation signals —{' '}
        <code>navigator.webdriver</code>, or a <code>User-Agent</code> containing
        &quot;HeadlessChrome&quot;. <code>--skip-user-agent-checks</code> neutralizes both, so a
        scan reflects what an ordinary visitor sees rather than what a detected bot sees. It&apos;s
        off by default — a deliberate, named action to bypass a site&apos;s own check, not
        something applied silently on every scan — and only affects requests made after the page
        has already loaded (the very first navigation request necessarily goes out before this
        tool has a chance to correct anything), which covers the common case since most CMPs run
        their bot-check from an init script after load, not before.
      </p>
      <p>
        <code>--enable-gpc</code> simulates a visitor with{' '}
        <Link href="/docs/compliance/jurisdiction-coverage-map/">Global Privacy Control</Link>{' '}
        turned on — sets <code>navigator.globalPrivacyControl = true</code> and sends{' '}
        <code>Sec-GPC: 1</code> on every request. Run a scan with and without it to see whether a
        site&apos;s tracking behavior actually changes in response: several US state privacy laws
        require honoring GPC as an opt-out-of-sale/sharing signal, and a site that doesn&apos;t is
        worth flagging regardless of what its cookie banner claims.
      </p>

      <h2>Known limitations</h2>
      <Callout type="warning">
        <strong>Cross-origin iframe banners.</strong> A handful of enterprise CMPs render their
        banner inside a cross-origin <code>&lt;iframe&gt;</code>{' '}
        rather than directly in the page DOM. This scanner&apos;s banner detection only searches
        the main frame plus same-origin frames — a cross-origin iframe banner won&apos;t be found
        or clicked, and the scan correctly falls back to <code>cmpDetected: false</code> rather
        than a false click, but states 2/3 collapse to state 1 on those sites even though a real
        CMP is present.
      </Callout>
      <Callout type="warning">
        <strong>Geo-gated or bot-mitigated CMPs.</strong> Some enterprise CMPs decide
        server-side, per visitor, whether a banner is required at all — usually via IP
        geolocation against the site&apos;s configured jurisdiction rules — and simply never
        render one for a visitor classified as not needing consent. A scan can therefore correctly
        report <code>cmpDetected: false</code> for a site that <em>does</em> show a real banner to
        visitors from a different network/region than wherever the scan runs from. Separately,
        some sites sit behind bot-mitigation/WAF layers that may serve automated traffic a
        degraded experience regardless of consent rules — <code>--skip-user-agent-checks</code>{' '}
        reduces false negatives from the most trivial signals, but won&apos;t help against
        WAF-level blocking (no TLS/fingerprint spoofing here, deliberately). If a scan reports no
        CMP for a site you know has one, try <code>--skip-user-agent-checks</code>, re-running from
        a different network, or <code>--headed --verbose</code> to watch what actually happens.
      </Callout>

      <h2>Extending the classification database</h2>
      <p>
        Every domain/cookie-name → vendor → category mapping the scanner matches against lives in{' '}
        <code>apps/scanner/source-data/</code> in the repo — a single, open, community-maintained
        dataset (vendor name, category, confidence, purpose description, retention, TCF vendor id,
        source citation) designed to grow toward the depth of what large commercial CMPs ship. It
        stays local and free for anyone self-hosting Consenti; see the{' '}
        <code>README.md</code> in that directory for the schema and how to add a vendor.
      </p>

      <h2>Programmatic use</h2>
      <CodeBlock
        lang="typescript"
        filename="scan.ts"
        code={`import { runScan, writeReport, writeHtmlReport, hasBlockingFindings, DEFAULT_SCAN_OPTIONS } from '@consenti/scanner'

const report = await runScan(
  'https://example.com',
  { ...DEFAULT_SCAN_OPTIONS, depth: 2 },
  message => console.log(message) // optional — progress updates as the scan runs
)

console.log(report.id) // e.g. '116gltxj' — also the name of its output directory
await writeReport(report, './scan-results')      // → ./scan-results/<report.id>/scan-results.json
await writeHtmlReport(report, './scan-results')  // → ./scan-results/<report.id>/scan-results.html

if (hasBlockingFindings(report)) process.exitCode = 1`}
      />

      <FAQ
        items={[
          {
            question: 'Does the scanner need @consenti/api or a database?',
            answer: (
              <p className="m-0">
                No. It never writes to a live profile itself — findings are a starting point for
                the dashboard&apos;s consent-template/UI-template/profile authoring flow, imported
                and reviewed by a human, not applied automatically.
              </p>
            ),
          },
          {
            question: 'Why does it scan under three consent states instead of just checking the banner exists?',
            answer: (
              <p className="m-0">
                Because the actual compliance question is what fires <em>before</em> a visitor
                agrees to anything. A banner that exists but doesn&apos;t actually block trackers
                until dismissed is a common real-world failure mode this specifically catches —
                see <code>summary.firingBeforeConsent</code> in the report.
              </p>
            ),
          },
          {
            question: 'Is this a replacement for a hosted scanning service from an enterprise CMP vendor?',
            answer: (
              <p className="m-0">
                For now, it&apos;s a local, on-demand/CI tool, not a continuously-scheduled hosted
                crawler with a managed vendor database — see{' '}
                <Link href="/guides/hot-topics/open-source-alternatives-to-onetrust/">
                  Open-source alternatives to OneTrust
                </Link>{' '}
                for the full comparison.
              </p>
            ),
          },
        ]}
      />

      <RelatedDocs
        items={[
          {
            href: '/guides/frontend-only-mode/',
            label: 'Frontend-Only Mode',
            desc: 'How the scanner fits into a no-backend Consenti setup',
          },
          {
            href: '/guides/what-is-consenti/',
            label: 'Consenti, What-Why-How?',
            desc: 'How scanning, profiles, and templates relate',
          },
          {
            href: '/docs/compliance/compliance-groups/',
            label: 'Compliance Groups',
            desc: 'The 8 built-in groups the scanner picks a suggestion from',
          },
        ]}
      />
    </div>
  )
}
