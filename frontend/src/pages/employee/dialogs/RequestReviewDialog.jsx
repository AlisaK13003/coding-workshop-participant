import { Send } from 'lucide-react'
import { FormDialog } from '../../../components/dialogs'
import { Field, TextArea } from '../../../components/ui'
import './RequestReviewDialog.css'

/** Asks the manager to review the whole milestone, with an optional note. */
export function RequestReviewDialog({ project, milestone, onClose, onSubmit }) {
  return (
    <FormDialog
      title="Request milestone review"
      description="This asks your manager to review whether the entire milestone is complete."
      submitLabel={
        <>
          <Send size={15} />
          Request review
        </>
      }
      onClose={onClose}
      onSubmit={(data) => onSubmit(String(data.get('note') || ''))}
      intro={
        <div className="review-request-summary">
          <span>Milestone</span>
          <strong>{milestone.name}</strong>
          <small>
            {project.name} · {milestone.totalHours} total milestone hours
          </small>
        </div>
      }
    >
      <div className="form-single">
        <Field label="Optional note">
          <TextArea name="note" placeholder="Add context for your manager" />
        </Field>
      </div>
    </FormDialog>
  )
}
