import { useEffect } from 'react'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationsApi.js'
import { useApiQuery } from './useApiQuery.js'
import { useToast } from './useToast.js'

// New notifications come from other people's actions, so the list is checked regularly.
const POLL_MS = 30000

/**
 * The signed-in user's unread notifications from the API, shared by every workspace; once
 * read they drop out of the list. Items look like { id, title, detail, project_id, milestone_id, created_at, read }.
 */
export function useNotifications() {
  const query = useApiQuery(() => listNotifications({ unread: true }), [])
  const { showToast } = useToast()
  const { reload } = query

  useEffect(() => {
    const timer = window.setInterval(reload, POLL_MS)
    return () => window.clearInterval(timer)
  }, [reload])

  // Marking read isn't worth a success toast; only failures are shown.
  const send = (request) =>
    request.then(reload, (error) => showToast(error.message, 'error'))

  return {
    items: query.data?.items ?? [],
    unreadCount: query.data?.unread_count ?? 0,
    markRead: (id) => send(markNotificationRead(id)),
    markAllRead: () => send(markAllNotificationsRead()),
  }
}
