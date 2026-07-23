import type {
  StorageAdapter, ConsentDbRecord, ConsentSummary, CreateConsentInput, UpdateConsentInput,
  ConsentFilters, PagedResult,
} from '@consenti/types'

export class ConsentRepo {
  constructor(private adapter: StorageAdapter) {}

  create(data: CreateConsentInput): Promise<ConsentDbRecord> {
    return this.adapter.createConsent(data)
  }

  update(visitorId: string, data: UpdateConsentInput): Promise<ConsentDbRecord> {
    return this.adapter.updateConsent(visitorId, data)
  }

  delete(visitorId: string): Promise<void> {
    return this.adapter.deleteConsent(visitorId)
  }

  get(visitorId: string): Promise<ConsentDbRecord | null> {
    return this.adapter.getConsent(visitorId)
  }

  list(filters: ConsentFilters): Promise<PagedResult<ConsentSummary>> {
    return this.adapter.getConsents(filters)
  }
}
