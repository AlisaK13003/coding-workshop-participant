import { LoaderCircle } from 'lucide-react'
import './QueryStates.css'

/** Spinner with a short label, shown while data loads. */
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="query-state" role="status" aria-live="polite">
      <LoaderCircle size={22} className="query-spinner" />
      <span>{label}</span>
    </div>
  )
}
