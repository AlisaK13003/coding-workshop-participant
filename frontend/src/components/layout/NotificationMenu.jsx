import { Bell } from 'lucide-react'
import { useDisclosure } from '../../hooks/useDisclosure.js'
import { cx } from '../../utils/cx.js'
import './Popover.css'
import './NotificationMenu.css'

/**
 * Bell button with an unread dot and a dropdown list.
 * items: [{ id, title, detail, read }].
 * onSelect (optional): makes each item clickable; the menu closes afterwards.
 * onMarkAllRead (optional): adds a "Mark all read" link to the header.
 */
export function NotificationMenu({ items, onSelect, onMarkAllRead }) {
  const menu = useDisclosure()
  const unread = items.filter((item) => !item.read).length

  return (
    <div className="popover-wrap">
      <button
        className="icon-button"
        aria-label={`${unread} unread notifications`}
        aria-expanded={menu.isOpen}
        onClick={menu.toggle}
      >
        <Bell size={19} />
        {unread > 0 && <i />}
      </button>
      {menu.isOpen && (
        <div className="popover notification-popover">
          {onMarkAllRead ? (
            <div className="notice-header">
              <strong>Notifications</strong>
              <button onClick={onMarkAllRead}>Mark all read</button>
            </div>
          ) : (
            <strong>Notifications</strong>
          )}
          {items.length ? (
            items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onSelect={
                  onSelect &&
                  (() => {
                    onSelect(item)
                    menu.close()
                  })
                }
              />
            ))
          ) : (
            <p className="notification-empty">You’re all caught up.</p>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ item, onSelect }) {
  const className = cx('notice', !item.read && 'unread')
  const content = (
    <>
      <span />
      <p>
        <b>{item.title}</b>
        {item.detail}
      </p>
    </>
  )
  return onSelect ? (
    <button className={className} onClick={onSelect}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}
