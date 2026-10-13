// TEMPORARY cross-role demo sync, ported from the prototype. The manager and
// employee workspaces share state through localStorage in the same browser
// (review requests, milestone changes, assignments, closed projects, logs).
// Replace with backend calls once the API exists, then delete this file.
import { MILESTONE_STATUS } from '../utils/milestones.js'
import { readStorage, writeStorage } from '../utils/storage.js'

const KEYS = {
  reviewRequests: 'atlas.employee.reviewRequests',
  employeeLogs: 'atlas.employee.logs',
  milestoneUpdates: 'atlas.manager.milestoneUpdates',
  employeeAssignments: 'atlas.manager.employeeAssignments',
  closedProjects: 'atlas.manager.closedProjects',
}

/** The demo employee (Aisha Patel) whose actions are synced between roles. */
export const DEMO_EMPLOYEE_ID = 1

// Review requests: [{ projectId, milestoneId, note }]
export function readReviewRequests() {
  return readStorage(KEYS.reviewRequests, [])
}

export function addReviewRequest(request) {
  writeStorage(KEYS.reviewRequests, [
    ...readReviewRequests().filter(
      (item) => item.milestoneId !== request.milestoneId,
    ),
    request,
  ])
}

export function removeReviewRequest(milestoneId) {
  writeStorage(
    KEYS.reviewRequests,
    readReviewRequests().filter((item) => item.milestoneId !== milestoneId),
  )
}

// Milestone updates: { [milestoneId]: { status?, employeeIds?, feedback? } }
export function readMilestoneUpdates() {
  return readStorage(KEYS.milestoneUpdates, {})
}

/** Replaces the stored update of each milestone id in `changes`. */
export function saveMilestoneUpdates(changes) {
  writeStorage(KEYS.milestoneUpdates, { ...readMilestoneUpdates(), ...changes })
}

// Demo employee's milestone per project: { [projectId]: milestoneId | null }
export function readEmployeeAssignments() {
  return readStorage(KEYS.employeeAssignments, {})
}

export function saveEmployeeAssignment(projectId, milestoneId) {
  writeStorage(KEYS.employeeAssignments, {
    ...readEmployeeAssignments(),
    [String(projectId)]: milestoneId,
  })
}

// Projects a manager has closed: number[]
export function readClosedProjectIds() {
  return readStorage(KEYS.closedProjects, [])
}

export function addClosedProjectId(projectId) {
  writeStorage(
    KEYS.closedProjects,
    Array.from(new Set([...readClosedProjectIds(), projectId])),
  )
}

// Workdays the demo employee logged: [{ id, date, submittedAt, projectId, milestoneId, hours }]
export function readEmployeeLogs() {
  return readStorage(KEYS.employeeLogs, [])
}

export function addEmployeeLog(log) {
  writeStorage(KEYS.employeeLogs, [...readEmployeeLogs(), log])
}

/**
 * Apply stored changes to seed milestones: manager updates, the demo
 * employee's assignments, and pending review requests.
 */
export function mergeStoredMilestones(milestones) {
  const requestedIds = new Set(
    readReviewRequests().map((request) => request.milestoneId),
  )
  const updates = readMilestoneUpdates()
  const assignments = readEmployeeAssignments()
  return milestones.map((milestone) => {
    const update = updates[String(milestone.id)]
    let employeeIds = update?.employeeIds || milestone.employeeIds
    const assignment = assignments[String(milestone.projectId)]
    if (assignment !== undefined) {
      employeeIds = employeeIds.filter((id) => id !== DEMO_EMPLOYEE_ID)
      if (assignment === milestone.id) {
        employeeIds = [...employeeIds, DEMO_EMPLOYEE_ID]
      }
    }
    return {
      ...milestone,
      ...update,
      employeeIds,
      status: requestedIds.has(milestone.id)
        ? MILESTONE_STATUS.review
        : update?.status || milestone.status,
    }
  })
}
