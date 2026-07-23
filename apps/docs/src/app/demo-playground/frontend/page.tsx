import type { Metadata } from 'next'
import { PlaygroundClient } from '@/components/playground/PlaygroundClient'

export const metadata: Metadata = {
  title: 'Frontend Playground — Consenti',
  description:
    'Try the Consenti consent banner live — switch compliance modes, themes, and locales in an interactive playground.',
  alternates: { canonical: '/demo-playground/frontend' },
  openGraph: {
    title: 'Frontend Playground — Consenti',
    description:
      'Try the Consenti consent banner live — switch compliance modes, themes, and locales in an interactive playground.',
    url: 'https://consenti.dev/demo-playground/frontend',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frontend Playground — Consenti',
    description:
      'Try the Consenti consent banner live — switch compliance modes, themes, and locales in an interactive playground.',
    images: ['/og-image.jpg'],
  },
}

export default function FrontendPlaygroundPage() {
  return <PlaygroundClient />
}
