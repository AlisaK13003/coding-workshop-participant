import { CircleAlert } from 'lucide-react'
import { Button } from './Button.jsx'
import './QueryStates.css'

/** Why data couldn't load, with a Retry button. error is an ApiError (or any Error). */
export function ErrorState({ error, onRetry, title = 'Couldn’t load this' }) {
  return (
    <div className="query-state query-error" role="alert">
      <CircleAlert size={22} />
      <strong>{title}</strong>
      <span>{error?.message || 'Something went wrong.'}</span>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
