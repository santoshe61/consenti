import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { NextRequest } from 'next/server'
import { verifyRecaptcha } from '@/lib/recaptcha-verify'

const DB_PATH = join(process.cwd(), '../../../../db', 'consenti-saas-requests.json')

const EMAIL_RE = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/
// Strip HTML tags and control characters from free-text fields
const HTML_TAG_RE = /<[^>]*>/g
const CONTROL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

function sanitizeText(value: unknown, maxLen: number): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return null
  return value
    .replace(HTML_TAG_RE, '')
    .replace(CONTROL_RE, '')
    .trim()
    .slice(0, maxLen) || null
}

function maskIp(ip: string): string {
  // IPv4: strip last octet (192.0.2.55 → 192.0.2.0)
  const v4 = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/)
  if (v4) return `${v4[1]}.0`
  // IPv6: keep first 3 groups (strip last 5)
  const parts = ip.split(':')
  if (parts.length >= 4) return parts.slice(0, 3).join(':') + ':0000:0000:0000:0000:0000'
  return ip
}

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const raw = forwarded ? forwarded.split(',')[0]!.trim() : (req.headers.get('x-real-ip') ?? '0.0.0.0')
  return maskIp(raw)
}

function appendRecord(record: Record<string, unknown>) {
  const dir = join(process.cwd(), 'db')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  let records: unknown[] = []
  if (existsSync(DB_PATH)) {
    try { records = JSON.parse(readFileSync(DB_PATH, 'utf8')) } catch { records = [] }
  }
  records.push(record)
  writeFileSync(DB_PATH, JSON.stringify(records, null, 2))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>
    const { email, organization, currentTool, triedConsenti, satisfactionScore, feedback, recaptchaToken } = body

    const cleanEmail = typeof email === 'string' ? email.trim() : ''
    if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) {
      return Response.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const captchaOk = await verifyRecaptcha(typeof recaptchaToken === 'string' ? recaptchaToken : null)
    if (!captchaOk) {
      return Response.json({ error: 'reCAPTCHA check failed. Please try again.' }, { status: 403 })
    }

    const score = triedConsenti && typeof satisfactionScore === 'number'
      && satisfactionScore >= 1 && satisfactionScore <= 5
      ? satisfactionScore : null

    const cleanFeedback = triedConsenti && score !== null
      ? sanitizeText(feedback, 200)
      : null

    const record = {
      timestamp: new Date().toISOString(),
      ip: getIp(req),
      email: cleanEmail.slice(0, 254),
      organization: sanitizeText(organization, 200),
      currentTool: sanitizeText(currentTool, 200),
      triedConsenti: Boolean(triedConsenti),
      satisfactionScore: score,
      feedback: cleanFeedback,
    }

    appendRecord(record)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to save request.' }, { status: 500 })
  }
}
