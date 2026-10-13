import { useState } from 'react'
import { CircleAlert, LockKeyhole } from 'lucide-react'
import {
  Avatar,
  Button,
  DetailList,
  Field,
  Input,
  PageHeading,
  Panel,
  PanelNote,
} from '../../components/ui'
import { signedInEmployee } from '../../data/employeeData.js'
import { fullName } from '../../utils/format.js'
import { validatePasswordChange } from '../../utils/password.js'
import './MyProfilePage.css'

const EMPTY_FORM = { current: '', next: '', confirm: '' }

const PROFILE_ITEMS = [
  { label: 'First name', value: signedInEmployee.first },
  { label: 'Last name', value: signedInEmployee.last },
  { label: 'Username', value: signedInEmployee.username },
  { label: 'Email', value: signedInEmployee.email },
  { label: 'Job title', value: signedInEmployee.title },
  { label: 'Employee ID', value: <code>{signedInEmployee.employeeId}</code> },
  { label: 'Assigned manager', value: signedInEmployee.manager },
]

/** Read-only profile details and a change-password form. */
export function MyProfilePage({ onPasswordChanged }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const name = fullName(signedInEmployee)

  const updateField = (field) => (event) =>
    setForm((values) => ({ ...values, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const problem = validatePasswordChange(form)
    setError(problem)
    if (problem) return
    setForm(EMPTY_FORM)
    onPasswordChanged('Password changed successfully.')
  }

  return (
    <>
      <PageHeading
        eyebrow="Account"
        title="My profile"
        description="Your manager or an administrator maintains your profile details."
      />
      <div className="profile-layout">
        <Panel>
          <div className="employee-profile-head">
            <Avatar name={name} />
            <div>
              <h2>{name}</h2>
              <p>
                {signedInEmployee.title} · Reports to {signedInEmployee.manager}
              </p>
            </div>
          </div>
          <DetailList items={PROFILE_ITEMS} />
          <PanelNote tone="muted">
            Contact your manager or an administrator if these details need to
            change.
          </PanelNote>
        </Panel>
        <Panel
          className="password-panel"
          title="Change password"
          description="Your existing password is never displayed."
          actions={<LockKeyhole size={19} />}
        >
          <form onSubmit={handleSubmit}>
            <Field label="Current password">
              <Input
                type="password"
                value={form.current}
                onChange={updateField('current')}
                autoComplete="current-password"
              />
            </Field>
            <Field
              label="New password"
              hint="At least 10 characters, one uppercase letter, and one number."
            >
              <Input
                type="password"
                value={form.next}
                onChange={updateField('next')}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                value={form.confirm}
                onChange={updateField('confirm')}
                autoComplete="new-password"
              />
            </Field>
            {error && (
              <div className="password-error" role="alert">
                <CircleAlert size={15} />
                {error}
              </div>
            )}
            <Button type="submit">Change password</Button>
          </form>
        </Panel>
      </div>
    </>
  )
}
