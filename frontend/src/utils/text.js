// Small text helpers for search filters and copy.

/** Case-insensitive "does text contain query". An empty query matches everything. */
export function includesText(text, query) {
  return (text ?? '').toLowerCase().includes(query.toLowerCase())
}

/** pluralize(1, 'milestone') → "milestone", pluralize(3, 'milestone') → "milestones". */
export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural
}

/** listWords(['a']) → "a"; listWords(['a', 'b', 'c']) → "a, b and c". */
export function listWords(items) {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}
