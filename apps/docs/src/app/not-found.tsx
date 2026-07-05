import Link from 'next/link'
import type { Metadata } from 'next'
import { FileX2, ArrowLeft, BookOpen, ShieldOff } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

export const metadata: Metadata = {
  title: '404 — Page Not Found',
  robots: { index: false },
}

const auditLog = [
  { ts: '2026-06-26T00:00:00Z', event: 'PAGE_REQUESTED', status: 'initiated', actor: 'visitor' },
  { ts: '2026-06-26T00:00:00Z', event: 'CONSENT_CHECK', status: 'passed', actor: 'system' },
  { ts: '2026-06-26T00:00:00Z', event: 'ROUTE_LOOKUP', status: 'failed', actor: 'router' },
  { ts: '2026-06-26T00:00:00Z', event: 'ERASURE_APPLIED', status: 'confirmed', actor: 'gdpr-art-17' },
]

const statusColor: Record<string, string> = {
  initiated: 'text-blue-400',
  passed: 'text-green-400',
  failed: 'text-red-400',
  confirmed: 'text-amber-400',
}

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center"
      style={{ background: 'linear-gradient(135deg, #020617 0%, #1a3460 40%, #1565c0 75%, #43a047 100%)' }}
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-white/20">
        <ShieldOff size={13} />
        GDPR Art. 17 — Right to Erasure
      </div>

      {/* Big 404 */}
      <div className="relative mb-6">
        <span
          className="text-[11rem] font-black leading-none select-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <FileX2 size={56} className="text-white/30" strokeWidth={1.2} />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
        This page exercised its right to erasure.
      </h1>
      <p className="text-white/60 text-lg max-w-xl mx-auto mb-2 leading-relaxed">
        The route you requested was not found — or it may have submitted a GDPR Art. 17 erasure
        request and been permanently removed from our records.
      </p>
      <p className="text-white/35 text-sm max-w-sm mx-auto mb-10 italic">
        (Just kidding — this URL simply doesn't exist on our site.)
      </p>

      {/* Fake audit log */}
      <div className="w-full max-w-lg bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden text-left mb-10 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-amber-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-3 text-xs text-white/40 font-mono">consent-audit.log</span>
        </div>
        <div className="px-4 py-4 font-mono text-xs space-y-2">
          {auditLog.map((entry) => (
            <div key={entry.event} className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-white/30">{entry.ts}</span>
              <span className="text-white/70">[{entry.event}]</span>
              <span className={statusColor[entry.status] ?? 'text-white/50'}>
                {entry.status.toUpperCase()}
              </span>
              <span className="text-white/30">actor={entry.actor}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-white/10 bg-white/5 font-mono text-[11px] text-amber-400">
          ✓ Erasure confirmed. No personal data retained. You have our word — and our audit log.
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-6 py-3 rounded-xl no-underline hover:bg-blue-50 transition-colors text-sm shadow-lg"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <Link
          href="/docs/getting-started/"
          className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl no-underline hover:border-white hover:bg-white/10 transition-colors text-sm"
        >
          <BookOpen size={16} />
          Read the Docs
        </Link>
        <a
          href="https://github.com/santoshe61/consenti"
          className="inline-flex items-center gap-2 border-2 border-white/20 text-white/60 font-semibold px-6 py-3 rounded-xl no-underline hover:text-white hover:border-white/40 transition-colors text-sm"
        >
          <FaGithub size={16} />
          GitHub
        </a>
      </div>

      <p className="mt-12 text-white/25 text-xs font-mono">
        HTTP 404 · Consenti Docs · Apache 2.0
      </p>
    </main>
  )
}
