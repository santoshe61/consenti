import type { ComponentChildren } from 'preact'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ComponentChildren
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  keyFn: (row: T) => string
  loading?: boolean
  emptyText?: string
}

export function Table<T extends Record<string, unknown>>({ columns, rows, keyFn, loading, emptyText = 'No data' }: Props<T>) {
  if (loading) {
    return (
      <div class="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            {columns.map(col => (
              <th key={col.key} class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map(row => (
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
  )
}
