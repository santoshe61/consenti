---
'@consenti/types': minor
'@consenti/api': minor
---

Removed the `auditLogPurgeAfterDays` retention option (`DataRetentionConfig`) and the corresponding `purgeExpiredAuditLogs` method from the `StorageAdapter` interface and all seven storage adapters. `audit_logs` is now unconditionally append-only — never deleted by Consenti under any configuration.

### Breaking changes
Any config setting `compliance.dataRetention.auditLogPurgeAfterDays` is now a no-op (the field no longer exists on the type) and any custom `StorageAdapter` implementation that relied on `purgeExpiredAuditLogs` being called will no longer see it invoked. Operators who need shorter audit-log retention must do so manually against their own database — this is intentionally outside Consenti's supported paths. `compliance.dataRetention.purgeAfterDays` (consent records) is unaffected.
