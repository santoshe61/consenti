#!/usr/bin/env bash
# Run apps/docs as a *consumer* of the locally built @consenti/ui and @consenti/api — the way a
# real user installs them — to see how a release candidate behaves before publishing it.
#
#   npm run docs:demo              # = all: registry → publish → prepare → build → start
#   npm run docs:demo -- <command>
#
# Commands
#   all        registry + publish + prepare + build + start (the full loop)
#   registry   start a local npm registry (Verdaccio in Docker) on localhost:$PORT
#   publish    build ui/api/utils, then publish ui + api to the local registry as
#              <version>-local.<timestamp> (never touches npmjs)
#   prepare    copy apps/docs to a throwaway project OUTSIDE the workspace, drop in .npmrc from
#              apps/docs/.npmrc.demo, point its deps at the registry, and `npm install`
#   build      production `next build` of that copy + the same post-build steps as DEPLOY.sh
#   start      run the production server from that build
#   dev        run `next dev` from that copy instead of a production build
#   reset      delete the demo's own data (JSON storage) so the next start is a fresh install
#   down       stop the local registry (add --purge to also delete its stored packages)
#   status     show registry state and what the consumer copy installed
#
# Why a copy: apps/docs is an npm workspace member, so npm ignores an .npmrc placed in it and
# always symlinks the workspace packages. A copy outside the workspace resolves @consenti/* from
# whichever registry apps/docs/.npmrc.demo points at — local Verdaccio (default) or npmjs
# (flip the commented line).
#
# Env: CONSENTI_DEMO_DIR (default $TMPDIR/consenti-docs-demo; the app lands in <dir>/apps/docs), CONSENTI_DEMO_REGISTRY_PORT
#      (4873), CONSENTI_DEMO_PORT (docs server port, 3000).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_ROOT="${CONSENTI_DEMO_DIR:-${TMPDIR:-/tmp}/consenti-docs-demo}"
DEMO_ROOT="${DEMO_ROOT%/}"
# Mirrors the repo layout (<root>/apps/docs + <root>/CHANGELOG.md) because the docs changelog page
# reads ../../CHANGELOG.md relative to the app folder.
DEMO_DIR="${DEMO_ROOT}/apps/docs"
REG_PORT="${CONSENTI_DEMO_REGISTRY_PORT:-4873}"
REG_URL="http://localhost:${REG_PORT}"
APP_PORT="${CONSENTI_DEMO_PORT:-3000}"
CONTAINER="consenti-demo-registry"
VOLUME="consenti-demo-registry-storage"
STATE_DIR="${DEMO_ROOT}.state"
DATA_DIR="${DEMO_ROOT}/data"   # isolated from your dev data (apps/docs/.env points CONSENTI_DATA_PATH at the repo)

log()  { printf '\033[1;36m[docs-demo]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[docs-demo]\033[0m %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "'$1' is required but not installed"; }

registry_up_check() { curl -fsS "${REG_URL}/-/ping" >/dev/null 2>&1; }

cmd_registry() {
  need docker; need curl
  if registry_up_check; then log "registry already running at ${REG_URL}"; return; fi
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  log "starting Verdaccio on ${REG_URL}"
  docker run -d --name "$CONTAINER" \
    -p "127.0.0.1:${REG_PORT}:4873" \
    -v "${ROOT}/scripts/docs-demo/verdaccio.yaml:/verdaccio/conf/config.yaml:ro" \
    -v "${VOLUME}:/verdaccio/storage" \
    verdaccio/verdaccio:5 >/dev/null
  for _ in $(seq 1 40); do registry_up_check && { log "registry is up"; return; }; sleep 1; done
  die "registry did not become ready — see: docker logs ${CONTAINER}"
}

cmd_down() {
  need docker
  docker rm -f "$CONTAINER" >/dev/null 2>&1 && log "registry stopped" || log "registry was not running"
  if [ "${1:-}" = "--purge" ]; then docker volume rm "$VOLUME" >/dev/null 2>&1 && log "stored packages deleted" || true; fi
}

registry_token() {
  # Verdaccio signs the user in (or creates it) and returns an auth token.
  curl -fsS -X PUT -H 'content-type: application/json' \
    -d '{"name":"demo","password":"demo-password-123","email":"demo@example.com"}' \
    "${REG_URL}/-/user/org.couchdb.user:demo" \
    | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).token)'
}

