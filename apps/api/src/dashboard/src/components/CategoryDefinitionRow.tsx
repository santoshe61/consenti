import { CookieMultiSelect } from './CookieMultiSelect'
import { HeadingTagInput } from './HeadingTagInput'
import type { TemplateCategoryDef } from '../utils/templates'

interface CategoryDefinitionRowProps {
  cat: TemplateCategoryDef
  onChange: (patch: Partial<TemplateCategoryDef>) => void
  onRemove: () => void
  cookieOptions?: Array<{ id: string; source?: string }> | undefined
}

export function CategoryDefinitionRow({ cat, onChange, onRemove, cookieOptions }: CategoryDefinitionRowProps) {
  const idEmpty = !cat.id.trim()

  return (
    <div class={`border rounded-lg p-3 bg-gray-50 ${idEmpty ? 'border-red-200' : 'border-gray-200'}`}>
      <div class="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Category ID <span class="text-red-500">*</span></label>
          <input
            class={`w-full border rounded px-2 py-1 font-mono text-xs ${idEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            value={cat.id}
            onInput={e => onChange({ id: (e.target as HTMLInputElement).value })}
            placeholder="analytics"
          />
          {idEmpty && <p class="text-xs text-red-500 mt-0.5">Required</p>}
        </div>

        <HeadingTagInput
          value={cat.headingTag}
          onChange={v => onChange({ headingTag: v })}
          label="Heading Tag"
        />

        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Legal Basis</label>
          <select
            class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            value={cat.legalBasis}
            onChange={e => onChange({ legalBasis: (e.target as HTMLSelectElement).value as TemplateCategoryDef['legalBasis'] })}
          >
            <option value="consent">Consent</option>
            <option value="legitimate_interest">Legitimate Interest</option>
            <option value="mandatory">Mandatory / Strictly Necessary</option>
          </select>
          {cat.legalBasis === 'legitimate_interest' && (
            <p class="text-xs text-gray-400 mt-0.5">Balancing-test description is authored per-locale on the profile, in Preference Modal content.</p>
          )}
        </div>

        <div class="flex items-start">
          <button
            type="button"
            onClick={onRemove}
            class="text-red-400 hover:text-red-600 text-lg leading-none p-1"
            title="Remove category"
          >✕</button>
        </div>

        <div class="col-span-2 lg:col-span-4">
          <label class="block text-xs text-gray-500 mb-0.5">Cookies in this category <span class="text-red-500">*</span></label>
          <CookieMultiSelect
            value={cat.cookies.length ? cat.cookies : undefined}
            onChange={v => onChange({ cookies: Array.isArray(v) ? v : [] })}
            showSpecial={false}
            extraCookies={cookieOptions}
          />
          {!cat.cookies.length && <p class="text-xs text-red-500 mt-0.5">Select at least one cookie</p>}
        </div>
      </div>
    </div>
  )
}
