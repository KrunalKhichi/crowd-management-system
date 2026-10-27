import { configureHttpClient } from '@/services/api/httpClient'
import { isExpired, loadSession, saveSession, type Session } from './session'

export type LogoutReason = 'expired' | 'unauthorized'

interface AuthState {
  session: Session | null
  logoutReason: LogoutReason | null
}

/**
 * Framework-agnostic session store. The HTTP client reads the token from here
 * synchronously, so the very first request after a reload is authenticated, and
 * React subscribes through useSyncExternalStore.
 */
let state: AuthState = { session: loadSession(), logoutReason: null }
const listeners = new Set<() => void>()
let expiryTimer: ReturnType<typeof setTimeout> | undefined

function emit(next: AuthState) {
  state = next
  saveSession(next.session)
  scheduleExpiry()
  listeners.forEach((fn) => {
    fn()
  })
}

function scheduleExpiry() {
  clearTimeout(expiryTimer)
  const s = state.session
  if (!s?.expiresAt) return
  if (isExpired(s)) {
    queueMicrotask(() => {
      endSession('expired')
    })
    return
  }
  // The backend issues 1-hour JWTs without a refresh flow: sign out when it lapses.
  expiryTimer = setTimeout(() => {
    endSession('expired')
  }, s.expiresAt - Date.now())
}

export const sessionStore = {
  getState: (): AuthState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function startSession(session: Session): void {
  emit({ session, logoutReason: null })
}

export function endSession(reason: LogoutReason | null = null): void {
  if (!state.session && state.logoutReason === reason) return
  emit({ session: null, logoutReason: reason })
}

configureHttpClient({
  getToken: () => state.session?.token ?? null,
  onAuthFailure: (reason) => {
    if (state.session) endSession(reason)
  },
})
scheduleExpiry()
