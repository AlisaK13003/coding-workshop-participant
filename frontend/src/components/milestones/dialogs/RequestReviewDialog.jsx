import { Send } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { requestReview } from '../../../services/milestonesApi.js'
import { formatHours } from '../../../utils/format.js'
import './RequestReviewDialog.css'

/**
 * Asks the project's manager to review whether the whole milestone is complete.
 * The backend also logs today's 8 hours on it, unless today is already logged.
 */
export function RequestReviewDialog({ project, milestone, onClose }) {
  const manager = project.manager?.name ?? 'your manager'
  const request = useMutation(() => requestReview(milestone.id), {
    success: (review) =>
      review.work_logged
        ? `Review requested from ${manager}, and today’s 8 hours were logged.`
        : `Review requested from ${manager}. Today’s work was already logged.`,
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title="Request milestone review"
      description="Your manager decides whether the entire milestone is complete. Logging pauses until they decide."
      confirmLabel={
        <>
          <Send size={15} />
          Request review
        </>
      }
      onConfirm={() => request.run()}
      submitting={request.submitting}
      error={request.error}
      onClose={onClose}
    >
      <div className="review-request-summary">
        <span>Milestone</span>
        <strong>{milestone.name}</strong>
        <small>
          {project.name} · {formatHours(milestone.hours)} logged on this milestone
        </small>
      </div>
      <div className="info-strip">
        Requesting a review also logs today as an 8-hour workday on this milestone, unless you’ve already logged today.
      </div>
    </ConfirmDialog>
  )
}
