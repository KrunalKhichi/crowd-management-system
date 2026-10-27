import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../authContext'

/**
 * Client-side gate for authenticated pages. This is a UX guard only; the backend
 * enforces authorization on every request.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  return <Outlet />
}
