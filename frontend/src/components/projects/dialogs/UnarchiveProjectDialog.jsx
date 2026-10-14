import { Archive } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { unarchiveProject } from '../../../services/projectsApi.js'

/** Admin: restore an archived project. It reopens in progress, without a manager or members. */
export function UnarchiveProjectDialog({ project, onClose }) {
  const restore = useMutation(() => unarchiveProject(project.id), {
    success: 'Project reopened. Assign a manager to continue.',
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={`Restore ${project.name}?`}
      description="Unarchiving reopens the project so it can be reassigned."
      icon={Archive}
      heading="Restoring this project reopens it and clears its manager and employee assignments."
      message="Project details and historical records remain. Completed milestones stay closed."
      confirmLabel="Restore project"
      onConfirm={() => restore.run()}
      submitting={restore.submitting}
      error={restore.error}
      onClose={onClose}
    >
      <div className="info-strip">
        After restoring, edit the project to assign a manager, who can then add employees.
      </div>
    </ConfirmDialog>
  )
}
