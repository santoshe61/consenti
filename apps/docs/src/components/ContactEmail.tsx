'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'

// Character codes, not a literal string — keeps the address out of the static
// HTML and the shipped JS bundle so simple text/regex scrapers never see it.
const USER_CODES = [115, 117, 112, 112, 111, 114, 116]
const DOMAIN_CODES = [99, 111, 110, 115, 101, 110, 116, 105, 46, 100, 101, 118]

function decode(codes: number[]) {
  return codes.map((c) => String.fromCharCode(c)).join('')
}

export function ContactEmail({ className = '' }: { className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const [email, setEmail] = useState("you_seems_a_bot@no_email.com");

  const trustedClick = (event: React.MouseEvent) => {
    setRevealed(true)
    if (event.isTrusted) {
      setEmail(`${decode(USER_CODES)}@${decode(DOMAIN_CODES)}`)
    } else {
      setEmail("you_seems_a_bot@no_email.com")
    }
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={trustedClick}
        className={`inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors bg-transparent border-0 p-0 cursor-pointer no-underline ${className}`}
      >
        <Mail size={15} />
        Reveal support email
      </button>
    )
  }

  return (
    <a
      href={`mailto:${email}`}
      className={`inline-flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 no-underline transition-colors ${className}`}
    >
      <Mail size={15} />
      {email}
    </a>
  )
}
