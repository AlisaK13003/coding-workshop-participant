// The read-only record of who did what. Admins only. Backed by the activity service (/api/activity).
import { api } from './apiClient.js'

/**
 * Entries, newest first, as { items, total, limit, offset }.
 * Filters: actor_id, role, action (prefix such as 'project.'), project_id, entity_type, entity_id, limit, offset.
 */
export const listActivity = (filters) => api.get('activity', '/', filters)

export const getActivityEntry = (id) => api.get('activity', `/${id}`)
