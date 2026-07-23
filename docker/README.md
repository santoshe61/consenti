# Consenti Docker Image

A maintained Docker image for self-hosting `@consenti/api`. This installs the **published npm
package**, not the monorepo source — it stays in lockstep with whatever version you pin via
`CONSENTI_API_VERSION`, the same way any other distributed artifact tracks a release.

## Quick start (SQLite, zero extra services)

From the repo root:

```bash
CONSENTI_ADMIN_PASSWORD=$(openssl rand -base64 24) \
CONSENTI_ADMIN_JWT_SECRET=$(openssl rand -hex 32) \
docker compose up
```

- Admin dashboard: `http://localhost:3000/consenti/`
- Public API: `http://localhost:3000/consenti/api/v1/`
- Data persists in the `consenti-data` named volume (see `docker-compose.yml`).

`CONSENTI_ADMIN_PASSWORD` and `CONSENTI_ADMIN_JWT_SECRET` are required — the compose file fails
fast with a clear error if either is missing, rather than silently booting with demo credentials.

## Using PostgreSQL or MongoDB instead

The default `docker-compose.yml` ships commented-out `postgres` and `mongodb` service blocks
with the exact environment variable changes needed on the `consenti` service to switch drivers.
Uncomment the block you want and follow the inline instructions.

## Building the image directly

```bash
docker build \
  --build-arg CONSENTI_API_VERSION=0.2.0 \
  -t consenti-api ./docker
```

Omit `CONSENTI_API_VERSION` to install `@consenti/api@latest`.

## Configuration

Every `CONSENTI_*` environment variable documented in
[`apps/api/README.md`](../apps/api/README.md#environment-variables) works here — `createConsenti()`
reads them directly, no extra wiring needed. Common ones:

| Variable | Purpose |
|---|---|
| `CONSENTI_ADMIN_EMAIL` | Bootstrap super-admin email |
| `CONSENTI_ADMIN_PASSWORD` | Bootstrap super-admin password (required, no default in compose) |
| `CONSENTI_ADMIN_JWT_SECRET` | JWT signing secret (required, no default in compose) |
| `CONSENTI_DB_DRIVER` | `node:sqlite` (default in this image), `postgresql`, `mysql`, `mongodb`, `json` |
| `CONSENTI_DB_PATH` | SQLite/JSON storage directory |
| `CONSENTI_DB_HOST` / `CONSENTI_DB_URI` | Postgres/MySQL/MongoDB connection |
| `CONSENTI_BASE_PATH` | URL prefix for all routes (default `/consenti`) |

## Why `node:sqlite` and not `better-sqlite3` by default

`node:sqlite` is built into Node 22.5+ — zero extra install, zero native compilation. This image
is built on `node:22-alpine`, which has no build toolchain (`node-gyp`, `python3`, `make`, `g++`)
installed, so `better-sqlite3` (which needs to compile a native addon) is deliberately not
bundled — it would require a heavier base image or a multi-stage build with build tools, adding
real weight for a driver `node:sqlite` already covers.

## What this image is not

Not built from the monorepo source, not a dev environment, and not automatically rebuilt on
every commit — it's a convenience artifact for people who just want to run Consenti without
cloning the repo. Bump `CONSENTI_API_VERSION` (and the image itself, if published to a registry)
as part of the normal release process alongside a new npm version.
