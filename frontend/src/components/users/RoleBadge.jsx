import { roleLabel } from '../../utils/users.js'
import { Badge } from '../ui'

/** Badge for a user's role ('manager' → "Manager"). */
export function RoleBadge({ role }) {
  const label = roleLabel(role)
  return <Badge tone={label}>{label}</Badge>
}
