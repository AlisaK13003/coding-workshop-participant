import { Button, Modal } from '../ui'
import { ModalActions } from './ModalActions.jsx'
import { ValidationNote } from './ValidationNote.jsx'

/**
 * Dialog wrapping a form. The fields go in children; onSubmit receives the
 * form's FormData after the default submit is prevented.
 * intro (optional): content between the header and the form.
 * leadingActions (optional): extra buttons placed before Cancel.
 * submitting: disables the form's buttons while the request runs.
 * error (optional): a message that isn't about one field, e.g. a conflict.
 */
export function FormDialog({
  title,
  description,
  submitLabel,
  onSubmit,
  onClose,
  wide,
  intro,
  leadingActions,
  submitting = false,
  submitDisabled = false,
  error,
  children,
}) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
  }
  return (
    <Modal title={title} description={description} onClose={onClose} wide={wide}>
      {intro}
      <form onSubmit={handleSubmit}>
        <fieldset className="dialog-fieldset" disabled={submitting}>
          {children}
        </fieldset>
        {error && <ValidationNote tone="danger">{error}</ValidationNote>}
        <ModalActions onCancel={onClose} leading={leadingActions}>
          <Button type="submit" disabled={submitting || submitDisabled}>
            {submitting ? 'Saving…' : submitLabel}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
