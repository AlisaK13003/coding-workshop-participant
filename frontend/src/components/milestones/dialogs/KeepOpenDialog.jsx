import { FormDialog } from '../../dialogs'
import { Field, TextArea } from '../../ui'
import { useMutation } from '../../../hooks/useMutation.js'
import { decideReview } from '../../../services/milestonesApi.js'

/** Keep a reviewed milestone open, with optional feedback for the requester. */
export function KeepOpenDialog({ milestone, onClose }) {
  const keepOpen = useMutation(
    (feedback) => decideReview(milestone.id, milestone.pending_review.id, { decision: 'kept_open', feedback }),
    { success: 'Milestone kept open and feedback sent.', onSuccess: onClose },
  )
  return (
    <FormDialog
      title="Keep milestone open"
      description="The requester is notified and sees your feedback with the milestone."
      submitLabel="Keep open"
      onClose={onClose}
      onSubmit={(data) => keepOpen.run(data.get('feedback'))}
      submitting={keepOpen.submitting}
      error={keepOpen.error}
    >
      <div className="form-single">
        <Field label="Feedback (optional)" error={keepOpen.fieldErrors.feedback}>
          <TextArea name="feedback" maxLength={2000} placeholder="Explain what still needs attention" />
        </Field>
      </div>
    </FormDialog>
  )
}
