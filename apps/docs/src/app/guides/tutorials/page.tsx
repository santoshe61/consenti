import type { Metadata } from 'next'
import Link from 'next/link'
import { FRONTEND_TUTORIAL_STEPS, BACKEND_TUTORIAL_STEPS } from '@/lib/tutorial-steps'

export const metadata: Metadata = {
  title: 'Tutorials — Consenti',
  description:
    'Step-by-step, paginated tutorials that build a working Consenti integration from scratch — frontend-only or frontend + backend.',
  alternates: { canonical: '/guides/tutorials' },
  openGraph: {
    title: 'Tutorials — Consenti',
    description:
      'Step-by-step, paginated tutorials that build a working Consenti integration from scratch — frontend-only or frontend + backend.',
    url: 'https://consenti.dev/guides/tutorials',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tutorials — Consenti',
    description:
      'Step-by-step, paginated tutorials that build a working Consenti integration from scratch — frontend-only or frontend + backend.',
    images: ['/og-image.jpg'],
  },
}

export default function TutorialsChooserPage() {
  return (
    <div className="prose max-w-none">
      <h1>Tutorials</h1>
      <p className="lead">
        A paginated, step-by-step walkthrough that builds one working Consenti integration from
        scratch — one step, one page at a time. Pick the path that matches your project.
      </p>

      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
        <Link
          href={`/guides/tutorials/frontend/${FRONTEND_TUTORIAL_STEPS[0]!.slug}/`}
          className="group block no-underline rounded-2xl border-2 border-slate-200 dark:border-gray-700 p-6 hover:border-brand-400 hover:shadow-md transition-all bg-white dark:bg-gray-800"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-700/20 flex items-center justify-center mb-4 text-xl">
            🌐
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">Frontend Only</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            {FRONTEND_TUTORIAL_STEPS.length} steps. Install the widget, configure it, define a
            custom profile, and gate a script on consent — no server required.
          </p>
          <ol className="text-sm text-slate-600 dark:text-gray-300 space-y-1 mb-5 list-none pl-0">
            {FRONTEND_TUTORIAL_STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-2">
                <span className="w-4 h-4 shrink-0 rounded-full bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {s.title}
              </li>
            ))}
          </ol>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
            Start Frontend Only →
          </span>
        </Link>

        <Link
          href={`/guides/tutorials/backend/${BACKEND_TUTORIAL_STEPS[0]!.slug}/`}
          className="group block no-underline rounded-2xl border-2 border-slate-200 dark:border-gray-700 p-6 hover:border-brand-400 hover:shadow-md transition-all bg-white dark:bg-gray-800"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-700/20 flex items-center justify-center mb-4 text-xl">
            🖥️
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">Frontend + Backend</h3>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            {BACKEND_TUTORIAL_STEPS.length} steps. Stand up the Node.js backend, manage profiles
            from the admin dashboard, then connect the widget to it.
          </p>
          <ol className="text-sm text-slate-600 dark:text-gray-300 space-y-1 mb-5 list-none pl-0">
            {BACKEND_TUTORIAL_STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-2">
                <span className="w-4 h-4 shrink-0 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {s.title}
              </li>
            ))}
          </ol>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
            Start Frontend + Backend →
          </span>
        </Link>
      </div>

      <p className="mt-6 text-sm text-slate-400 dark:text-gray-500 text-center">
        Looking for a narrative walkthrough instead of a hands-on build?{' '}
        <Link href="/guides/" className="text-brand-600 dark:text-brand-400 hover:underline">
          See Guides
        </Link>{' '}
        — or browse{' '}
        <Link href="/guides/examples/" className="text-brand-600 dark:text-brand-400 hover:underline">
          real-life Examples
        </Link>
        .
      </p>
    </div>
  )
}
