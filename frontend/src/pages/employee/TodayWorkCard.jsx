import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
} from 'lucide-react'
import { MilestoneStatusBadge } from '../../components/milestones/MilestoneStatusBadge.jsx'
import { Button, EmptyState, Field, Select } from '../../components/ui'
import { isWeekday } from '../../utils/calendar.js'
import { formatDate } from '../../utils/format.js'
import { ASSIGNMENT_STATE } from '../../utils/milestones.js'
import { pluralize } from '../../utils/text.js'
import { findTodaysLog, getLoggableAssignments } from './employeeSelectors.js'
import './TodayWorkCard.css'

function LoggedToday({ log }) {
  return (
    <div className="today-success">
      <span>
        <CheckCircle2 size={24} />
      </span>
      <div>
        <strong>Today’s work is logged</strong>
        <p>
          {log.project.name} <ChevronRight size={13} /> {log.milestone.name}
        </p>
        <small>{formatDate(log.work_date)} · {log.hours} hours</small>
      </div>
    </div>
  )
}

function Unavailable({ icon: Icon, title, children }) {
  return (
    <div className="today-unavailable">
      <Icon size={22} />
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  )
}

/** Why none of the assignments can take work today, e.g. "1 assignment is waiting for prerequisites." */
function getIneligibleReason(assignments) {
  const count = (state) => assignments.filter((item) => item.state === state).length
  const waiting = count(ASSIGNMENT_STATE.waiting)
  const review = count(ASSIGNMENT_STATE.review)
  const none = count(ASSIGNMENT_STATE.none)
  return [
    waiting > 0 && `${waiting} ${pluralize(waiting, 'assignment is', 'assignments are')} waiting for prerequisites.`,
    review > 0 && `${review} ${pluralize(review, 'milestone is', 'milestones are')} awaiting your manager’s review.`,
    none > 0 && `${none} ${pluralize(none, 'project needs', 'projects need')} a milestone assignment from your manager.`,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Today's logging card: shows today's entry, why logging is unavailable, or a
 * project picker with its milestone and the "Log today's work" button.
 */
export function TodayWorkCard({ assignments, logs, selectedProjectId, onSelectProject, onLog }) {
  const today = new Date()
  const todaysLog = findTodaysLog(logs)
  const eligible = getLoggableAssignments(assignments, logs)
  const selected =
    eligible.find(({ project }) => project.id === selectedProjectId) ??
    (eligible.length === 1 ? eligible[0] : null)

  const renderBody = () => {
    if (todaysLog) return <LoggedToday log={todaysLog} />
    if (!isWeekday(today)) {
      return (
        <Unavailable icon={CalendarDays} title="Work logging is unavailable on weekends">
          Work entries can be submitted on weekdays only.
        </Unavailable>
      )
    }
    if (!assignments.length) {
      return <EmptyState title="No active projects" body="You don’t have an active project assignment yet." />
    }
    if (!eligible.length) {
      return (
        <Unavailable icon={CircleAlert} title="No assignment can take work today">
          {getIneligibleReason(assignments)}
        </Unavailable>
      )
    }
    return (
      <div className="today-form">
        <Field label="Project">
          <Select value={selected?.project.id ?? ''} onChange={(value) => onSelectProject(Number(value))}>
            {eligible.length > 1 && <option value="">Select a project</option>}
            {eligible.map(({ project }) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="selected-milestone">
          <span>Assigned milestone</span>
          <strong>{selected?.milestone.name ?? 'Select a project'}</strong>
          {selected && <MilestoneStatusBadge status={selected.milestone.status} />}
        </div>
        <div className="fixed-hours">
          <span>Total</span>
          <strong>8 hours</strong>
        </div>
        <Button disabled={!selected} onClick={() => onLog(selected)}>
          <Clock3 size={16} />
          Log today’s work
        </Button>
      </div>
    )
  }

  return (
    <section className="today-card">
      <div className="today-card-head">
        <div>
          <span className="eyebrow">Today’s work</span>
          <h2>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
        </div>
        <span className="today-hours">8 hours</span>
      </div>
      {renderBody()}
      {!todaysLog && eligible.length > 0 && (
        <div className="today-rule">You can submit one 8-hour entry per weekday across all projects.</div>
      )}
    </section>
  )
}
