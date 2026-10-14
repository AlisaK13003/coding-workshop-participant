// Work log helpers. Logs come from the API as { id, work_date, employee, project,
// milestone, hours, entered_by, historical, created_at, hourly_rate?, cost? }.
import { sumBy } from './collections.js'
import { getWeekRange } from './calendar.js'
import { formatDate, formatDateTime, parseDate } from './format.js'

/** Hours across logs matching `predicate` (default: all). */
export function sumHours(logs, predicate = () => true) {
  return sumBy(logs.filter(predicate), (log) => log.hours)
}

/** Labor cost across logs (admins and the employee's manager receive `cost` from the API). */
export function sumCost(logs) {
  return sumBy(logs, (log) => log.cost ?? 0)
}

/** Logs dated this week (Monday to Sunday), optionally for one employee. */
export function getWeekLogs(logs, employeeId) {
  const { start, end } = getWeekRange()
  return logs.filter(
    (log) =>
      log.work_date >= start &&
      log.work_date <= end &&
      (employeeId === undefined || log.employee.id === employeeId),
  )
}

/** Hours logged this week (Monday to Sunday), optionally for one employee. */
export function getWeekHours(logs, employeeId) {
  return sumHours(getWeekLogs(logs, employeeId))
}

/** A log as a display-ready row for WorkLogTable; `log` keeps the original for actions. */
export function toWorkLogRow(log) {
  return {
    id: log.id,
    date: formatDate(log.work_date),
    employee: log.employee.name,
    project: log.project.name,
    milestone: log.milestone.name,
    hours: log.hours,
    rate: log.hourly_rate,
    cost: log.cost,
    submittedAt: formatDateTime(log.created_at),
    note: log.historical ? `Entered by ${log.entered_by.name}` : undefined,
    log,
  }
}

/**
 * Hours and labor cost per month for the `count` months up to `today`, oldest first:
 * [{ key: '2026-10', month: 'Oct', hours, cost }].
 */
export function getMonthlyTotals(logs, count = 6, today = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const inMonth = logs.filter((log) => log.work_date.startsWith(key))
    return {
      key,
      month: parseDate(`${key}-01`).toLocaleString('en-US', { month: 'short' }),
      hours: sumHours(inMonth),
      cost: sumCost(inMonth),
    }
  })
}
