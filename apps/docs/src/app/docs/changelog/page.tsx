import type { Metadata } from 'next'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ReactMarkdown from 'react-markdown'

export const metadata: Metadata = { title: 'Changelog' }

interface Entry {
  name: string
  content: string
}

async function loadEntries(): Promise<Entry[]> {
  const dir = join(process.cwd(), '../../changelog')
  let files: string[]
  try {
    files = await readdir(dir)
  } catch {
    return []
  }
  const mdFiles = files.filter((f) => f.endsWith('.md')).sort().reverse()
  const entries = await Promise.all(
    mdFiles.map(async (f) => ({
      name: f.replace('.md', ''),
      content: await readFile(join(dir, f), 'utf8'),
    }))
  )
  return entries
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
        {entries.map((entry) => (
          <article
            key={entry.name}
            className="border border-slate-100 dark:border-gray-700 rounded-2xl p-6"
          >
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-xl prose-h1:mb-1 prose-h2:text-sm prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-slate-500 prose-h2:mt-5 prose-h2:mb-2 prose-p:text-sm prose-li:text-sm prose-strong:font-semibold prose-code:text-xs prose-hr:hidden">
              <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
