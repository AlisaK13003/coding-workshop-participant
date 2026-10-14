import { Archive } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { archiveProject } from '../../../services/projectsApi.js'

/** Admin: archive `project`. Archiving is separate from its status. */
export function ArchiveProjectDialog({ project, onClose }) {
  const archive = useMutation(() => archiveProject(project.id), {
    success: 'Project archived. Historical records remain available.',
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={`Archive ${project.name}?`}
      description="Archiving is separate from project status."
      icon={Archive}
      heading="Historical views remain available."
      message="Project details, milestones, assignments, activity and work logs are kept. Nothing is deleted."
      confirmLabel="Archive project"
      onConfirm={() => archive.run()}
      submitting={archive.submitting}
      error={archive.error}
      onClose={onClose}
    />
  )
}
