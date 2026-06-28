'use client'

import { useState } from 'react'
import { CopyButton } from './CopyButton'

export interface RenderedTab {
  label: string
  code: string
  html: string
}

export function CodeTabsClient({ tabs }: { tabs: RenderedTab[] }) {
  const [active, setActive] = useState(0)
  const tab = tabs[active]!

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800">
        <div className="flex">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActive(i)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                i === active
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-4">
          <CopyButton code={tab.code} />
        </div>
      </div>
      <div
        className="[&>pre]:p-4 [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:leading-relaxed [&>pre]:!bg-slate-950 [&>pre]:m-0"
        dangerouslySetInnerHTML={{ __html: tab.html }}
      />
    </div>
  )
}
