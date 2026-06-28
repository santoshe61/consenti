import type { AuditLog, AuditFilters, CreateAuditLogInput } from '@consenti/types'
import type { AuditRepo } from '../repositories/audit.repo'

export class AuditService {
  constructor(private audit: AuditRepo) {}

  log(data: CreateAuditLogInput): Promise<void> {
    return this.audit.log(data)
  }

  list(filters: AuditFilters): Promise<AuditLog[]> {
    return this.audit.list(filters)
  }
}
