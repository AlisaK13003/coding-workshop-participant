// Project rules shared by every role. Projects come from the API as
// { id, name, start_date, end_date, status, archived_at, manager, milestones: { completed, total },
//   member_count, hours, budget?, cost? } (budget and cost only for admins and managers).
import { daysBetween, todayIso } from './calendar.js'
import { getProjectHealth, isProjectOverBudget } from './schedule.js'

// Lives next to the health rule (which uses it); re-exported for existing callers.
export { isProjectOverBudget }

export const PROJECT_STATUS = {
  inProgress: 'in_progress',
  completed: 'completed',
  abandoned: 'abandoned',
}

/** The statuses a project can be archived with (the backend only archives finished projects). */
export const ARCHIVABLE_STATUSES = [PROJECT_STATUS.completed, PROJECT_STATUS.abandoned]

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

/** True once every milestone is complete (and there is at least one), so the project can be completed. */
export function canCompleteProject(project) {
  return project.milestones.total > 0 && project.milestones.completed === project.milestones.total
}


// Limits from the backend: Validator.text max_length=200, and Validator.money digits=12 (budget is NUMERIC(12, 2)).
export const PROJECT_NAME_MAX = 200
export const BUDGET_LIMIT = 10_000_000_000

/**
 * Checks the create/edit project form in the browser before it's sent, with the server's
 * wording. Returns { field: message } for each problem; empty when the form can be sent.
 * The server checks again, plus the rules that need the database (unique name, milestones
 * fitting inside the dates).
 */
export function validateProjectForm({ name, manager_id, start_date, end_date, budget }, { needsManager = false } = {}) {
  const errors = {}
  const trimmed = (name ?? '').trim()
  if (!trimmed) errors.name = 'This field is required.'
  else if (trimmed.length > PROJECT_NAME_MAX) errors.name = `Must be at most ${PROJECT_NAME_MAX} characters.`
  if (needsManager && !manager_id) errors.manager_id = 'This field is required.'
  if (!start_date) errors.start_date = 'This field is required.'
  if (!end_date) errors.end_date = 'This field is required.'
  else if (start_date && end_date < start_date) errors.end_date = 'Must be on or after the start date.'
  if (budget == null || budget === '') errors.budget = 'This field is required.'
  else if (!Number.isFinite(Number(budget))) errors.budget = 'Must be a number.'
  else if (Number(budget) < 0) errors.budget = 'Must be zero or more.'
  else if (Number(budget) >= BUDGET_LIMIT) errors.budget = `Must be less than ${BUDGET_LIMIT.toLocaleString('en-US')}.`
  return errors
}
