import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../dialogs'
import { useMutation } from '../../../hooks/useMutation.js'
import { deleteMilestone } from '../../../services/milestonesApi.js'

/** Deletes a milestone. The API refuses once it has history (work logs, members, reviews). */
export function DeleteMilestoneDialog({ milestone, onClose }) {
  const remove = useMutation(() => deleteMilestone(milestone.id), {
    success: 'Milestone deleted.',
    onSuccess: onClose,
  })
  return (
    <ConfirmDialog
      title={`Delete ${milestone.name}?`}
      description="Only milestones without any history can be deleted."
      icon={Trash2}
      heading="Delete this milestone permanently?"
      message="Milestones with work logs, assigned employees or review requests are kept for the record; complete them instead."
      confirmLabel="Delete milestone"
      confirmVariant="danger"
      onConfirm={() => remove.run()}
      submitting={remove.submitting}
      error={remove.error}
      onClose={onClose}
    />
  )
}
