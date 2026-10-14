import { EmptyState } from '../ui'
import './DeadlineList.css'

/**
 * Upcoming dates with a calendar tile.
 * items: [{ key, day, month, title, detail, status, onClick? }]; status is any node (Badge,
 * Phase…). An item with onClick is a button (e.g. to open its project).
 */
export function DeadlineList({ items, emptyBody = 'Nothing is due soon.' }) {
  if (!items.length) return <EmptyState title="No upcoming dates" body={emptyBody} />
  return (
    <div className="deadline-list">
      {items.map((item) => {
        const Row = item.onClick ? 'button' : 'div'
        return (
          <Row
            key={item.key}
            className="deadline-row"
            {...(item.onClick && { type: 'button', onClick: item.onClick })}
          >
            <span className="date-tile">
              <b>{item.day}</b>
              {item.month}
            </span>
            <p>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </p>
            {item.status}
          </Row>
        )
      })}
    </div>
  )
}
