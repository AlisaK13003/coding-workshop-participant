import { Button, Modal } from '../ui'
import { ConfirmationBlock } from './ConfirmationBlock.jsx'
import { ModalActions } from './ModalActions.jsx'
import { ValidationNote } from './ValidationNote.jsx'

/**
 * Yes/no dialog: optional confirmation block (icon + heading + message),
 * extra content as children, then Cancel and the confirm button.
 * submitting disables the confirm button; error shows why the action failed.
 */
export function ConfirmDialog({
  title,
  description,
  icon,
  heading,
  message,
  confirmLabel,
  confirmVariant = 'primary',
  confirmDisabled = false,
  submitting = false,
  error,
  onConfirm,
  onClose,
  wide,
  children,
}) {
  return (
    <Modal title={title} description={description} onClose={onClose} wide={wide}>
      {heading && (
        <ConfirmationBlock icon={icon} title={heading}>
          {message}
        </ConfirmationBlock>
      )}
      {children}
      {error && <ValidationNote tone="danger">{error}</ValidationNote>}
      <ModalActions onCancel={onClose}>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={confirmDisabled || submitting}
        >
          {submitting ? 'Working…' : confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
