import { useState } from 'preact/hooks'
import { apiFetch } from '../api/client'
import { AutoComplete, type AutoCompleteItem } from './AutoComplete'
import { useT } from '../context/locale'

export interface PickedVendor {
  id: number
  name: string
  purposes: number[]
}

interface VendorSearchResult {
  vendors: PickedVendor[]
}

interface Props {
  vendorId?: number | undefined
  vendorName?: string | undefined
  onSelect: (vendor: PickedVendor | null) => void
  disabled?: boolean | undefined
}

async function searchVendors(q: string): Promise<AutoCompleteItem<PickedVendor>[]> {
  if (!q.trim()) return []
  const d = await apiFetch<VendorSearchResult>(`/tcf/vendors?q=${encodeURIComponent(q)}&limit=20`)
  return d.vendors.map(v => ({ key: v.id, label: v.name, value: v.name, meta: `#${v.id}`, data: v }))
}

export function VendorPicker({ vendorId, vendorName, onSelect, disabled }: Props) {
  const t = useT()
  const [query, setQuery] = useState('')

  const clear = () => {
    onSelect(null)
    setQuery('')
  }

  if (vendorId && !query) {
    return (
      <div class="flex items-center gap-1 text-xs">
        <span class="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
          {vendorId}
        </span>
        <span class="text-gray-600 truncate max-w-[100px]" title={vendorName}>{vendorName ?? `Vendor ${vendorId}`}</span>
        {!disabled && (
          <button type="button" onClick={clear} class="text-gray-400 hover:text-red-500 ml-1 leading-none" title="Clear vendor">✕</button>
        )}
      </div>
    )
  }

  return (
    <AutoComplete<PickedVendor>
      value={query}
      onChange={setQuery}
      onSelect={item => {
        if (item.data) onSelect(item.data)
        setQuery('')
      }}
      source={{ type: 'server', search: searchVendors, minChars: 1 }}
      placeholder={t('vendors.searchPlaceholder')}
      disabled={disabled}
      loadingText={t('common.searching')}
      emptyText={t('vendors.noResults')}
    />
  )
}
