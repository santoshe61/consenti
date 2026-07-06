import type { ConsentiRuntimeConfig } from '@consenti/types'

declare global {
  interface Window {
    readonly __CONSENTI_CONFIG__?: Readonly<ConsentiRuntimeConfig>
  }
}
