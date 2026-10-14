import { FormDialog, ValidationNote } from '../../dialogs'
import { Field, MoneyInput, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import { listUsers } from '../../../services/usersApi.js'
import { addWorkLog } from '../../../services/workLogsApi.js'
import { WorkLogFields } from './WorkLogFields.jsx'
import { ROLE } from '../../../utils/users.js'

/** Admin: enter a past workday for any employee. project (optional) pre-selects the project. */
export function AddWorkLogDialog({ project, onClose }) {
  const employees = useApiQuery(() => listUsers({ role: ROLE.employee }), [])
  const add = useMutation(addWorkLog, {
    success: 'Historical workday added with an activity record.',
    onSuccess: onClose,
  })
  const errors = add.fieldErrors

  const handleSubmit = (data) =>
    add.run({
      employee_id: Number(data.get('employee_id')),
      project_id: Number(data.get('project_id')),
      milestone_id: Number(data.get('milestone_id')),
      work_date: data.get('work_date'),
      hourly_rate: data.get('hourly_rate') === '' ? null : Number(data.get('hourly_rate')),
    })

  return (
    <FormDialog
      title="Add historical workday"
      description="Admins can enter past days for any employee and correct existing records."
      submitLabel="Add workday"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={add.submitting}
      error={add.error}
      wide
    >
      <ValidationNote>
        Each entry is one 8-hour weekday, at most one per employee per day, and never in the future.
      </ValidationNote>
      <div className="form-grid">
        <Field label="Employee" error={errors.employee_id}>
          <Select name="employee_id" defaultValue="" required>
            <option value="">{employees.data ? 'Choose employee' : 'Loading employees…'}</option>
            {(employees.data ?? []).map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </Select>
        </Field>
        <WorkLogFields defaultProjectId={project?.id} errors={errors} />
        <Field
          label="Hourly rate (optional)"
          hint="Leave empty to use the employee’s current salary."
          error={errors.hourly_rate}
        >
          <MoneyInput name="hourly_rate" step={1} />
        </Field>
      </div>
    </FormDialog>
  )
}
