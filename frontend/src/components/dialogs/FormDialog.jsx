import { Button, Modal } from '../ui'
import { ModalActions } from './ModalActions.jsx'

/**
 * Dialog wrapping a form. The fields go in children; onSubmit receives the
 * form's FormData after the default submit is prevented.
 * intro (optional): content between the header and the form.
 * leadingActions (optional): extra buttons placed before Cancel.
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
        {children}
        <ModalActions onCancel={onClose} leading={leadingActions}>
          <Button type="submit">{submitLabel}</Button>
        </ModalActions>
      </form>
    </Modal>
  )
}
