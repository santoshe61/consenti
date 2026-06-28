import { X } from 'lucide-react'
import { HeadingTagInput } from './HeadingTagInput'
import { OverlayOpacityInput } from './OverlayOpacityInput'
import { ButtonsEditor } from './ButtonsEditor'
import type { TemplateBannerUI, BannerPosition } from '../utils/templates'

const BANNER_POSITIONS: BannerPosition[] = ['top', 'bottom', 'middle', 'left-bottom', 'right-bottom']

interface BannerUIEditorProps {
  label?: string
  value: TemplateBannerUI
  onChange: (v: TemplateBannerUI) => void
  cookieOptions?: Array<{ id: string; source?: string }>
}

export function BannerUIEditor({ label, value, onChange, cookieOptions }: BannerUIEditorProps) {
  const set = <K extends keyof TemplateBannerUI>(k: K, v: TemplateBannerUI[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div class="space-y-5">
      {label && <p class="text-xs text-gray-500 italic">{label}</p>}

      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Position <span class="text-red-500">*</span></label>
          <select
            class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            value={value.position}
            onChange={e => set('position', (e.target as HTMLSelectElement).value as BannerPosition)}
          >
            {BANNER_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <HeadingTagInput value={value.headingTag} onChange={v => set('headingTag', v)} />

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Overlay opacity</label>
          <OverlayOpacityInput value={value.overlayOpacity} onChange={v => set('overlayOpacity', v)} />
          <p class="text-xs text-gray-400 mt-0.5">0% = transparent (page still interactive) · 100% = darkened</p>
        </div>

        <div class="flex items-end pb-1">
          <label class="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              class="w-4 h-4"
              checked={value.showClose}
              onChange={e => set('showClose', (e.target as HTMLInputElement).checked)}
            />
            Show <X size={10} className="inline-block mx-0.5" /> close button
          </label>
        </div>

        <div class="flex items-end pb-1">
          <label class="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              class="w-4 h-4"
              checked={value.showLocaleSwitcher ?? false}
              onChange={e => set('showLocaleSwitcher', (e.target as HTMLInputElement).checked)}
            />
            🌐 Show locale switcher
          </label>
        </div>
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
