import { FormDialog } from '../../dialogs'
import { CheckboxList, Field, Input, LoadingState, Select } from '../../ui'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import {
  createMilestone,
  listMilestones,
  setPrerequisites,
  updateMilestone,
} from '../../../services/milestonesApi.js'
import { assignMember, listMembers } from '../../../services/projectsApi.js'
import { dependsOn, isCompleted } from '../../../utils/milestones.js'

/** Saves the milestone itself: one request to create, or an update plus a prerequisites change to edit. */
async function saveDetails({ project, milestone, values, prerequisiteIds }) {
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
 * Puts the checked members on the milestone and takes unchecked ones off it. Each employee
 * has one milestone per project, so checking someone moves them here from wherever they were.
 */
async function saveAssignments(project, milestoneId, members, checkedIds) {
  for (const member of members) {
    const isHere = member.milestone?.id === milestoneId
    const wantHere = checkedIds.includes(member.id)
    if (wantHere !== isHere) await assignMember(project.id, member.id, wantHere ? milestoneId : null)
  }
}

async function saveMilestone({ project, milestone, values, prerequisiteIds, members, checkedIds }) {
  const saved = await saveDetails({ project, milestone, values, prerequisiteIds })
  await saveAssignments(project, milestone?.id ?? saved.id, members, checkedIds)
  return saved
}

/** "On Build", "No milestone" or "On this milestone", shown under each member's name. */
function currentAssignment(member, milestone) {
  if (!member.milestone) return 'No milestone yet'
  if (milestone && member.milestone.id === milestone.id) return 'On this milestone'
  return `Now on ${member.milestone.name}, so checking moves them here`
}

/**
 * Add a milestone to `project`, or edit `milestone`, including which members work on it.
 * Prerequisite choices leave out the milestone itself, anything that already depends on
 * it, and completed milestones (the API doesn't allow adding or removing those as prerequisites).
 */
export function MilestoneFormDialog({ project, milestone, onClose }) {
  const milestones = useApiQuery(() => listMilestones(project.id), [project.id])
  const members = useApiQuery(() => listMembers(project.id), [project.id])
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
      members: members.data ?? [],
      checkedIds: data.getAll('members').map(Number),
    })

  return (
    <FormDialog
      title={milestone ? 'Edit milestone' : 'Add milestone'}
      description="Select several prerequisites when work depends on parallel branches. Circular dependencies are not allowed."
      submitLabel={milestone ? 'Save milestone' : 'Add milestone'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={save.submitting}
      submitDisabled={milestones.data === undefined || members.data === undefined}
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
        <div className="form-span">
          {members.data === undefined ? (
            <LoadingState label="Loading team…" />
          ) : (
            <CheckboxList
              label="Assigned employees"
              name="members"
              options={members.data.map((member) => ({
                value: member.id,
                label: member.user.name,
                detail: currentAssignment(member, milestone),
              }))}
              defaultValues={
                milestone ? members.data.filter((member) => member.milestone?.id === milestone.id).map((m) => m.id) : []
              }
              hint="Each employee works on one milestone per project. Unchecking someone leaves them without a milestone."
              emptyText="No one is on this project yet. Add people from the People tab first."
            />
          )}
        </div>
      </div>
    </FormDialog>
  )
}
