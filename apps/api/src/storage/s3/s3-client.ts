import { createHmac, createHash } from 'node:crypto'
import type { S3ApiConfig } from '@consenti/types'

type S3Config = Pick<S3ApiConfig, 'region' | 'bucketName' | 'accessKeyId' | 'secretAccessKey' | 'sessionToken'>

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest()
}

function toAmzDate(d: Date): { amzDate: string; dateStamp: string } {
  const iso = d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  return { amzDate: iso, dateStamp: iso.slice(0, 8) }
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  return hmacSha256(kService, 'aws4_request')
}

interface S3RequestParams {
  method: 'PUT' | 'GET' | 'HEAD' | 'DELETE'
  key: string
  body?: Buffer | string
  contentType?: string
  config: S3Config
}

function buildSignedHeaders(params: S3RequestParams): Record<string, string> {
  const { method, key, body, contentType, config } = params
  const now = new Date()
  const { amzDate, dateStamp } = toAmzDate(now)
  const host = `${config.bucketName}.s3.${config.region}.amazonaws.com`

  const payloadHash = body
    ? sha256Hex(Buffer.isBuffer(body) ? body : Buffer.from(body as string, 'utf8'))
    : sha256Hex('')

  const signedHeaderMap: Record<string, string> = {
    host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
  }
  if (config.sessionToken) signedHeaderMap['x-amz-security-token'] = config.sessionToken
  if (contentType && method === 'PUT') signedHeaderMap['content-type'] = contentType

  const sortedKeys = Object.keys(signedHeaderMap).sort()
  const canonicalHeaders = sortedKeys.map(k => `${k}:${signedHeaderMap[k]}\n`).join('')
  const signedHeadersList = sortedKeys.join(';')

  const canonicalRequest = [
    method,
    `/${encodeURIComponent(key).replace(/%2F/g, '/')}`,
    '',
    canonicalHeaders,
    signedHeadersList,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const signingKey = getSigningKey(config.secretAccessKey, dateStamp, config.region, 's3')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeadersList}`,
    `Signature=${signature}`,
  ].join(', ')

  return { ...signedHeaderMap, authorization }
}

function s3Url(key: string, config: S3Config): string {
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/')
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${encodedKey}`
}

export async function s3Put(key: string, body: Buffer | string, config: S3Config, contentType = 'application/json'): Promise<void> {
  const headers = buildSignedHeaders({ method: 'PUT', key, body, contentType, config })
  const bodyStr = typeof body === 'string' ? body : body.toString('utf8')
  const res = await fetch(s3Url(key, config), {
    method: 'PUT',
    headers: { ...headers, 'content-length': String(Buffer.byteLength(bodyStr, 'utf8')) },
    body: bodyStr,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`S3 PUT ${key} failed: ${res.status} ${text}`)
  }
}

export async function s3Get(key: string, config: S3Config): Promise<Buffer> {
  const headers = buildSignedHeaders({ method: 'GET', key, config })
  const res = await fetch(s3Url(key, config), { method: 'GET', headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`S3 GET ${key} failed: ${res.status} ${text}`)
  }
  const buf = await res.arrayBuffer()
  return Buffer.from(buf)
}

export async function s3Head(key: string, config: S3Config): Promise<boolean> {
  const headers = buildSignedHeaders({ method: 'HEAD', key, config })
  const res = await fetch(s3Url(key, config), { method: 'HEAD', headers })
  return res.ok
}

export async function s3Delete(key: string, config: S3Config): Promise<void> {
  const headers = buildSignedHeaders({ method: 'DELETE', key, config })
  const res = await fetch(s3Url(key, config), { method: 'DELETE', headers })
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '')
    throw new Error(`S3 DELETE ${key} failed: ${res.status} ${text}`)
  }
}
