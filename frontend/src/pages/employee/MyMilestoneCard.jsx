import { Check, CircleAlert, Clock3, Send, Users } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { teammates } from '../../data/employeeData.js'
import { findById } from '../../utils/collections.js'
import { cx } from '../../utils/cx.js'
import { formatDateRange } from '../../utils/format.js'
import { MILESTONE_STATUS, getMilestoneState } from '../../utils/milestones.js'
import { getStateTone, sumHours } from './employeeSelectors.js'
import './MyMilestoneCard.css'

function Prerequisites({ milestone, milestones }) {
  const prerequisites = milestone.prerequisiteIds
    .map((id) => findById(milestones, id))
    .filter(Boolean)
  return (
    <div className="prerequisite-list">
      <span>Prerequisites</span>
      {prerequisites.length ? (
        prerequisites.map((item) => {
          const done = item.status === MILESTONE_STATUS.completed
          return (
            <div key={item.id}>
              <span className={done ? 'done' : undefined}>
                {done ? <Check size={12} /> : <Clock3 size={12} />}
              </span>
              <strong>{item.name}</strong>
              <Badge tone={item.status}>{item.status}</Badge>
            </div>
          )
        })
      ) : (
        <small>No prerequisites</small>
      )}
    </div>
  )
}

function StateNote({ className, icon: Icon, title, children }) {
  return (
    <div className={className}>
      <Icon size={17} />
      <p>
        <strong>{title}</strong>
        <span>{children}</span>
      </p>
    </div>
  )
}

/**
 * The employee's current milestone on a project: dates, hours, teammates,
 * prerequisites, state notes and the log / request-review actions.
 */
export function MyMilestoneCard({
  milestone,
  state,
  milestones,
  logs,
  hasLoggedToday,
  onLog,
  onReview,
}) {
  const status = milestone ? getMilestoneState(milestone, milestones) : null
  const awaitingReview = milestone?.status === MILESTONE_STATUS.review
  const canLog =
    !hasLoggedToday &&
    (status === MILESTONE_STATUS.available || status === MILESTONE_STATUS.review)
  const canReview = status === MILESTONE_STATUS.available && !awaitingReview

  return (
    <section className={cx('my-milestone-card', !milestone && 'empty')}>
      <div className="my-milestone-heading">
        <div>
          <span className="eyebrow">My milestone</span>
          <h2>{milestone?.name || 'No milestone assigned'}</h2>
          <p>
            {milestone
              ? formatDateRange(milestone.start, milestone.end)
              : 'You’re part of this project but don’t have a milestone assignment yet.'}
          </p>
        </div>
        <Badge tone={getStateTone(state)}>{state}</Badge>
      </div>
      {milestone ? (
        <>
          <div className="milestone-metrics">
            <div>
              <span>Milestone total hours</span>
              <strong>{milestone.totalHours} h</strong>
              <small>Everyone assigned to this milestone</small>
            </div>
            <div>
              <span>Your hours</span>
              <strong>
                {sumHours(logs, (log) => log.milestoneId === milestone.id)} h
              </strong>
              <small>Your contribution across visible entries</small>
            </div>
            <div>
              <span>Assigned teammates</span>
              <strong>
                {milestone.employeeIds
                  .map((id) => findById(teammates, id)?.name)
                  .filter(Boolean)
                  .join(', ')}
              </strong>
              <small>{milestone.employeeIds.length} people</small>
            </div>
          </div>
          <Prerequisites milestone={milestone} milestones={milestones} />
          {status === MILESTONE_STATUS.blocked && (
            <StateNote
              className="blocked-explanation"
              icon={CircleAlert}
              title="Waiting for prerequisites"
            >
              Logging becomes available when every prerequisite is complete.
              Your manager or an admin controls milestone completion.
            </StateNote>
          )}
          {awaitingReview && (
            <StateNote
              className="review-pending-state"
              icon={Clock3}
              title="Awaiting manager review"
            >
              Your request asks Maya to review the entire milestone. Logging
              remains available while the milestone is open.
            </StateNote>
          )}
          {milestone.feedback && (
            <div className="manager-feedback">
              <span>Manager feedback</span>
              <p>{milestone.feedback}</p>
            </div>
          )}
          <div className="milestone-actions">
            <Button
              disabled={!canLog}
              onClick={onLog}
              variant={canLog ? 'primary' : 'secondary'}
            >
              <Clock3 size={16} />
              {hasLoggedToday ? 'Today’s work is logged' : 'Log today’s work'}
            </Button>
            <Button variant="secondary" disabled={!canReview} onClick={onReview}>
              <Send size={16} />
              {awaitingReview
                ? 'Awaiting manager review'
                : 'Request milestone review'}
            </Button>
          </div>
        </>
      ) : (
        <div className="no-milestone-state">
          <Users size={22} />
          <p>
            Your manager handles milestone assignments. Work logging and review
            requests are unavailable for this project until you have one.
          </p>
        </div>
      )}
    </section>
  )
}
