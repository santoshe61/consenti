import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { EXAMPLES } from '@/lib/examples'

export function ExampleNav({ currentSlug }: { currentSlug: string }) {
  const idx = EXAMPLES.findIndex((e) => e.slug === currentSlug)
  if (idx === -1) return null

  const prev = EXAMPLES[(idx - 1 + EXAMPLES.length) % EXAMPLES.length]!
  const next = EXAMPLES[(idx + 1) % EXAMPLES.length]!

  return (
    <div className="not-prose mt-12 pt-6 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between gap-4">
      <Link
        href={`/guides/examples/${prev.slug}/`}
        className="group flex items-center gap-2 no-underline min-w-0"
      >
        <ArrowLeft size={16} className="shrink-0 text-slate-400 group-hover:text-brand-500 transition-colors" />
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
            Previous
          </div>
          <div className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
            {prev.title}
          </div>
        </div>
      </Link>
      <Link
        href={`/guides/examples/${next.slug}/`}
        className="group flex items-center gap-2 no-underline min-w-0 ml-auto text-right justify-end"
      >
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-gray-500">
            Next
          </div>
          <div className="text-sm font-medium text-slate-700 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
            {next.title}
          </div>
        </div>
        <ArrowRight size={16} className="shrink-0 text-slate-400 group-hover:text-brand-500 transition-colors" />
      </Link>
    </div>
  )
}
