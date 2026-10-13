import { FormDialog, ValidationNote } from '../../../components/dialogs'
import { Field, Input, Select } from '../../../components/ui'

/** Historical workday entry with an audit reason. */
export function AddWorkLogDialog({ onClose, onSubmit }) {
  return (
    <FormDialog
      title="Add historical workday"
      description="Admins can create historical entries and correct existing records."
      submitLabel="Add workday"
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <ValidationNote>
        Entries must be weekdays, exactly 8 hours, and cannot overlap another
        project for the employee on the same day.
      </ValidationNote>
      <div className="form-grid">
        <Field label="Work date">
          <Input type="date" required />
        </Field>
        <Field label="Employee">
          <Select>
            <option>Choose employee</option>
            <option>Aisha Patel</option>
            <option>Jon Bell</option>
            <option>Sofia Reyes</option>
          </Select>
        </Field>
        <Field label="Project">
          <Select>
            <option>Choose project</option>
            <option>Customer Portal Rebuild</option>
            <option>Finance Data Migration</option>
          </Select>
        </Field>
        <Field label="Milestone">
          <Select>
            <option>Choose milestone</option>
            <option>Design system</option>
            <option>API integration</option>
          </Select>
        </Field>
        <Field label="Hours">
          <Input type="number" defaultValue="8" required />
        </Field>
        <Field label="Administrative reason">
          <Input placeholder="Required audit reason" required />
        </Field>
      </div>
    </FormDialog>
  )
}
