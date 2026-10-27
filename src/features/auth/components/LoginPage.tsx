import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { BrandMark } from '@/components/layout/BrandMark'
import { isApiError } from '@/services/api/errors'
import { useAuth } from '../authContext'
import type { LoginFormValues } from '../schemas/loginSchema'
import { LoginForm } from './LoginForm'
import styles from './LoginPage.module.css'
import { safeRedirectPath } from '../redirect'

const SESSION_NOTICE = {
  expired: 'Your session has expired. Please sign in again.',
  unauthorized: 'You were signed out. Please sign in again.',
} as const

export default function LoginPage() {
  const { login, isAuthenticated, logoutReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [authError, setAuthError] = useState<string | null>(null)
  const from = safeRedirectPath((location.state as { from?: unknown } | null)?.from)

  if (isAuthenticated) return <Navigate to={from} replace />

  async function handleSubmit(values: LoginFormValues) {
    setAuthError(null)
    try {
      await login(values)
      await navigate(from, { replace: true })
    } catch (error) {
      setAuthError(
        isApiError(error) && error.kind === 'unauthorized'
          ? 'Invalid email or password.'
          : isApiError(error)
            ? error.message
            : 'Something went wrong. Please try again.',
      )
    }
  }

  const notice = authError ?? (logoutReason ? SESSION_NOTICE[logoutReason] : null)

  return (
    <div className={styles.page}>
      <main className={styles.layout}>
        <h1 className={styles.welcome}>
          Welcome to the <br />
          Crowd Management System
        </h1>
        <section className={styles.card} aria-labelledby="login-heading">
          <header className={styles.cardHeader}>
            <BrandMark />
            <h2 id="login-heading" className="visually-hidden">
              Sign in
            </h2>
          </header>
          <LoginForm onSubmit={handleSubmit} formError={notice} />
        </section>
      </main>
    </div>
  )
}
