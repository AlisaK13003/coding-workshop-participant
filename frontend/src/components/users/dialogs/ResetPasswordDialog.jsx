import { useState } from 'react'
import { FormDialog } from '../../dialogs'
import { Field, Input } from '../../ui'
import { useMutation } from '../../../hooks/useMutation.js'
import { resetPassword } from '../../../services/usersApi.js'

/** Admin, or the employee's manager: set a new password for `user`. Existing passwords are never shown. */
export function ResetPasswordDialog({ user, onClose }) {
  const [mismatch, setMismatch] = useState('')
  const reset = useMutation((password) => resetPassword(user.id, password), {
    success: `Password reset for ${user.name}. Share it with them securely.`,
    onSuccess: onClose,
  })

  const handleSubmit = (data) => {
    const password = data.get('password')
    const problem = password === data.get('confirm') ? '' : 'Passwords don’t match.'
    setMismatch(problem)
    if (!problem) reset.run(password)
  }

  return (
    <FormDialog
      title="Reset password"
      description="Existing passwords are never displayed."
      submitLabel="Reset password"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={reset.submitting}
      error={reset.error}
    >
      <div className="form-grid">
        <Field label="New password" hint="At least 8 characters." error={reset.fieldErrors.password}>
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field label="Confirm new password" error={mismatch}>
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </Field>
      </div>
    </FormDialog>
  )
}
