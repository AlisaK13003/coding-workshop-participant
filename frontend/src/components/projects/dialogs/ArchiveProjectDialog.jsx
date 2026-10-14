import { Archive } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { archiveProject } from '../../../services/projectsApi.js'

/** Admin: archive a completed or abandoned `project`, filing it away from everyday views. */
export function ArchiveProjectDialog({ project, onClose }) {
  const archive = useMutation(() => archiveProject(project.id), {
    success: 'Project archived. Historical records remain available.',
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={`Archive ${project.name}?`}
      description="Only completed or abandoned projects can be archived."
      icon={Archive}
      heading="The project moves to the Archive. Only admins can see it there."
      message="Project details, milestones, assignments, activity and work logs are kept. Nothing is deleted."
      confirmLabel="Archive project"
      onConfirm={() => archive.run()}
      submitting={archive.submitting}
      error={archive.error}
      onClose={onClose}
    />
  )
}
