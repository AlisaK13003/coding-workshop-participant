// Project rules shared by every role. Projects come from the API as
// { id, name, start_date, end_date, status, archived_at, manager, milestones: { completed, total },
//   member_count, hours, budget?, cost? } (budget and cost only for admins and managers).
import { daysBetween, todayIso } from './calendar.js'
import { getProjectHealth, isOverBudget } from './schedule.js'

export const PROJECT_STATUS = {
  inProgress: 'in_progress',
  completed: 'completed',
  abandoned: 'abandoned',
}

const STATUS_LABELS = {
  in_progress: 'In progress',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

/** 'in_progress' → 'In progress'. */
export function projectStatusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

/** Open projects can still change: in progress and not archived (the backend's rule). */
export function isOpenProject(project) {
  return project.status === PROJECT_STATUS.inProgress && !project.archived_at
}

/** Not archived: in progress, completed or abandoned. The admin's Projects page lists these. */
export function isNotArchived(project) {
  return !project.archived_at
}

/** Unarchived projects come back without a manager until an admin assigns one. */
export function needsManager(project) {
  return !project.manager
}

/** Health as of today: On track / Needs attention / Urgent (see getProjectHealth). */
export function getProjectPhase(project) {
  return getProjectHealth(project)
}

/** Ends between today and `days` days from now. */
export function isEndingSoon(project, days = 60) {
  const remaining = daysBetween(todayIso(), project.end_date)
  return remaining >= 0 && remaining <= days
}

export function isProjectOverBudget(project) {
  return isOverBudget(project.cost ?? 0, project.budget ?? 0)
}

/** True once every milestone is complete (and there is at least one), so the project can be completed. */
export function canCompleteProject(project) {
  return project.milestones.total > 0 && project.milestones.completed === project.milestones.total
}

