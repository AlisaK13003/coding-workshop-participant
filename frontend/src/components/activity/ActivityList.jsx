import { Avatar, EmptyState } from '../ui'
import './ActivityList.css'

/** Audit trail entries. items: [{ id, time, actor, role, action, record, summary }] (see utils/activity.js). */
export function ActivityList({ items }) {
  if (!items.length) {
    return <EmptyState title="No activity found" body="Changes made in the workspace appear here." />
  }
  return (
    <div className="activity-list">
      {items.map((item) => (
        <div key={item.id}>
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
