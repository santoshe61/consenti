'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { FRONTEND_TUTORIAL_STEPS, BACKEND_TUTORIAL_STEPS, type TutorialStepMeta } from '@/lib/tutorial-steps'

export function TutorialStepper({
  path,
  steps,
  currentStep,
  children,
}: {
  path: 'frontend' | 'backend'
  steps: TutorialStepMeta[]
  currentStep: number
  children: React.ReactNode
}) {
  const total = steps.length
  const step = steps[currentStep - 1]
  const prevStep = steps[currentStep - 2]
  const nextStep = steps[currentStep]
  const otherPath = path === 'frontend' ? 'backend' : 'frontend'
  const otherPathFirstStep = path === 'frontend' ? BACKEND_TUTORIAL_STEPS[0] : FRONTEND_TUTORIAL_STEPS[0]
  const prevHref = prevStep ? `/guides/tutorials/${path}/${prevStep.slug}/` : '/guides/tutorials/'
  const nextHref = nextStep ? `/guides/tutorials/${path}/${nextStep.slug}/` : null

  if (!step) return null

  return (
    <div className="prose max-w-none">
      <div className="not-prose flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Tutorial — {path === 'frontend' ? 'Frontend Only' : 'Frontend + Backend'} — Step {currentStep}{' '}
          of {total}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/guides/tutorials/"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 no-underline"
          >
            <RotateCcw size={12} /> Restart
          </Link>
          <Link
            href={otherPathFirstStep ? `/guides/tutorials/${otherPath}/${otherPathFirstStep.slug}/` : '/guides/tutorials/'}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-gray-200 no-underline"
          >
            Switch to {otherPath === 'frontend' ? 'Frontend Only' : 'Frontend + Backend'} →
          </Link>
        </div>
      </div>

      <h1 className="mb-1">{step.title}</h1>
      <p className="lead mt-0">{step.description}</p>

      {/* Step pills */}
      <div className="not-prose flex flex-wrap gap-1.5 mb-8">
        {steps.map((s, i) => {
          const n = i + 1
          const isCurrent = n === currentStep
          return (
            <Link
              key={s.slug}
              href={`/guides/tutorials/${path}/${s.slug}/`}
              title={s.title}
              className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold no-underline transition-colors ${
                isCurrent
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'
              }`}
            >
              {n}
            </Link>
          )
        })}
      </div>

      {children}

      <div className="not-prose mt-12 pt-6 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between gap-3">
        <Link
          href={prevHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 no-underline"
        >
          <ArrowLeft size={15} /> {prevStep ? 'Previous' : 'Choose a path'}
        </Link>
        {nextHref && nextStep ? (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg no-underline transition-colors"
          >
            Next: {nextStep.title} <ArrowRight size={15} />
          </Link>
        ) : (
          <Link
            href="/guides/examples/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg no-underline transition-colors"
          >
            Finish → See real-life Examples
          </Link>
        )}
      </div>
    </div>
  )
}
