// The signed-in user's notifications. Backed by the notifications service (/api/notifications).
import { api } from './apiClient.js'

/** { items, unread_count }, newest first. Pass { unread: true } for unread ones only. */
export const listNotifications = (filters) => api.get('notifications', '/', filters)

export const markNotificationRead = (id) => api.post('notifications', `/${id}/read`)

/** { updated: n } */
export const markAllNotificationsRead = () => api.post('notifications', '/read-all')
