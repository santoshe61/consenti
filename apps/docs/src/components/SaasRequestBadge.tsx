'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRecaptcha } from '@/hooks/useRecaptcha'

const SMILEYS = [
  { score: 1, label: 'Very dissatisfied', emoji: '😞' },
  { score: 2, label: 'Dissatisfied',      emoji: '😕' },
  { score: 3, label: 'Neutral',           emoji: '😐' },
  { score: 4, label: 'Satisfied',         emoji: '😊' },
  { score: 5, label: 'Very satisfied',    emoji: '😄' },
]

const EMAIL_RE = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/
const MAX_SHORT = 200
const MAX_FEEDBACK = 200

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

export function SaasRequestBadge() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [currentTool, setCurrentTool] = useState('')
  const [triedConsenti, setTriedConsenti] = useState(false)
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { load, getToken } = useRecaptcha()

  const reset = () => {
    setEmail(''); setOrganization(''); setCurrentTool('')
    setTriedConsenti(false); setSatisfactionScore(null)
    setFeedback(''); setSubmitted(false); setError(null)
  }

  const feedbackLabel = satisfactionScore !== null
    ? satisfactionScore >= 4
      ? 'What went well?'
      : 'What should be improved?'
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim()
    if (!EMAIL_RE.test(cleanEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const recaptchaToken = await getToken('saas_request')
      const res = await fetch('/api/saas-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sanitizeText(email, 254),
          organization: sanitizeText(organization, MAX_SHORT),
          currentTool: sanitizeText(currentTool, MAX_SHORT),
          triedConsenti,
          satisfactionScore,
          feedback: triedConsenti && satisfactionScore !== null ? sanitizeText(feedback, MAX_FEEDBACK) : null,
          recaptchaToken,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Something went wrong.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Sticky badge */}
      <button
        onClick={() => { load(); reset(); setOpen(true) }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-brand-600 text-white text-xs font-bold px-2 py-4 rounded-l-lg shadow-lg hover:bg-brand-700 transition-colors cursor-pointer border-0 writing-mode-vertical"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.05em' }}
        aria-label="Request SaaS version"
      >
        Request SaaS
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-gray-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-gray-100">Request a SaaS Version</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 transition-colors bg-transparent border-0 cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 mb-1">Thanks for your interest!</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">We&apos;ll keep your request in mind as we evaluate the SaaS roadmap.</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-4 text-sm text-brand-500 hover:text-brand-600 bg-transparent border-0 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    We look up your general region to prioritize features for your area. Your IP is anonymized (e.g., 192.0.2.55 → 192.0.2.0) to comply with privacy laws worldwide.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      maxLength={254}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Organization</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                      maxLength={MAX_SHORT}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Company or project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Which consent tool are you currently using?</label>
                    <input
                      type="text"
                      value={currentTool}
                      onChange={e => setCurrentTool(e.target.value)}
                      maxLength={MAX_SHORT}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. Cookiebot, OneTrust, Usercentrics…"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Tried Consenti?</span>
                    <button
                      type="button"
                      onClick={() => { setTriedConsenti(v => !v); setSatisfactionScore(null); setFeedback('') }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-0 cursor-pointer ${triedConsenti ? 'bg-brand-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${triedConsenti ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-slate-500 dark:text-gray-400">{triedConsenti ? 'Yes' : 'No'}</span>
                  </div>

                  {triedConsenti && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">How much did you like it?</label>
                        <div className="flex gap-3 justify-center">
                          {SMILEYS.map(({ score, label, emoji }) => (
                            <button
                              key={score}
                              type="button"
                              title={label}
                              onClick={() => { setSatisfactionScore(score); setFeedback('') }}
                              className={`text-2xl transition-transform hover:scale-125 border-0 bg-transparent cursor-pointer rounded-lg p-1 ${satisfactionScore === score ? 'ring-2 ring-brand-500 scale-125' : 'opacity-60 hover:opacity-100'}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {feedbackLabel && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                            {feedbackLabel}
                          </label>
                          <textarea
                            value={feedback}
                            onChange={e => setFeedback(e.target.value.slice(0, MAX_FEEDBACK))}
                            rows={3}
                            maxLength={MAX_FEEDBACK}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            placeholder="Your thoughts…"
                          />
                          <p className="text-xs text-slate-400 dark:text-gray-500 text-right mt-0.5">
                            {feedback.length}/{MAX_FEEDBACK}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
                  >
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">
                    By submitting, you agree to our{' '}
                    <a href="/privacy/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                      Privacy Policy
                    </a>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
