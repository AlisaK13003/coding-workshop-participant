import { Search } from 'lucide-react'
import './EmptyState.css'

/** Placeholder shown when a list or search has no results. */
export function EmptyState({ title, body, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Search size={22} />
      </span>
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  )
}
