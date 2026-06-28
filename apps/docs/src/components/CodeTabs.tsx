import { codeToHtml } from 'shiki'
import { CodeTabsClient } from './CodeTabsClient'

interface TabDef {
  label: string
  code: string
  lang?: string
}

export async function CodeTabs({ tabs }: { tabs: TabDef[] }) {
  const rendered = await Promise.all(
    tabs.map(async (t) => ({
      label: t.label,
      code: t.code.trim(),
      html: await codeToHtml(t.code.trim(), {
        lang: t.lang ?? 'json',
        theme: 'github-dark',
      }),
    })),
  )
  return <CodeTabsClient tabs={rendered} />
}
