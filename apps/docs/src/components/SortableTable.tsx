'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export interface SortableTableColumn {
  key: string
  label: string
  /** Render this column's values as <code>. */
  mono?: boolean
  className?: string
}

export interface SortableTableRow {
  /** Stable identity for React keys — not necessarily rendered. */
  id: string
  [key: string]: string
}

export function SortableTable({
  columns,
  rows,
  defaultSortKey,
}: {
  columns: SortableTableColumn[]
  rows: SortableTableRow[]
  defaultSortKey?: string
}) {
  const [sortKey, setSortKey] = useState<string>(defaultSortKey ?? columns[0]?.key ?? '')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function toggleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const cmp = (a[sortKey] ?? '').localeCompare(b[sortKey] ?? '', undefined, { sensitivity: 'base', numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>
              <button
                type="button"
                onClick={() => toggleSort(col.key)}
                className="inline-flex items-center gap-1 font-semibold text-left cursor-pointer bg-transparent border-0 p-0 text-inherit hover:text-brand-600 dark:hover:text-brand-400"
              >
                {col.label}
                {sortKey === col.key ? (
                  sortDir === 'asc' ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />
                ) : (
                  <ChevronsUpDown size={12} className="shrink-0 opacity-30" />
                )}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.key} className={col.className}>
                {col.mono ? <code>{row[col.key]}</code> : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