cmd_publish() {
  need node; need npm; need curl
  registry_up_check || die "no registry at ${REG_URL} — run: npm run docs:demo -- registry"
  case "$REG_URL" in http://localhost:*|http://127.0.0.1:*) ;; *) die "refusing to publish to non-local registry ${REG_URL}";; esac

  log "building utils, ui and api"
  (cd "$ROOT" && npx turbo build --filter=@consenti/utils --filter=@consenti/ui --filter=@consenti/api)

  local base stamp token
  base="$(node -p "require('${ROOT}/apps/api/package.json').version")"
  stamp="$(date +%s)"
  LOCAL_VERSION="${base}-local.${stamp}"
  token="$(registry_token)"
  mkdir -p "$STATE_DIR"

  for pkg in api ui; do
    local stage; stage="$(mktemp -d)"
    log "packing apps/${pkg} → ${LOCAL_VERSION}"
    (cd "$ROOT/apps/${pkg}" && npm pack --silent --pack-destination "$stage" >/dev/null)
    tar -xzf "$stage"/*.tgz -C "$stage"
    node -e '
      const fs = require("fs"), p = process.argv[1] + "/package/package.json";
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      j.version = process.argv[2];
      delete j.publishConfig;
      fs.writeFileSync(p, JSON.stringify(j, null, 2));
    ' "$stage" "$LOCAL_VERSION"
    printf 'registry=%s/\n//localhost:%s/:_authToken=%s\n' "$REG_URL" "$REG_PORT" "$token" > "$stage/.npmrc"
    npm publish "$stage/package" --registry "$REG_URL/" --tag latest --userconfig "$stage/.npmrc" >/dev/null
    log "published @consenti/${pkg}@${LOCAL_VERSION} to ${REG_URL}"
    rm -rf "$stage"
  done
  printf '%s\n' "$LOCAL_VERSION" > "$STATE_DIR/local-version"
}

cmd_prepare() {
  need node; need npm; need rsync
  local tpl="$ROOT/apps/docs/.npmrc.demo"
  [ -f "$tpl" ] || die "missing $tpl"

  log "preparing consumer copy in ${DEMO_DIR}"
  mkdir -p "$DEMO_DIR/vendor"
  cp "$ROOT/CHANGELOG.md" "$DEMO_ROOT/CHANGELOG.md"
  rsync -a --delete \
    --exclude node_modules --exclude .next --exclude .turbo --exclude '*.tsbuildinfo' \
    --exclude '*-deploy.tar.gz' --exclude .npmrc --exclude .npmrc.demo --exclude vendor \
    "$ROOT/apps/docs/" "$DEMO_DIR/"
  rm -f "$DEMO_DIR"/vendor/*.tgz

  sed "s#localhost:4873#localhost:${REG_PORT}#g" "$tpl" > "$DEMO_DIR/.npmrc"
  cp "$ROOT/tsconfig.base.json" "$DEMO_DIR/tsconfig.base.json"
  # Never inherit a developer's data path from .env — the demo keeps its own data in $DATA_DIR.
  if [ -f "$DEMO_DIR/.env" ]; then
    grep -v '^CONSENTI_DATA_PATH=' "$DEMO_DIR/.env" > "$DEMO_DIR/.env.tmp" || true
    mv "$DEMO_DIR/.env.tmp" "$DEMO_DIR/.env"
  fi

  # @consenti/utils is private (never published) — vendor its BUILT output as a tarball. It has no
  # `files` field and dist/ is gitignored, so `npm pack` on the package dir would skip dist.
  [ -d "$ROOT/packages/utils/dist" ] || (cd "$ROOT" && npx turbo build --filter=@consenti/utils)
  local ustage; ustage="$(mktemp -d)"
  cp "$ROOT/packages/utils/package.json" "$ustage/" && cp -R "$ROOT/packages/utils/dist" "$ustage/dist"
  node -e 'const fs=require("fs"),p=process.argv[1]+"/package.json",j=JSON.parse(fs.readFileSync(p,"utf8"));j.files=["dist"];delete j.scripts;fs.writeFileSync(p,JSON.stringify(j,null,2))' "$ustage"
  (cd "$ustage" && npm pack --silent --pack-destination "$DEMO_DIR/vendor" >/dev/null)
  rm -rf "$ustage"
  local utils_tgz; utils_tgz="$(cd "$DEMO_DIR/vendor" && ls consenti-utils-*.tgz | head -1)"

  node -e '
    const fs = require("fs"), dir = process.argv[1], utils = process.argv[2];
    const pj = dir + "/package.json", pkg = JSON.parse(fs.readFileSync(pj, "utf8"));
    pkg.name = "consenti-docs-demo";
    // "latest" resolves to whatever the active @consenti registry in .npmrc serves: the most
    // recent local publish (Verdaccio) or the released version (npmjs).
    pkg.dependencies["@consenti/ui"] = "latest";
    pkg.dependencies["@consenti/api"] = "latest";
    pkg.dependencies["@consenti/utils"] = "file:./vendor/" + utils;
    fs.writeFileSync(pj, JSON.stringify(pkg, null, 2) + "\n");
    const tj = dir + "/tsconfig.json", ts = JSON.parse(fs.readFileSync(tj, "utf8"));
    ts.extends = "./tsconfig.base.json";
    fs.writeFileSync(tj, JSON.stringify(ts, null, 2) + "\n");
  ' "$DEMO_DIR" "$utils_tgz"

  log ".npmrc in use:"; sed 's/^/    /' "$DEMO_DIR/.npmrc" | grep -v '^    *$' | grep -v '^    #' || true
  (cd "$DEMO_DIR" && rm -rf node_modules package-lock.json && npm install --no-audit --no-fund)
  log "installed @consenti packages:"
  (cd "$DEMO_DIR" && npm ls @consenti/ui @consenti/api @consenti/utils --depth=0 2>/dev/null | sed 's/^/    /') || true
}

cmd_build() {
  [ -d "$DEMO_DIR/node_modules" ] || die "consumer copy not prepared — run: npm run docs:demo -- prepare"
  log "production build (next build)"
  (cd "$DEMO_DIR" && npm run build)

  # Same post-build steps apps/docs/DEPLOY.sh performs for the real deployment.
  local sa="$DEMO_DIR/.next/standalone" server appdir
  server="$(cd "$sa" && find . -name server.js -not -path '*/node_modules/*' | head -1)"
  [ -n "$server" ] || die "no server.js found in ${sa}"
  appdir="$sa/$(dirname "$server")"
  cp -R "$DEMO_DIR/public" "$appdir/public"
  mkdir -p "$appdir/.next" && cp -R "$DEMO_DIR/.next/static" "$appdir/.next/static"
  local dash="$sa/node_modules/@consenti/api/dist/dashboard"
  if [ -d "$dash" ]; then
    log "dashboard bundle already traced into the standalone output"
  else
    log "dashboard bundle NOT traced — copying it in, as DEPLOY.sh does"
    cp -R "$DEMO_DIR/node_modules/@consenti/api/dist/dashboard" "$dash"
  fi
  mkdir -p "$STATE_DIR" && printf '%s\n' "$appdir" > "$STATE_DIR/appdir"
  log "build ready: ${appdir}"
}

cmd_start() {
  local appdir; appdir="$(cat "$STATE_DIR/appdir" 2>/dev/null || true)"
  [ -n "$appdir" ] && [ -f "$appdir/server.js" ] || die "no build found — run: npm run docs:demo -- build"
  # The API refuses to boot with NODE_ENV=production and no signing secret (see SECURITY.md); a real
  # deployment sets this in its environment. Generate a throwaway one unless you provide your own.
  if [ -z "${CONSENTI_DATA_SIGNING_HASH:-}" ]; then
    CONSENTI_DATA_SIGNING_HASH="$(node -p 'require("crypto").randomBytes(32).toString("hex")')"
    log "CONSENTI_DATA_SIGNING_HASH not set — generated a throwaway one for this run"
  fi
  log "docs (production build) → http://localhost:${APP_PORT}   dashboard → http://localhost:${APP_PORT}/consenti"
  mkdir -p "$DATA_DIR"
  (cd "$appdir" && CONSENTI_DATA_PATH="$DATA_DIR" CONSENTI_DATA_SIGNING_HASH="$CONSENTI_DATA_SIGNING_HASH" PORT="$APP_PORT" HOSTNAME=127.0.0.1 NODE_ENV=production node server.js)
}

cmd_dev() {
  [ -d "$DEMO_DIR/node_modules" ] || die "consumer copy not prepared — run: npm run docs:demo -- prepare"
  log "next dev from the consumer copy → http://localhost:${APP_PORT}"
  mkdir -p "$DATA_DIR"
  (cd "$DEMO_DIR" && CONSENTI_DATA_PATH="$DATA_DIR" npx next dev --port "$APP_PORT" --webpack)
}

cmd_reset() { rm -rf "$DATA_DIR" && log "demo data deleted (${DATA_DIR})"; }

cmd_status() {
  if registry_up_check; then log "registry: up at ${REG_URL}"; else log "registry: down"; fi
  [ -f "$STATE_DIR/local-version" ] && log "last local publish: $(cat "$STATE_DIR/local-version")"
  if [ -d "$DEMO_DIR/node_modules" ]; then
    (cd "$DEMO_DIR" && npm ls @consenti/ui @consenti/api @consenti/utils --depth=0 2>/dev/null | sed 's/^/    /') || true
  else
    log "consumer copy: not prepared (${DEMO_DIR})"
  fi
}

case "${1:-all}" in
  all)      cmd_registry; cmd_publish; cmd_prepare; cmd_build; cmd_start ;;
  registry) cmd_registry ;;
  publish)  cmd_publish ;;
  prepare)  cmd_prepare ;;
  build)    cmd_build ;;
  start)    cmd_start ;;
  dev)      cmd_dev ;;
  reset)    cmd_reset ;;
  down)     cmd_down "${2:-}" ;;
  status)   cmd_status ;;
  -h|--help|help) sed -n '2,32p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' ;;
  *) die "unknown command '$1' — try: help" ;;
esac
