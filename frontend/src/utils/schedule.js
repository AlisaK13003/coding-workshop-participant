// Project health (On track / Needs attention / Urgent) and budget usage.
import { parseDate } from './format.js'

// Health is 'Green' | 'Amber' | 'Red' internally (it picks the colour); people see these labels.
export const SCHEDULE_PHASE_LABELS = {
  Green: 'On track',
  Amber: 'Needs attention',
  Red: 'Urgent',
}

export const SCHEDULE_PHASES = Object.keys(SCHEDULE_PHASE_LABELS)

export const phaseLabel = (phase) => SCHEDULE_PHASE_LABELS[phase] ?? phase

const DAY_MS = 24 * 60 * 60 * 1000

export const SCHEDULE_PHASE_HINT =
  'Checks each milestone against its own end date. On track: every milestone on schedule. ' +
  'Needs attention: a milestone is running late (past its end date, not completed). ' +
  'Urgent: several milestones are late, or the project is past its end date with work left. ' +
  'Projects without milestones go by how much of the schedule has passed. ' +
  'Being over budget raises health one step (On track to Needs attention, Needs attention to Urgent).'

/**
 * Health from the schedule alone: how many milestones are past their end date but not
 * completed (`milestones.overdue`, from the API). A finished project is on track; one past
 * its own end date with work left is urgent. Without milestones, falls back to elapsed time.
 */
export function getScheduleHealth(project, today = new Date()) {
  const { completed = 0, total = 0, overdue = 0 } = project.milestones ?? {}
  if (!total) return getSchedulePhase(project.start_date, project.end_date, today)
  if (completed === total) return 'Green'
  if (today.getTime() > parseDate(project.end_date).getTime() + DAY_MS) return 'Red'
  if (overdue === 0) return 'Green'
  return overdue === 1 ? 'Amber' : 'Red'
}

/** True when labor cost exceeds the budget (only admins and managers receive both). */
export function isProjectOverBudget(project) {
  return project.cost != null && project.budget != null && isOverBudget(project.cost, project.budget)
}

const ONE_STEP_WORSE = { Green: 'Amber', Amber: 'Red', Red: 'Red' }

/**
 * Project health: the schedule health, raised one step (On track → Needs attention →
 * Urgent) when the project is over budget.
 * project: { start_date, end_date, budget?, cost?, milestones: { completed, total, overdue } }.
 */
export function getProjectHealth(project, today = new Date()) {
  const schedule = getScheduleHealth(project, today)
  return isProjectOverBudget(project) ? ONE_STEP_WORSE[schedule] : schedule
}

/**
 * Time-only phase from how much of the scheduled time has passed: under 50% green,
 * 50–75% amber, the rest red. Used for projects that have no milestones yet.
 * start and end are ISO dates; today defaults to the current date.
 */
export function getSchedulePhase(start, end, today = new Date()) {
  const startTime = parseDate(start).getTime()
  const endTime = parseDate(end).getTime()
  const now = today.getTime()
  if (now < startTime) return 'Green'
  if (now > endTime) return 'Red'
  if (endTime === startTime) return 'Red'
  const elapsed = (now - startTime) / (endTime - startTime)
  if (elapsed < 0.5) return 'Green'
  if (elapsed < 0.75) return 'Amber'
  return 'Red'
}

/** Percentage of the budget spent, rounded, e.g. (186400, 175000) → 107. A zero budget counts as 0%. */
export function getBudgetUsage(cost, budget) {
  if (!budget) return 0
  return Math.round((cost / budget) * 100)
}

export function isOverBudget(cost, budget) {
  return cost > budget
}
