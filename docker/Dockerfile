FROM node:22-alpine

WORKDIR /app

# Pin the exact version on every release so this image stays in lockstep with the published
# package — bump alongside the changeset that ships a new @consenti/api version, the same way
# any other distributed artifact is kept in sync.
ARG CONSENTI_API_VERSION=latest

# @consenti/api itself has zero runtime dependencies (see AGENTS.md) — pg/mysql2/mongodb are
# optional peer deps for the postgresql/mysql/mongodb storage drivers, installed here so any
# CONSENTI_DB_DRIVER works out of the box without rebuilding the image. better-sqlite3 is
# deliberately excluded — it needs native compilation (node-gyp, unavailable on this base
# image without extra build tooling); the default 'node:sqlite' driver (built into Node
# 22.5+) covers the SQLite case with zero extra install instead.
RUN npm install --omit=dev \
    "@consenti/api@${CONSENTI_API_VERSION}" \
    pg \
    mysql2 \
    mongodb

COPY server.mjs ./

ENV NODE_ENV=production
ENV CONSENTI_DB_DRIVER=node:sqlite
ENV CONSENTI_DB_PATH=/data/consenti-data
VOLUME ["/data"]

EXPOSE 3000
CMD ["node", "server.mjs"]
