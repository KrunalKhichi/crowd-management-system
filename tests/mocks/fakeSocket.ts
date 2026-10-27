import type { Socket } from 'socket.io-client'
import { vi } from 'vitest'

type Listener = (...args: unknown[]) => void

/** Minimal stand-in for a socket.io-client Socket, enough to drive RealtimeClient. */
export class FakeSocket {
  connected = false
  active = true
  readonly listeners = new Map<string, Listener[]>()
  readonly managerListeners = new Map<string, Listener[]>()
  readonly connect = vi.fn(() => this)
  readonly disconnect = vi.fn(() => {
    this.connected = false
    this.active = false
    return this
  })

  readonly io = {
    on: (event: string, fn: Listener) => {
      this.managerListeners.set(event, [...(this.managerListeners.get(event) ?? []), fn])
      return this.io
    },
    removeAllListeners: () => {
      this.managerListeners.clear()
      return this.io
    },
  }

  on(event: string, fn: Listener) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), fn])
    return this
  }

  removeAllListeners() {
    this.listeners.clear()
    return this
  }

  /** Simulate a server → client event (or a lifecycle event like "connect"). */
  serverEmit(event: string, ...args: unknown[]) {
    if (event === 'connect') this.connected = true
    this.listeners.get(event)?.forEach((fn) => {
      fn(...args)
    })
  }

  managerEmit(event: string, ...args: unknown[]) {
    this.managerListeners.get(event)?.forEach((fn) => {
      fn(...args)
    })
  }

  listenerCount(event: string) {
    return this.listeners.get(event)?.length ?? 0
  }

  asSocket(): Socket {
    return this as unknown as Socket
  }
}

/** Factory recording every socket it creates. */
export function createFakeFactory() {
  const sockets: FakeSocket[] = []
  const options: unknown[] = []
  const factory = vi.fn((_url: string, opts: unknown) => {
    const s = new FakeSocket()
    sockets.push(s)
    options.push(opts)
    return s.asSocket()
  })
  return { factory, sockets, options, latest: () => sockets.at(-1)! }
}
