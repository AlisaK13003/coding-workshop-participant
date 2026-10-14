import { ErrorState } from './ErrorState.jsx'
import { LoadingState } from './LoadingState.jsx'

/**
 * Shows LoadingState until query.data arrives, ErrorState (with Retry) if it failed,
 * then children(data). query comes from useApiQuery or combineQueries.
 */
export function QueryContent({ query, loadingLabel, children }) {
  if (query.data !== undefined) return children(query.data)
  if (query.error) return <ErrorState error={query.error} onRetry={query.reload} />
  return <LoadingState label={loadingLabel} />
}
