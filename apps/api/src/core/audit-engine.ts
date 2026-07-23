import type {
  AuditLogSummary, AuditFilters, CreateAuditLogInput, StorageAdapter, PagedResult,
} from '@consenti/types'

export class AuditEngine {
  constructor(
    private storage: StorageAdapter,
    private tenantId: string = 'default',
  ) {}

  log(data: Omit<CreateAuditLogInput, 'tenantId'>): Promise<void> {
    return this.storage.createLog({ ...data, tenantId: this.tenantId })
  }

  list(filters: Omit<AuditFilters, 'tenantId'>): Promise<PagedResult<AuditLogSummary>> {
    return this.storage.getLogs({ ...filters, tenantId: this.tenantId })
  }
}
