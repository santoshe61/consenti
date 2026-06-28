// Backward-compat re-export. Prefer the explicit driver names:
//   driver: 'better-sqlite3'    — same implementation, clearer intent
//   driver: 'node-sqlite3-wasm' — zero compilation, Node 20+
//   driver: 'node:sqlite'       — built-in, Node 22.5+
export { BetterSqlite3Adapter as SQLiteAdapter } from './better-sqlite3.adapter'
