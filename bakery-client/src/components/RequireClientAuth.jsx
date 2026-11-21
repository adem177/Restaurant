import { Navigate, useLocation } from 'react-router-dom'
import { useClientAuth } from '../context/ClientAuthContext'

/**
 * Route guard for client-only pages (e.g. /reservation).
 * Redirects to /login when not authenticated.
 */
export default function RequireClientAuth({ children }) {
  const { user, loading } = useClientAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
