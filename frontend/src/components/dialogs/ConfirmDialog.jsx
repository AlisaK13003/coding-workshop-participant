import { Button, Modal } from '../ui'
import { ConfirmationBlock } from './ConfirmationBlock.jsx'
import { ModalActions } from './ModalActions.jsx'

/**
 * Yes/no dialog: optional confirmation block (icon + heading + message),
 * extra content as children, then Cancel and the confirm button.
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
      <ModalActions onCancel={onClose}>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
