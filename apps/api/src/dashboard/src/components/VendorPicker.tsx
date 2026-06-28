import { useState, useEffect, useRef } from 'preact/hooks'
import { apiFetch } from '../api/client'

export interface PickedVendor {
  id: number
  name: string
  purposes: number[]
}

interface VendorSearchResult {
  vendors: PickedVendor[]
}

interface Props {
  vendorId?: number | undefined
  vendorName?: string | undefined
  onSelect: (vendor: PickedVendor | null) => void
  disabled?: boolean | undefined
}

export function VendorPicker({ vendorId, vendorName, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickedVendor[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    apiFetch<VendorSearchResult>(`/tcf/vendors?q=${encodeURIComponent(q)}&limit=20`)
      .then(d => setResults(d.vendors))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  const handleInput = (q: string) => {
    setQuery(q)
    setOpen(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => search(q), 250)
  }

  const select = (v: PickedVendor) => {
    onSelect(v)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const clear = () => {
    onSelect(null)
    setQuery('')
    setResults([])
  }

  if (vendorId && !query) {
    return (
      <div class="flex items-center gap-1 text-xs">
        <span class="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
          {vendorId}
        </span>
        <span class="text-gray-600 truncate max-w-[100px]" title={vendorName}>{vendorName ?? `Vendor ${vendorId}`}</span>
        {!disabled && (
          <button type="button" onClick={clear} class="text-gray-400 hover:text-red-500 ml-1 leading-none" title="Clear vendor">✕</button>
        )}
      </div>
    )
  }

  return (
    <div class="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder="Search vendor…"
        disabled={disabled}
        onInput={e => handleInput((e.target as HTMLInputElement).value)}
        onFocus={() => { if (query) setOpen(true) }}
        class="border border-gray-300 rounded px-2 py-1 text-xs w-36 disabled:bg-gray-50"
      />
      {open && (loading || results.length > 0) && (
        <div class="absolute z-50 top-full left-0 mt-0.5 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto text-xs">
          {loading && <p class="px-3 py-2 text-gray-400">Searching…</p>}
          {!loading && results.map(v => (
            <button
              key={v.id}
              type="button"
              onMouseDown={() => select(v)}
              class="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2"
            >
              <span class="font-medium text-gray-800 truncate">{v.name}</span>
              <span class="shrink-0 font-mono text-gray-400">#{v.id}</span>
            </button>
          ))}
          {!loading && results.length === 0 && query && (
            <p class="px-3 py-2 text-gray-400">No vendors found</p>
          )}
        </div>
      )}
    </div>
  )
}
