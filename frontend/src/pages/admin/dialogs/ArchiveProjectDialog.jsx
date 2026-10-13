import { Archive } from 'lucide-react'
import { ConfirmDialog } from '../../../components/dialogs'

export function ArchiveProjectDialog({ onClose, onSubmit }) {
  return (
    <ConfirmDialog
      title="Archive project?"
      description="Archiving is separate from project status."
      icon={Archive}
      heading="Historical views remain available."
      message="Project details, milestones, assignments, activity, and work logs will be preserved. No records are permanently deleted."
      confirmLabel="Archive project"
      onConfirm={onSubmit}
      onClose={onClose}
    />
  )
}
