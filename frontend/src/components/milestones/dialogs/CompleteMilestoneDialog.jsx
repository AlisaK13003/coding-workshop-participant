import { useState } from 'react'
import { FormDialog } from '../../dialogs'
import { Button, Field, Select, TextArea } from '../../ui'
import { DIALOGS } from '../../workspace/dialogKinds.js'
import { useApiQuery } from '../../../hooks/useApiQuery.js'
import { useMutation } from '../../../hooks/useMutation.js'
import {
  completeMilestone,
  decideReview,
  listMilestones,
} from '../../../services/milestonesApi.js'
import { formatDateTime, formatHours } from '../../../utils/format.js'
import {
  getMemberNames,
  getPrerequisiteNames,
  milestoneStatusLabel,
  openMilestones,
} from '../../../utils/milestones.js'
import { ReviewDetail } from './ReviewDetail.jsx'

function getDetailItems(milestone, milestones) {
  const review = milestone.pending_review
  return [
    { label: 'Milestone', value: milestone.name },
    review && {
      label: 'Requested by',
      value: `${review.requested_by.name} · ${formatDateTime(review.requested_at)}`,
    },
    { label: 'Assigned employees', value: getMemberNames(milestone) },
    { label: 'Logged hours', value: formatHours(milestone.hours) },
    { label: 'Prerequisites', value: getPrerequisiteNames(milestone, milestones) },
  ].filter(Boolean)
}

/**
 * Complete a milestone and optionally move its employees to another one. With
 * `review` it decides the waiting review request instead: accept (which completes
 * the milestone) with optional feedback, or "Keep open", which opens KeepOpenDialog
 * and carries over any feedback already typed here.
 */
export function CompleteMilestoneDialog({ milestone, review = false, onClose, onOpenDialog }) {
  const milestones = useApiQuery(() => listMilestones(milestone.project_id), [milestone.project_id])
  const [feedback, setFeedback] = useState('')
  const complete = useMutation(
    ({ destinationId, feedback }) =>
      review
        ? decideReview(milestone.id, milestone.pending_review.id, {
            decision: 'accepted',
            feedback,
            destinationId,
          })
        : completeMilestone(milestone.id, destinationId),
    {
      success: (_, { destinationId }) =>
        destinationId ? 'Milestone completed and its employees moved.' : 'Milestone completed.',
      onSuccess: onClose,
    },
  )
  const all = milestones.data ?? []
  const destinations = openMilestones(all).filter((item) => item.id !== milestone.id)

  const handleSubmit = (data) =>
    complete.run({
      destinationId: data.get('destination') ? Number(data.get('destination')) : null,
      feedback,
    })

  return (
    <FormDialog
      title={review ? 'Review milestone completion' : 'Complete milestone'}
      description="Completion is permanent. Completed milestones can’t be reopened."
      submitLabel={review ? 'Accept and complete' : 'Mark complete'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={complete.submitting}
      error={complete.error}
      wide
      intro={<ReviewDetail items={getDetailItems(milestone, all)} />}
      leadingActions={
        review && (
          <Button
            variant="secondary"
            onClick={() => onOpenDialog(DIALOGS.keepOpen, { milestone, feedback })}
          >
            Keep open
          </Button>
        )
      }
    >
      <div className="form-single">
        <Field
          label="Move all assigned employees to (optional)"
          hint="If the destination still has unfinished prerequisites, employees wait there and can’t log work. With no destination they stay on the project without a milestone."
          error={complete.fieldErrors.destination_milestone_id}
        >
          <Select name="destination">
            <option value="">No destination — leave unassigned</option>
            {destinations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {milestoneStatusLabel(item.status)}
              </option>
            ))}
          </Select>
        </Field>
        {review && (
          <Field label="Feedback for the requester (optional)" error={complete.fieldErrors.feedback}>
            <TextArea
              name="feedback"
              maxLength={2000}
              placeholder="What went well, or what still needs attention"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
          </Field>
        )}
      </div>
    </FormDialog>
  )
}
