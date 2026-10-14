import { projectStatusLabel } from '../../utils/projects.js'
import { Badge } from '../ui'

/** Badge for a project status from the API ('in_progress' → "In progress"). */
export function ProjectStatusBadge({ status }) {
  const label = projectStatusLabel(status)
  return <Badge tone={label}>{label}</Badge>
}
