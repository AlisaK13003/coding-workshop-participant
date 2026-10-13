import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '../../../components/dialogs'

/** Close the project as 'Completed' or 'Abandoned'. */
export function CloseProjectDialog({ status, onClose, onConfirm }) {
  const completing = status === 'Completed'
  return (
    <ConfirmDialog
      title={completing ? 'Complete project?' : 'Abandon project?'}
      description="This action removes the project from all manager views."
      icon={completing ? CheckCircle2 : AlertTriangle}
      heading={
        completing
          ? 'Explicitly close this completed project?'
          : 'Close this project as abandoned?'
      }
      message="You will no longer be able to access the project or its logs. Administrators retain the complete historical record."
      confirmLabel={completing ? 'Complete project' : 'Abandon project'}
      confirmVariant={completing ? 'primary' : 'danger'}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  )
}
