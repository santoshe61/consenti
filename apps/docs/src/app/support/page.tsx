import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Coffee, CreditCard, ExternalLink, Heart, Code2 } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import { ContactEmail } from '@/components/ContactEmail'

export const metadata: Metadata = {
  title: 'Support Consenti',
  description:
    'Consenti is free, open-source, and Apache 2.0 licensed — support development if it saved you time or helped you ship something.',
  alternates: { canonical: '/support' },
  openGraph: {
    title: 'Support Consenti',
    description:
      'Consenti is free, open-source, and Apache 2.0 licensed — support development if it saved you time or helped you ship something.',
    url: 'https://consenti.dev/support',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support Consenti',
    description:
      'Consenti is free, open-source, and Apache 2.0 licensed — support development if it saved you time or helped you ship something.',
    images: ['/og-image.jpg'],
  },
}

const tiers = [
  {
    label: 'Razorpay',
    desc: 'Pay via UPI, cards, or net banking (India)',
    url: 'https://rzp.io/rzp/consenti',
    Icon: CreditCard,
    // color: 'bg-green-700 hover:bg-green-800',
  },
  {
    label: 'Ko-fi',
    desc: 'Buy me a coffee — one-time or monthly',
    url: 'https://ko-fi.com/santoshe61',
    Icon: Coffee,
    // color: 'bg-red-700 hover:bg-red-800',
  },
  {
    label: 'PayPal',
    desc: 'One-time donation via PayPal',
    url: 'https://paypal.me/santoshe61',
    Icon: CreditCard,
    // color: 'bg-blue-700 hover:bg-blue-800',
  },
]

const whySupport = [
  'Consenti is built and maintained solo, in spare time.',
  'Zero external dependencies keeps it lightweight — but it takes effort to build correctly.',
  'Your support helps fund time to build TCF v2.2, multi-tenant, and enterprise features.',
  'Every contribution, however small, matters and is appreciated.',
]

export default function SupportPage() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Support Consenti</h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          Consenti is free, open-source, and Apache 2.0 licensed. If it saved you time or helped you
          ship something, consider buying me a coffee.
        </p>
      </div>

      {/* Why support */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-10">
        <h2 className="text-base font-bold text-slate-900 mb-4">Why it matters</h2>
        <ul className="space-y-2">
          {whySupport.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <Check size={15} className="text-green-500 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Donation options */}
      <div className="mb-12 grid md:grid-cols-3 gap-4">
        {tiers.map(t => (
          <a
            key={t.label}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-4 bg-gray-500 hover:bg-gray-700 text-white px-6 py-4 rounded-2xl no-underline transition-colors shadow-sm`}
          >
            <t.Icon size={24} className="shrink-0" />
            <div>
              <div className="font-bold text-base">{t.label}</div>
              <div className="text-sm text-white/80">{t.desc}</div>
            </div>
            <ExternalLink size={18} className="ml-auto text-white/60 shrink-0" />
          </a>
        ))}
      </div>

      {/* GitHub */}
      <div className="border border-slate-200 rounded-2xl p-6 text-center">
        <h2 className="font-bold text-slate-900 mb-2">Other ways to support</h2>
        <p className="text-sm text-slate-500 mb-4">
          Stars, issues, PRs, and spreading the word all help Consenti grow.
        </p>
        <a
          href="https://github.com/santoshe61/consenti"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl text-lg font-semibold no-underline hover:bg-slate-800 transition-colors"
        >
          <FaGithub size={22} />
          Star on GitHub
        </a>
      </div>

      {/* Contact */}
      <div className="mt-8 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 text-center">
        <h2 className="font-bold text-slate-900 dark:text-gray-100 mb-2">Need to get in touch?</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          Questions, bug reports, or enterprise inquiries — reach out directly.
        </p>
        <ContactEmail className="text-base" />
      </div>

      {/* Built by */}
      <div className="mt-10 pt-8 border-t border-slate-100 dark:border-gray-800 flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-gray-500">
        <Code2 size={14} className="shrink-0" />
        Built and maintained by{' '}
        <a
          href="https://santosh.top"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 dark:text-gray-400 hover:text-brand-500 no-underline transition-colors"
        >
          Santosh Ojha
        </a>
      </div>

      <div className="text-center mt-6">
        <Link
          href="/docs/getting-started/"
          className="text-brand-500 hover:text-brand-600 text-sm font-medium no-underline"
        >
          ← Back to documentation
        </Link>
      </div>
    </main>
  )
}
