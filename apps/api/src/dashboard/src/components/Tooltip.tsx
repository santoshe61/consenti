import { useRef, useState } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import type { ComponentChildren } from 'preact'

interface TooltipProps {
  content: ComponentChildren
  children: ComponentChildren
}

interface TooltipPos {
  left: number
  placement: 'top' | 'bottom'
  maxHeight: number
  top?: number
  bottom?: number
}

export function Tooltip({ content, children }: TooltipProps) {
  const [pos, setPos] = useState<TooltipPos | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const show = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const GAP = 6
    const EDGE_PADDING = 8
    const spaceAbove = rect.top - GAP - EDGE_PADDING
    const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE_PADDING
    // Open toward whichever side has more room; if the content is taller than
    // that room, cap it and let it scroll internally instead of overflowing.
    if (spaceAbove >= spaceBelow) {
      setPos({ bottom: window.innerHeight - rect.top + GAP, left: rect.left + rect.width / 2, placement: 'top', maxHeight: Math.max(spaceAbove, 40) })
    } else {
      setPos({ top: rect.bottom + GAP, left: rect.left + rect.width / 2, placement: 'bottom', maxHeight: Math.max(spaceBelow, 40) })
    }
  }
  const hide = () => setPos(null)

  return (
    <span
      ref={triggerRef}
      class="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos && createPortal(
        <span
          role="tooltip"
          class="fixed -translate-x-1/2 z-50 min-w-max max-w-xs overflow-y-auto bg-gray-900 text-white text-xs rounded px-2.5 py-1.5 shadow-lg pointer-events-none"
          style={{ left: pos.left, maxHeight: pos.maxHeight, ...(pos.placement === 'top' ? { bottom: pos.bottom } : { top: pos.top }) }}
        >
          {pos.placement === 'top'
            ? <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            : <span class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />}
          {content}
        </span>,
        document.body
      )}
    </span>
  )
}
