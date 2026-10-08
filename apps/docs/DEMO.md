# Running the docs app as a consumer of your local `@consenti/ui` + `@consenti/api` build

`apps/docs` is also Consenti's demo app. Normally it runs against the workspace (npm symlinks
`apps/ui` and `apps/api`). Before a release you want to see it run the way a **user** gets the
packages: installed from a registry, built for production, with a fresh database.

```bash
npm run docs:demo            # registry → build+publish ui/api locally → install → next build → start
# docs:       http://localhost:3000
# dashboard:  http://localhost:3000/consenti      (admin: user@consenti.dev / Consenti@123)
```

Needs Docker (a throwaway [Verdaccio](https://verdaccio.org) registry) and `rsync`.

## Steps individually

| Command | What it does |
|---|---|
| `npm run docs:demo -- registry` | Start the local registry on `localhost:4873` (Docker). |
| `npm run docs:demo -- publish` | Build utils/ui/api and publish ui + api to it as `<version>-local.<timestamp>`. Never touches npmjs. |
| `npm run docs:demo -- prepare` | Copy `apps/docs` to `$TMPDIR/consenti-docs-demo/apps/docs` (outside the workspace), install `.npmrc.demo` as its `.npmrc`, point `@consenti/ui` and `@consenti/api` at the registry, `npm install`. |
| `npm run docs:demo -- build` | Production `next build` plus the same post-build steps as `DEPLOY.sh`. |
| `npm run docs:demo -- start` | Run the production server (generates a throwaway `CONSENTI_DATA_SIGNING_HASH` if you don't set one — the API refuses to boot in production without it). |
| `npm run docs:demo -- dev` | `next dev` from the consumer copy instead of a production build. |
| `npm run docs:demo -- reset` | Delete the demo's own data → the next start is a fresh install (setup wizard). |
| `npm run docs:demo -- status` | Registry state and the `@consenti/*` versions the copy installed. |
| `npm run docs:demo -- down [--purge]` | Stop the registry (`--purge` also deletes the packages it stored). |

Env: `CONSENTI_DEMO_DIR`, `CONSENTI_DEMO_REGISTRY_PORT` (4873), `CONSENTI_DEMO_PORT` (3000).

## Local build vs. what is on npmjs

`.npmrc.demo` lists both registries for the `@consenti` scope; one is commented out. Edit it,
then run `prepare` again:

```ini
registry=https://registry.npmjs.org/

@consenti:registry=http://localhost:4873/                  # local build (default)
# @consenti:registry=https://registry.npmjs.org/           # published packages
```

The consumer's dependencies are `"@consenti/ui": "latest"` / `"@consenti/api": "latest"`, so they
resolve to whichever registry is active: the most recent local publish, or the released version.

## Why a copy, and why `.npmrc.demo`

npm ignores an `.npmrc` placed inside a workspace member (`npm warn config ignoring workspace
config`) and always symlinks workspace packages, so an `apps/docs/.npmrc` would silently do
nothing. The script therefore builds a project **outside** the workspace and drops the template in
as `.npmrc` there. The copy has its own `node_modules`, lockfile and data, and never reads
`apps/docs/.env`'s `CONSENTI_DATA_PATH`, so it cannot touch your dev data.

`@consenti/utils` is private (never published), so the copy vendors a tarball of its built output.
