import { FolderKanban } from 'lucide-react'
import './AssignmentList.css'

/**
 * A person's project assignments.
 * items: [{ key, title, detail, trailing }]; trailing is any node (chevron, Badge…).
 */
export function AssignmentList({ items }) {
  return (
    <div className="assignment-list">
      {items.map((item) => (
        <div key={item.key}>
          <FolderKanban size={18} />
          <p>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </p>
          {item.trailing}
        </div>
      ))}
    </div>
  )
}
