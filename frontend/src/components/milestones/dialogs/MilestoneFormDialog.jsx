import { FormDialog } from '../../dialogs'
import { CheckboxList, Field, Input, LoadingState, PickList } from '../../ui'
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
 * Every other milestone is offered as a prerequisite; completed ones and ones that depend on
 * this milestone are greyed out with the reason (the API doesn't allow them).
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
  // Every other milestone is listed; ones the API won't accept are greyed out with the reason.
  const prerequisiteOptions = all
    .filter((item) => item.id !== milestone?.id)
    .map((item) => ({
      value: item.id,
      label: item.name,
      disabledReason: isCompleted(item)
        ? 'completed'
        : milestone && dependsOn(item.id, milestone.id, all)
          ? 'would create a loop'
          : undefined,
    }))
  // Completed prerequisites can't be removed, so they're always kept (shown without ×).
  const keptIds = milestone
    ? milestone.prerequisite_ids.filter((id) => all.some((item) => item.id === id && isCompleted(item)))
    : []
  const keptItems = all
    .filter((item) => keptIds.includes(item.id))
    .map((item) => ({ value: item.id, label: item.name, note: 'Completed · stays' }))

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
      description="Add several prerequisites when work depends on parallel branches. Circular dependencies are not allowed."
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
        {milestones.data === undefined ? (
          <LoadingState label="Loading milestones…" />
        ) : (
          <PickList
            label="Prerequisites"
            name="prerequisites"
            options={prerequisiteOptions}
            defaultValues={milestone?.prerequisite_ids.filter((id) => !keptIds.includes(id)) ?? []}
            locked={keptItems}
            placeholder="Add a prerequisite…"
            emptyText="None: this milestone can start straight away."
            error={errors.prerequisite_ids}
          />
        )}
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
