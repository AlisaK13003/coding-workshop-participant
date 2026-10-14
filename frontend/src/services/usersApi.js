// People, roles and reporting lines. Backed by the users service (/api/users).
import { api } from './apiClient.js'

/** Admin: everyone (filters: role, manager_id, include_archived). Manager: themselves and their employees. */
export const listUsers = (filters) => api.get('users', '/', filters)

/** One user, plus their current projects ({ project, milestone }) for employees. */
export const getUser = (id) => api.get('users', `/${id}`)

/** Admin only. details: first_name, last_name, username?, email, job_title, role, password, manager_id?, annual_salary? */
export const createUser = (details) => api.post('users', '/', details)

/** Admin: any field. Manager: their own employees, except role and manager_id. */
export const updateUser = (id, changes) => api.put('users', `/${id}`, changes)

/** Admin only. Archives (nobody is ever deleted). */
export const archiveUser = (id) => api.delete('users', `/${id}`)

export const restoreUser = (id) => api.post('users', `/${id}/restore`)

/** Admin, or the employee's own manager: sets a new password. */
export const resetPassword = (id, password) => api.post('users', `/${id}/password`, { password })
