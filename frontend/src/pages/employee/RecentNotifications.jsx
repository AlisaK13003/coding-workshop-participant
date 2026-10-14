import { formatDateTime } from '../../utils/format.js'
import './RecentNotifications.css'

/** Compact notification list; onSelect opens the related project. items from useNotifications. */
export function RecentNotifications({ items, onSelect }) {
  return (
    <div className="employee-notification-list">
      {items.map((notice) => (
        <button key={notice.id} onClick={() => onSelect(notice)}>
          <span className={notice.read ? undefined : 'unread-dot'} />
          <p>
            <strong>{notice.title}</strong>
            <small>
              {notice.detail ? `${notice.detail} · ` : ''}
              {formatDateTime(notice.created_at)}
            </small>
          </p>
        </button>
      ))}
    </div>
  )
}
