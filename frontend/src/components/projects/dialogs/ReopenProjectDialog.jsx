import { RotateCcw } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { reopenProject } from '../../../services/projectsApi.js'

/** Admin: undo abandoning. The project goes back in progress with its manager and members. */
export function ReopenProjectDialog({ project, onClose }) {
  const reopen = useMutation(() => reopenProject(project.id), {
    success: 'Project reopened.',
    onSuccess: onClose,
  })
  const manager = project.manager?.name
  return (
    <ConfirmDialog
      title={`Reopen ${project.name}?`}
      description="Undoes abandoning the project."
      icon={RotateCcw}
      heading="The project goes back to In progress with the same manager and employees."
      message={
        manager
          ? `${manager} is notified and can carry on where the project left off.`
          : 'It has no manager yet; assign one to carry on.'
      }
      confirmLabel="Reopen project"
      onConfirm={() => reopen.run()}
      submitting={reopen.submitting}
      error={reopen.error}
      onClose={onClose}
    />
  )
}
