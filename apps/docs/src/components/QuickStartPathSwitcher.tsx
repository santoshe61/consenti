'use client'

import { Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'

interface QuickStartPathSwitcherProps {
  chooser: ReactNode
  frontend: ReactNode
  both: ReactNode
}

function PathSwitcherInner({ chooser, frontend, both }: QuickStartPathSwitcherProps) {
  const searchParams = useSearchParams()
  const path = searchParams.get('path')

  if (path === 'frontend') return <>{frontend}</>
  if (path === 'both') return <>{both}</>
  return <>{chooser}</>
}

// Suspense fallback: statically renders the chooser (the default view when
// no ?path= is present) so the page can prerender fully; the client swaps
// to the requested path on hydration for deep links like ?path=both.
export function QuickStartPathSwitcher(props: QuickStartPathSwitcherProps) {
  return (
    <Suspense fallback={props.chooser}>
      <PathSwitcherInner {...props} />
    </Suspense>
  )
}
