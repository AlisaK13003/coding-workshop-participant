import { CircleAlert } from 'lucide-react'
import { pluralize } from '../../utils/text.js'

/**
 * Amber note explaining why a project cannot be completed yet.
 * itemLabel names what remains, e.g. 'unfinished milestone'.
 */
export function CompletionNote({ remaining, itemLabel = 'milestone' }) {
  return (
    <div className="inline-note">
      <CircleAlert size={16} />
      Project completion is unavailable until all milestones are complete.{' '}
      {remaining} {pluralize(remaining, itemLabel)} remain.
    </div>
  )
}
