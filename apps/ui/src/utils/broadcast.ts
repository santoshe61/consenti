/**
 * Cross-tab consent synchronisation via the `BroadcastChannel` API.
 *
 * When a user interacts with the consent widget in one tab (accept, deny, delete),
 * `ConsentiChannel` broadcasts the change to all other open tabs on the same origin.
 * Receiving tabs update their in-memory state and hide the banner without requiring
 * a page reload.
 *
 * `BroadcastChannel` is not available in very old browsers or in Safari < 15.4.
 * The `isSupported` guard ensures `ConsentiChannel` fails silently in those cases
 * — consent still works, cross-tab sync is just unavailable.
 */

import type { ConsentiMessage, ConsentValue } from '../types'
import { isClient } from './ssr'

export type { ConsentiMessage }

/**
 * Wrapper around the native `BroadcastChannel` API for Consenti inter-tab messaging.
 *
 * All tabs with an active `ConsentiSetup` instance for the same origin subscribe
 * on the shared channel name `'consenti'` and receive each other's consent events.
 */
export class ConsentiChannel {
  private channel: BroadcastChannel | null = null
  private onMessageCallback: ((msg: ConsentiMessage) => void) | undefined

  /** `true` when `BroadcastChannel` is available in the current environment. */
  get isSupported(): boolean {
    return isClient() && typeof BroadcastChannel !== 'undefined'
  }

  /**
   * Opens the `BroadcastChannel` and registers a message handler.
   * Silently no-ops if `BroadcastChannel` is unsupported.
   *
   * @param onMessage - Callback invoked with each received `ConsentiMessage`.
   */
  connect(onMessage: (msg: ConsentiMessage) => void): void {
    if (!this.isSupported) return
    this.onMessageCallback = onMessage
    this.channel = new BroadcastChannel('consenti')
    this.channel.onmessage = (event: MessageEvent<ConsentiMessage>) => {
      if (event.data?.type) {
        onMessage(event.data)
      }
    }
    this.channel.onmessageerror = () => {
      console.warn('[Consenti] BroadcastChannel message error — ignoring')
    }
  }

  /**
   * Posts a message to all other tabs connected to the `'consenti'` channel.
   * The sending tab does not receive its own message.
   *
   * @param message - The `ConsentiMessage` to broadcast.
   */
  send(message: ConsentiMessage): void {
    this.channel?.postMessage(message)
  }

  /** Closes the channel and removes the message callback. */
  disconnect(): void {
    this.channel?.close()
    this.channel = null
    this.onMessageCallback = void 0
  }
}

// Re-export so callers can use ConsentValue without going through types
export type { ConsentValue }
