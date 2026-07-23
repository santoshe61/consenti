import { useMemo } from 'preact/hooks'
import type { CookiePurpose } from '@consenti/types'
import { COOKIE_PURPOSE_IDS, COOKIE_PURPOSE_DEFAULTS, KNOWN_COOKIE_PURPOSES, TRACKER_KNOWLEDGE_BASE, matchTrackerKnowledge } from '@consenti/utils'
import type { TemplateCookie } from '../utils/templates'
import { VendorPicker } from './VendorPicker'
import { TcfPurposePicker } from './TcfPurposePicker'
import { AutoComplete, type AutoCompleteItem } from './AutoComplete'
import { useT, type TranslationKey } from '../context/locale'

interface CookieDefinitionRowProps {
  cookie: TemplateCookie
  idx?: number
  onChange: (c: TemplateCookie) => void
  onRemove: () => void
  duplicateIds?: Set<string>
  tcfEnabled?: boolean
  showCpra?: boolean
  /** The legal basis of the category this parameter currently belongs to, if any — drives the Pre Grant checkbox. */
  categoryLegalBasis?: 'mandatory' | 'consent' | 'legitimate_interest' | undefined
}

export function CookieDefinitionRow({ cookie, idx, onChange, onRemove, duplicateIds, tcfEnabled, showCpra, categoryLegalBasis }: CookieDefinitionRowProps) {
  const t = useT()
  const set = <K extends keyof TemplateCookie>(k: K, v: TemplateCookie[K]) => onChange({ ...cookie, [k]: v })
  const withPurposeDefaults = (c: TemplateCookie, purpose: CookiePurpose): TemplateCookie => ({
    ...c,
    purpose,
    listenGpc: COOKIE_PURPOSE_DEFAULTS[purpose].listenGpc,
    cpraCategory: COOKIE_PURPOSE_DEFAULTS[purpose].cpraCategory,
  })
  const trackerMatch = matchTrackerKnowledge(cookie.id)
  const setId = (id: string) => {
    const known = KNOWN_COOKIE_PURPOSES[id.trim()] ?? matchTrackerKnowledge(id)?.category
    if (known && known !== cookie.purpose) onChange(withPurposeDefaults({ ...cookie, id }, known))
    else onChange({ ...cookie, id })
  }
  const trackerSuggestions = useMemo((): AutoCompleteItem[] =>
    TRACKER_KNOWLEDGE_BASE.map(e => ({ key: e.pattern, label: e.pattern, value: e.pattern, meta: e.vendor })),
    [])
  const idEmpty = !cookie.id.trim()
  const idDup = !idEmpty && (duplicateIds?.has(cookie.id.trim()) ?? false)
  const idError = idEmpty ? 'Required' : idDup ? 'Duplicate ID' : ''
  const purposeError = !cookie.purpose ? 'Required' : ''
  const isNecessary = cookie.purpose === 'necessary'
  const isMandatory = isNecessary || categoryLegalBasis === 'mandatory'
  const preGrantLocked = categoryLegalBasis !== 'consent'

  const handlePurposeChange = (e: Event) => {
    const v = (e.target as HTMLSelectElement).value as CookiePurpose | ''
    if (v) onChange(withPurposeDefaults(cookie, v));
  }

  const rowBg = idx !== undefined
    ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-10/50')
    : 'bg-white'

  return (
    <tr class={`border-b align-top text-xs ${rowBg}`}>
      <td class="py-2.5 pr-3 pl-1">
        <AutoComplete
          value={cookie.id}
          onChange={setId}
          source={{ type: 'local', items: trackerSuggestions }}
          placeholder="analytics_storage"
          emptyText={t('consentTemplates.editor.idNoMatches')}
          inputClassName={`border rounded px-2 py-1.5 w-60 font-mono text-xs ${idError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
        />
        {idError
          ? <p class="text-xs text-red-500 mt-0.5">{idError}</p>
          : trackerMatch && <p class="text-xs text-gray-400 mt-0.5">{t('cookieTemplates.editor.trackerDetected', { vendor: trackerMatch.vendor })}</p>}
      </td>
      <td class="py-2.5 pr-3">
        <select
          class={`border rounded pl-2 pr-4 py-1.5 text-xs w-32 ${purposeError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          value={cookie.purpose ?? ''}
          onChange={handlePurposeChange}
        >
          <option value="" disabled>{t('consentTemplates.editor.purposePlaceholder')}</option>
          {COOKIE_PURPOSE_IDS.map(p => (
            <option key={p} value={p}>{t(`consentTemplates.purpose.${p}` as TranslationKey)}</option>
          ))}
        </select>
        {purposeError && <p class="text-xs text-red-500 mt-0.5">{purposeError}</p>}
      </td>
      <td class="py-2.5 pr-3 text-center">
        <input
          type="checkbox"
          class="w-4 h-4 accent-blue-600"
          checked={cookie.listenGpc}
          disabled={isMandatory}
          onChange={e => set('listenGpc', (e.target as HTMLInputElement).checked)}
          title={isMandatory ? t('consentTemplates.editor.gpcMandatoryTitle') : ''}
        />
      </td>
      <td class="py-2.5 pr-3 text-center">
        <input
          type="checkbox"
          class="w-4 h-4 accent-blue-600"
          checked={preGrantLocked ? true : (cookie.preGrant ?? false)}
          disabled={preGrantLocked}
          onChange={e => set('preGrant', (e.target as HTMLInputElement).checked)}
          title={preGrantLocked ? 'Already effectively pre-granted — only editable when the category legal basis is Consent' : ''}
        />
      </td>
      {tcfEnabled && (
        <td class="py-2.5 pr-3 min-w-[160px]">
          <VendorPicker
            vendorId={cookie.tcfVendorId}
            vendorName={cookie.tcfVendorName}
            onSelect={v => onChange({
              ...cookie,
              tcfVendorId: v?.id ?? undefined,
              tcfVendorName: v?.name ?? undefined,
              tcfPurposes: v?.purposes ?? undefined,
            })}
          />
          {cookie.tcfVendorId != null && (
            <TcfPurposePicker
              selected={cookie.tcfPurposes ?? []}
              onChange={ids => set('tcfPurposes', ids.length > 0 ? ids : undefined)}
            />
          )}
        </td>
      )}
      {showCpra && (
        <td class="py-2.5 pr-3">
          <select
            class="border border-gray-300 rounded pl-2 pr-4 py-1.5 text-xs w-28"
            value={cookie.cpraCategory ?? ''}
            onChange={e => {
              const v = (e.target as HTMLSelectElement).value
              set('cpraCategory', (v || undefined) as TemplateCookie['cpraCategory'])
            }}
          >
            <option value="">—</option>
            <option value="sale">Sale</option>
            <option value="sharing">Sharing</option>
            <option value="sensitive">Sensitive</option>
          </select>
        </td>
      )}
      <td class="py-2.5 text-center">
        <button
          type="button"
          onClick={onRemove}
          class="text-red-400 hover:text-red-600 text-lg leading-none px-1"
          title="Remove"
        >✕</button>
      </td>
    </tr>
  )
}
