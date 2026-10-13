import { Check } from 'lucide-react'
import { cx } from '../../utils/cx.js'
import { MILESTONE_STATUS } from '../../utils/milestones.js'
import { Badge } from '../ui'
import './MilestoneTimeline.css'

/**
 * Vertical numbered list of milestones with their dates and state.
 * getState(milestone) → status shown (default: milestone.status).
 * getDates(milestone) → date text (default: milestone.dates).
 */
export function MilestoneTimeline({
  milestones,
  getState = (milestone) => milestone.status,
  getDates = (milestone) => milestone.dates,
}) {
  return (
    <div className="timeline">
      {milestones.map((milestone, index) => {
        const state = getState(milestone)
        const done = state === MILESTONE_STATUS.completed
        return (
          <div key={milestone.id}>
            <span
              className={cx(
                'timeline-node',
                done && 'done',
                state === MILESTONE_STATUS.review && 'review',
              )}
            >
              {done ? <Check size={13} /> : index + 1}
            </span>
            <p>
              <strong>{milestone.name}</strong>
              <small>{getDates(milestone)}</small>
            </p>
            <Badge tone={state}>{state}</Badge>
          </div>
        )
      })}
    </div>
  )
}
