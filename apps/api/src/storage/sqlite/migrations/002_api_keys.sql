-- Phase 4: API keys for multi-tenant public API authentication.
-- Each tenant gets one or more API keys; the raw key is shown once and never stored.

CREATE TABLE IF NOT EXISTS api_keys (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash   TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
