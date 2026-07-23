interface CacheEntry<T> { value: T; expiresAt: number }

/**
 * Small in-memory TTL cache with a hard size bound and periodic sweeping — used to front
 * expensive, rarely-changing reads (report/stats queries) without needing an external cache
 * (this project ships zero runtime dependencies). Bounded so a multi-tenant deployment with many
 * tenants/query combinations can't grow the cache without limit between sweeps; swept on an
 * interval so expired entries are reclaimed even if nothing happens to re-touch that key.
 */
export class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private sweepTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private ttlMs: number,
    private maxEntries = 500,
    sweepIntervalMs = 60_000,
  ) {
    this.sweepTimer = setInterval(() => this.sweep(), sweepIntervalMs)
    this.sweepTimer.unref?.()
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      // Map preserves insertion order — the first key is the oldest-inserted entry, a
      // reasonable-enough eviction target without tracking separate access-time metadata.
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  private sweep(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key)
    }
  }

  /** Stops the sweep interval — call on shutdown so it doesn't keep the process alive. */
  dispose(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer)
    this.sweepTimer = null
  }
}
