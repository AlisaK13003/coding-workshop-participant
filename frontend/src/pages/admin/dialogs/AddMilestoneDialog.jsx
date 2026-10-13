import { FormDialog } from '../../../components/dialogs'
import { Field, Input, Select } from '../../../components/ui'

export function AddMilestoneDialog({ onClose, onSubmit }) {
  return (
    <FormDialog
      title="Add milestone"
      description="Dependencies can branch and run in parallel. Circular dependencies are not allowed."
      submitLabel="Add milestone"
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="form-grid">
        <Field label="Milestone name">
          <Input placeholder="Milestone name" required />
        </Field>
        <Field label="Start date">
          <Input type="date" required />
        </Field>
        <Field label="End date">
          <Input type="date" required />
        </Field>
        <Field
          label="Prerequisites"
          hint="Select multiple completed or planned milestones."
        >
          <Select>
            <option>No prerequisites</option>
            <option>Research & requirements</option>
            <option>Design system</option>
            <option>API integration</option>
          </Select>
        </Field>
      </div>
    </FormDialog>
  )
}
