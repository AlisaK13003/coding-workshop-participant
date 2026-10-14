// Small array helpers for lists from the API.

/** The item whose id matches, or undefined. */
export function findById(items, id) {
  return items.find((item) => item.id === id)
}

/** Sum of getValue(item) over the items. */
export function sumBy(items, getValue) {
  return items.reduce((sum, item) => sum + Number(getValue(item) ?? 0), 0)
}

/** Items without duplicates, comparing getKey(item). */
export function uniqueBy(items, getKey) {
  const seen = new Set()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
