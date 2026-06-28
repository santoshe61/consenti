import { useState, useEffect, useRef } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string | undefined
  confirmLabel?: string | undefined
  cancelLabel?: string | undefined
  danger?: boolean | undefined
  onConfirm: () => void
  onCancel: () => void
}

const TITLE_ID = 'confirm-dialog-title'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCancel(); return }
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
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        class="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
      >
        <div class="flex items-start gap-4">
          {danger && (
            <div class="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center" aria-hidden="true">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          )}
          <div class="flex-1 min-w-0">
            <h3 id={TITLE_ID} class="text-sm font-semibold text-gray-900">{title}</h3>
            {message && <p class="text-sm text-gray-500 mt-1">{message}</p>}
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function useConfirmDialog() {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)

  const requestConfirm = (opts: ConfirmOptions): Promise<boolean> =>
    new Promise(resolve => setState({ opts, resolve }))

  const handleConfirm = () => { state?.resolve(true); setState(null) }
  const handleCancel = () => { state?.resolve(false); setState(null) }

  const dialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.opts.title ?? ''}
      message={state?.opts.message}
      confirmLabel={state?.opts.confirmLabel}
      cancelLabel={state?.opts.cancelLabel}
      danger={state?.opts.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return { requestConfirm, dialog }
}
