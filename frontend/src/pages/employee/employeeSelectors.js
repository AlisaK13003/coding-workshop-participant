// Derived values for the employee workspace (pure functions over API data).
import { isWeekday, todayIso } from '../../utils/calendar.js'
import { findById } from '../../utils/collections.js'
import { MILESTONE_STATUS, getAssignmentState } from '../../utils/milestones.js'

/**
 * One entry per project: { project, milestone, state }, where milestone is the
 * employee's current milestone (or null) and state an ASSIGNMENT_STATE.
 * portfolio is { projects, milestones, members } from loadPortfolio.
 */
export function getAssignments({ projects, milestones, members }, userId) {
  return projects.map((project) => {
    const membership = members.find(
      (member) => member.project_id === project.id && member.user.id === userId,
    )
    const milestone = membership?.milestone ? findById(milestones, membership.milestone.id) ?? null : null
    return { project, milestone, state: getAssignmentState(milestone) }
  })
}

/** Today's entry, if the employee already logged one. */
export function findTodaysLog(logs) {
  return logs.find((log) => log.work_date === todayIso())
}

/**
 * Whether work can be logged on this milestone today, matching the API: a
 * weekday, nothing logged yet today, and the milestone available (not blocked,
 * awaiting review or completed).
 */
export function canLogToday(milestone, logs) {
  return (
    isWeekday() &&
    !findTodaysLog(logs) &&
    milestone?.status === MILESTONE_STATUS.available
  )
}

/** Review requests are only allowed while the milestone is available. */
export function canRequestReview(milestone) {
  return milestone?.status === MILESTONE_STATUS.available
}

/** Assignments whose milestone accepts work today. */
export function getLoggableAssignments(assignments, logs) {
  return assignments.filter(({ milestone }) => canLogToday(milestone, logs))
}
