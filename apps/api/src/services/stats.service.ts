import type {
  StorageAdapter, OverviewStats, CategoryStats, TimelineEntry, CountryStat, GpcStats, Tenant,
} from '@consenti/types'
import { TTLCache } from '../utils/ttl-cache'

// Stats/report queries scan the whole tenant's consent history — expensive, and rarely need
// per-second freshness for a reporting page. 30s keeps the dashboard feeling live (a fresh
// consent shows up within half a minute) while absorbing repeat page views/refreshes for free.
const STATS_CACHE_TTL_MS = 30_000

export class StatsService {
  private cache = new TTLCache(STATS_CACHE_TTL_MS)

  constructor(private storage: StorageAdapter) {}

  async getOverview(tenantId: string): Promise<OverviewStats> {
    return this.cached(`overview:${tenantId}`, () => this.storage.getOverviewStats(tenantId))
  }

  async getCategories(tenantId: string): Promise<CategoryStats> {
    return this.cached(`categories:${tenantId}`, () => this.storage.getCategoryStats(tenantId))
  }

  async getTimeline(tenantId: string, days: number): Promise<TimelineEntry[]> {
    return this.cached(`timeline:${tenantId}:${days}`, () => this.storage.getTimeline(tenantId, days))
  }

  async getCountries(tenantId: string): Promise<CountryStat[]> {
    return this.cached(`countries:${tenantId}`, () => this.storage.getCountries(tenantId))
  }

  async getGpc(tenantId: string): Promise<GpcStats> {
    return this.cached(`gpc:${tenantId}`, () => this.storage.getGpcStats(tenantId))
  }

  async getTenants(): Promise<Tenant[]> {
    return this.storage.getTenants()
  }

  dispose(): void {
    this.cache.dispose()
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get<T>(key)
    if (hit !== undefined) return hit
    const value = await load()
    this.cache.set(key, value)
    return value
  }
}
