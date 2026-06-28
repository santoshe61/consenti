'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Check, Copy, ExternalLink, MessageSquare, X } from 'lucide-react'

function buildPrompt(url: string, question: string): string {
  const questionPart = question.trim()
    ? `Answer this specific question: ${question.trim()}`
    : 'Summarize the key information on this page and explain how to use it.'

  return `You are a helpful assistant for Consenti, an open-source GDPR-compliant Cookie Consent & Consent Management Platform (CMP).

Please read the Consenti documentation page at: ${url}

${questionPart}

About Consenti:
- Two npm packages: @consenti/ui (browser widget) and @consenti/api (Node.js backend)
- Zero external runtime dependencies — uses only browser/Node built-ins
- Supports GDPR (opt-in), CCPA/CPRA (opt-out), TCF v2.2, GPC, COPPA
- Works with React, Vue, Angular, Next.js, Nuxt, Express, Fastify, and Vanilla JS
- Admin dashboard included in the API package
- Apache 2.0 license, TypeScript strict mode

Please provide a clear, accurate answer based on the documentation.`
}

export function AskAIButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [copied, setCopied] = useState(false)

  function getPageUrl(): string {
    if (typeof window === 'undefined') return `https://consenti.dev${pathname}`
    return window.location.href
  }

  function openChatGPT() {
    const prompt = buildPrompt(getPageUrl(), question)
    const chatUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
    window.open(chatUrl, '_blank', 'noopener,noreferrer')
    setOpen(false)
    setQuestion('')
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(buildPrompt(getPageUrl(), question))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  function handleClose() {
    setOpen(false)
    setQuestion('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        title="Ask ChatGPT about this documentation page"
        aria-label="Ask ChatGPT about this page"
      >
        <MessageSquare size={15} />
        Ask AI
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={handleClose}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-ai-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#10a37f' }}>
                  <MessageSquare size={15} className="text-white" />
                </div>
                <div>
                  <p id="ask-ai-title" className="font-bold text-slate-900 text-sm leading-none">Ask ChatGPT</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">About this documentation page</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Question input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Your question <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && openChatGPT()}
                  placeholder="e.g. How do I configure GDPR opt-in mode?"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#10a37f' } as React.CSSProperties}
                  autoFocus
                />
              </div>

              {/* Prompt preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prompt preview</label>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-500 font-mono leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {buildPrompt(
                    typeof window !== 'undefined' ? window.location.href : `https://consenti.dev${pathname}`,
                    question
                  )}
                </div>
              </div>

              {/* Page URL info */}
              <p className="text-[11px] text-slate-400 flex items-start gap-1">
                <span className="shrink-0 mt-0.5">📄</span>
                ChatGPT will be asked to read:{' '}
                <span className="font-mono break-all">
                  {typeof window !== 'undefined' ? window.location.href : `https://consenti.dev${pathname}`}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 text-sm px-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                {copied
                  ? <><Check size={14} className="text-green-500" /> Copied!</>
                  : <><Copy size={14} /> Copy</>
                }
              </button>
              <button
                onClick={openChatGPT}
                className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 text-white rounded-lg font-semibold transition-colors hover:opacity-90"
                style={{ background: '#10a37f' }}
              >
                <ExternalLink size={14} />
                Open in ChatGPT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
