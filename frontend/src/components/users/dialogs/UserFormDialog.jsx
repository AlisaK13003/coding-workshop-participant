import { useState } from 'react'
import { FormDialog } from '../../dialogs'
import { Field, Input, MoneyInput, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import { useCurrentUser } from '../../../hooks/useSession.js'
import { createUser, listUsers, updateUser } from '../../../services/usersApi.js'
import { ROLES, roleLabel } from '../../../utils/users.js'

/**
 * Create a user (admins only) or edit `user`. Admins can change anything except
 * their own role; managers edit their employees' profile and salary, but not
 * their role or manager. Salary and manager apply to employees only.
 */
export function UserFormDialog({ user, onClose }) {
  const me = useCurrentUser()
  const isAdmin = me.role === 'admin'
  const [role, setRole] = useState(user?.role ?? 'employee')
  const managers = useApiQuery(() => (isAdmin ? listUsers({ role: 'manager' }) : []), [isAdmin])
  const save = useMutation((values) => (user ? updateUser(user.id, values) : createUser(values)), {
    success: user ? 'Profile updated. Historical labor costs were kept.' : 'User created with a generated ID.',
    onSuccess: onClose,
  })
  const errors = save.fieldErrors
  const isEmployee = role === 'employee'
  const showsSalary = isEmployee && (!user || 'annual_salary' in user)

  const handleSubmit = (data) => {
    const values = {
      first_name: data.get('first_name'),
      last_name: data.get('last_name'),
      username: data.get('username') || null,
      email: data.get('email'),
      job_title: data.get('job_title'),
    }
    if (isAdmin) values.role = role
    if (isAdmin && isEmployee) values.manager_id = Number(data.get('manager_id')) || null
    if (showsSalary) values.annual_salary = data.get('annual_salary') === '' ? null : Number(data.get('annual_salary'))
    if (!user) values.password = data.get('password')
    save.run(values)
  }

  return (
    <FormDialog
      title={user ? `Edit ${user.name}` : 'Create user'}
      description={
        isAdmin
          ? 'User IDs are generated automatically and can’t be edited.'
          : 'Role, reporting manager and the generated ID can’t be changed.'
      }
      submitLabel={user ? 'Save profile' : 'Create user'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={save.submitting}
      error={save.error}
      wide
    >
      <div className="form-grid">
        <Field label="First name" error={errors.first_name}>
          <Input name="first_name" defaultValue={user?.first_name} required />
        </Field>
        <Field label="Last name" error={errors.last_name}>
          <Input name="last_name" defaultValue={user?.last_name} required />
        </Field>
        <Field
          label="Username"
          hint={user ? undefined : 'Leave empty to generate one from the name.'}
          error={errors.username}
        >
          <Input name="username" defaultValue={user?.username} required={Boolean(user)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input name="email" type="email" defaultValue={user?.email} required />
        </Field>
        <Field
          label="Role"
          hint={user?.id === me.id ? 'You can’t change your own role.' : !isAdmin ? 'Read-only' : undefined}
          error={errors.role}
        >
          <Select value={role} onChange={setRole} disabled={!isAdmin || user?.id === me.id}>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {roleLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Job title" error={errors.job_title}>
          <Input name="job_title" defaultValue={user?.job_title} required />
        </Field>
        {showsSalary && (
          <Field
            label="Annual salary"
            hint="Changes apply to future work logs; recorded costs stay unchanged."
            error={errors.annual_salary}
          >
            <MoneyInput name="annual_salary" defaultValue={user?.annual_salary} placeholder="95,000" required />
          </Field>
        )}
        {isEmployee && (
          <Field label="Reporting manager" hint={isAdmin ? undefined : 'Read-only'} error={errors.manager_id}>
            {isAdmin ? (
              <Select
                name="manager_id"
                key={Boolean(managers.data)}
                defaultValue={user?.manager?.id ?? ''}
                required
              >
                <option value="">{managers.data ? 'Choose a manager' : 'Loading managers…'}</option>
                {(managers.data ?? []).map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input value={user?.manager?.name ?? ''} readOnly />
            )}
          </Field>
        )}
        {!user && (
          <Field label="Initial password" hint="At least 8 characters." error={errors.password}>
            <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </Field>
        )}
      </div>
    </FormDialog>
  )
}
