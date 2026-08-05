/** Re-exported from `@consenti/utils`'s shared ANSI color engine (originally
 * `apps/test-runner`'s `term-color.ts`, moved there so every CLI in the monorepo colors its
 * terminal output the same way instead of each maintaining its own copy) — this file is scanner's
 * single import point for it, matching the convention `apps/test-runner`'s own `log.ts` uses. */
export { color, formatLog } from '@consenti/utils'
