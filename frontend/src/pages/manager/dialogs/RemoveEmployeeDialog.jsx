import { CircleAlert } from 'lucide-react'
import { ConfirmDialog } from '../../../components/dialogs'
import { fullName } from '../../../utils/format.js'

export function RemoveEmployeeDialog({ employee, onClose, onConfirm }) {
  return (
    <ConfirmDialog
      title={`Remove ${fullName(employee)}?`}
      description="Historical assignments and work logs will be preserved."
      icon={CircleAlert}
      heading="Remove this active project assignment?"
      message="The employee will no longer appear on this project. Existing labor costs and work history remain unchanged."
      confirmLabel="Remove assignment"
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
