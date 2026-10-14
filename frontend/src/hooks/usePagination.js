import { useState } from 'react'

/**
 * Splits a list into pages for display. Returns the current page's items plus what a
 * Pager needs: { pageItems, start, end, total, hasPrevious, hasNext, previous, next }.
 * If the list shrinks (e.g. after a refresh), the page moves back so it's never empty.
 */
export function usePagination(items, pageSize) {
  const [requestedPage, setPage] = useState(0)
  const lastPage = Math.max(0, Math.ceil(items.length / pageSize) - 1)
  const page = Math.min(requestedPage, lastPage)
  const from = page * pageSize
  const pageItems = items.slice(from, from + pageSize)
  return {
    pageItems,
    start: items.length ? from + 1 : 0,
    end: from + pageItems.length,
    total: items.length,
    hasPrevious: page > 0,
    hasNext: page < lastPage,
    previous: () => setPage(Math.max(0, page - 1)),
    next: () => setPage(Math.min(lastPage, page + 1)),
  }
}
