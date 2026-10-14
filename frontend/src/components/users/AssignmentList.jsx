import { FolderKanban } from 'lucide-react'
import './AssignmentList.css'

/**
 * A person's project assignments.
 * items: [{ key, title, detail, trailing, onClick? }]; trailing is any node (chevron, Badge…).
 * Items with onClick are buttons.
 */
export function AssignmentList({ items }) {
  return (
    <div className="assignment-list">
      {items.map((item) => {
        const content = (
          <>
            <FolderKanban size={18} />
            <p>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </p>
            {item.trailing}
          </>
        )
        return item.onClick ? (
          <button key={item.key} onClick={item.onClick}>
            {content}
          </button>
        ) : (
          <div key={item.key}>{content}</div>
        )
      })}
    </div>
  )
}
