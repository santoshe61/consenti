import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TutorialStepper } from '@/components/TutorialStepper'
import { BACKEND_TUTORIAL_STEPS } from '@/lib/tutorial-steps'
import { BACKEND_TUTORIAL_CONTENT } from '../content'

export function generateStaticParams() {
  return BACKEND_TUTORIAL_STEPS.map((s) => ({ step: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>
}): Promise<Metadata> {
  const { step } = await params
  const idx = BACKEND_TUTORIAL_STEPS.findIndex((s) => s.slug === step)
  const meta = BACKEND_TUTORIAL_STEPS[idx]
  if (!meta) return {}
  const n = idx + 1
  const title = `${meta.title} — Backend Tutorial (Step ${n}/${BACKEND_TUTORIAL_STEPS.length})`
  return {
    title,
    description: meta.description,
    alternates: { canonical: `/guides/tutorials/backend/${meta.slug}` },
    openGraph: {
      title,
      description: meta.description,
      url: `https://consenti.dev/guides/tutorials/backend/${meta.slug}`,
      siteName: 'Consenti Docs',
      images: ['/og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: meta.description,
      images: ['/og-image.jpg'],
    },
  }
}

export default async function BackendTutorialStepPage({
  params,
}: {
  params: Promise<{ step: string }>
}) {
  const { step } = await params
  const idx = BACKEND_TUTORIAL_STEPS.findIndex((s) => s.slug === step)
  if (idx === -1) notFound()

  const Content = BACKEND_TUTORIAL_CONTENT[idx]
  if (!Content) notFound()

  return (
    <TutorialStepper path="backend" steps={BACKEND_TUTORIAL_STEPS} currentStep={idx + 1}>
      <Content />
    </TutorialStepper>
  )
}
