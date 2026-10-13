import { FormDialog } from '../../../components/dialogs'
import { Field, Input, Select } from '../../../components/ui'
import {
  dependsOn,
  getProjectMilestones,
  getStatusForPrerequisites,
} from '../../../utils/milestones.js'

/**
 * Add a milestone, or edit one when `milestone` is given. Prerequisite choices
 * exclude the milestone itself and anything that already depends on it.
 */
export function MilestoneFormDialog({
  project,
  milestone,
  milestones,
  onClose,
  onSave,
}) {
  const prerequisiteChoices = getProjectMilestones(milestones, project.id).filter(
    (item) =>
      !milestone ||
      (item.id !== milestone.id && !dependsOn(item.id, milestone.id, milestones)),
  )

  const handleSubmit = (data) => {
    const prerequisiteIds = data
      .getAll('prerequisites')
      .map(Number)
      .filter(Boolean)
    onSave({
      id: milestone?.id || Math.max(...milestones.map((item) => item.id)) + 1,
      projectId: project.id,
      name: String(data.get('name')),
      start: String(data.get('start')),
      end: String(data.get('end')),
      prerequisiteIds,
      employeeIds: milestone?.employeeIds || [],
      hours: milestone?.hours || 0,
      status: getStatusForPrerequisites(
        prerequisiteIds,
        milestones,
        milestone?.status,
      ),
    })
  }

  return (
    <FormDialog
      title={milestone ? 'Edit milestone' : 'Add milestone'}
      description="Select multiple prerequisites when work depends on parallel branches. Self and circular dependencies are excluded."
      submitLabel={milestone ? 'Save milestone' : 'Add milestone'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="form-grid">
        <Field label="Milestone name">
          <Input name="name" defaultValue={milestone?.name} required />
        </Field>
        <Field label="Start date">
          <Input
            name="start"
            type="date"
            defaultValue={milestone?.start}
            required
          />
        </Field>
        <Field label="Expected end date">
          <Input name="end" type="date" defaultValue={milestone?.end} required />
        </Field>
        <Field
          label="Prerequisites"
          hint="Use Ctrl/Cmd to select multiple. A new milestone cannot depend on itself, and circular dependencies are rejected."
        >
          <Select
            className="multi-select"
            name="prerequisites"
            multiple
            defaultValue={milestone?.prerequisiteIds.map(String)}
          >
            {prerequisiteChoices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </FormDialog>
  )
}
