import { Avatar } from '../ui'
import './ActivityList.css'

/** Audit trail entries. items: [{ time, actor, role, action, record, summary }]. */
export function ActivityList({ items }) {
  return (
    <div className="activity-list">
      {items.map((item, index) => (
        <div key={`${item.time}-${index}`}>
          <span className="activity-avatar">
            <Avatar name={item.actor} size="sm" />
          </span>
          <p>
            <strong>{item.action}</strong>
            <span>
              {item.actor} · {item.role} · {item.record}
            </span>
            <small>{item.summary}</small>
          </p>
          <time>{item.time}</time>
        </div>
      ))}
    </div>
  )
}
