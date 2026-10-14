import { FormDialog } from '../../dialogs'
import { Field, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import { updateProject } from '../../../services/projectsApi.js'
import { listUsers } from '../../../services/usersApi.js'

/** Admin: give a project without a manager (e.g. after unarchiving) a manager in one step. */
export function AssignManagerDialog({ project, onClose }) {
  const managers = useApiQuery(() => listUsers({ role: 'manager' }), [])
  const assign = useMutation((managerId) => updateProject(project.id, { manager_id: managerId }), {
    success: (saved) => `${saved.manager?.name ?? 'The manager'} now manages ${project.name}.`,
    onSuccess: onClose,
  })
  return (
    <FormDialog
      title="Assign manager"
      description={`Choose who manages ${project.name}. They'll be notified and can then add employees.`}
      submitLabel="Assign manager"
      onClose={onClose}
      onSubmit={(data) => assign.run(Number(data.get('manager_id')))}
      submitting={assign.submitting}
      submitDisabled={managers.data === undefined}
      error={assign.error}
    >
      <div className="form-single">
        <Field label="Manager" error={assign.fieldErrors.manager_id}>
          <Select name="manager_id" key={Boolean(managers.data)} defaultValue="" required>
            <option value="" disabled>
              {managers.data ? 'Choose a manager' : 'Loading managers…'}
            </option>
            {(managers.data ?? []).map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </FormDialog>
  )
}
