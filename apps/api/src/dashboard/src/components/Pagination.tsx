import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '../context/locale'

interface Props {
  page: number
  hasMore: boolean
  onPage: (p: number) => void
}

export function Pagination({ page, hasMore, onPage }: Props) {
  const t = useT()
  return (
    <nav aria-label="Pagination" class="flex items-center gap-2 mt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label={t('common.prev')}
        class="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors flex items-center gap-1"
      >
        <ChevronLeft size={14} aria-hidden="true" /> {t('common.prev')}
      </button>
      <span class="text-sm text-gray-600" aria-current="page">{t('common.page', { n: page })}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasMore}
        aria-label={t('common.next')}
        class="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors flex items-center gap-1"
      >
        {t('common.next')} <ChevronRight size={14} aria-hidden="true" />
      </button>
    </nav>
  )
}
