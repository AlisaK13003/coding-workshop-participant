// Small array helpers for id-based sample data.

/** The item whose id matches, or undefined. */
export function findById(items, id) {
  return items.find((item) => item.id === id)
}
