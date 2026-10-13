import { CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '../../../components/dialogs'
import { Field, Select } from '../../../components/ui'

/** Confirms completing the milestone under review, with an optional destination for its employees. */
export function CompleteMilestoneDialog({ onClose, onSubmit }) {
  return (
    <ConfirmDialog
      title="Confirm milestone completion"
      description="Completed milestones cannot be reopened."
      icon={CheckCircle2}
      heading="Complete “Design system”?"
      message="All employees assigned to it can move together to an optional destination milestone."
      confirmLabel="Confirm completion"
      onConfirm={onSubmit}
      onClose={onClose}
    >
      <Field
        label="Destination milestone (optional)"
        hint="Portal build remains blocked until API integration is complete. Employees moved there will wait and cannot log work."
      >
        <Select>
          <option>No destination — leave employees unassigned</option>
          <option>Portal build — prerequisites incomplete</option>
          <option>API integration — available</option>
        </Select>
      </Field>
    </ConfirmDialog>
  )
}
