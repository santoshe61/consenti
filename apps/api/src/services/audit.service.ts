import type { AuditLog, AuditLogSummary, AuditFilters, CreateAuditLogInput, PagedResult } from '@consenti/types'
import type { AuditRepo } from '../repositories/audit.repo'

export class AuditService {
  constructor(private audit: AuditRepo) {}

  log(data: CreateAuditLogInput): Promise<void> {
    return this.audit.log(data)
  }

  list(filters: AuditFilters): Promise<PagedResult<AuditLogSummary>> {
    return this.audit.list(filters)
  }

  get(id: string): Promise<AuditLog | null> {
    return this.audit.get(id)
  }
}
