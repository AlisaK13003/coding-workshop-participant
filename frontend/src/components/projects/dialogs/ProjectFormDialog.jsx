import { FormDialog } from '../../dialogs'
import { Field, Input, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import { useCurrentUser } from '../../../hooks/useSession.js'
import { createProject, updateProject } from '../../../services/projectsApi.js'
import { listUsers } from '../../../services/usersApi.js'

/** Only the fields that differ from the project (all of them when creating). */
function changedValues(values, project) {
  if (!project) return values
  return Object.fromEntries(
    Object.entries(values).filter(([field, value]) =>
      field === 'manager_id' ? value !== (project.manager?.id ?? null) : value !== project[field],
    ),
  )
}

/**
 * Create a project (admins only) or edit `project`. Only admins choose the
 * manager; a manager sees themselves as read-only.
 */
export function ProjectFormDialog({ project, onClose }) {
  const user = useCurrentUser()
  const isAdmin = user.role === 'admin'
  const managers = useApiQuery(() => (isAdmin ? listUsers({ role: 'manager' }) : []), [isAdmin])
  const save = useMutation(
    (values) => (project ? updateProject(project.id, changedValues(values, project)) : createProject(values)),
    {
      success: project ? 'Project details updated.' : 'Project created and assigned to its manager.',
      onSuccess: onClose,
    },
  )
  const errors = save.fieldErrors

  const handleSubmit = (data) => {
    const values = {
      name: data.get('name'),
      start_date: data.get('start_date'),
      end_date: data.get('end_date'),
      budget: Number(data.get('budget')),
    }
    if (isAdmin && data.get('manager_id')) values.manager_id = Number(data.get('manager_id'))
    save.run(values)
  }

  return (
    <FormDialog
      title={project ? 'Edit project' : 'Create project'}
      description={
        isAdmin
          ? 'Only administrators create projects and choose their manager.'
          : 'Project ownership is controlled by administrators and can’t be changed here.'
      }
      submitLabel={project ? 'Save changes' : 'Create project'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={save.submitting}
      error={save.error}
    >
      <div className="form-grid">
        <Field label="Project name" error={errors.name}>
          <Input name="name" defaultValue={project?.name} placeholder="e.g. Operations Analytics Platform" required />
        </Field>
        <Field label="Manager" hint={isAdmin ? undefined : 'Read-only'} error={errors.manager_id}>
          {isAdmin ? (
            <Select
              name="manager_id"
              key={Boolean(managers.data)}
              defaultValue={project?.manager?.id ?? ''}
              required={!project}
            >
              <option value="">{managers.data ? 'Choose a manager' : 'Loading managers…'}</option>
              {(managers.data ?? []).map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input value={project?.manager?.name ?? ''} readOnly />
          )}
        </Field>
        <Field label="Start date" error={errors.start_date}>
          <Input name="start_date" type="date" defaultValue={project?.start_date} required />
        </Field>
        <Field label="Predicted end date" error={errors.end_date}>
          <Input name="end_date" type="date" defaultValue={project?.end_date} required />
        </Field>
        <Field label="Estimated budget" error={errors.budget}>
          <Input name="budget" type="number" min="0" step="0.01" defaultValue={project?.budget} placeholder="150000" required />
        </Field>
      </div>
    </FormDialog>
  )
}
