interface RateLimitEntry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()

  constructor(
    private windowMs: number = 60_000,
    private maxRequests: number = 60,
  ) {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store) {
        if (now >= entry.resetAt) this.store.delete(key)
      }
    }, this.windowMs).unref()
  }

  check(key: string): boolean {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs })
      return true
    }

    entry.count += 1
    return entry.count <= this.maxRequests
  }

  // Returns false if either the IP bucket or the profileId bucket is exhausted.
  checkRequest(ip: string, profileId?: string): boolean {
    const ipOk = this.check(`ip:${ip}`)
    if (!ipOk) return false
    if (profileId) return this.check(`profile:${profileId}`)
    return true
  }
}
