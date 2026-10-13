import { FormDialog } from '../../../components/dialogs'
import { Field, Input } from '../../../components/ui'
import { MANAGER_NAME } from '../../../data/managerData.js'
import { fullName } from '../../../utils/format.js'

/** Edit a direct report's profile. onSave receives the updated employee. */
export function EditEmployeeDialog({ employee, onClose, onSave }) {
  const handleSubmit = (data) =>
    onSave({
      ...employee,
      first: String(data.get('first')),
      last: String(data.get('last')),
      username: String(data.get('username')),
      email: String(data.get('email')),
      title: String(data.get('title')),
      salary: Number(data.get('salary')),
    })
  return (
    <FormDialog
      title={`Edit ${fullName(employee)}`}
      description="Role, reporting manager, and generated employee ID cannot be changed."
      submitLabel="Save profile"
      onClose={onClose}
      onSubmit={handleSubmit}
      wide
    >
      <div className="form-grid">
        <Field label="First name">
          <Input name="first" defaultValue={employee.first} required />
        </Field>
        <Field label="Last name">
          <Input name="last" defaultValue={employee.last} required />
        </Field>
        <Field label="Username">
          <Input name="username" defaultValue={employee.username} required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={employee.email} required />
        </Field>
        <Field label="Job title">
          <Input name="title" defaultValue={employee.title} required />
        </Field>
        <Field
          label="Annual salary"
          hint="Future labor rates update; historical costs remain unchanged."
        >
          <Input
            name="salary"
            type="number"
            defaultValue={employee.salary}
            required
          />
        </Field>
        <Field label="Reporting manager" hint="Read-only">
          <Input value={MANAGER_NAME} readOnly />
        </Field>
        <Field label="Employee ID" hint="Generated and read-only">
          <Input value={employee.employeeId} readOnly />
        </Field>
      </div>
    </FormDialog>
  )
}
