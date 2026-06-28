import { CookieMultiSelect } from './CookieMultiSelect'
import type { TemplateButton, ButtonVisualType, ButtonAction } from '../utils/templates'

const VISUAL_TYPES: ButtonVisualType[] = ['primary', 'secondary', 'accent', 'text']
const ACTION_TYPES: ButtonAction[] = ['custom', 'submit', 'manage', 'close', 'link']

const VISUAL_LABELS: Record<ButtonVisualType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  text: 'Text',
}

const ACTION_LABELS: Record<ButtonAction, string> = {
  custom: 'Custom (grant/deny)',
  submit: 'Submit (save toggles)',
  manage: 'Manage (open modal)',
  close: 'Close (dismiss)',
  link: 'Link (open URL)',
}

interface ButtonRowEditorProps {
  btn: TemplateButton
  onChange: (b: TemplateButton) => void
  onRemove: () => void
  extraCookies?: Array<{ id: string; source?: string }> | undefined
}

export function ButtonRowEditor({ btn, onChange, onRemove, extraCookies }: ButtonRowEditorProps) {
  const set = <K extends keyof TemplateButton>(k: K, v: TemplateButton[K]) =>
    onChange({ ...btn, [k]: v })
  const textEmpty = !btn.text.trim()
  const urlEmpty = btn.action === 'link' && !btn.url?.trim()

  return (
    <div class="border border-gray-100 rounded p-2.5 bg-gray-50 space-y-2">
      <div class="grid grid-cols-[1fr_1fr_1fr_2fr_auto] gap-2 items-start">
        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Label <span class="text-red-500">*</span></label>
          <input
            class={`w-full border rounded px-2 py-1 text-xs ${textEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            value={btn.text}
            onInput={e => set('text', (e.target as HTMLInputElement).value)}
            placeholder="Button text"
          />
          {textEmpty && <p class="text-xs text-red-500 mt-0.5">Required</p>}
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Style</label>
          <select
            class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            value={btn.type}
            onChange={e => set('type', (e.target as HTMLSelectElement).value as ButtonVisualType)}
          >
            {VISUAL_TYPES.map(t => <option key={t} value={t}>{VISUAL_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-0.5">Action</label>
          <select
            class="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            value={btn.action}
            onChange={e => {
              const action = (e.target as HTMLSelectElement).value as ButtonAction
              const update: TemplateButton = {
                ...btn,
                action,
                cookies: action === 'custom' ? (btn.cookies ?? '*') : undefined,
                url: action === 'link' ? (btn.url ?? '') : undefined,
                // Default to 'text' style for links
                type: action === 'link' && btn.type !== 'text' ? 'text' : btn.type,
              }
              onChange(update)
            }}
          >
            {ACTION_TYPES.map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
          </select>
        </div>
        {btn.action === 'custom' ? (
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Cookies to grant/deny <span class="text-red-500">*</span></label>
            <CookieMultiSelect
              value={btn.cookies}
              onChange={cookies => set('cookies', cookies)}
              showSpecial
              extraCookies={extraCookies}
            />
            {!btn.cookies && <p class="text-xs text-red-500 mt-0.5">Required for custom action</p>}
          </div>
        ) : btn.action === 'link' ? (
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">URL <span class="text-red-500">*</span></label>
            <input
              type="url"
              class={`w-full border rounded px-2 py-1 text-xs ${urlEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              value={btn.url ?? ''}
              onInput={e => set('url', (e.target as HTMLInputElement).value)}
              placeholder="https://example.com/privacy"
            />
            {urlEmpty && <p class="text-xs text-red-500 mt-0.5">Required for link action</p>}
          </div>
        ) : <div />}
        <div class="flex items-end pb-0.5">
          <button
            type="button"
            onClick={onRemove}
            class="text-red-400 hover:text-red-600 text-lg leading-none p-0.5"
            title="Remove button"
          >✕</button>
        </div>
      </div>
    </div>
  )
}
