import { useMemo, useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { Search } from 'lucide-react'
import { useT } from '../context/locale'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ComponentChildren
}

export interface TableFilter<T> {
  label: string
  options: { value: string; label: string }[]
  /** Returns true when `row` matches the selected filter `value`. Not called for the "all" option. */
  predicate: (row: T, value: string) => boolean
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  keyFn: (row: T) => string
  loading?: boolean
  emptyText?: string
  /** Enables the free-text search box. `keys` extracts the strings to match against per row. */
  search?: { placeholder?: string; keys: (row: T) => (string | undefined)[] }
  filters?: TableFilter<T>[]
}

export function Table<T extends Record<string, unknown>>({ columns, rows, keyFn, loading, emptyText, search, filters }: Props<T>) {
  const t = useT()
  const empty = emptyText ?? t('common.noData')
  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState<Record<number, string>>({})

  const filteredRows = useMemo(() => {
    let result = rows
    if (search && query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(row => search.keys(row).some(v => v?.toLowerCase().includes(q)))
    }
    if (filters) {
      filters.forEach((filter, i) => {
        const value = filterValues[i]
        if (value) result = result.filter(row => filter.predicate(row, value))
      })
    }
    return result
  }, [rows, query, filterValues, search, filters])

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        class="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500 text-sm"
      >
        {t('common.loading')}
      </div>
    )
  }

  const showToolbar = !!search || (filters && filters.length > 0)

  return (
    <div>
      {showToolbar && (
        <div class="flex flex-wrap items-center gap-2 mb-3">
          {search && (
            <div class="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onInput={e => setQuery((e.target as HTMLInputElement).value)}
                placeholder={search.placeholder ?? t('common.search')}
                aria-label={search.placeholder ?? t('common.search')}
                class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              />
            </div>
          )}
          {filters?.map((filter, i) => (
            <select
              key={filter.label}
              value={filterValues[i] ?? ''}
              onChange={e => setFilterValues(prev => ({ ...prev, [i]: (e.target as HTMLSelectElement).value }))}
              aria-label={filter.label}
              class="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              <option value="">{filter.label}</option>
              {filter.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ))}
        </div>
      )}

      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              {columns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  {rows.length === 0 ? empty : t('common.noResults')}
                </td>
              </tr>
            ) : (
              filteredRows.map(row => (
                <tr key={keyFn(row)} class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} class="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
