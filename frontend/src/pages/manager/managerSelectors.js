// Derived values for the manager workspace (pure functions over API data).
import { ASSIGNMENT_STATE, getAssignmentState } from '../../utils/milestones.js'
import { getWeekHours } from '../../utils/workLogs.js'

/**
 * Project members who need the manager's attention: on a blocked milestone,
 * or on a project without a milestone. members come from loadPortfolio.
 */
export function getAssignmentAttention(members) {
  return members
    .map((member) => ({ member, state: getAssignmentState(member.milestone) }))
    .filter(({ state }) => state === ASSIGNMENT_STATE.waiting || state === ASSIGNMENT_STATE.none)
}

/** Row values for the My Employees table. */
export function getEmployeeOverview(employee, { members, logs }) {
  const states = members
    .filter((member) => member.user.id === employee.id)
    .map((member) => getAssignmentState(member.milestone))
  let attention = 'Assigned'
  if (states.includes(ASSIGNMENT_STATE.none)) attention = 'Needs milestone'
  else if (states.includes(ASSIGNMENT_STATE.waiting)) attention = 'Waiting'
  else if (!states.length) attention = 'No projects'
  return {
    activeCount: states.length,
    weekHours: getWeekHours(logs, employee.id),
    attention,
  }
}

