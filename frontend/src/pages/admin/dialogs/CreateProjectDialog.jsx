import { FormDialog } from '../../../components/dialogs'
import { Field, Input, Select } from '../../../components/ui'
import { managerNames } from '../../../data/adminData.js'

export function CreateProjectDialog({ onClose, onSubmit }) {
  return (
    <FormDialog
      title="Create project"
      description="Only administrators can create projects."
      submitLabel="Create project"
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <div className="form-grid">
        <Field label="Project name">
          <Input placeholder="e.g. Operations Analytics Platform" required />
        </Field>
        <Field label="Manager">
          <Select>
            <option>Choose a manager</option>
            {managerNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Start date">
          <Input type="date" required />
        </Field>
        <Field label="Predicted end date">
          <Input type="date" required />
        </Field>
        <Field label="Estimated budget">
          <Input type="number" placeholder="150000" required />
        </Field>
      </div>
    </FormDialog>
  )
}
