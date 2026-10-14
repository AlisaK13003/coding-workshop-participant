import { EmptyState } from '../ui'
import './DeadlineList.css'

/**
 * Upcoming dates with a calendar tile.
 * items: [{ key, day, month, title, detail, status }]; status is any node (Badge, Phase…).
 */
export function DeadlineList({ items, emptyBody = 'Nothing is due soon.' }) {
  if (!items.length) return <EmptyState title="No upcoming dates" body={emptyBody} />
  return (
    <div className="deadline-list">
      {items.map((item) => (
        <div key={item.key}>
          <span className="date-tile">
            <b>{item.day}</b>
            {item.month}
          </span>
          <p>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </p>
          {item.status}
        </div>
      ))}
    </div>
  )
}
