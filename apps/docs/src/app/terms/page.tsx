import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms for using consenti.dev and the Consenti software.',
  alternates: { canonical: 'https://consenti.dev/terms' },
  openGraph: {
    title: 'Terms of Use',
    description: 'Terms for using consenti.dev and the Consenti software.',
    url: 'https://consenti.dev/terms',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use',
    description: 'Terms for using consenti.dev and the Consenti software.',
    images: ['/og-image.jpg'],
  },
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="prose max-w-none">
        <h1>Terms of Use</h1>
        <p className="text-sm text-slate-400">Last updated: 2026-07-24</p>

        <p>
          These terms cover two separate things, kept deliberately distinct:{' '}
          <strong>consenti.dev</strong> (this website — documentation, demos, and the SaaS-interest
          form), and the <strong>Consenti software</strong> (<code>@consenti/ui</code>,{' '}
          <code>@consenti/api</code>, and related packages, which you install and run yourself).
        </p>

        <h2>1. This website</h2>
        <p>
          consenti.dev is provided as-is, for the purpose of documenting and demoing the Consenti
          software. Don&apos;t use it to attack, scrape abusively, or attempt to disrupt the site or
          the SaaS-interest form (see <Link href="/privacy/">Privacy Policy</Link> for what that
          form collects and why). Demo/playground pages are for evaluation only — data entered there
          is not a durable record and may be reset at any time.
        </p>

        <h2>2. The Consenti software</h2>
        <p>
          Consenti is open-source software licensed under the{' '}
          <strong>Apache License, Version 2.0</strong>. The license — not this page — is the binding
          legal document governing your use of the code; see <Link href="/license/">License</Link>{' '}
          for a plain-language summary and a link to the full text.
        </p>
        <p>
          The short version, consistent with the license&apos;s own warranty disclaimer: Consenti is
          provided <strong>&quot;AS IS&quot;, without warranty of any kind</strong>. The maintainers
          are not liable for any damages arising from its use.
        </p>

        <h2>3. Consenti does not itself guarantee legal compliance</h2>
        <p>
          Consenti is a <strong>toolkit</strong> for building a compliant consent flow — it is not a
          substitute for legal advice, and installing it does not, by itself, make any website
          compliant with GDPR, CCPA, or any other privacy law. Whether a given deployment is
          actually compliant depends entirely on how it&apos;s configured: which compliance group is
          selected, how cookies/categories/legal bases are set up, whether the banner copy is
          accurate for that business, and so on. See the{' '}
          <Link href="/docs/compliance/jurisdiction-coverage-map/">Jurisdiction Coverage Map</Link>{' '}
          for how the software maps countries to consent models — and consult qualified counsel for
          your specific situation. The maintainers bear no responsibility for legal or regulatory
          outcomes resulting from the use, misuse, or misconfiguration of this software. This is
          also stated in{' '}
          <a
            href="https://github.com/santoshe61/consenti/blob/master/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            LICENSE
          </a>
          .
        </p>

        <h2>4. Third-party services</h2>
        <p>
          This site uses Google reCAPTCHA and Algolia DocSearch (see{' '}
          <Link href="/privacy/">Privacy Policy</Link>). Your use of those features is also subject
          to those providers&apos; own terms.
        </p>

        <h2>5. Comparisons and trademarks</h2>
        <p>
          This site names other cookie-consent and CMP products in feature-comparison tables and
          marketing copy, for the purpose of factual, like-for-like comparison. Pricing and feature
          claims about third-party products reflect our understanding of their public documentation
          as of the date noted next to the comparison; vendors change pricing and features without
          notice, so verify current details directly with them before relying on our summary.
          Where we describe limitations of paid or open-source CMPs generally, we do so in general
          terms rather than attributing specific shortcomings to a specific product, unless the
          claim is a discrete, sourced fact (e.g. a named feature in a comparison table).
        </p>
        <p>
          All third-party product names, logos, and brands referenced on this site are trademarks
          or registered trademarks of their respective owners. Their use here is for identification
          and comparison purposes only and does not imply any affiliation with, sponsorship of, or
          endorsement by, those owners. If you believe a comparison on this site is inaccurate or
          outdated, let us know via <Link href="/support/">Support Consenti</Link> and we will
          review it.
        </p>

        <h2>6. Changes</h2>
        <p>
          These terms may change as the project changes. Material changes will update the &quot;Last
          updated&quot; date above.
        </p>

        <p>
          Related: <Link href="/privacy/">Privacy Policy</Link> ·{' '}
          <Link href="/license/">License</Link>
        </p>
      </div>
    </main>
  )
}
