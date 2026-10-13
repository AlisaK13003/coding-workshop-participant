import { Avatar } from './Avatar.jsx'
import './PersonCell.css'

/** Small avatar plus bold name, used in table cells. */
export function PersonCell({ name }) {
  return (
    <div className="person-cell">
      <Avatar name={name} size="sm" />
      <strong>{name}</strong>
    </div>
  )
}
