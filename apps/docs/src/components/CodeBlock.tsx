import { codeToHtml } from 'shiki'
import { CopyButton } from './CopyButton'

type Lang =
  | 'typescript'
  | 'tsx'
  | 'javascript'
  | 'jsx'
  | 'json'
  | 'sql'
  | 'html'
  | 'bash'
  | 'nginx'
  | 'vue'
  | 'css'
  | 'text'

interface CodeBlockProps {
  code: string
  lang?: Lang | string
  filename?: string
}

export async function CodeBlock({ code, lang = 'typescript', filename }: CodeBlockProps) {
  const html = await codeToHtml(code.trim(), {
    lang: lang === 'ts' ? 'typescript' : lang === 'js' ? 'javascript' : lang,
    theme: 'github-dark',
  })

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          {filename && (
            <span className="text-xs text-slate-400 font-mono ml-2">{filename}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-mono uppercase">{lang}</span>
          <CopyButton code={code} />
        </div>
      </div>
      <div
        className="[&>pre]:p-4 [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:leading-relaxed [&>pre]:!bg-slate-950 [&>pre]:m-0"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export function InlineCode({ children }: { children: string }) {
  return (
    <code className="bg-slate-100 text-brand-600 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  )
}

export function Terminal({ code }: { code: string }) {
  return (
    <CodeBlock code={code} lang='bash' />
  )
}
