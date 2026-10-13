// Derived values for the employee workspace (pure functions over sample data).
import { signedInEmployee } from '../../data/employeeData.js'
import { MILESTONE_STATUS, getMilestoneState } from '../../utils/milestones.js'

/** Where the signed-in employee stands on a project. */
export const ASSIGNMENT_STATE = {
  available: 'Available',
  waiting: 'Waiting on prerequisites',
  review: 'Awaiting review',
  none: 'No milestone assigned',
}

const WEEK = { start: '2025-06-16', end: '2025-06-20' }

/** The employee's open (not completed) milestone on a project, if any. */
export function getCurrentMilestone(milestones, projectId) {
  return milestones.find(
    (milestone) =>
      milestone.projectId === projectId &&
      milestone.employeeIds.includes(signedInEmployee.id) &&
      milestone.status !== MILESTONE_STATUS.completed,
  )
}

export function getAssignmentState(milestones, projectId) {
  const milestone = getCurrentMilestone(milestones, projectId)
  if (!milestone) return ASSIGNMENT_STATE.none
  const state = getMilestoneState(milestone, milestones)
  if (state === MILESTONE_STATUS.blocked) return ASSIGNMENT_STATE.waiting
  if (state === MILESTONE_STATUS.review) return ASSIGNMENT_STATE.review
  return ASSIGNMENT_STATE.available
}

/** Badge tone for an assignment state. */
export function getStateTone(state) {
  if (state === ASSIGNMENT_STATE.available) return 'Green'
  if (state === ASSIGNMENT_STATE.review) return 'Awaiting review'
  return 'Amber'
}

/** Work can be logged while the milestone is Available or Awaiting review. */
function canLogWork(milestone, milestones) {
  if (!milestone) return false
  const state = getMilestoneState(milestone, milestones)
  return state === MILESTONE_STATUS.available || state === MILESTONE_STATUS.review
}

/** Projects whose current milestone accepts work today. */
export function getLoggableProjects(projects, milestones) {
  return projects.filter((project) =>
    canLogWork(getCurrentMilestone(milestones, project.id), milestones),
  )
}

export function getProjectsInState(projects, milestones, state) {
  return projects.filter(
    (project) => getAssignmentState(milestones, project.id) === state,
  )
}

/** Hours across logs matching `predicate` (default: all). */
export function sumHours(logs, predicate = () => true) {
  return logs.filter(predicate).reduce((sum, log) => sum + log.hours, 0)
}

/** Hours logged in the prototype's current week. */
export function getWeekHours(logs) {
  return sumHours(logs, (log) => log.date >= WEEK.start && log.date <= WEEK.end)
}
