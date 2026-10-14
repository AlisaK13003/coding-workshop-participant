import { Avatar } from './Avatar.jsx'
import './PersonCell.css'

/** Small avatar plus bold name, used in table cells. `badge` (e.g. "Archived") sits after the name. */
export function PersonCell({ name, badge = null }) {
  return (
    <div className="person-cell">
      <Avatar name={name} size="sm" />
      <strong>{name}</strong>
      {badge}
    </div>
  )
}
