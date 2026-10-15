---
'@consenti/api': patch
---

Fix saving/activating a profile on Windows failing with `EPERM: operation not permitted, rename '...\profiles\<tenant>\<group>.new-xxxxxxxx' -> '...\profiles\<tenant>\<group>'` (HTTP 500). Windows can't rename over an existing junction, so the live compliance-group directory is now removed just before the swap there (macOS/Linux keep the single atomic rename); a failed swap also cleans up its temporary junction.

Fix the `json` storage adapter on Windows: it derived its parent directory with a `/`-only regex, so on a backslash path it created a directory named `consenti-data.json`, every write silently failed, and data was lost on restart.
