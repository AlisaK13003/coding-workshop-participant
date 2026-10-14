import { Check } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import { formatDateRange } from '../../utils/format.js'
import { MILESTONE_STATUS } from '../../utils/milestones.js'
import { EmptyState } from '../ui'
import { MilestoneStatusBadge } from './MilestoneStatusBadge.jsx'
import './MilestoneTimeline.css'

/** Vertical numbered list of milestones with their dates and status. */
export function MilestoneTimeline({ milestones }) {
  if (!milestones.length) {
    return <EmptyState title="No milestones yet" body="The project plan is empty." />
  }
  return (
    <div className="timeline">
      {milestones.map((milestone, index) => {
        const done = milestone.status === MILESTONE_STATUS.completed
        return (
          <div key={milestone.id}>
            <span
              className={cx(
                'timeline-node',
                done && 'done',
                milestone.status === MILESTONE_STATUS.review && 'review',
              )}
            >
              {done ? <Check size={13} /> : index + 1}
            </span>
            <p>
              <strong>{milestone.name}</strong>
              <small>{formatDateRange(milestone.start_date, milestone.end_date)}</small>
            </p>
            <MilestoneStatusBadge status={milestone.status} />
          </div>
        )
      })}
    </div>
  )
}
