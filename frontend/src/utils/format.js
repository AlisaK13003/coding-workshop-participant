// Display formatting shared by every role: money, hours, dates and names.

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})

/** Whole dollars, e.g. 186400 → "$186,400". */
export function formatMoney(value) {
  return moneyFormatter.format(value)
}

/** Dollars and cents, e.g. 430.8 → "$430.80". */
export function formatCents(value) {
  return `$${value.toFixed(2)}`
}

/** Hours with thousands separators, e.g. 2480 → "2,480 h". */
export function formatHours(value) {
  return `${value.toLocaleString()} h`
}

/** Parse an ISO date (YYYY-MM-DD) at midday so time zones never shift the day. */
export function parseDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`)
}

/** ISO date → "Jun 03, 2025". */
export function formatDate(isoDate) {
  return dateFormatter.format(parseDate(isoDate))
}

/** Join two already-formatted dates, e.g. "Feb 03, 2025 – Aug 29, 2025". */
export function formatRange(start, end) {
  return `${start} – ${end}`
}

/** ISO start and end dates → "Feb 03, 2025 – Aug 29, 2025". */
export function formatDateRange(start, end) {
  return formatRange(formatDate(start), formatDate(end))
}

/** ISO date → { day: 29, month: "AUG" } for calendar-style date tiles. */
export function toDateTile(isoDate) {
  const date = parseDate(isoDate)
  return {
    day: date.getDate(),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  }
}

/** { first, last } → "First Last". */
export function fullName(person) {
  return `${person.first} ${person.last}`
}

/** "Elena Vasquez" → "EV" (at most two letters). */
export function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
}
