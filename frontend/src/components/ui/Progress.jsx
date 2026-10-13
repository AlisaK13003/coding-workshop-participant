import './Progress.css'

/** Thin progress bar. value is a percentage, capped at 100 for display. */
export function Progress({ value, danger = false }) {
  return (
    <div className="progress">
      <span
        className={danger ? 'danger' : undefined}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}
