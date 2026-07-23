import type { ComponentChildren } from 'preact'
import { Search } from 'lucide-react'
import { Table } from './Table'
import { Pagination } from './Pagination'
import { useT } from '../context/locale'

export interface DataTableColumn<T> {
  key: string
  label: string
  render?: (row: T) => ComponentChildren
}

interface Props<T extends Record<string, unknown>> {
  loading: boolean
  rows: T[]
  columns: DataTableColumn<T>[]
  keyFn: (row: T) => string
  emptyText?: string
  /** Server-side search — unlike `Table`'s own `search` prop, this must trigger a refetch rather
   * than filtering the already-fetched page, since results outside the current page wouldn't be
   * visible to a client-side filter. */
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  /** Extra filter controls (date pickers, checkboxes, selects) rendered next to the search box. */
  filters?: ComponentChildren
  /** Rendered at the end of the toolbar row — typically an export button. */
  toolbarEnd?: ComponentChildren
  total: number
  page: number
  pageSize: number
  onPage: (p: number) => void
  onPageSize: (size: number) => void
}

/**
 * Shared shell for server-paginated admin list pages (Consents, Visitors, Audit Log): search box
 * + filter slot + table + numbered pagination, wired to the `{items, total, page, limit}` shape
 * every list endpoint returns. Extracted so a fix or style change to any of these pieces doesn't
 * need to be repeated across every page that lists records.
 */
export function DataTable<T extends Record<string, unknown>>({
  loading, rows, columns, keyFn, emptyText,
  searchValue, onSearchChange, searchPlaceholder,
  filters, toolbarEnd,
  total, page, pageSize, onPage, onPageSize,
}: Props<T>) {
  const t = useT()

  return (
    <div>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <div class="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onInput={e => onSearchChange((e.target as HTMLInputElement).value)}
            placeholder={searchPlaceholder ?? t('common.search')}
            aria-label={searchPlaceholder ?? t('common.search')}
            class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
        </div>
        {filters}
        <div class="ml-auto flex items-center gap-3">{toolbarEnd}</div>
      </div>

      <Table
        loading={loading}
        keyFn={keyFn}
        rows={rows}
        columns={columns}
        {...(emptyText !== undefined ? { emptyText } : {})}
      />

      <Pagination page={page} total={total} pageSize={pageSize} onPage={onPage} onPageSize={onPageSize} />
    </div>
  )
}
