import type { AuditLog, AuditFilters, CreateAuditLogInput, StorageAdapter } from '@consenti/types'

export class AuditEngine {
  constructor(
    private storage: StorageAdapter,
    private tenantId: string = 'default',
  ) {}

  log(data: Omit<CreateAuditLogInput, 'tenantId'>): Promise<void> {
    return this.storage.createLog({ ...data, tenantId: this.tenantId })
  }

  list(filters: Omit<AuditFilters, 'tenantId'>): Promise<AuditLog[]> {
    return this.storage.getLogs({ ...filters, tenantId: this.tenantId })
  }
}
