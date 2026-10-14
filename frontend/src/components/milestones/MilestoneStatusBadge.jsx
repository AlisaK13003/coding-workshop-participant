import { milestoneStatusLabel } from '../../utils/milestones.js'
import { Badge } from '../ui'

/** Badge for a milestone status from the API ('awaiting_review' → "Awaiting review"). */
export function MilestoneStatusBadge({ status }) {
  const label = milestoneStatusLabel(status)
  return <Badge tone={label}>{label}</Badge>
}
