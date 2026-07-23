import { createContext } from 'preact'
import { useContext, useEffect } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

const PageTitleContext = createContext<(title: string) => void>(() => {})

export function PageTitleProvider({ setTitle, children }: { setTitle: (title: string) => void; children: ComponentChildren }) {
  return <PageTitleContext.Provider value={setTitle}>{children}</PageTitleContext.Provider>
}

// Pages call this instead of owning their own <Layout> so the sidebar/header
// chrome stays mounted at the Router level across navigations — including
// while a lazy page chunk is still loading, which avoids remounting (and
// flickering) the chrome on every Suspense fallback.
export function usePageTitle(title: string) {
  const setTitle = useContext(PageTitleContext)
  useEffect(() => { setTitle(title) }, [title, setTitle])
}
