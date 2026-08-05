'use client'

import { ArrowUp } from "lucide-react"

export function ScrollToTop() {

  const scrollToTop = function () {
    window.scrollTo(0, 0)
  }

  return <button aria-label='Scroll to top' type='button' onClick={scrollToTop} className="bg-green-600/70 hover:bg-green-600/100 p-3 rounded-full text-center fixed right-4 bottom-4">
    <ArrowUp className="size-4 text-white" />
  </button>
}
