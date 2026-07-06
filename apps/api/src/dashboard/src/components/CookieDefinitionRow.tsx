import type { TemplateCookie } from '../utils/templates'
import { VendorPicker } from './VendorPicker'
import { TcfPurposePicker } from './TcfPurposePicker'
import { useT } from '../context/locale'

interface CookieDefinitionRowProps {
  cookie: TemplateCookie
  idx?: number
  onChange: (c: TemplateCookie) => void
  onRemove: () => void
  duplicateIds?: Set<string>
  tcfEnabled?: boolean
  showCpra?: boolean
}

export function CookieDefinitionRow({ cookie, idx, onChange, onRemove, duplicateIds, tcfEnabled, showCpra }: CookieDefinitionRowProps) {
  const t = useT()
  const set = <K extends keyof TemplateCookie>(k: K, v: TemplateCookie[K]) => onChange({ ...cookie, [k]: v })
  const idEmpty = !cookie.id.trim()
  const idDup = !idEmpty && (duplicateIds?.has(cookie.id.trim()) ?? false)
  const idError = idEmpty ? 'Required' : idDup ? 'Duplicate ID' : ''
  const expiryError = cookie.expiry < 1 ? 'Must be ≥ 1' : ''
  const isMandatory = cookie.legalBasis === 'mandatory'

  const rowBg = idx !== undefined
    ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')
    : 'bg-white'

  return (
    <tr class={`border-b align-top text-xs ${rowBg}`}>
      <td class="py-2.5 pr-3 pl-1">
        <input
          class={`border rounded px-2 py-1.5 w-60 font-mono ${idError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          value={cookie.id}
          onInput={e => set('id', (e.target as HTMLInputElement).value)}
          placeholder="analytics_storage"
        />
        {idError && <p class="text-xs text-red-500 mt-0.5">{idError}</p>}
      </td>
      <td class="py-2.5 pr-3">
        <select
          class="border border-gray-300 rounded pl-2 pr-4 py-1.5 text-xs w-40"
          value={cookie.legalBasis}
          onChange={e => set('legalBasis', (e.target as HTMLSelectElement).value as TemplateCookie['legalBasis'])}
        >
          <option value="consent">Consent</option>
          <option value="legitimate_interest">Legitimate Interest</option>
          <option value="mandatory">{t('cookieTemplates.col.mandatoryShort')}</option>
        </select>
      </td>
      <td class="py-2.5 pr-3 text-center">
        <input
          type="checkbox"
          class="w-4 h-4 accent-blue-600"
          checked={cookie.listenGpc}
          disabled={isMandatory}
          onChange={e => set('listenGpc', (e.target as HTMLInputElement).checked)}
          title={isMandatory ? t('cookieTemplates.editor.gpcMandatoryTitle') : ''}
        />
      </td>
      <td class="py-2.5 pr-3">
        <div class="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="3650"
            class={`border rounded px-2 py-1.5 w-16 ${expiryError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            value={cookie.expiry}
            onInput={e => set('expiry', parseInt((e.target as HTMLInputElement).value) || 1)}
          />
          <span class="text-gray-400 text-xs">days</span>
        </div>
        {expiryError && <p class="text-xs text-red-500 mt-0.5">{expiryError}</p>}
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
