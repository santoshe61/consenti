import type { ComponentChild } from 'preact'
import { X } from 'lucide-react'
import { HeadingTagInput } from './HeadingTagInput'
import { OverlayOpacityInput } from './OverlayOpacityInput'
import { ButtonsEditor } from './ButtonsEditor'
import { CategoryDefinitionRow } from './CategoryDefinitionRow'
import type { TemplateModalUI, TemplateCategoryDef, ModalPosition } from '../utils/templates'

const MODAL_POSITIONS: ModalPosition[] = ['left', 'right', 'center']

interface ModalUIEditorProps {
  value: TemplateModalUI
  onChange: (v: TemplateModalUI) => void
  cookieOptions?: Array<{ id: string; source?: string }> | undefined
  onCategoriesChange?: ((cats: TemplateCategoryDef[]) => void) | undefined
}

export function ModalUIEditor({ value, onChange, cookieOptions, onCategoriesChange }: ModalUIEditorProps) {
  const set = <K extends keyof TemplateModalUI>(k: K, v: TemplateModalUI[K]) =>
    onChange({ ...value, [k]: v })

  const updateCat = (idx: number, patch: Partial<TemplateCategoryDef>) => {
    const cats = value.categories.map((c, i) => i === idx ? { ...c, ...patch } : c)
    onChange({ ...value, categories: cats })
  }

  const addCategory = () => {
    const cats = [...value.categories, { id: '', headingTag: 'h3', mandatory: false, type: 'consent' as const, liEnabled: false, cookies: [] }]
    onChange({ ...value, categories: cats })
    onCategoriesChange?.(cats)
  }

  const removeCategory = (idx: number) => {
    const cats = value.categories.filter((_, i) => i !== idx)
    onChange({ ...value, categories: cats })
    onCategoriesChange?.(cats)
  }

  return (
    <div class="space-y-5">
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Position <span class="text-red-500">*</span></label>
          <select
            class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            value={value.position}
            onChange={e => set('position', (e.target as HTMLSelectElement).value as ModalPosition)}
          >
            {MODAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <HeadingTagInput value={value.headingTag} onChange={v => set('headingTag', v)} />

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Overlay opacity</label>
          <OverlayOpacityInput value={value.overlayOpacity} onChange={v => set('overlayOpacity', v)} />
          <p class="text-xs text-gray-400 mt-0.5">0% = transparent (page still interactive) · 100% = darkened</p>
        </div>

        {(
          [
            ['showClose', <span class="flex items-center gap-1">Show <X size={10} /> close button</span>],
            ['showLocaleSwitcher', '🌐 Show locale switcher'],
            ['persistent', 'Persistent (block outside-click dismiss)'],
            ['hasSubheading', 'Include subheading field'],
          ] as [keyof TemplateModalUI, ComponentChild][]
        ).map(([k, lbl]) => (
          <label key={k as string} class="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              class="w-4 h-4"
              checked={value[k] as boolean}
              onChange={e => set(k, (e.target as HTMLInputElement).checked)}
            />
            {lbl}
          </label>
        ))}
      </div>

      <div>
        <h4 class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Buttons</h4>
        <ButtonsEditor
          buttons={value.buttons}
          onChange={buttons => set('buttons', buttons)}
          cookieOptions={cookieOptions}
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Consent Categories</h4>
        </div>
        <p class="text-xs text-gray-400 mb-3">
          Each category groups cookies shown as a toggle in the preference modal. Category ID must be unique.
        </p>
        <div class="space-y-3">
          {value.categories.map((cat, idx) => (
            <CategoryDefinitionRow
              key={idx}
              cat={cat}
              onChange={patch => updateCat(idx, patch)}
              onRemove={() => removeCategory(idx)}
              cookieOptions={cookieOptions}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addCategory}
          class="text-xs text-blue-600 hover:underline mt-3 block"
        >+ Add Category</button>
      </div>
    </div>
  )
}
