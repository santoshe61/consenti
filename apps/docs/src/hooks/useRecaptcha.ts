'use client'
import { useCallback } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''

export function useRecaptcha() {
  const load = useCallback(() => {
    if (!SITE_KEY || document.querySelector('script[data-recaptcha]')) return
    const s = document.createElement('script')
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    s.dataset.recaptcha = '1'
    s.async = true
    document.head.appendChild(s)
  }, [])

  const getToken = useCallback(async (action: string): Promise<string | null> => {
    if (!SITE_KEY || typeof window === 'undefined' || !window.grecaptcha) return null
    return new Promise(resolve => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(() => resolve(null))
      })
    })
  }, [])

  return { load, getToken, enabled: Boolean(SITE_KEY) }
}
