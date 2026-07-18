import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * ProtectedRoute — wraps a route to require authentication.
 *
 * Props:
 *   children     — the protected component
 *   roles        — optional string[] of allowed roles. If omitted, any
 *                  authenticated user is allowed.
 *   redirectTo   — where to send unauthenticated users (default: '/login')
 */
export default function ProtectedRoute({
  children,
  roles,
  redirectTo = '/login',
}) {
  const { token, user } = useAuthStore()
  const location = useLocation()

  // Not logged in at all
  if (!token || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Logged in but role not yet selected (role is 'customer' by default but
  // roleSelectedAt is null → first-time user who hasn't picked a role)
  if (!user.roleSelectedAt && location.pathname !== '/role-select') {
    return <Navigate to="/role-select" replace />
  }

  // Role-based guard
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
