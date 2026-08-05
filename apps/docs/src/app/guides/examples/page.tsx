import type { Metadata } from 'next'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { EXAMPLES } from '@/lib/examples'

export const metadata: Metadata = {
  title: 'Examples — Consenti',
  description:
    'Complete, real-life Consenti integrations — full code for e-commerce, SaaS, Next.js, multi-region, and Vue 3 setups.',
  alternates: { canonical: '/guides/examples' },
  openGraph: {
    title: 'Examples — Consenti',
    description:
      'Complete, real-life Consenti integrations — full code for e-commerce, SaaS, Next.js, multi-region, and Vue 3 setups.',
    url: 'https://consenti.dev/guides/examples',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Examples — Consenti',
    description:
      'Complete, real-life Consenti integrations — full code for e-commerce, SaaS, Next.js, multi-region, and Vue 3 setups.',
    images: ['/og-image.jpg'],
  },
}

export default function ExamplesPage() {
  return (
    <div className="prose max-w-none">
      <div className="not-prose mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
            <FlaskConical size={22} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-50 m-0">Examples</h1>
        </div>
        <p className="text-slate-600 dark:text-gray-400 text-base leading-relaxed max-w-2xl">
          Complete, real-life integrations — not isolated snippets. Each example is a full working
          setup for a specific kind of project, with the full code and a walkthrough of every
          decision.
        </p>
      </div>

      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXAMPLES.map((ex) => (
          <Link
            key={ex.slug}
            href={`/guides/examples/${ex.slug}/`}
            className="block p-5 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-sm transition-all no-underline group"
          >
            <div className="font-semibold text-slate-900 dark:text-gray-100 text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {ex.title}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              {ex.desc}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ex.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="not-prose mt-10 p-5 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700">
        <p className="text-sm text-slate-600 dark:text-gray-400 m-0">
          New to Consenti? Build one of these from scratch, one step at a time, in the{' '}
          <Link href="/guides/tutorials/" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Tutorials
          </Link>{' '}
          section — or start with the narrative{' '}
          <Link href="/guides/" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Guides
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
