import { FormDialog } from '../../../components/dialogs'
import { Field, TextArea } from '../../../components/ui'

/** Keep a reviewed milestone open, with optional feedback for the requester. */
export function KeepOpenDialog({ onClose, onConfirm }) {
  return (
    <FormDialog
      title="Keep milestone open"
      description="The requester will see your feedback with the milestone."
      submitLabel="Keep open"
      onClose={onClose}
      onSubmit={onConfirm}
    >
      <div className="form-single">
        <Field label="Feedback (optional)">
          <TextArea placeholder="Explain what still needs attention" />
        </Field>
      </div>
    </FormDialog>
  )
}
