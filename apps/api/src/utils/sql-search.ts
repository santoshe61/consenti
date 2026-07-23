/**
 * Escapes SQL LIKE metacharacters (`%`, `_`, and the escape character itself) in user input so
 * it's matched literally, then appends a trailing `%` for prefix matching. Pair with
 * `ESCAPE '\'` in the query.
 *
 * Deliberately prefix-only (`value%`), never `%value%`: a leading wildcard can't use a B-tree
 * index on any SQL dialect, forcing a full table scan. The columns this searches (visitor IDs,
 * profile IDs, locale/country codes, audit actions) are opaque IDs or short codes that users
 * paste or type from the start, not prose — prefix matching fits the data and stays index-backed.
 */
export function likePrefix(input: string): string {
  return `${input.replace(/[\\%_]/g, ch => `\\${ch}`)}%`
}
