import { Check, CircleAlert, Clock3, Send, Users } from 'lucide-react'
import { MilestoneStatusBadge } from '../../components/milestones/MilestoneStatusBadge.jsx'
import { Badge, Button } from '../../components/ui'
import { findById } from '../../utils/collections.js'
import { cx } from '../../utils/cx.js'
import { formatDateRange, formatDateTime, formatHours } from '../../utils/format.js'
import { MILESTONE_STATUS, getAssignmentTone } from '../../utils/milestones.js'
import { pluralize } from '../../utils/text.js'
import { sumHours } from '../../utils/workLogs.js'
import { canLogToday, canRequestReview, findTodaysLog } from './employeeSelectors.js'
import './MyMilestoneCard.css'

function Prerequisites({ milestone, milestones }) {
  const prerequisites = milestone.prerequisite_ids
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
              <span className={cx('prerequisite-icon', done && 'done')}>
                {done ? <Check size={12} /> : <Clock3 size={12} />}
              </span>
              <strong>{item.name}</strong>
              <MilestoneStatusBadge status={item.status} />
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

/** Why the log button is disabled, or nothing when it isn't. */
function getLogBlocker(milestone, logs) {
  if (findTodaysLog(logs)) return 'Today’s work is logged'
  if (milestone.status === MILESTONE_STATUS.blocked) return 'Waiting for prerequisites'
  if (milestone.status === MILESTONE_STATUS.review) return 'Paused during review'
  return null
}

/**
 * The employee's current milestone on a project: dates, hours, teammates,
 * prerequisites, state notes, the manager's latest feedback and the
 * log / request-review actions (enabled only when the API would allow them).
 */
export function MyMilestoneCard({ project, milestone, state, milestones, logs, latestReview, onLog, onReview }) {
  const canLog = canLogToday(milestone, logs)
  const canReview = canRequestReview(milestone)
  const awaitingReview = milestone?.status === MILESTONE_STATUS.review
  const managerName = project.manager?.name ?? 'your manager'
  const feedback = latestReview?.decision === 'kept_open' && !awaitingReview ? latestReview : null

  return (
    <section className={cx('my-milestone-card', !milestone && 'empty')}>
      <div className="my-milestone-heading">
        <div>
          <span className="eyebrow">My milestone</span>
          <h2>{milestone?.name ?? 'No milestone assigned'}</h2>
          <p>
            {milestone
              ? formatDateRange(milestone.start_date, milestone.end_date)
              : 'You’re part of this project but don’t have a milestone assignment yet.'}
          </p>
        </div>
        <Badge tone={getAssignmentTone(state)}>{state}</Badge>
      </div>
      {milestone ? (
        <>
          <div className="milestone-metrics">
            <div>
              <span>Milestone total hours</span>
              <strong>{formatHours(milestone.hours)}</strong>
              <small>Everyone assigned to this milestone</small>
            </div>
            <div>
              <span>Your hours</span>
              <strong>{formatHours(sumHours(logs, (log) => log.milestone.id === milestone.id))}</strong>
              <small>Your contribution across visible entries</small>
            </div>
            <div>
              <span>Assigned teammates</span>
              <strong>{milestone.members.map((member) => member.name).join(', ')}</strong>
              <small>
                {milestone.members.length} {pluralize(milestone.members.length, 'person', 'people')}
              </small>
            </div>
          </div>
          <Prerequisites milestone={milestone} milestones={milestones} />
          {milestone.status === MILESTONE_STATUS.blocked && (
            <StateNote className="blocked-explanation" icon={CircleAlert} title="Waiting for prerequisites">
              Logging becomes available when every prerequisite is complete.
              Your manager or an admin controls milestone completion.
            </StateNote>
          )}
          {awaitingReview && (
            <StateNote className="review-pending-state" icon={Clock3} title="Awaiting manager review">
              {milestone.pending_review.requested_by.name} asked {managerName} to review the whole milestone on{' '}
              {formatDateTime(milestone.pending_review.requested_at)}. Logging is paused until they decide.
            </StateNote>
          )}
          {feedback && (
            <div className="manager-feedback">
              <span>Kept open by {feedback.decided_by?.name} · {formatDateTime(feedback.decided_at)}</span>
              <p>{feedback.feedback || 'No feedback was added.'}</p>
            </div>
          )}
          <div className="milestone-actions">
            <Button disabled={!canLog} onClick={onLog} variant={canLog ? 'primary' : 'secondary'}>
              <Clock3 size={16} />
              {canLog ? 'Log today’s work' : getLogBlocker(milestone, logs) ?? 'Log today’s work'}
            </Button>
            <Button variant="secondary" disabled={!canReview} onClick={onReview}>
              <Send size={16} />
              {awaitingReview ? 'Awaiting manager review' : 'Request milestone review'}
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
