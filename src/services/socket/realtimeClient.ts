import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client'
import { AUTH_ERROR_MESSAGE, serverEventSchemas, type ServerEventName, type ServerEvents } from './events'

export type ConnectionStatus =
  | 'idle' // not started (signed out)
  | 'connecting'
  | 'connected'
  | 'reconnecting' // dropped; socket.io is retrying with backoff
  | 'disconnected' // closed by the server or retries exhausted; manual reconnect available
  | 'unauthorized' // handshake rejected: token missing/invalid/expired

export type SocketFactory = (url: string, options: Partial<ManagerOptions & SocketOptions>) => Socket

type Handler<E extends ServerEventName> = (payload: ServerEvents[E]) => void

interface ConnectOptions {
  onAuthError?: () => void
}

/**
 * Owns the single Socket.IO connection for the app.
 *
 * - `connect()` is idempotent per token, so React re-renders / StrictMode cannot open
 *   duplicate connections.
 * - Exactly one native listener is registered per event; app subscribers are kept in
 *   Sets, so subscribing twice never duplicates socket listeners and unsubscribing is O(1).
 * - Payloads are validated; malformed events are dropped and never reach the UI.
 */
export class RealtimeClient {
  private socket: Socket | null = null
  private token: string | null = null
  private status: ConnectionStatus = 'idle'
  private readonly statusListeners = new Set<() => void>()
  private readonly handlers: { [E in ServerEventName]: Set<Handler<E>> } = {
    alert: new Set(),
    live_occupancy: new Set(),
  }
  private readonly reconnectListeners = new Set<() => void>()

  private readonly url: string
  private readonly loadFactory: () => Promise<SocketFactory>

  constructor(url: string, loadFactory: () => Promise<SocketFactory>) {
    this.url = url
    this.loadFactory = loadFactory
  }

  /** Monotonic id so a disconnect() during the async factory import wins. */
  private generation = 0

  async connect(token: string, options: ConnectOptions = {}): Promise<void> {
    if (this.token === token && this.socket) return
    this.disconnect()
    const generation = ++this.generation
    this.token = token
    this.setStatus('connecting')

    const factory = await this.loadFactory()
    if (generation !== this.generation) return

    const socket = factory(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    })
    this.socket = socket
    let hasConnected = false

    socket.on('connect', () => {
      if (hasConnected)
        this.reconnectListeners.forEach((fn) => {
          fn()
        })
      hasConnected = true
      this.setStatus('connected')
    })
    socket.on('disconnect', (reason) => {
      // Server-initiated disconnects are not retried by socket.io; everything else is.
      this.setStatus(
        reason === 'io client disconnect' ? 'idle' : socket.active ? 'reconnecting' : 'disconnected',
      )
    })
    socket.on('connect_error', (err) => {
      if (err.message === AUTH_ERROR_MESSAGE) {
        this.setStatus('unauthorized')
        options.onAuthError?.()
        return
      }
      this.setStatus(socket.active ? 'reconnecting' : 'disconnected')
    })
    socket.io.on('reconnect_attempt', () => {
      this.setStatus('reconnecting')
    })
    socket.io.on('reconnect_failed', () => {
      this.setStatus('disconnected')
    })

    for (const event of Object.keys(serverEventSchemas) as ServerEventName[]) {
      socket.on(event, (raw: unknown) => {
        this.dispatch(event, raw)
      })
    }
  }

  /** Manual retry after the server closed the connection or retries were exhausted. */
  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.setStatus('connecting')
      this.socket.connect()
    }
  }

  disconnect(): void {
    this.generation++
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.io.removeAllListeners()
      this.socket.disconnect()
    }
    this.socket = null
    this.token = null
    this.setStatus('idle')
  }

  subscribe<E extends ServerEventName>(event: E, handler: Handler<E>): () => void {
    const set = this.handlers[event] as Set<Handler<E>>
    set.add(handler)
    return () => {
      set.delete(handler)
    }
  }

  /** Fires after a successful re-connection (not the first connect), to resync REST data. */
  onReconnect(fn: () => void): () => void {
    this.reconnectListeners.add(fn)
    return () => {
      this.reconnectListeners.delete(fn)
    }
  }

  getStatus = (): ConnectionStatus => this.status

  subscribeStatus = (listener: () => void): (() => void) => {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /** Number of app-level handlers for an event (used by tests and diagnostics). */
  handlerCount(event: ServerEventName): number {
    return this.handlers[event].size
  }

  private dispatch(event: ServerEventName, raw: unknown): void {
    if (event === 'alert') {
      const parsed = serverEventSchemas.alert.safeParse(raw)
      if (parsed.success)
        this.handlers.alert.forEach((h) => {
          h(parsed.data)
        })
      else this.dropped(event)
    } else {
      const parsed = serverEventSchemas.live_occupancy.safeParse(raw)
      if (parsed.success)
        this.handlers.live_occupancy.forEach((h) => {
          h(parsed.data)
        })
      else this.dropped(event)
    }
  }

  private dropped(event: ServerEventName): void {
    if (import.meta.env.DEV) console.warn(`[realtime] dropped malformed "${event}" event`)
  }

  private setStatus(next: ConnectionStatus): void {
    if (next === this.status) return
    this.status = next
    this.statusListeners.forEach((fn) => {
      fn()
    })
  }
}
