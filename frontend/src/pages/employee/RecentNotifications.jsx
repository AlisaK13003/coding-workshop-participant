import './RecentNotifications.css'

/** Compact read-only notification list. items: [{ id, title, detail, read }]. */
export function RecentNotifications({ items }) {
  return (
    <div className="employee-notification-list">
      {items.map((notice) => (
        <div key={notice.id}>
          <span className={notice.read ? undefined : 'unread-dot'} />
          <p>
            <strong>{notice.title}</strong>
            <small>{notice.detail}</small>
          </p>
        </div>
      ))}
    </div>
  )
}
