'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy code'}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
    >
      {copied ? (
        <>
          <Check size={13} />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy size={13} />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}
