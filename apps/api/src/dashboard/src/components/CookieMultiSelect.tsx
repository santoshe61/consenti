import { useState, useEffect, useRef } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { Check, ChevronUp, ChevronDown } from 'lucide-react'
import { cookieTemplatesApi } from '../api/templates'
import type { ServerCookieTemplate } from '@consenti/types'

interface CookieMultiSelectProps {
  /** Current value: '*' | '!' | string[] | undefined */
  value: string[] | '*' | '!' | undefined
  onChange: (v: string[] | '*' | '!' | undefined) => void
  /** Show the * (accept-all) and ! (deny-all) special options */
  showSpecial?: boolean | undefined
  /** Extra cookies beyond what's in the stored templates (e.g. from the current wizard step) */
  extraCookies?: Array<{ id: string; source?: string }> | undefined
  disabled?: boolean | undefined
  placeholder?: string | undefined
}

interface DropPos {
  left: number
  top?: number
  bottom?: number
}

function displayValue(value: string[] | '*' | '!' | undefined): string {
  if (value === '*') return '* — Accept all cookies'
  if (value === '!') return '! — Deny non mandatory cookies'
  if (Array.isArray(value) && value.length > 0) return value.join(', ')
  return ''
}

export function CookieMultiSelect({
  value,
  onChange,
  showSpecial = true,
  extraCookies,
  disabled = false,
  placeholder = 'Select cookies…',
}: CookieMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState<DropPos | null>(null)
  const [cookieTemplates, setCookieTemplates] = useState<ServerCookieTemplate[]>([])
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cookieTemplatesApi.list().then(setCookieTemplates).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const inTrigger = triggerRef.current?.contains(e.target as Node)
      const inDrop = dropRef.current?.contains(e.target as Node)
      if (!inTrigger && !inDrop) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close when the page scrolls but not when the user scrolls inside the dropdown itself
  useEffect(() => {
    if (!open) return
    const handler = (e: Event) => {
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('scroll', handler, { capture: true, passive: true })
    return () => window.removeEventListener('scroll', handler, true)
  }, [open])

  const handleToggle = () => {
    if (disabled) return
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const DROPDOWN_HEIGHT = 280
      if (window.innerHeight - rect.bottom >= DROPDOWN_HEIGHT) {
        setDropPos({ top: rect.bottom + 4, left: rect.left })
      } else {
        setDropPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left })
      }
    }
    setOpen(o => !o)
  }

  const fromTemplates = cookieTemplates.flatMap(t =>
    t.cookies.map(c => ({ id: c.id, source: t.name }))
  )
  const allOptions = [
    ...(extraCookies ?? []),
    ...fromTemplates,
  ].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)

  const isSelected = (id: string): boolean => {
    if (id === '*') return value === '*'
    if (id === '!') return value === '!'
    return Array.isArray(value) && value.includes(id)
  }

  const toggle = (id: string) => {
    if (id === '*') { onChange(value === '*' ? undefined : '*'); return }
    if (id === '!') { onChange(value === '!' ? undefined : '!'); return }
    const current = Array.isArray(value) ? [...value] : []
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    onChange(next.length ? next : undefined)
  }

  const label = displayValue(value)

  const dropStyle: Record<string, string | number> = {
    position: 'fixed',
    zIndex: 9999,
    left: `${dropPos?.left ?? 0}px`,
    width: '288px',
    ...(dropPos?.top !== undefined
      ? { top: `${dropPos.top}px` }
      : { bottom: `${dropPos?.bottom ?? 0}px` }),
  }

  return (
    <div class="relative" ref={triggerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        class={`w-full text-left border rounded px-2 py-1.5 text-xs flex items-center justify-between gap-1 ${disabled
          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
          : 'bg-white border-gray-300 hover:border-blue-400 cursor-pointer transition-colors'
          }`}
      >
        <span class={label ? 'font-mono text-gray-800' : 'text-gray-400'}>
          {label || placeholder}
        </span>
        <span class="text-gray-400 shrink-0 ml-1">{open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
      </button>

      {open && dropPos && createPortal(
        <div ref={dropRef} style={dropStyle} class="bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {showSpecial && (
            <div class="border-b border-gray-100">
              <p class="text-xs font-semibold text-gray-400 px-3 pt-2 pb-1 uppercase tracking-wide">Special</p>
              {[
                { id: '*', label: 'Accept all cookies', sub: 'Grants every cookie in this profile' },
                { id: '!', label: 'Reject non mandatory cookies', sub: 'Denies non mandatory cookies in this profile' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  class={`w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 ${isSelected(opt.id) ? 'bg-blue-50' : ''}`}
                  onClick={() => toggle(opt.id)}
                >
                  <span class={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${isSelected(opt.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                    }`}>{isSelected(opt.id) ? <Check size={10} /> : null}</span>
                  <div class="min-w-0">
                    <span class="font-mono text-xs font-semibold text-gray-700">{opt.id}</span>
                    <span class="text-xs text-gray-400 ml-1.5">{opt.label}</span>
                    <p class="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div>
            <p class="text-xs font-semibold text-gray-400 px-3 pt-2 pb-1 uppercase tracking-wide">Cookie IDs</p>
            {allOptions.length === 0 ? (
              <p class="text-xs text-gray-400 px-3 pb-3">
                No cookies defined yet.{' '}
                <a href="#/banners/cookie-templates/new" class="text-blue-600 hover:underline" target="_blank">Create a template ↗</a>
              </p>
            ) : allOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                class={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 ${isSelected(opt.id) ? 'bg-blue-50' : ''}`}
                onClick={() => toggle(opt.id)}
              >
                <span class={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${isSelected(opt.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}>{isSelected(opt.id) ? <Check size={10} /> : null}</span>
                <div class="min-w-0 flex items-baseline gap-1.5">
                  <span class="font-mono text-xs text-gray-800">{opt.id}</span>
                  {opt.source && <span class="text-xs text-gray-400 truncate">· {opt.source}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
