import type { Metadata } from 'next'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ReactMarkdown from 'react-markdown'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'All notable changes to Consenti, newest first.',
  alternates: { canonical: '/docs/changelog' },
  openGraph: {
    title: 'Changelog',
    description: 'All notable changes to Consenti, newest first.',
    url: 'https://consenti.dev/docs/changelog',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog',
    description: 'All notable changes to Consenti, newest first.',
    images: ['/og-image.jpg'],
  },
}

// Forces this page to be pre-rendered to static HTML at `next build` time — the
// filesystem read below only ever runs at build time, never per-request.
export const dynamic = 'force-static'

// Marks the end of the file's own title/intro so it isn't duplicated below our own
// heading — tolerant of the "Changelpg" typo currently in CHANGELOG.md.
const ENTRIES_MARKER = /<!--.*entries here.*-->/i
// The contributor-facing template block at the bottom of the file — not a real entry.
const TEMPLATE_MARKER = /\n#+\s*Changelog template\b/i

async function loadEntries(): Promise<string[]> {
  const raw = await readFile(join(process.cwd(), '../../CHANGELOG.md'), 'utf8')

  const markerMatch = raw.match(ENTRIES_MARKER)
  let body = markerMatch ? raw.slice(markerMatch.index! + markerMatch[0].length) : raw

  const templateMatch = body.match(TEMPLATE_MARKER)
  if (templateMatch) body = body.slice(0, templateMatch.index)

  return body
    .split(/\n(?=^## \[)/m)
    .map(entry => entry.replace(/\n-{3,}\s*$/, '').trim())
    .filter(Boolean)
}

export default async function ChangelogPage() {
  const entries = await loadEntries()

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Changelog</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm">
        All notable changes to Consenti, newest first.
      </p>

      {entries.length === 0 && (
        <p className="text-slate-400 text-sm">No changelog entries found.</p>
      )}

      <div className="space-y-10">
        {entries.map(entry => {
          const heading = entry.match(/^## (.+)$/m)?.[1] ?? entry.slice(0, 40)
          return (
            <article
              key={heading}
              className="border border-slate-100 dark:border-gray-700 rounded-2xl p-6"
            >
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mb-1 prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-wide prose-h3:text-slate-500 prose-h3:mt-5 prose-h3:mb-2 prose-p:text-sm prose-li:text-sm prose-strong:font-semibold prose-code:text-xs prose-hr:hidden">
                <ReactMarkdown>{entry}</ReactMarkdown>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
