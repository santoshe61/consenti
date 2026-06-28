-- Add tenant scoping to user_roles
ALTER TABLE user_roles ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
