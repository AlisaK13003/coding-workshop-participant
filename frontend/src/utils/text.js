// Small text helpers for search filters and copy.

/** Case-insensitive "does text contain query". An empty query matches everything. */
export function includesText(text, query) {
  return (text ?? '').toLowerCase().includes(query.toLowerCase())
}

/** pluralize(1, 'milestone') → "milestone", pluralize(3, 'milestone') → "milestones". */
export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}
