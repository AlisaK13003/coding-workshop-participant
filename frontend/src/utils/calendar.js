// Date math for month and timeline calendars. Dates are local Date objects;
// project ranges are ISO strings (YYYY-MM-DD).
import { parseDate } from './format.js'

/** Local date → "YYYY-MM-DD" (no UTC shift). */
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** First day of the month `amount` months away from `date`. */
export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/** "June 2025". */
export function formatMonthYear(date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

/** The 42 days (6 weeks, Sunday first) shown in a month grid. */
export function getMonthGrid(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstDay.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

/** Position of a date range on a one-year track, as { left, width } percentages. */
export function getYearSpan(start, end, year) {
  const yearStart = parseDate(`${year}-01-01`).getTime()
  const yearLength = parseDate(`${year}-12-31`).getTime() - yearStart
  const startTime = parseDate(start).getTime()
  return {
    left: ((startTime - yearStart) / yearLength) * 100,
    width: ((parseDate(end).getTime() - startTime) / yearLength) * 100,
  }
}
