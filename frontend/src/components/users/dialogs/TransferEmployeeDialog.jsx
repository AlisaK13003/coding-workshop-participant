import { FormDialog, ValidationNote } from '../../dialogs'
import { Field, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import { listUsers, updateUser } from '../../../services/usersApi.js'
import { ROLE } from '../../../utils/users.js'

/** Admin: move an employee to another reporting manager. */
export function TransferEmployeeDialog({ user, onClose }) {
  const managers = useApiQuery(() => listUsers({ role: ROLE.manager }), [])
  const transfer = useMutation((managerId) => updateUser(user.id, { manager_id: managerId }), {
    success: `${user.name} now reports to their new manager.`,
    onSuccess: onClose,
  })
  const choices = (managers.data ?? []).filter((manager) => manager.id !== user.manager?.id)

  return (
    <FormDialog
      title={`Transfer ${user.name}`}
      description={`Currently reports to ${user.manager?.name ?? 'nobody'}.`}
      submitLabel="Transfer employee"
      onClose={onClose}
      onSubmit={(data) => transfer.run(Number(data.get('manager_id')))}
      submitting={transfer.submitting}
      error={transfer.error}
    >
      <div className="form-single">
        <Field label="New manager" error={transfer.fieldErrors.manager_id}>
          <Select name="manager_id" required defaultValue="">
            <option value="">{managers.data ? 'Choose a manager' : 'Loading managers…'}</option>
            {choices.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </Select>
        </Field>
        <ValidationNote>
          Current project memberships stay as they are. The employee is notified of the change.
        </ValidationNote>
      </div>
    </FormDialog>
  )
}
