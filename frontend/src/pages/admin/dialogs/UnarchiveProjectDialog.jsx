import { Archive } from 'lucide-react'
import { ConfirmDialog } from '../../../components/dialogs'

/** Restores an archived project. payload is the project. */
export function UnarchiveProjectDialog({ payload: project, onClose, onSubmit }) {
  return (
    <ConfirmDialog
      title={`Restore ${project.name}?`}
      description="Unarchiving does not change the project status."
      icon={Archive}
      heading="Restoring this project clears its manager and employee assignments."
      message="Project details and historical records remain. Completed milestones stay closed."
      confirmLabel="Restore project"
      onConfirm={onSubmit}
      onClose={onClose}
    >
      <div className="info-strip">
        After restoration, the project will need a manager and eligible
        employees assigned.
      </div>
    </ConfirmDialog>
  )
}
