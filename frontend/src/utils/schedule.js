// Project health: schedule phase and budget usage.
import { parseDate } from './format.js'

// Phases are 'Green' | 'Amber' | 'Red' internally (they pick the colour); people see these labels.
export const SCHEDULE_PHASE_LABELS = {
  Green: 'On track',
  Amber: 'Needs attention',
  Red: 'Urgent',
}

export const SCHEDULE_PHASES = Object.keys(SCHEDULE_PHASE_LABELS)

export const phaseLabel = (phase) => SCHEDULE_PHASE_LABELS[phase] ?? phase

export const SCHEDULE_PHASE_HINT =
  'Based on how much of the schedule has passed. On track: under 50%. Needs attention: 50–75%. ' +
  'Urgent: the last 25%, or past the end date.'

/**
 * Schedule phase from elapsed scheduled time (not performance or budget).
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
