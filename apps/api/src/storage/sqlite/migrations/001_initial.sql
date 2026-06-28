-- All tables for Consenti. Created in a single migration so foreign keys work.

CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id),
  name           TEXT NOT NULL,
  default_locale TEXT NOT NULL DEFAULT 'en',
  version        INTEGER NOT NULL DEFAULT 1,
  is_default     INTEGER NOT NULL DEFAULT 0,
  profile_json   TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consent_records (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id),
  visitor_id      TEXT NOT NULL,
  profile_id      TEXT NOT NULL REFERENCES profiles(id),
  profile_version INTEGER NOT NULL,
  locale          TEXT NOT NULL,
  consent_json    TEXT NOT NULL,
  gpc_detected    INTEGER NOT NULL DEFAULT 0,
  source          TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(visitor_id, profile_id)
);

CREATE TABLE IF NOT EXISTS consent_history (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenants(id),
  consent_record_id TEXT NOT NULL REFERENCES consent_records(id),
  visitor_id        TEXT NOT NULL,
  old_json          TEXT,
  new_json          TEXT NOT NULL,
  action            TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visitors (
  id              TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL REFERENCES tenants(id),
  visitor_id      TEXT NOT NULL UNIQUE,
  country         TEXT,
  region          TEXT,
  city            TEXT,
  ip_hash         TEXT,
  user_agent_hash TEXT,
  first_seen      TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id),
  role_id TEXT NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       TEXT NOT NULL REFERENCES roles(id),
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenants(id),
  user_id       TEXT,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT,
  old_data      TEXT,
  new_data      TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed data is generated from src/storage/seed-data.ts (SEED_SQL) at runtime by each adapter.
