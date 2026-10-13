import { CircleAlert } from 'lucide-react'
import { ConfirmDialog } from '../../../components/dialogs'
import { fullName } from '../../../utils/format.js'

export function ResetPasswordDialog({ employee, onClose, onConfirm }) {
  return (
    <ConfirmDialog
      title="Reset password?"
      description="Existing passwords are never displayed."
      icon={CircleAlert}
      heading={`Create a reset for ${fullName(employee)}?`}
      message="This prototype records the action and does not send an external email."
      confirmLabel="Reset password"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
