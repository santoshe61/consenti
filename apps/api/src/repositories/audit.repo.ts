import type {
  StorageAdapter, AuditLog, AuditLogSummary, AuditFilters, CreateAuditLogInput, PagedResult,
} from '@consenti/types'

export class AuditRepo {
  constructor(private adapter: StorageAdapter) {}

  log(data: CreateAuditLogInput): Promise<void> {
    return this.adapter.createLog(data)
  }

  list(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    return this.adapter.getLogs(filters)
  }

  get(id: string): Promise<AuditLog | null> {
    return this.adapter.getAuditLogById(id)
  }
}
