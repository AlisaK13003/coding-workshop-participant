import { useCallback, useState } from 'react'

/**
 * Notification list state. Items look like { id, title, detail, read }
 * plus any extra fields a role needs (e.g. projectId).
 */
export function useNotifications(initialItems) {
  const [notifications, setNotifications] = useState(initialItems)

  const markRead = useCallback(
    (id) =>
      setNotifications((items) =>
        items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      ),
    [],
  )

  const markAllRead = useCallback(
    () =>
      setNotifications((items) =>
        items.map((item) => ({ ...item, read: true })),
      ),
    [],
  )

  const addNotification = useCallback(
    (notification) => setNotifications((items) => [notification, ...items]),
    [],
  )

  const removeNotifications = useCallback(
    (predicate) =>
      setNotifications((items) => items.filter((item) => !predicate(item))),
    [],
  )

  const unreadCount = notifications.filter((item) => !item.read).length

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    addNotification,
    removeNotifications,
  }
}
