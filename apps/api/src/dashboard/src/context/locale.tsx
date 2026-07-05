import { createContext } from 'preact'
import { useContext, useState, useEffect } from 'preact/hooks'
import type { ComponentChildren, FunctionComponent } from 'preact'
import { Globe } from 'lucide-react'
import en from '../../../../locale/en.json'
import { resolve, type TranslationKey } from '../utils/t'
export { type TranslationKey } from '../utils/t'
  ;

type LocaleDict = typeof en

// ── Supported locales ──────────────────────────────────────────────────────────
// To add a new locale:
//   1. Add apps/api/locale/[lang].json with the same keys as en.json
//   2. Add a loader entry below in LAZY_LOADERS
//   3. Add a display label in LOCALE_LABELS
//   4. Extend the SupportedLocale union
export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh-CN';

const LOCALE_LABELS: Record<SupportedLocale, string> = { en: 'English (en)', es: 'Español (es)', fr: 'Français (fr)', de: 'Deutsch (de)', ja: '日本語 (ja)', 'zh-CN': '中文 (zh-CN)' }
const SUPPORTED = Object.keys(LOCALE_LABELS) as SupportedLocale[]

// Lazy loaders — en is always bundled; all others load on first switch (~4 KB each).
type NonEnLocale = Exclude<SupportedLocale, 'en'>
const LAZY_LOADERS: Record<NonEnLocale, () => Promise<LocaleDict>> = {
  es: () => import('../../../../locale/es.json').then(m => m.default as LocaleDict),
  fr: () => import('../../../../locale/fr.json').then(m => m.default as LocaleDict),
  de: () => import('../../../../locale/de.json').then(m => m.default as LocaleDict),
  ja: () => import('../../../../locale/ja.json').then(m => m.default as LocaleDict),
  'zh-CN': () => import('../../../../locale/zh-CN.json').then(m => m.default as LocaleDict),
}

// In-memory cache — en is pre-seeded so the first render is instant.
const cache: Partial<Record<SupportedLocale, LocaleDict>> = { en }

function loadLocale(l: SupportedLocale): Promise<LocaleDict> {
  if (cache[l]) return Promise.resolve(cache[l]!)
  const loader = (LAZY_LOADERS as Record<string, (() => Promise<LocaleDict>) | undefined>)[l]
  if (!loader) return Promise.resolve(en)
  return loader().then(dict => { cache[l] = dict; return dict })
}

// ── Context ────────────────────────────────────────────────────────────────────
interface LocaleContextValue {
  locale: SupportedLocale
  setLocale: (l: SupportedLocale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => { },
  t: (key) => key,
})

// ── Provider ───────────────────────────────────────────────────────────────────
export function LocaleProvider({ children }: { children: ComponentChildren }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const stored = localStorage.getItem('dashboard-locale') as SupportedLocale | null
      return stored && SUPPORTED.includes(stored) ? stored : 'en'
    } catch {
      return 'en'
    }
  })

  // dict is the active translation map; starts from cache (en is always pre-seeded).
  const [dict, setDict] = useState<LocaleDict>(cache[locale] ?? en)

  // On mount: restore a non-English locale that was persisted in localStorage.
  useEffect(() => {
    if (locale !== 'en' && !cache[locale]) {
      loadLocale(locale).then(setDict)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setLocale = (l: SupportedLocale) => {
    if (l === locale) return
    setLocaleState(l)
    try { localStorage.setItem('dashboard-locale', l) } catch { }
    // Apply immediately if cached, otherwise fetch then apply (en fallback stays visible during load).
    if (cache[l]) setDict(cache[l]!)
    else loadLocale(l).then(setDict)
  }

  const t = (key: TranslationKey, vars?: Record<string, string | number>) =>
    resolve(dict, key, vars)

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

// ── Hooks ──────────────────────────────────────────────────────────────────────
export const useLocale = () => useContext(LocaleContext)
export const useT = () => useContext(LocaleContext).t

// ── LocaleSwitcher component ───────────────────────────────────────────────────
interface GlobeProps { size?: number; className?: string }
const GlobeIcon = Globe as unknown as FunctionComponent<GlobeProps>

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div class="flex items-center gap-1" title={t('locale.switcherAria')}>
      <GlobeIcon size={13} className="text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true" />
      <select
        value={locale}
        onChange={e => setLocale((e.target as HTMLSelectElement).value as SupportedLocale)}
        aria-label={t('locale.switcherAria')}
        disabled={SUPPORTED.length <= 1}
        class="text-xs text-gray-600 dark:text-gray-300 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white appearance-none disabled:cursor-default"
      >
        {SUPPORTED.map(l => (
          <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
        ))}
      </select>
    </div>
  )
}
