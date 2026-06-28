import type { Metadata } from 'next'
import { PlaygroundClient } from '@/components/playground/PlaygroundClient'

export const metadata: Metadata = { title: 'Frontend Playground — Consenti' }

export default function FrontendPlaygroundPage() {
  return <PlaygroundClient />
}
