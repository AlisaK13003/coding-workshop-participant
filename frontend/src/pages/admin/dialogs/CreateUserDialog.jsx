import { useState } from 'react'
import { FormDialog } from '../../../components/dialogs'
import { Field, Input, Select } from '../../../components/ui'
import { managerNames } from '../../../data/adminData.js'

/** New user form. Salary and manager only apply to employees. */
export function CreateUserDialog({ onClose, onSubmit }) {
  const [role, setRole] = useState('Employee')
  return (
    <FormDialog
      title="Create user"
      description="User IDs are generated automatically and cannot be edited."
      submitLabel="Create user"
      onClose={onClose}
      onSubmit={onSubmit}
      wide
    >
      <div className="form-grid">
        <Field label="First name">
          <Input placeholder="First name" required />
        </Field>
        <Field label="Last name">
          <Input placeholder="Last name" required />
        </Field>
        <Field label="Username">
          <Input placeholder="firstname.lastname" required />
        </Field>
        <Field label="Email">
          <Input type="email" placeholder="name@northstar.co" required />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={setRole}>
            <option>Employee</option>
            <option>Manager</option>
            <option>Admin</option>
          </Select>
        </Field>
        <Field label="Job title">
          <Input placeholder="Job title" required />
        </Field>
        {role === 'Employee' && (
          <>
            <Field label="Annual salary">
              <Input type="number" placeholder="95000" required />
            </Field>
            <Field label="Assigned manager">
              <Select>
                <option>Choose a manager</option>
                {managerNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </Select>
            </Field>
          </>
        )}
        <Field
          label="Initial password"
          hint="The user will be asked to replace this password."
        >
          <Input type="password" required />
        </Field>
      </div>
    </FormDialog>
  )
}
