import { ButtonRowEditor } from './ButtonRowEditor'
import type { TemplateButton } from '../utils/templates'

interface ButtonsEditorProps {
  buttons: TemplateButton[]
  onChange: (b: TemplateButton[]) => void
  cookieOptions?: Array<{ id: string; source?: string }> | undefined
}

export function ButtonsEditor({ buttons, onChange, cookieOptions }: ButtonsEditorProps) {
  return (
    <div class="space-y-2">
      {buttons.map((b, idx) => (
        <ButtonRowEditor
          key={idx}
          btn={b}
          onChange={updated => onChange(buttons.map((x, i) => i === idx ? updated : x))}
          onRemove={() => onChange(buttons.filter((_, i) => i !== idx))}
          extraCookies={cookieOptions}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...buttons, { id: '', type: 'primary', action: 'custom', cookies: '*' }])}
        class="text-xs text-blue-600 hover:underline"
      >+ Add Button</button>
    </div>
  )
}
