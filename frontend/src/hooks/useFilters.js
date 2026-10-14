import { useState } from 'react'

/**
 * Filter values for a list, e.g. { from: '', project: '' } ('' means any).
 * setFilter(name) returns a handler for that filter's input, so it can go straight into
 * <Select onChange={setFilter('project')}>. onChange (optional) runs after every change,
 * e.g. to go back to the first page.
 */
export function useFilters(initial, onChange) {
  const [filters, setFilters] = useState(initial)
  const setFilter = (name) => (value) => {
    setFilters((current) => ({ ...current, [name]: value }))
    onChange?.()
  }
  return { filters, setFilter }
}
