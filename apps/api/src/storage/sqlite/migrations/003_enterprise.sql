-- Phase 5 Enterprise additions
ALTER TABLE consent_records ADD COLUMN age_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE consent_records ADD COLUMN parental_consent_token TEXT;
ALTER TABLE consent_records ADD COLUMN tcf_string TEXT;
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;
