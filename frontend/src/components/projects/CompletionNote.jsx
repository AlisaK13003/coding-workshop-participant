import { CircleAlert } from 'lucide-react'
import { pluralize } from '../../utils/text.js'

/** Amber note explaining why a project cannot be completed yet. */
export function CompletionNote({ remaining }) {
  return (
    <div className="inline-note">
      <CircleAlert size={16} />
      Project completion is unavailable until all milestones are complete.{' '}
      {remaining} {pluralize(remaining, 'milestone')} remain.
    </div>
  )
}
