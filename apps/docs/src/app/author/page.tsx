import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Coffee, CreditCard, ExternalLink, Github, Heart, MapPin, Code2, Package } from 'lucide-react'

export const metadata: Metadata = { title: 'Support the Author — Santosh Ojha' }

const supportLinks = [
  {
    label: 'Razorpay',
    desc: 'UPI, cards, net banking (India)',
    url: 'https://pages.razorpay.com/bestwebs',
    Icon: CreditCard,
    color: 'bg-green-700 hover:bg-green-800',
  },
  {
    label: 'Ko-fi',
    desc: 'Buy a coffee — one-time or monthly',
    url: 'https://ko-fi.com/santoshe61',
    Icon: Coffee,
    color: 'bg-red-700 hover:bg-red-800',
  },
  {
    label: 'PayPal',
    desc: 'One-time donation via PayPal',
    url: 'https://paypal.me/santoshe61',
    Icon: CreditCard,
    color: 'bg-blue-700 hover:bg-blue-800',
  },
]

const facts = [
  'Full-stack developer building open-source tools in spare time',
  'Created Consenti to fill the gap for a truly zero-dependency, self-hosted CMP',
  'Believes consent management should be a commodity, not a locked-in SaaS subscription',
  'Based in India — building products used worldwide',
]

export default function AuthorPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-brand-100">
          <Code2 size={36} className="text-brand-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-gray-100 mb-2">Santosh Ojha</h1>
        <p className="text-brand-500 font-semibold text-sm mb-1">Author & Maintainer of Consenti</p>
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm">
          <MapPin size={14} />
          India
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-base font-bold text-slate-900 dark:text-gray-100 mb-4">About</h2>
        <ul className="space-y-2">
          {facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
              <Check size={15} className="text-brand-500 mt-0.5 shrink-0" />
              {fact}
            </li>
          ))}
          <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
            <Check size={15} className="text-brand-500 mt-0.5 shrink-0" />
            Visit my portfolio <a href="https://santosh.top?utm_source=consenti.dev&utm_campaign=support" target='_blank' className='text-brand-500 text-underline hover:text-blue-900'>https://santosh.top</a> for more about me.
          </li>
        </ul>
      </div>

      {/* Why Consenti */}
      <div className="mb-8 p-6 border border-slate-200 dark:border-gray-700 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Package size={18} className="text-brand-500" />
          <h2 className="text-base font-bold text-slate-900 dark:text-gray-100">Why I built Consenti</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
          Every GDPR cookie consent tool I found was either a paid SaaS with vendor lock-in, or an
          open-source library that pulled in dozens of dependencies. I wanted something that was
          truly self-hosted, zero runtime dependencies, TypeScript strict, and covered real-world
          regulations — not just GDPR checkbox theatre. Consenti is the tool I wished existed.

          {/* // TODO: rephrase and redesign this below sentance to be reason why i created it */}
          <ul>
            <li>- Money is not the only reason i was fed up with lots of restriction and non availablity of features in tons of paid and open sourcr tools</li>
            <li>- As a developer we need to perform certain action on some conditions like when user allows analytics cookie only then we can trigger analytics and tracking</li>
            <li>- when user enabled gpc, non mandatory cookies must get denied and no related tools shall get initiated</li>
            <li>- my root element is not yet and dom where i want to mount banner how wait for that to render first</li>
            <li>- some geographical laws says, let user download the consent receipt but most tools doesnt support</li>
            <li>- programatically need to check, set, trigger updates to banner, but most tools dont support granularity</li>
            <li>- need to trigger banner visibility with my existing menu, but unable to sync with methods</li>
            <li>- limited links, buttons, cookies in banners/modals</li>
          </ul>
        </p>
      </div>

      {/* Support options */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-4 text-center">Support my work</h2>
      <p className="text-center text-sm text-slate-500 dark:text-gray-400 mb-6">
        Consenti is free and open-source. If it saved you time or helped you ship, a small contribution
        goes a long way toward keeping the project maintained and growing.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {supportLinks.map((t) => (
          <a
            key={t.label}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 ${t.color} text-white px-5 py-4 rounded-2xl no-underline transition-colors shadow-sm`}
          >
            <t.Icon size={22} className="shrink-0" />
            <div>
              <div className="font-bold text-sm">{t.label}</div>
              <div className="text-xs text-white/80">{t.desc}</div>
            </div>
            <ExternalLink size={15} className="ml-auto text-white/60 shrink-0" />
          </a>
        ))}
      </div>

      {/* GitHub + website */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
        <a
          href="https://github.com/santoshe61"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold no-underline hover:bg-slate-800 dark:hover:bg-gray-600 transition-colors"
        >
          <Github size={16} />
          GitHub Profile
        </a>
        <a
          href="https://santosh.top"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ExternalLink size={16} />
          santosh.top
        </a>
      </div>

      {/* Also support the project */}
      <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-2xl p-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-gray-200">Also support the project</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
          Stars, issues, PRs, and spreading the word all help Consenti grow.
        </p>
        <Link href="/support" className="text-brand-500 hover:text-brand-600 text-sm font-semibold no-underline">
          Support Consenti →
        </Link>
      </div>

      <div className="text-center mt-10">
        <Link href="/docs/getting-started/" className="text-brand-500 hover:text-brand-600 text-sm font-medium no-underline">
          ← Back to documentation
        </Link>
      </div>
    </main>
  )
}
