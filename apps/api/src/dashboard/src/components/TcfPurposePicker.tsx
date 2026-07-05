import { useState, useEffect, useRef } from 'preact/hooks'

const TCF_PURPOSES = [
  { id: 1,  name: 'Store and/or access information on a device' },
  { id: 2,  name: 'Select basic ads' },
  { id: 3,  name: 'Create a personalised ads profile' },
  { id: 4,  name: 'Select personalised ads' },
  { id: 5,  name: 'Create a personalised content profile' },
  { id: 6,  name: 'Select personalised content' },
  { id: 7,  name: 'Measure ad performance' },
  { id: 8,  name: 'Measure content performance' },
  { id: 9,  name: 'Apply market research to generate audience insights' },
  { id: 10, name: 'Develop and improve products' },
  { id: 11, name: 'Use limited data to select content' },
] as const

interface Props {
  selected: number[]
  onChange: (ids: number[]) => void
}

export function TcfPurposePicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (id: number) => {
    onChange(
      selected.includes(id)
        ? selected.filter(x => x !== id).sort((a, b) => a - b)
        : [...selected, id].sort((a, b) => a - b),
    )
  }

  const label = selected.length === 0
    ? 'None selected'
    : selected.length <= 3
      ? selected.map(id => `P${id}`).join(', ')
      : `${selected.length} purposes`

  return (
    <div class="relative mt-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        class={`flex items-center justify-between gap-1.5 w-full border rounded px-2 py-1 text-xs transition-colors ${
          open ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        } ${selected.length > 0 ? 'text-blue-700 bg-blue-50' : 'text-gray-500 bg-white'}`}
      >
        <span class="truncate">{label}</span>
        <svg class={`shrink-0 w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 4l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      {open && (
        <div class="absolute z-50 top-full left-0 mt-0.5 w-64 bg-white border border-gray-200 rounded shadow-lg">
          <div class="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purposes</span>
            {selected.length > 0 && (
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-red-500 transition-colors"
                onClick={() => onChange([])}
              >
                Clear all
              </button>
            )}
          </div>
          <ul class="max-h-52 overflow-y-auto py-1">
            {TCF_PURPOSES.map(p => {
              const checked = selected.includes(p.id)
              return (
                <li key={p.id}>
                  <label class={`flex items-start gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-blue-50/60' : ''}`}>
                    <input
                      type="checkbox"
                      class="mt-0.5 accent-blue-600 shrink-0"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                    />
                    <span class="text-xs text-gray-700 leading-snug">
                      <span class="font-semibold text-blue-700 mr-1">P{p.id}</span>
                      {p.name}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
