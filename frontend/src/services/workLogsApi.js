// Logged workdays. Backed by the work-logs service (/api/work-logs).
import { api } from './apiClient.js'

/** Logs the user can see, newest first. Filters: project_id, employee_id, milestone_id, from, to (YYYY-MM-DD). */
export const listWorkLogs = (filters) => api.get('work-logs', '/', filters)

export const getWorkLog = (id) => api.get('work-logs', `/${id}`)

/** Employee: logs today's 8 hours on their current milestone of the project. */
export const logToday = (projectId, milestoneId) =>
  api.post('work-logs', '/', { project_id: projectId, milestone_id: milestoneId })

/** Admin: enters a past weekday for any employee. details: employee_id, project_id, milestone_id, work_date, hourly_rate? */
export const addWorkLog = (details) => api.post('work-logs', '/', details)

/** Admin: corrects a log's project_id, milestone_id or work_date. */
export const correctWorkLog = (id, changes) => api.put('work-logs', `/${id}`, changes)
