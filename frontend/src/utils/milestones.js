// Milestone rules shared by every role. Milestones come from the API as
// { id, project_id, name, start_date, end_date, status, prerequisite_ids, members,
//   hours, pending_review }. The server works out the status.
import { daysBetween, todayIso } from './calendar.js'
import { findById } from './collections.js'
import { pluralize } from './text.js'

export const MILESTONE_STATUS = {
  blocked: 'blocked',
  available: 'available',
  review: 'awaiting_review',
  completed: 'completed',
}

const STATUS_LABELS = {
  blocked: 'Blocked',
  available: 'Available',
  awaiting_review: 'Awaiting review',
  completed: 'Completed',
}

/** 'awaiting_review' → 'Awaiting review'. */
export function milestoneStatusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

export function isCompleted(milestone) {
  return milestone.status === MILESTONE_STATUS.completed
}


/** Milestones that aren't completed (they can still take members and changes). */
export function openMilestones(milestones) {
  return milestones.filter((milestone) => !isCompleted(milestone))
}

/** "Design, Backend API", or "None" when there are no prerequisites. */
export function getPrerequisiteNames(milestone, milestones) {
  if (!milestone.prerequisite_ids.length) return 'None'
  return milestone.prerequisite_ids
    .map((id) => findById(milestones, id)?.name)
    .filter(Boolean)
    .join(', ')
}

/** "Ana Lee, Jon Bell", or "Unassigned" when nobody is on the milestone. */
export function getMemberNames(milestone) {
  return milestone.members.map((member) => member.name).join(', ') || 'Unassigned'
}

/**
 * Group milestones into columns by dependency depth: roots first, then each
 * milestone one column after its deepest prerequisite. Milestones in the same
 * column can run in parallel. Prerequisites outside the list are ignored.
 */
export function getDependencyColumns(milestones) {
  const depths = new Map()
  const depthOf = (milestone, visiting = new Set()) => {
    if (depths.has(milestone.id)) return depths.get(milestone.id)
    if (visiting.has(milestone.id)) return 0
    visiting.add(milestone.id)
    const prerequisites = milestone.prerequisite_ids
      .map((id) => findById(milestones, id))
      .filter(Boolean)
    const depth = prerequisites.length
      ? 1 + Math.max(...prerequisites.map((item) => depthOf(item, visiting)))
      : 0
    depths.set(milestone.id, depth)
    return depth
  }
  const columns = []
  milestones.forEach((milestone) => {
    const depth = depthOf(milestone)
    columns[depth] = [...(columns[depth] || []), milestone]
  })
  return columns.filter(Boolean)
}

/**
 * True when candidateId depends on targetId, directly or indirectly. Use it to
 * hide prerequisite choices that would create a circular dependency.
 */
export function dependsOn(candidateId, targetId, milestones, visited = new Set()) {
  if (visited.has(candidateId)) return false
  visited.add(candidateId)
  const candidate = findById(milestones, candidateId)
  if (!candidate) return false
  return (
    candidate.prerequisite_ids.includes(targetId) ||
    candidate.prerequisite_ids.some((id) => dependsOn(id, targetId, milestones, visited))
  )
}

/** Milestones belonging to one project. */
export function getProjectMilestones(milestones, projectId) {
  return milestones.filter((milestone) => milestone.project_id === projectId)
}

/** Milestones with a review request waiting for a decision, oldest request first. */
export function getPendingReviews(milestones) {
  return milestones
    .filter((milestone) => milestone.pending_review)
    .sort((a, b) => a.pending_review.requested_at.localeCompare(b.pending_review.requested_at))
}

/** Where an employee stands on a project, from their current milestone. */
export const ASSIGNMENT_STATE = {
  available: 'Available',
  waiting: 'Waiting on prerequisites',
  review: 'Awaiting review',
  none: 'No milestone assigned',
}

/** milestone: the employee's current milestone ({ status }) or null. */
export function getAssignmentState(milestone) {
  if (!milestone) return ASSIGNMENT_STATE.none
  if (milestone.status === MILESTONE_STATUS.blocked) return ASSIGNMENT_STATE.waiting
  if (milestone.status === MILESTONE_STATUS.review) return ASSIGNMENT_STATE.review
  return ASSIGNMENT_STATE.available
}

/** Badge tone for an assignment state. */
export function getAssignmentTone(state) {
  if (state === ASSIGNMENT_STATE.available) return 'Green'
  if (state === ASSIGNMENT_STATE.review) return 'Awaiting review'
  return 'Amber'
}

// A blocked milestone this close to its end date is unlikely to make it.
const BLOCKED_URGENT_DAYS = 7

/**
 * Deadline health for an open milestone, for lists of upcoming end dates:
 * { phase: 'Green' | 'Amber' | 'Red', reason }. Urgent: past its end date, or still blocked
 * with a week or less to go. Needs attention: blocked, or nobody assigned. Otherwise on track.
 */
export function getMilestoneHealth(milestone, today = todayIso()) {
  const daysLeft = daysBetween(today, milestone.end_date)
  const blocked = milestone.status === MILESTONE_STATUS.blocked
  if (daysLeft < 0) return { phase: 'Red', reason: 'Past its end date and not completed' }
  if (blocked && daysLeft <= BLOCKED_URGENT_DAYS) {
    return { phase: 'Red', reason: `Ends in ${daysLeft} ${pluralize(daysLeft, 'day')} but its prerequisites aren’t done` }
  }
  if (blocked) return { phase: 'Amber', reason: 'Waiting on prerequisites before work can start' }
  if (milestone.status === MILESTONE_STATUS.review) return { phase: 'Green', reason: 'Waiting for a review decision' }
  if (!milestone.members.length) return { phase: 'Amber', reason: 'Nobody is assigned to it' }
  return { phase: 'Green', reason: `${milestone.members.length} ${pluralize(milestone.members.length, 'person', 'people')} working on it` }
}
