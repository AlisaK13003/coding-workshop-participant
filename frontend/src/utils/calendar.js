// Date math for "today", weeks, month grids and timelines. Dates are local Date
// objects; dates from the API are ISO strings (YYYY-MM-DD).
import { parseDate } from './format.js'

const DAY_MS = 24 * 60 * 60 * 1000

/** Local date → "YYYY-MM-DD" (no UTC shift). */
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Today as "YYYY-MM-DD". */
export function todayIso() {
  return toIsoDate(new Date())
}

/** Monday to Friday. */
export function isWeekday(date = new Date()) {
  return date.getDay() !== 0 && date.getDay() !== 6
}

/** The date `amount` days after `date`. */
export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

/** Monday and Sunday of the week containing `date`, as ISO dates. */
export function getWeekRange(date = new Date()) {
  const monday = addDays(date, -((date.getDay() + 6) % 7))
  return { start: toIsoDate(monday), end: toIsoDate(addDays(monday, 6)) }
}

/** Whole days from ISO date `from` to ISO date `to` (negative when `to` is earlier). */
export function daysBetween(from, to) {
  return Math.round((parseDate(to) - parseDate(from)) / DAY_MS)
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

/** Position of a date range on a one-year track, as { left, width } percentages clipped to that year. */
export function getYearSpan(start, end, year) {
  const yearStart = parseDate(`${year}-01-01`).getTime()
  const yearLength = parseDate(`${year + 1}-01-01`).getTime() - yearStart
  const clip = (time) => Math.min(Math.max(time, yearStart), yearStart + yearLength)
  const startTime = clip(parseDate(start).getTime())
  const endTime = clip(parseDate(end).getTime())
  return {
    left: ((startTime - yearStart) / yearLength) * 100,
    width: ((endTime - startTime) / yearLength) * 100,
  }
}
