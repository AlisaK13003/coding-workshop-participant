import { FormDialog } from '../../../components/dialogs'
import { Field, Input } from '../../../components/ui'
import { MANAGER_NAME } from '../../../data/managerData.js'

/** Edit name, dates and budget. onSave receives the updated project. */
export function EditProjectDialog({ project, onClose, onSave }) {
  const handleSubmit = (data) =>
    onSave({
      ...project,
      name: String(data.get('name')),
      start: String(data.get('start')),
      end: String(data.get('end')),
      budget: Number(data.get('budget')),
    })
  return (
    <FormDialog
      title="Edit project"
      description="Project ownership is controlled by administrators and cannot be changed here."
      submitLabel="Save changes"
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="form-grid">
        <Field label="Project name">
          <Input name="name" defaultValue={project.name} required />
        </Field>
        <Field label="Manager" hint="Read-only">
          <Input value={MANAGER_NAME} readOnly />
        </Field>
        <Field label="Start date">
          <Input name="start" type="date" defaultValue={project.start} required />
        </Field>
        <Field label="Predicted end date">
          <Input name="end" type="date" defaultValue={project.end} required />
        </Field>
        <Field label="Estimated budget">
          <Input
            name="budget"
            type="number"
            defaultValue={project.budget}
            required
          />
        </Field>
      </div>
    </FormDialog>
  )
}
