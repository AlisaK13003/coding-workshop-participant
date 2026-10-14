// Milestones, their prerequisites, completion and review requests.
// Backed by the milestones service (/api/milestones).
import { api } from './apiClient.js'

/** A project's milestones, each with status, prerequisite_ids, members, hours and pending_review. */
export const listMilestones = (projectId) => api.get('milestones', '/', { project_id: projectId })

/** One milestone plus its review history (newest first) as `reviews`. */
export const getMilestone = (id) => api.get('milestones', `/${id}`)

/** details: project_id, name, start_date, end_date, prerequisite_ids? */
export const createMilestone = (details) => api.post('milestones', '/', details)

/** changes: name, start_date, end_date (prerequisites go through setPrerequisites). */
export const updateMilestone = (id, changes) => api.put('milestones', `/${id}`, changes)

/** Only milestones with no history (work logs, members, reviews…) can be deleted. */
export const deleteMilestone = (id) => api.delete('milestones', `/${id}`)

/** Replaces the milestone's prerequisites. */
export const setPrerequisites = (id, prerequisiteIds) =>
  api.put('milestones', `/${id}/dependencies`, { prerequisite_ids: prerequisiteIds })

/** Completes it and moves its members to the destination milestone (or to none). */
export const completeMilestone = (id, destinationId = null) =>
  api.post('milestones', `/${id}/complete`, { destination_milestone_id: destinationId })

/** Employee on the milestone: ask the manager to review it as done. */
export const requestReview = (id) => api.post('milestones', `/${id}/reviews`)

/**
 * Admin or the project's manager. decision: 'accepted' | 'kept_open'.
 * Accepting completes the milestone and can move its members to destinationId.
 */
export const decideReview = (milestoneId, reviewId, { decision, feedback = '', destinationId = null }) =>
  api.post('milestones', `/${milestoneId}/reviews/${reviewId}/decision`, {
    decision,
    feedback,
    ...(decision === 'accepted' && { destination_milestone_id: destinationId }),
  })

/** Milestones of several projects as one list (the API lists one project at a time). */
export async function listMilestonesForProjects(projectIds) {
  const lists = await Promise.all(projectIds.map(listMilestones))
  return lists.flat()
}
