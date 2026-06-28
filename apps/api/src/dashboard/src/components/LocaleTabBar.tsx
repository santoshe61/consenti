import { useState } from 'preact/hooks'

interface Props {
  locales: string[]
  defaultLocale: string
  activeLocale: string
  onSelect: (locale: string) => void
  onAdd: (locale: string) => void
}

export function LocaleTabBar({ locales, defaultLocale, activeLocale, onSelect, onAdd }: Props) {
  const [showInput, setShowInput] = useState(false)
  const [newLocale, setNewLocale] = useState('')

  const handleAdd = () => {
    const l = newLocale.trim().toLowerCase()
    if (l && !locales.includes(l)) {
      onAdd(l)
      setNewLocale('')
      setShowInput(false)
    }
  }

  return (
    <div class="flex flex-wrap items-center gap-1 border-b border-gray-200 mb-4 pb-0">
      {locales.map(locale => (
        <button
          key={locale}
          onClick={() => onSelect(locale)}
          class={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            locale === activeLocale
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {locale.toUpperCase()}
          {locale === defaultLocale && (
            <span class="ml-1 text-xs text-gray-400">(default)</span>
          )}
        </button>
      ))}
      {showInput ? (
        <div class="flex items-center gap-1 ml-2">
          <input
            class="border border-gray-300 rounded px-2 py-1 text-xs w-20"
            placeholder="e.g. fr"
            value={newLocale}
            onInput={e => setNewLocale((e.target as HTMLInputElement).value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <button onClick={handleAdd} class="text-xs text-blue-600 hover:underline">Add</button>
          <button onClick={() => setShowInput(false)} class="text-xs text-gray-400 hover:underline">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          class="px-2 py-2 text-xs text-gray-400 hover:text-blue-600 transition-colors -mb-px border-b-2 border-transparent"
        >
          + Add locale
        </button>
      )}
    </div>
  )
}
