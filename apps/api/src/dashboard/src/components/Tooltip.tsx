import { useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

interface TooltipProps {
  content: ComponentChildren
  children: ComponentChildren
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      class="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 min-w-max max-w-xs bg-gray-900 text-white text-xs rounded px-2.5 py-1.5 shadow-lg pointer-events-none"
        >
          {content}
          <span class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}
