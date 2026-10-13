// Derived values for the manager workspace (pure functions over sample data).
import { referenceToday } from '../../data/managerData.js'
import { findById } from '../../utils/collections.js'
import {
  MILESTONE_STATUS,
  findEmployeeMilestone,
  getMilestoneState,
} from '../../utils/milestones.js'
import { getSchedulePhase } from '../../utils/schedule.js'

/** Monday of the prototype's current week; "hours this week" counts from here. */
const WEEK_START = '2025-06-16'

/** Schedule phase as of the prototype's reference date. */
export function getProjectPhase(project) {
  return getSchedulePhase(project.start, project.end, referenceToday)
}

export function getProjectName(projects, projectId) {
  return findById(projects, projectId)?.name
}

function isBlocked(milestone, milestones) {
  return getMilestoneState(milestone, milestones) === MILESTONE_STATUS.blocked
}

/** Milestones awaiting review on the given projects. */
export function getPendingReviews(milestones, projects) {
  return milestones.filter(
    (milestone) =>
      milestone.status === MILESTONE_STATUS.review &&
      projects.some((project) => project.id === milestone.projectId),
  )
}

/**
 * Employees who need the manager's attention: waiting on a blocked milestone,
 * or on a project without a milestone. One item per employee.
 */
export function getAssignmentAttention(employees, projects, milestones) {
  return employees
    .map((employee) => {
      const assigned = milestones.filter((milestone) =>
        milestone.employeeIds.includes(employee.id),
      )
      const blocked = assigned.find(
        (milestone) =>
          isBlocked(milestone, milestones) &&
          projects.some((project) => project.id === milestone.projectId),
      )
      if (blocked) {
        return {
          employee,
          projectId: blocked.projectId,
          label: blocked.name,
          state: 'Waiting on prerequisites',
        }
      }
      const unassignedProject = projects.find(
        (project) =>
          project.employeeIds.includes(employee.id) &&
          !assigned.some((milestone) => milestone.projectId === project.id),
      )
      return unassignedProject
        ? {
            employee,
            projectId: unassignedProject.id,
            label: 'No milestone',
            state: 'Needs assignment',
          }
        : null
    })
    .filter(Boolean)
}

/** Row values for the My Employees table. */
export function getEmployeeOverview(employee, { projects, milestones, logs }) {
  const employeeProjects = projects.filter((project) =>
    project.employeeIds.includes(employee.id),
  )
  const weekHours = logs
    .filter((log) => log.employeeId === employee.id && log.date >= WEEK_START)
    .reduce((sum, log) => sum + log.hours, 0)
  const needsMilestone = employeeProjects.some(
    (project) => !findEmployeeMilestone(milestones, project.id, employee.id),
  )
  const waiting = milestones.some(
    (milestone) =>
      milestone.employeeIds.includes(employee.id) &&
      isBlocked(milestone, milestones),
  )
  return {
    activeCount: employeeProjects.length,
    weekHours,
    attention: needsMilestone ? 'Needs milestone' : waiting ? 'Waiting' : 'Assigned',
  }
}
