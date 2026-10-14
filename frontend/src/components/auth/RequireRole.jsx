import { Navigate } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.js'
import { HOME_BY_ROLE } from '../../services/authApi.js'

/**
 * Shows its children only to a signed-in user with the given role. Signed-out
 * visitors go to sign-in; other roles go to their own workspace. The backend
 * enforces the same rules — this only keeps people out of screens they can't use.
 */
export default function RequireRole({ role, children }) {
  const session = useSession()
  if (!session) return <Navigate to="/" replace />
  if (session.user.role !== role) return <Navigate to={HOME_BY_ROLE[session.user.role] ?? '/'} replace />
  return children
}
