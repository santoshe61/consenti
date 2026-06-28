import type {
  StorageAdapter, ConsentDbRecord, CreateConsentInput, UpdateConsentInput, ConsentFilters,
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

  list(filters: ConsentFilters): Promise<ConsentDbRecord[]> {
    return this.adapter.getConsents(filters)
  }
}
