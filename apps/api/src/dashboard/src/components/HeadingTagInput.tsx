import { useState, useEffect } from 'preact/hooks'

const STD_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

function isValidTagName(tag: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9-]*$/.test(tag)
}

interface HeadingTagInputProps {
  value: string
  onChange: (v: string) => void
  label?: string
  required?: boolean
}

export function HeadingTagInput({ value, onChange, label = 'Heading Tag', required }: HeadingTagInputProps) {
  const [useCustom, setUseCustom] = useState(() => !STD_TAGS.includes(value))
  const [customError, setCustomError] = useState('')

  // If value changes externally to a std tag, reset custom mode
  useEffect(() => {
    if (STD_TAGS.includes(value)) setUseCustom(false)
  }, [value])

  const toggleCustom = (checked: boolean) => {
    setUseCustom(checked)
    setCustomError('')
    if (!checked) onChange(STD_TAGS.includes(value) ? value : 'h2')
  }

  const handleCustomInput = (raw: string) => {
    onChange(raw)
    setCustomError(raw && !isValidTagName(raw) ? 'Invalid HTML tag name (letters, digits, hyphens only)' : '')
  }

  return (
    <div>
      <div class="flex items-center justify-between mb-1">
        <label class="text-xs font-medium text-gray-600">
          {label}{required && <span class="text-red-500 ml-0.5">*</span>}
        </label>
        <label class="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            class="w-3.5 h-3.5"
            checked={useCustom}
            onChange={e => toggleCustom((e.target as HTMLInputElement).checked)}
          />
          Custom tag
        </label>
      </div>

      {useCustom ? (
        <div>
          <input
            class={`w-full border rounded px-2 py-1.5 text-sm font-mono ${customError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            value={value}
            onInput={e => handleCustomInput((e.target as HTMLInputElement).value)}
            placeholder="e.g. p, div, span"
          />
          {customError && <p class="text-xs text-red-500 mt-0.5">{customError}</p>}
        </div>
      ) : (
        <select
          class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
          value={STD_TAGS.includes(value) ? value : 'h2'}
          onChange={e => onChange((e.target as HTMLSelectElement).value)}
        >
          {STD_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
    </div>
  )
}
