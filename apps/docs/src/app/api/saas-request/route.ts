import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { NextRequest } from 'next/server'

const DB_PATH = join(process.cwd(), 'db', 'consenti-saas-requests.json')

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
    const { email, organization, currentTool, triedConsenti, satisfactionScore } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const record = {
      timestamp: new Date().toISOString(),
      ip: getIp(req),
      email: String(email).trim(),
      organization: organization ? String(organization).trim() : null,
      currentTool: currentTool ? String(currentTool).trim() : null,
      triedConsenti: Boolean(triedConsenti),
      satisfactionScore: triedConsenti && typeof satisfactionScore === 'number' ? satisfactionScore : null,
    }

    appendRecord(record)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to save request.' }, { status: 500 })
  }
}
