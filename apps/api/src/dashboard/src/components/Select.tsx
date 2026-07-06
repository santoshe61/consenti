import { useState, useRef, useEffect } from 'preact/hooks'
import { ChevronDown, Search } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  id?: string
  class?: string
}

export function Select({ options, value, onChange, placeholder = 'Select…', searchable, disabled, id, class: extraClass }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => inputRef.current?.focus(), 10)
    }
    if (!open) setQuery('')
  }, [open, searchable])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter' && !open) setOpen(true)
  }

  return (
    <div ref={containerRef} class={`relative ${extraClass ?? ''}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKey}
        class={`w-full flex items-center justify-between gap-2 border border-gray-300 rounded px-3 py-2 text-sm bg-white text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span class={selected ? 'text-gray-900' : 'text-gray-400'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-56 flex flex-col" role="listbox">
          {searchable && (
            <div class="px-2 pt-2 pb-1 border-b border-gray-100">
              <div class="flex items-center gap-1.5 border border-gray-300 rounded px-2 py-1">
                <Search size={12} className="text-gray-400 shrink-0" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  class="flex-1 text-sm outline-none bg-transparent"
                  placeholder="Search…"
                  value={query}
                  onInput={e => setQuery((e.target as HTMLInputElement).value)}
                  aria-label="Search options"
                />
              </div>
            </div>
          )}
          <ul class="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <li class="px-3 py-2 text-sm text-gray-400">No results</li>
            )}
            {filtered.map(opt => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                class={`px-3 py-2 text-sm cursor-pointer transition-colors ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
