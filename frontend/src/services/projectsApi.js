// Projects, their lifecycle and their members. Backed by the projects service (/api/projects).
import { api } from './apiClient.js'

/** Projects the user can see. Admin filters: status, archived ('true' | 'false'). */
export const listProjects = (filters) => api.get('projects', '/', filters)

export const getProject = (id) => api.get('projects', `/${id}`)

/** Admin only. details: name, manager_id, start_date, end_date, budget */
export const createProject = (details) => api.post('projects', '/', details)

/** Admin, or its manager (who can't change manager_id). Only open projects. */
export const updateProject = (id, changes) => api.put('projects', `/${id}`, changes)

/** Admin only. Archives the project; its history stays. */
export const archiveProject = (id) => api.delete('projects', `/${id}`)

/** Admin, or its manager, once every milestone is complete. */
export const completeProject = (id) => api.post('projects', `/${id}/complete`)

/** Admin only. */
export const abandonProject = (id) => api.post('projects', `/${id}/abandon`)

/** Admin only. The project comes back without a manager or members. */
export const unarchiveProject = (id) => api.post('projects', `/${id}/unarchive`)

/** Current members: [{ id, user: { id, name, job_title, display_id }, milestone, added_at }]. */
export const listMembers = (projectId) => api.get('projects', `/${projectId}/members`)

/** Admin, or the project's manager (their own employees only). milestoneId is optional. */
export const addMember = (projectId, employeeId, milestoneId = null) =>
  api.post('projects', `/${projectId}/members`, { employee_id: employeeId, milestone_id: milestoneId })

/** Moves a member to a milestone, or to none with milestoneId = null. */
export const assignMember = (projectId, memberId, milestoneId) =>
  api.put('projects', `/${projectId}/members/${memberId}`, { milestone_id: milestoneId })

export const removeMember = (projectId, memberId) => api.delete('projects', `/${projectId}/members/${memberId}`)

/** Members of several projects as one list; each member gets the project_id it belongs to. */
export async function listMembersForProjects(projectIds) {
  const lists = await Promise.all(projectIds.map(listMembers))
  return lists.flatMap((members, index) =>
    members.map((member) => ({ ...member, project_id: projectIds[index] })),
  )
}
