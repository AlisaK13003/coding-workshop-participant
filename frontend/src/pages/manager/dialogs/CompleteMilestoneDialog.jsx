import { FormDialog } from '../../../components/dialogs'
import { Button, Field, Select } from '../../../components/ui'
import { findById } from '../../../utils/collections.js'
import { fullName } from '../../../utils/format.js'
import {
  MILESTONE_STATUS,
  getMilestoneState,
  getPrerequisiteNames,
} from '../../../utils/milestones.js'
import { ReviewDetail } from './ReviewDetail.jsx'

function getDetailItems(milestone, milestones, employees) {
  const assigned = milestone.employeeIds
    .map((id) => findById(employees, id))
    .filter(Boolean)
  return [
    { label: 'Milestone', value: milestone.name },
    milestone.requester && {
      label: 'Requested by',
      value: `${milestone.requester} · ${milestone.requestDate}`,
    },
    {
      label: 'Assigned employees',
      value: assigned.map(fullName).join(', ') || 'No assigned employees',
    },
    { label: 'Logged hours', value: `${milestone.hours} h` },
    {
      label: 'Prerequisites',
      value: getPrerequisiteNames(milestone, milestones),
    },
  ].filter(Boolean)
}

/**
 * Complete a milestone and optionally move its employees. With onKeepOpen
 * (review mode) it is titled as a review and offers "Keep open".
 */
export function CompleteMilestoneDialog({
  milestone,
  milestones,
  employees,
  onClose,
  onComplete,
  onKeepOpen,
}) {
  const destinations = milestones.filter(
    (item) =>
      item.projectId === milestone.projectId &&
      item.id !== milestone.id &&
      item.status !== MILESTONE_STATUS.completed,
  )
  const handleSubmit = (data) =>
    onComplete(data.get('destination') ? Number(data.get('destination')) : null)

  return (
    <FormDialog
      title={onKeepOpen ? 'Review milestone completion' : 'Complete milestone'}
      description="Completion is permanent. Completed milestones cannot be reopened."
      submitLabel="Mark complete"
      onClose={onClose}
      onSubmit={handleSubmit}
      wide
      intro={
        <ReviewDetail items={getDetailItems(milestone, milestones, employees)} />
      }
      leadingActions={
        onKeepOpen && (
          <Button variant="secondary" onClick={onKeepOpen}>
            Keep open
          </Button>
        )
      }
    >
      <Field
        label="Move all assigned employees to (optional)"
        hint="If the destination has unfinished prerequisites, employees will wait and cannot log work. Choosing no destination leaves them on the project without a milestone."
      >
        <Select name="destination">
          <option value="">No destination — leave unassigned</option>
          {destinations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {getMilestoneState(item, milestones)}
            </option>
          ))}
        </Select>
      </Field>
    </FormDialog>
  )
}
