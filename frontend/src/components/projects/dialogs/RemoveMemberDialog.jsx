import { CircleAlert } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { removeMember } from '../../../services/projectsApi.js'

/** Takes `member` off `project`. Their work history stays. */
export function RemoveMemberDialog({ project, member, onClose }) {
  const remove = useMutation(() => removeMember(project.id, member.id), {
    success: 'Project assignment removed. Historical records remain.',
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={`Remove ${member.user.name}?`}
      description="Historical assignments and work logs are kept."
      icon={CircleAlert}
      heading="Remove this project assignment?"
      message="The employee no longer appears on this project. Existing labor costs and work history stay unchanged."
      confirmLabel="Remove assignment"
      onConfirm={() => remove.run()}
      submitting={remove.submitting}
      error={remove.error}
      onClose={onClose}
    />
  )
}
