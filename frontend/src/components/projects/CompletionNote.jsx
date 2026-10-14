import { CircleAlert } from 'lucide-react'
import { pluralize } from '../../utils/text.js'

/**
 * Amber note explaining why a project can't be completed yet.
 * itemLabel names what remains, e.g. 'unfinished milestone'.
 */
export function CompletionNote({ remaining, itemLabel = 'milestone' }) {
  return (
    <div className="inline-note">
      <CircleAlert size={16} />
      {remaining
        ? `Project completion is unavailable until all milestones are complete. ${remaining} ${pluralize(remaining, itemLabel)} ${pluralize(remaining, 'remains', 'remain')}.`
        : 'Add at least one milestone before completing the project.'}
    </div>
  )
}
