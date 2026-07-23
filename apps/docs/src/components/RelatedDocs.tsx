import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

interface RelatedDoc {
  href: string
  label: string
  desc: string
}

export function RelatedDocs({ items }: { items: RelatedDoc[] }) {
  return (
    <div className="not-prose mt-2 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
        <BookOpen size={14} className="text-brand-500" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
          Related documentation
        </span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-gray-800">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between gap-4 px-5 py-3 no-underline hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {item.label}
              </div>
              <div className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{item.desc}</div>
            </div>
            <ArrowRight size={14} className="shrink-0 text-slate-300 dark:text-gray-600 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  )
}
