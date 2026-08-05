const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const ID_LENGTH = 8

/** Short, filesystem/URL-safe scan identifier — random rather than sequential (this is a
 * stateless CLI with no counter to persist across runs). 8 lowercase-alphanumeric characters
 * (~41 bits, 36^8 ≈ 2.8e12 possibilities) is as small as practical while keeping collision odds
 * negligible for how many scans a single machine will ever run locally. */
export function generateScanId(): string {
  let id = ''
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
  }
  return id
}
