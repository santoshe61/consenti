import { useState } from 'preact/hooks'
import { X, AlertCircle } from 'lucide-react'

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  disabled?: boolean
}

// Normalize a raw entry: strip protocol/path from full URLs, lowercase.
function normalize(raw: string): string {
  const s = raw.trim().toLowerCase()
  try {
    // Accept full URLs by extracting hostname (preserves port for localhost:3000)
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const u = new URL(s)
      return u.port ? `${u.hostname}:${u.port}` : u.hostname
    }
  } catch {
    // fall through to raw value
  }
  return s
}

// Pattern: bare hostname OR *.hostname.  Allows localhost[:port].
function isValid(s: string): boolean {
  const base = s.startsWith('*.') ? s.slice(2) : s
  // localhost or localhost:port
  if (/^localhost(:\d{1,5})?$/.test(base)) return true
  // standard hostname segments, optionally port
  const [host, port] = base.split(':')
  if (port !== undefined && !/^\d{1,5}$/.test(port)) return false
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(host ?? '')
}

function parseDomains(raw: string): string[] {
  return raw
    .split(/[\s,\n]+/)
    .map(normalize)
    .filter(d => d.length > 0)
}

export function DomainsInput({ value, onChange, placeholder, disabled }: Props) {
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState(false)

  const add = (raw: string) => {
    const parsed = parseDomains(raw)
    const invalid = parsed.filter(d => !isValid(d))
    if (invalid.length > 0) {
      setInputError(true)
      return
    }
    setInputError(false)
    const next = [...new Set([...value, ...parsed])]
    onChange(next)
    setInput('')
  }

  const remove = (domain: string) => onChange(value.filter(d => d !== domain))

  const handleInput = (raw: string) => {
    setInput(raw)
    setInputError(false)
  }

  return (
    <div class="space-y-1">
      <div
        class={`flex flex-wrap gap-1.5 border rounded px-3 py-2 min-h-[42px] focus-within:ring-1 transition-colors ${
          inputError
            ? 'border-red-400 focus-within:ring-red-400'
            : 'border-gray-300 focus-within:ring-blue-500 focus-within:border-blue-500'
        } ${disabled ? 'bg-gray-50' : 'bg-white'}`}
      >
        {value.map(domain => (
          <span
            key={domain}
            class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200 font-mono"
          >
            {domain}
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(domain)}
                class="text-blue-400 hover:text-blue-700 leading-none ml-0.5"
                aria-label={`Remove ${domain}`}
              >
                <X size={10} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            value={input}
            class="outline-none flex-1 min-w-[200px] text-sm bg-transparent"
            placeholder={value.length === 0 ? (placeholder ?? 'example.com, *.staging.example.com') : ''}
            onInput={e => handleInput((e.target as HTMLInputElement).value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                if (input.trim()) add(input)
              } else if (e.key === 'Backspace' && !input && value.length > 0) {
                onChange(value.slice(0, -1))
              }
            }}
            onBlur={() => { if (input.trim()) add(input) }}
            onPaste={e => {
              e.preventDefault()
              const text = (e as ClipboardEvent).clipboardData?.getData('text') ?? ''
              if (text.trim()) add(text)
            }}
          />
        )}
      </div>
      {inputError && (
        <p class="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle size={12} />
          Invalid domain. Use <code class="font-mono bg-red-50 px-1 rounded">example.com</code> or <code class="font-mono bg-red-50 px-1 rounded">*.example.com</code>. Full URLs are accepted and normalized automatically.
        </p>
      )}
    </div>
  )
}
