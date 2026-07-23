import { useEffect, useState } from 'preact/hooks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '../context/locale'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const MAX_NUMBERED_PAGES = 5

interface Props {
  page: number
  /** Total row count matching the current filters (ignoring page/limit) — drives numbered pages. */
  total: number
  pageSize: number
  onPage: (p: number) => void
  /** When provided (with onPageSize), renders a rows-per-page selector alongside the controls. */
  onPageSize?: (size: number) => void
}

/** Free-typed page-number box, shown once there are more pages than fit as numbered buttons.
 * Only commits on blur/Enter — never on keystroke — so a half-typed number never triggers
 * navigation, and always clamps to [1, totalPages]. */
function JumpToPage({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  const t = useT()
  const [draft, setDraft] = useState(String(page))

  useEffect(() => { setDraft(String(page)) }, [page])

  const commit = () => {
    const n = Number.parseInt(draft, 10)
    const clamped = Number.isFinite(n) ? Math.min(Math.max(n, 1), totalPages) : page
    setDraft(String(clamped))
    if (clamped !== page) onPage(clamped)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={totalPages}
      value={draft}
      aria-label={t('common.goToPage')}
      title={t('common.goToPage')}
      onInput={e => setDraft((e.target as HTMLInputElement).value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      class="w-14 px-1.5 py-1 text-sm text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
    />
  )
}

export function Pagination({ page, total, pageSize, onPage, onPageSize }: Props) {
  const t = useT()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const numberedCount = Math.min(MAX_NUMBERED_PAGES, totalPages)
  const numberedPages = Array.from({ length: numberedCount }, (_, i) => i + 1)
  const showJump = totalPages > MAX_NUMBERED_PAGES

  return (
    <nav aria-label="Pagination" class="flex items-center justify-between gap-2 mt-4 flex-wrap">
      <div class="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label={t('common.prev')}
          class="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={14} aria-hidden="true" /> {t('common.prev')}
        </button>

        {numberedPages.map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === page ? 'page' : undefined}
            class={`px-2.5 py-1.5 text-sm rounded border transition-colors ${
              p === page
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}

        {showJump && <JumpToPage page={page} totalPages={totalPages} onPage={onPage} />}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label={t('common.next')}
          class="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
        >
          {t('common.next')} <ChevronRight size={14} aria-hidden="true" />
        </button>

        <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {t('common.pageOfTotal', { page, total: totalPages })}
        </span>
      </div>

      {onPageSize && (
        <label class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          {t('common.perPage')}
          <select
            value={pageSize}
            onChange={e => onPageSize(Number((e.target as HTMLSelectElement).value))}
            class="border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
    </nav>
  )
}
