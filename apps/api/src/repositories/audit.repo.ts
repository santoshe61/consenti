import type {
  StorageAdapter, AuditLog, AuditFilters, CreateAuditLogInput,
} from '@consenti/types'

export class AuditRepo {
  constructor(private adapter: StorageAdapter) {}

  log(data: CreateAuditLogInput): Promise<void> {
    return this.adapter.createLog(data)
  }

  list(filters: AuditFilters): Promise<AuditLog[]> {
    return this.adapter.getLogs(filters)
  }
}
