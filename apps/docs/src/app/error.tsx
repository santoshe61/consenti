'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft, Terminal } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [ts] = useState(() => new Date().toISOString())

  useEffect(() => {
    // Full error is logged here only — never exposed to the UI
    console.warn('[Consenti Docs] Uncaught render error:', error)
  }, [error])

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #1a1a2e 50%, #16213e 100%)' }}
    >
      <div className="w-full max-w-2xl">

        {/* Header badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-500/25">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            Unconsented Error Detected
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-400" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Something went wrong.</h1>
          <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
            An error occurred and it did not ask for your consent first.
            Under GDPR Art. 5(1)(f), this has been noted in our audit log.{' '}
            <span className="italic text-white/30">(We&apos;re joking — but the error is real.)</span>
          </p>
        </div>

        {/* Error card — no internal details exposed */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm mb-6">

          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/50" />
            <span className="w-3 h-3 rounded-full bg-green-500/30" />
            <Terminal size={13} className="ml-3 text-white/30" />
            <span className="text-xs text-white/30 font-mono">error-report.json</span>
          </div>

          <div className="p-5 font-mono text-sm space-y-3">
            <div className="flex gap-3">
              <span className="text-white/30 select-none shrink-0">status</span>
              <span className="text-red-400 font-semibold">render_failed</span>
            </div>
            {error.digest && (
              <div className="flex gap-3">
                <span className="text-white/30 select-none shrink-0">digest</span>
                <span className="text-blue-400">{error.digest}</span>
              </div>
            )}
            <div className="flex gap-3">
              <span className="text-white/30 select-none shrink-0">timestamp</span>
              <span className="text-white/40">{ts}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-white/30 select-none shrink-0">consent</span>
              <span className="text-red-400">not_obtained</span>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-white/10 bg-white/5 font-mono text-[11px] text-white/25">
            Details are in the browser console. We don&apos;t expose stack traces here.
          </div>
        </div>

        {/* Consent-style actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-center">
          <p className="text-white/50 text-sm mb-4">
            Do you consent to retrying this operation? You may withdraw at any time by navigating away.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm cursor-pointer"
            >
              <RefreshCw size={15} />
              Accept &amp; Retry
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-white/20 text-white/60 hover:text-white hover:border-white/40 font-semibold px-6 py-3 rounded-xl no-underline transition-colors text-sm"
            >
              <ArrowLeft size={15} />
              Reject &amp; Go Home
            </Link>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs font-mono">
          Consenti Docs · Apache 2.0
        </p>
      </div>
    </main>
  )
}
