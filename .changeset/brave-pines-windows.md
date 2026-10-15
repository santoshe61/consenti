---
'@consenti/api': patch
---

Fix saving/activating a profile on Windows failing with `EPERM: operation not permitted, rename '...\profiles\<tenant>\<group>.new-xxxxxxxx' -> '...\profiles\<tenant>\<group>'` (HTTP 500). Windows can't rename over an existing junction, so the live compliance-group directory is now removed just before the swap there (macOS/Linux keep the single atomic rename); a failed swap also cleans up its temporary junction.

Fix the `json` storage adapter on Windows: it derived its parent directory with a `/`-only regex, so on a backslash path it created a directory named `consenti-data.json`, every write silently failed, and data was lost on restart.

Fix `DELETE /profiles/:id` failing with a foreign-key error (HTTP 500) on MariaDB 10.5+, PostgreSQL and SQLite once a profile had any consent or notice records: `consent_records.profile_id` / `notice_shown.profile_id` no longer reference `profiles`, because a consent record is evidence and must outlive its profile. Existing databases are upgraded automatically to schema v2 on the next start (MariaDB/MySQL, PostgreSQL, SQLite; MongoDB and the JSON store need nothing) — take a backup first for production.

Each consent and consent-history row now records the `profileVersion` it was given (also in the CSV/XLSX exports and the OpenAPI schema), so `GET /consent/:visitorId/verify` can resolve a deleted profile's record to the exact archived snapshot. The `profile:deleted` audit entry records the profile's name, compliance group and whether it was active, and profile create/copy/update/delete/activate/deactivate are attributed to the acting admin.

Compliance-group and locale names are now validated as safe directory/file names (lowercase `a-z 0-9 - _` group keys, language-tag locales); a bad name previously could point the live-profile swap outside the profiles folder. `POST`/`PUT /profiles` return `400` for a violation, and the worker refuses unsafe names even if validation is bypassed.
