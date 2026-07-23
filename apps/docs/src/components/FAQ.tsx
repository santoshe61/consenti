'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: React.ReactNode
}

export function FAQ({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="not-prose mt-2 divide-y divide-slate-200 dark:divide-gray-700 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-slate-800 dark:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={open === i}
          >
            <span>{item.question}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-slate-400 dark:text-gray-500 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 pt-1 text-sm text-slate-600 dark:text-gray-400 leading-relaxed bg-slate-50 dark:bg-gray-800/50">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
