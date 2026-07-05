'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface Credential { label: string; value: string; copyable?: boolean }

function InlineCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (non-HTTPS or browser restriction)
    }
  }
  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy'}
      className="ml-2 inline-flex items-center gap-0.5 text-blue-400 hover:text-blue-600 transition-colors bg-transparent border-0 cursor-pointer p-0 align-middle"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

export function DemoCredentials({ items }: { items: Credential[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
      {items.map(({ label, value, copyable = true }) => (
        <div key={label}>
          <span className="text-blue-500 text-xs font-semibold uppercase tracking-wide">{label}</span>
          <p className="font-mono text-blue-900 mt-0.5 flex items-center">
            {value}
            {copyable && <InlineCopy value={value} />}
          </p>
        </div>
      ))}
    </div>
  )
}
