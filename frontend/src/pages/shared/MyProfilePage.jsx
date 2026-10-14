import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
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
import { useMutation } from '../../hooks/useMutation.js'
import { changePassword } from '../../services/authApi.js'
import { PASSWORD_HINT, validatePasswordChange } from '../../utils/password.js'
import { capitalize } from '../../utils/text.js'
import './MyProfilePage.css'

const EMPTY_FORM = { current: '', next: '', confirm: '' }

// Who can change an employee's or a manager's details.
const MAINTAINED_BY = {
  employee: 'your manager or an administrator',
  manager: 'an administrator',
}

/**
 * Read-only profile details (from the API) and a change-password form, for employees and managers.
 * profile: the user from the API. relation: the line under the name, e.g. "Reports to Morgan Manager".
 * extraDetails: role-specific rows added to the details list.
 */
export function MyProfilePage({ profile, relation, extraDetails = [] }) {
  const maintainedBy = MAINTAINED_BY[profile.role] ?? 'an administrator'
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const change = useMutation(() => changePassword(form.current, form.next), {
    success: 'Password changed successfully.',
    onSuccess: () => setForm(EMPTY_FORM),
  })
  const fieldErrors = { ...errors, ...change.fieldErrors }

  const updateField = (field) => (event) =>
    setForm((values) => ({ ...values, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const problems = validatePasswordChange(form)
    setErrors(problems)
    if (!Object.keys(problems).length) change.run()
  }

  return (
    <>
      <PageHeading
        eyebrow="Account"
        title="My profile"
        description={`${capitalize(maintainedBy)} maintains your profile details.`}
      />
      <div className="profile-layout">
        <Panel>
          <div className="profile-head">
            <Avatar name={profile.name} />
            <div>
              <h2>{profile.name}</h2>
              <p>
                {[profile.job_title, relation].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <DetailList
            items={[
              { label: 'First name', value: profile.first_name },
              { label: 'Last name', value: profile.last_name },
              { label: 'Username', value: profile.username },
              { label: 'Email', value: profile.email },
              { label: 'Job title', value: profile.job_title },
              { label: `${capitalize(profile.role)} ID`, value: <code>{profile.display_id}</code> },
              ...extraDetails,
            ]}
          />
          <PanelNote tone="muted">
            Contact {maintainedBy} if these details need to change.
          </PanelNote>
        </Panel>
        <Panel
          className="password-panel"
          title="Change password"
          description="Your existing password is never displayed."
          actions={<LockKeyhole size={19} />}
        >
          <form onSubmit={handleSubmit} noValidate>
            {/* Tells the browser's password manager whose saved password this updates. */}
            <input type="text" name="username" autoComplete="username" value={profile.username} readOnly hidden />
            <Field label="Current password" error={fieldErrors.current_password}>
              <Input
                type="password"
                value={form.current}
                onChange={updateField('current')}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" hint={PASSWORD_HINT} error={fieldErrors.new_password}>
              <Input
                type="password"
                value={form.next}
                onChange={updateField('next')}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password" error={fieldErrors.confirm}>
              <Input
                type="password"
                value={form.confirm}
                onChange={updateField('confirm')}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" disabled={change.submitting}>
              {change.submitting ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        </Panel>
      </div>
    </>
  )
}
