import { useState, useEffect, useRef, useMemo } from 'preact/hooks'
import { debounce } from '../../../utils/debounce'

export interface AutoCompleteItem<T = unknown> {
  key: string | number
  label: string
  value: string
  meta?: string
  /** Optional full payload for consumers that need more than label/value (e.g. a picked vendor object). */
  data?: T
}

export interface LocalAutoCompleteSource<T = unknown> {
  type: 'local'
  items: AutoCompleteItem<T>[]
}

export interface ServerAutoCompleteSource<T = unknown> {
  type: 'server'
  search: (query: string) => Promise<AutoCompleteItem<T>[]>
  /** Minimum characters typed before a server search fires. Defaults to 1. */
  minChars?: number
  debounceMs?: number
}

export type AutoCompleteSource<T = unknown> = LocalAutoCompleteSource<T> | ServerAutoCompleteSource<T>

interface Props<T = unknown> {
  value: string
  onChange: (value: string) => void
  onSelect?: (item: AutoCompleteItem<T>) => void
  source: AutoCompleteSource<T>
  placeholder?: string
  disabled?: boolean | undefined
  loadingText?: string
  emptyText?: string
  inputClassName?: string
  autoFocus?: boolean
}

export function AutoComplete<T = unknown>({
  value, onChange, onSelect, source, placeholder, disabled,
  loadingText = 'Searching…', emptyText = 'No matches', inputClassName, autoFocus,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const [serverResults, setServerResults] = useState<AutoCompleteItem<T>[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const localResults = useMemo(() => {
    if (source.type !== 'local') return []
    const q = value.trim().toLowerCase()
    if (!q) return source.items
    return source.items.filter(i => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q))
  }, [source, value])

  const search = useMemo(() => {
    if (source.type !== 'server') return null
    const fn = source.search
    return debounce((q: string) => {
      setLoading(true)
      fn(q).then(setServerResults).catch(() => setServerResults([])).finally(() => setLoading(false))
    }, source.debounceMs ?? 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.type === 'server' ? source.search : null])

  useEffect(() => {
    if (source.type !== 'server' || !search) return
    const minChars = source.minChars ?? 1
    const q = value.trim()
    if (q.length < minChars) { setServerResults([]); return }
    search(q)
  }, [value, source, search])

  const results = source.type === 'local' ? localResults : serverResults
  const showDropdown = open && !disabled

  const select = (item: AutoCompleteItem<T>) => {
    onChange(item.value)
    onSelect?.(item)
    setOpen(false)
  }

  return (
    <div class="relative" ref={containerRef}>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onInput={e => { onChange((e.target as HTMLInputElement).value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        class={inputClassName ?? 'border border-gray-300 rounded px-2 py-1 text-xs w-36 disabled:bg-gray-50'}
        autocomplete="off"
      />
      {showDropdown && (loading || results.length > 0 || source.type === 'server') && (
        <div class="absolute z-50 top-full left-0 mt-0.5 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto text-xs">
          {loading && <p class="px-3 py-2 text-gray-400">{loadingText}</p>}
          {!loading && results.map(item => (
            <button
              key={item.key}
              type="button"
              onMouseDown={() => select(item)}
              class="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2"
            >
              <span class="font-medium text-gray-800 truncate">{item.label}</span>
              {item.meta && <span class="shrink-0 font-mono text-gray-400 text-[10px]">{item.meta}</span>}
            </button>
          ))}
          {!loading && results.length === 0 && (
            <p class="px-3 py-2 text-gray-400">{emptyText}</p>
          )}
        </div>
      )}
    </div>
  )
}
