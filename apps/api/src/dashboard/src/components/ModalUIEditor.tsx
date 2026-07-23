import type { ComponentChild } from 'preact'
import { X } from 'lucide-react'
import { HeadingTagInput } from './HeadingTagInput'
import { OverlayOpacityInput } from './OverlayOpacityInput'
import { ButtonsEditor } from './ButtonsEditor'
import { useT } from '../context/locale'
import type { TemplateModalUI, ModalPosition } from '../utils/templates'

const MODAL_POSITIONS: ModalPosition[] = ['left', 'right', 'center']

interface ModalUIEditorProps {
  value: TemplateModalUI
  onChange: (v: TemplateModalUI) => void
  cookieOptions?: Array<{ id: string; source?: string }> | undefined
}

export function ModalUIEditor({ value, onChange, cookieOptions }: ModalUIEditorProps) {
  const t = useT()
  const set = <K extends keyof TemplateModalUI>(k: K, v: TemplateModalUI[K]) =>
    onChange({ ...value, [k]: v })

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
            ['trapFocus', t('uiTemplates.editor.trapFocus')],
          ] as [keyof TemplateModalUI, ComponentChild][]
        ).map(([k, lbl]) => (
          <label key={k as string} class="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer" title={k === 'trapFocus' ? t('uiTemplates.editor.trapFocusHint') : undefined}>
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
    </div>
  )
}
