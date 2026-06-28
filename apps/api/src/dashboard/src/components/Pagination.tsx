import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  hasMore: boolean
  onPage: (p: number) => void
}

export function Pagination({ page, hasMore, onPage }: Props) {
  return (
    <div class="flex items-center gap-2 mt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        class="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors flex items-center gap-1"
      >
        <ChevronLeft size={14} /> Prev
      </button>
      <span class="text-sm text-gray-600">Page {page}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasMore}
        class="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors flex items-center gap-1"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  )
}
