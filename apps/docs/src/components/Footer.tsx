'use client'

import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-8 mb-8 justify-between">
          <div>
            <div className="flex items-center gap-2 text-white mb-3">
              <Image src="/logo-dark.svg" alt="Consenti" width={240} height={64} className="rounded-lg" unoptimized />
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
              Open-source, GDPR-compliant consent management platform. Apache 2.0 license.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Docs</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs/getting-started/" className="hover:text-white no-underline transition-colors">Getting Started</Link></li>
                <li><Link href="/docs/ui/" className="hover:text-white no-underline transition-colors">UI Widget</Link></li>
                <li><Link href="/docs/api/" className="hover:text-white no-underline transition-colors">Backend API</Link></li>
                <li><Link href="/docs/compliance/gdpr/" className="hover:text-white no-underline transition-colors">GDPR Guide</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Project</div>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo-playground/frontend" className="hover:text-white no-underline transition-colors">Live Demo</Link></li>
                <li><Link href="/demo-playground/backend" className="hover:text-white no-underline transition-colors">Admin Demo</Link></li>
                <li><a href="https://github.com/santoshe61/consenti" target="_blank" rel="noopener noreferrer" className="hover:text-white no-underline transition-colors">GitHub</a></li>
                <li><a href="https://www.npmjs.com/org/consenti" target="_blank" rel="noopener noreferrer" className="hover:text-white no-underline transition-colors">npm</a></li>
                <li><Link href="/support" className="hover:text-white no-underline transition-colors">Support Us</Link></li>
                <li>
                  <button
                    onClick={() => (window as unknown as { consentiWidget?: { showModal(): void } }).consentiWidget?.showModal()}
                    className="hover:text-white transition-colors bg-transparent border-0 p-0 text-inherit cursor-pointer text-sm"
                  >
                    Customize
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-wrap gap-4 justify-between text-xs text-slate-600">
          <span>© {new Date().getFullYear()} <a href="https://santosh.top" target='_blank'>Santosh Ojha</a> · Apache 2.0 License</span>
          <span>Built with &hearts; & Node 20+ in India · TypeScript Strict · Zero runtime deps</span>
        </div>
      </div>
    </footer>
  )
}
