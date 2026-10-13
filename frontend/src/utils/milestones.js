// Milestone rules shared by every role: derived state, prerequisites and dependency layout.
// A milestone looks like { id, name, prerequisiteIds: number[], status },
// plus projectId and employeeIds for the manager and employee workspaces.
import { findById } from './collections.js'

export const MILESTONE_STATUS = {
  blocked: 'Blocked',
  available: 'Available',
  review: 'Awaiting review',
  completed: 'Completed',
}

/**
 * Completed and Awaiting review are stored states. Otherwise a milestone is
 * Available only when every prerequisite is Completed, else Blocked.
 */
export function getMilestoneState(milestone, milestones) {
  if (
    milestone.status === MILESTONE_STATUS.completed ||
    milestone.status === MILESTONE_STATUS.review
  ) {
    return milestone.status
  }
  const unlocked = milestone.prerequisiteIds.every(
    (id) => findById(milestones, id)?.status === MILESTONE_STATUS.completed,
  )
  return unlocked ? MILESTONE_STATUS.available : MILESTONE_STATUS.blocked
}

export function countCompleted(milestones) {
  return milestones.filter((item) => item.status === MILESTONE_STATUS.completed)
    .length
}

/** "Design system, API integration", or "None" when there are no prerequisites. */
export function getPrerequisiteNames(milestone, milestones) {
  if (!milestone.prerequisiteIds.length) return 'None'
  return milestone.prerequisiteIds
    .map((id) => findById(milestones, id)?.name)
    .filter(Boolean)
    .join(', ')
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
    const prerequisites = milestone.prerequisiteIds
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
    candidate.prerequisiteIds.includes(targetId) ||
    candidate.prerequisiteIds.some((id) =>
      dependsOn(id, targetId, milestones, visited),
    )
  )
}

/**
 * Status for a new or edited milestone: Blocked until every prerequisite is
 * Completed, otherwise Available (an open review request is kept).
 */
export function getStatusForPrerequisites(prerequisiteIds, milestones, currentStatus) {
  const unlocked = prerequisiteIds.every(
    (id) => findById(milestones, id)?.status === MILESTONE_STATUS.completed,
  )
  if (!unlocked) return MILESTONE_STATUS.blocked
  return currentStatus === MILESTONE_STATUS.review
    ? MILESTONE_STATUS.review
    : MILESTONE_STATUS.available
}

/** Milestones belonging to one project. */
export function getProjectMilestones(milestones, projectId) {
  return milestones.filter((milestone) => milestone.projectId === projectId)
}

/** The project milestone an employee is assigned to, if any. */
export function findEmployeeMilestone(milestones, projectId, employeeId) {
  return milestones.find(
    (milestone) =>
      milestone.projectId === projectId &&
      milestone.employeeIds.includes(employeeId),
  )
}

/**
 * Mark a milestone Completed and move all of its employees to the optional
 * destination milestone. Returns a new array.
 */
export function completeMilestone(milestones, milestoneId, destinationId) {
  const moving = findById(milestones, milestoneId)?.employeeIds || []
  return milestones.map((item) => {
    if (item.id === milestoneId) {
      return {
        ...item,
        status: MILESTONE_STATUS.completed,
        requester: undefined,
        requestDate: undefined,
        employeeIds: [],
      }
    }
    if (item.id === destinationId) {
      return {
        ...item,
        employeeIds: Array.from(new Set([...item.employeeIds, ...moving])),
      }
    }
    return item
  })
}

/** Close a pending review without completing: the milestone becomes Available again. */
export function reopenMilestone(milestones, milestoneId) {
  return milestones.map((item) =>
    item.id === milestoneId
      ? {
          ...item,
          status: MILESTONE_STATUS.available,
          requester: undefined,
          requestDate: undefined,
        }
      : item,
  )
}

/**
 * Give an employee exactly one milestone within a project (or none when
 * milestoneId is null). Returns a new array.
 */
export function assignEmployeeMilestone(milestones, projectId, employeeId, milestoneId) {
  return milestones.map((item) => {
    if (item.projectId !== projectId) return item
    const without = item.employeeIds.filter((id) => id !== employeeId)
    return item.id === milestoneId
      ? { ...item, employeeIds: [...without, employeeId] }
      : { ...item, employeeIds: without }
  })
}
