import { useEffect, useRef } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { X } from 'lucide-react'
import { useT } from '../context/locale'

export interface RecordDetailField {
  label: string
  value: import('preact').ComponentChildren
}

interface Props {
  open: boolean
  title: string
  fields: RecordDetailField[]
  onClose: () => void
}

const TITLE_ID = 'record-detail-title'

export function RecordDetailModal({ open, title, fields, onClose }: Props) {
  const t = useT()
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.hasAttribute('disabled'))
      if (!focusable.length) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h3 id={TITLE_ID} class="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <dl class="px-6 py-4 space-y-3 overflow-y-auto">
          {fields.map(f => (
            <div key={f.label}>
              <dt class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{f.label}</dt>
              <dd class="text-sm text-gray-800 dark:text-gray-200 mt-0.5 break-words">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>,
    document.body
  )
}

export function JsonValue({ value }: { value: unknown }) {
  if (value == null) return <span class="text-gray-400">—</span>
  return (
    <pre class="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
