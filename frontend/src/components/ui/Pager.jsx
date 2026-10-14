import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Pager.css'

/**
 * "Showing 1–5 of 6" with previous / next buttons on the right, disabled at either end.
 * Takes the object from usePagination (or the same fields for server-side paging).
 */
export function Pager({ start, end, total, hasPrevious, hasNext, previous, next }) {
  return (
    <div className="pager">
      <span>{total ? `Showing ${start}–${end} of ${total}` : 'Nothing to show'}</span>
      <button type="button" className="pager-button" onClick={previous} disabled={!hasPrevious} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      <button type="button" className="pager-button" onClick={next} disabled={!hasNext} aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
