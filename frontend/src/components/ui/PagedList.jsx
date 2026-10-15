import { usePagination } from '../../hooks/usePagination.js'
import { Pager } from './Pager.jsx'

/**
 * Shows `items` a page at a time with a Pager below: children(pageItems) renders the
 * current page. Give it a `key` that changes with the search and filters, so a new
 * result starts again on page 1.
 */
export function PagedList({ items, pageSize, children }) {
  const pages = usePagination(items, pageSize)
  return (
    <>
      {children(pages.pageItems)}
      <Pager {...pages} />
    </>
  )
}
