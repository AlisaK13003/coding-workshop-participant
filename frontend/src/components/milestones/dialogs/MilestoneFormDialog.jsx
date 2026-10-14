import { FormDialog } from '../../dialogs'
import { Field, Input, LoadingState, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import {
  createMilestone,
  listMilestones,
  setPrerequisites,
  updateMilestone,
} from '../../../services/milestonesApi.js'
import { dependsOn, isCompleted } from '../../../utils/milestones.js'

/** Saves the form: one request to create, or an update plus a prerequisites change to edit. */
async function saveMilestone({ project, milestone, values, prerequisiteIds }) {
  if (!milestone) {
    return createMilestone({ project_id: project.id, ...values, prerequisite_ids: prerequisiteIds })
  }
  const saved = await updateMilestone(milestone.id, values)
  const unchanged =
    prerequisiteIds.length === milestone.prerequisite_ids.length &&
    prerequisiteIds.every((id) => milestone.prerequisite_ids.includes(id))
  return unchanged ? saved : setPrerequisites(milestone.id, prerequisiteIds)
}

/**
 * Add a milestone to `project`, or edit `milestone`. Prerequisite choices leave out
 * the milestone itself, anything that already depends on it, and completed
 * milestones (the API doesn't allow adding or removing those as prerequisites).
 */
export function MilestoneFormDialog({ project, milestone, onClose }) {
  const milestones = useApiQuery(() => listMilestones(project.id), [project.id])
  const save = useMutation(saveMilestone, {
    success: milestone ? 'Milestone updated.' : 'Milestone added to the project plan.',
    onSuccess: onClose,
  })
  const errors = save.fieldErrors

  const all = milestones.data ?? []
  const choices = all.filter(
    (item) =>
      !isCompleted(item) &&
      (!milestone || (item.id !== milestone.id && !dependsOn(item.id, milestone.id, all))),
  )
  // Completed prerequisites can't be removed, so they're always kept.
  const keptIds = milestone
    ? milestone.prerequisite_ids.filter((id) => all.some((item) => item.id === id && isCompleted(item)))
    : []
  const keptNames = all.filter((item) => keptIds.includes(item.id)).map((item) => item.name)

  const handleSubmit = (data) =>
    save.run({
      project,
      milestone,
      values: {
        name: data.get('name'),
        start_date: data.get('start_date'),
        end_date: data.get('end_date'),
      },
      prerequisiteIds: [...keptIds, ...data.getAll('prerequisites').map(Number)],
    })

  return (
    <FormDialog
      title={milestone ? 'Edit milestone' : 'Add milestone'}
      description="Select several prerequisites when work depends on parallel branches. Circular dependencies are not allowed."
      submitLabel={milestone ? 'Save milestone' : 'Add milestone'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={save.submitting}
      submitDisabled={milestones.data === undefined}
      error={save.error}
    >
      <div className="form-grid">
        <Field label="Milestone name" error={errors.name}>
          <Input name="name" defaultValue={milestone?.name} required />
        </Field>
        <Field label="Start date" error={errors.start_date}>
          <Input
            name="start_date"
            type="date"
            min={project.start_date}
            max={project.end_date}
            defaultValue={milestone?.start_date}
            required
          />
        </Field>
        <Field label="Expected end date" error={errors.end_date}>
          <Input
            name="end_date"
            type="date"
            min={project.start_date}
            max={project.end_date}
            defaultValue={milestone?.end_date}
            required
          />
        </Field>
        <Field
          label="Prerequisites"
          hint={
            keptNames.length
              ? `Completed prerequisites stay: ${keptNames.join(', ')}. Use Ctrl/Cmd to select several.`
              : 'Use Ctrl/Cmd to select several. Completed milestones can’t be added.'
          }
          error={errors.prerequisite_ids}
        >
          {milestones.data === undefined ? (
            <LoadingState label="Loading milestones…" />
          ) : (
            <Select
              className="multi-select"
              name="prerequisites"
              multiple
              defaultValue={milestone?.prerequisite_ids.filter((id) => !keptIds.includes(id)).map(String)}
            >
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </FormDialog>
  )
}
