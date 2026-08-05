import { useState } from 'preact/hooks'
import { X } from 'lucide-react'
import { CountrySelecter, localeLabel } from './CountrySelecter'
import { useT } from '../context/locale'

interface Props {
  locales: string[]
  defaultLocale: string
  activeLocale: string
  onSelect: (locale: string) => void
  onAdd: (locale: string) => void
  onRemove: (locale: string) => void
}

export function LocaleTabBar({ locales, defaultLocale, activeLocale, onSelect, onAdd, onRemove }: Props) {
  const t = useT()
  const [showPicker, setShowPicker] = useState(false)

  const handleSelect = (locale: string) => {
    if (locale && !locales.includes(locale)) {
      onAdd(locale)
    }
    setShowPicker(false)
  }

  return (
    <div class="flex flex-wrap items-center gap-1 border-b border-gray-200 mb-4 pb-0">
      {locales.map(locale => (
        <div key={locale} class="relative flex items-center -mb-px">
          <button
            onClick={() => onSelect(locale)}
            title={localeLabel(locale)}
            class={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${locale !== defaultLocale ? 'pr-5' : ''} ${
              locale === activeLocale
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {locale.toUpperCase()}
            {locale === defaultLocale && (
              <span class="ml-1 text-xs text-gray-400">{t('profileEditor.content.defaultLocaleLabel')}</span>
            )}
          </button>
          {locale !== defaultLocale && (
            <button
              onClick={() => onRemove(locale)}
              class="absolute right-1 text-gray-300 hover:text-red-500 transition-colors"
              aria-label={`Remove ${locale}`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      {showPicker ? (
        <div class="flex items-center gap-1.5 ml-2 relative z-10">
          <CountrySelecter
            value=""
            onChange={handleSelect}
            placeholder={t('profileEditor.content.selectLocale')}
            class="w-52"
          />
          <button
            onClick={() => setShowPicker(false)}
            class="text-xs text-gray-400 hover:underline px-1"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          class="px-2 py-2 text-xs text-gray-400 hover:text-blue-600 transition-colors -mb-px border-b-2 border-transparent"
        >
          {t('profileEditor.content.addLocale')}
        </button>
      )}
    </div>
  )
}
