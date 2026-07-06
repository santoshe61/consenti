const SECRET = process.env.RECAPTCHA_SECRET_KEY ?? ''
const MIN_SCORE = 0.5

interface RecaptchaResult {
  success: boolean
  score: number
  'error-codes'?: string[]
}

export async function verifyRecaptcha(token: string | null | undefined): Promise<boolean> {
  if (!SECRET) return true
  if (!token) return false
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: SECRET, response: token }),
  })
  const data = await res.json() as RecaptchaResult
  return data.success && data.score >= MIN_SCORE
}
