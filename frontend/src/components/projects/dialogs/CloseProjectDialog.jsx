import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { useCurrentUser } from '../../../hooks/useSession.js'
import { abandonProject, completeProject } from '../../../services/projectsApi.js'

/** Close `project` as completed or (admins only) abandoned. outcome: 'complete' | 'abandon'. */
export function CloseProjectDialog({ project, outcome, onClose }) {
  const user = useCurrentUser()
  const completing = outcome === 'complete'
  const close = useMutation(() => (completing ? completeProject(project.id) : abandonProject(project.id)), {
    success: `${project.name} was marked ${completing ? 'completed' : 'abandoned'}.`,
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={completing ? 'Complete project?' : 'Abandon project?'}
      description="Closed projects can’t be changed any more."
      icon={completing ? CheckCircle2 : AlertTriangle}
      heading={completing ? 'Close this project as completed?' : 'Close this project as abandoned?'}
      message={
        user.role === 'manager'
          ? 'It leaves your workspace, with its logs. Administrators keep the complete history.'
          : 'Its milestones, assignments and work logs stay available to administrators.'
      }
      confirmLabel={completing ? 'Complete project' : 'Abandon project'}
      confirmVariant={completing ? 'primary' : 'danger'}
      onConfirm={() => close.run()}
      submitting={close.submitting}
      error={close.error}
      onClose={onClose}
    />
  )
}
