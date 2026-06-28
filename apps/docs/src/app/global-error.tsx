'use client'

import { useEffect, useState } from 'react'

// global-error replaces the root layout entirely — no Navbar, no Footer, no globals.css.
// All styles are inline here to stay self-contained.

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: 'linear-gradient(135deg, #020617 0%, #0f1f3d 40%, #1a3460 80%, #122547 100%)',
    color: '#fff',
    boxSizing: 'border-box' as const,
    textAlign: 'center' as const,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    fontSize: '11px',
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(239,68,68,0.25)',
    marginBottom: '2rem',
    letterSpacing: '0.02em',
  },
  dot: {
    width: '8px',
    height: '8px',
    background: '#f87171',
    borderRadius: '50%',
  },
  iconWrap: {
    width: '96px',
    height: '96px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.75rem',
    fontSize: '3rem',
  },
  h1: {
    fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
    fontWeight: 900,
    color: '#fff',
    marginBottom: '0.75rem',
    lineHeight: 1.15,
  },
  sub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1rem',
    maxWidth: '480px',
    lineHeight: 1.65,
    marginBottom: '2.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: 'rgba(15,25,50,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
    marginBottom: '1.5rem',
    textAlign: 'left' as const,
  },
  cardBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
  },
  trafficDot: (color: string) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: color,
    opacity: 0.7,
  }),
  barLabel: {
    marginLeft: '10px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: '"Fira Code", ui-monospace, monospace',
  },
  row: {
    display: 'flex',
    gap: '1.25rem',
    padding: '4px 18px',
    fontFamily: '"Fira Code", ui-monospace, monospace',
    fontSize: '12px',
    lineHeight: 1.8,
  },
  rowKey: {
    color: 'rgba(255,255,255,0.3)',
    minWidth: '80px',
    flexShrink: 0,
  },
  cardBody: {
    padding: '18px 0 10px',
  },
  cardFooter: {
    padding: '12px 18px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    fontSize: '11px',
    fontFamily: '"Fira Code", ui-monospace, monospace',
    color: '#fbbf24',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '2.5rem',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1565c0',
    color: '#fff',
    fontWeight: 700,
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    border: '2px solid rgba(255,255,255,0.18)',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  footer: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: '11px',
    fontFamily: '"Fira Code", ui-monospace, monospace',
  },
} as const

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [ts] = useState(() => new Date().toISOString())

  useEffect(() => {
    // Full error details logged here only — never exposed to the UI
    console.warn('[Consenti Docs] Global render error (root layout crashed):', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error — Consenti Docs</title>
        <meta name="robots" content="noindex" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div style={s.page}>

          <div style={s.badge}>
            <span style={s.dot} />
            CRITICAL — Root Layout Exception
          </div>

          <div style={s.iconWrap}>💀</div>

          <h1 style={s.h1}>
            Our server broke its own privacy policy.
          </h1>
          <p style={s.sub}>
            This is the nuclear fallback. Whatever happened,
            it happened before server can respond.
          </p>

          {/* Error card */}
          <div style={s.card}>
            <div style={s.cardBar}>
              <span style={s.trafficDot('#ef4444')} />
              <span style={s.trafficDot('#f59e0b')} />
              <span style={s.trafficDot('#22c55e')} />
              <span style={s.barLabel}>global-error-report.json</span>
            </div>

            <div style={s.cardBody}>
              <div style={s.row}>
                <span style={s.rowKey}>severity</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>CRITICAL</span>
              </div>
              <div style={s.row}>
                <span style={s.rowKey}>status</span>
                <span style={{ color: '#f87171' }}>server_crashed</span>
              </div>
              {error.digest && (
                <div style={s.row}>
                  <span style={s.rowKey}>digest</span>
                  <span style={{ color: '#60a5fa' }}>{error.digest}</span>
                </div>
              )}
              <div style={s.row}>
                <span style={s.rowKey}>timestamp</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{ts}</span>
              </div>
              <div style={s.row}>
                <span style={s.rowKey}>scope</span>
                <span style={{ color: '#fb923c' }}>we_are_figuring_out</span>
              </div>
              <div style={s.row}>
                <span style={s.rowKey}>consent</span>
                <span style={{ color: '#f87171' }}>definitely_not_obtained</span>
              </div>
            </div>

            <div style={s.cardFooter}>
              ⚠ This error crashed the page. No cookies were harmed in the making of this.
            </div>
          </div>

          {/* Actions */}
          <div style={s.actions}>
            <button onClick={reset} style={s.btnPrimary}>
              ↺ Force Retry
            </button>
            <a href="/" style={s.btnSecondary}>
              ← Back to Safety
            </a>
            <a
              href="https://github.com/santoshe61/consenti/issues"
              style={{ ...s.btnSecondary, fontSize: '13px' }}
            >
              Report on GitHub
            </a>
          </div>

          <p style={s.footer}>
            Consenti Docs · Apache 2.0
          </p>
        </div>
      </body>
    </html>
  )
}
