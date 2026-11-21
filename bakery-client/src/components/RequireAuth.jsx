import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Route guard: only authenticated staff can access /admin/*.
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user || !['admin', 'employee'].includes(user.role)) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
