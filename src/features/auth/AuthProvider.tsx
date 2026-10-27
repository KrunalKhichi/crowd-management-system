import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './authContext'
import { login as loginRequest, type Credentials } from './services/authService'
import { createSession } from './session'
import { endSession, sessionStore, startSession } from './sessionStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { session, logoutReason } = useSyncExternalStore(sessionStore.subscribe, sessionStore.getState)

  // Whenever the session ends (logout, expiry, 401/403), drop all cached server data
  // so nothing from the previous session is shown to the next user.
  useEffect(() => {
    if (!session) queryClient.clear()
  }, [session, queryClient])

  const login = useCallback(async (credentials: Credentials) => {
    const { token } = await loginRequest(credentials)
    startSession(createSession(token, credentials.email))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, logoutReason, login, logout: endSession }),
    [session, logoutReason, login],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
