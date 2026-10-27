import { createContext, useContext } from 'react'
import type { Credentials } from './services/authService'
import type { Session } from './session'
import type { LogoutReason } from './sessionStore'

export type { LogoutReason }

export interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  /** Why the user was signed out automatically, for the login screen message. */
  logoutReason: LogoutReason | null
  login: (credentials: Credentials) => Promise<void>
  logout: (reason?: LogoutReason | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
