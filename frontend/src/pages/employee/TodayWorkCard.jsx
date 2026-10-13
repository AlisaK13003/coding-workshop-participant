import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
} from 'lucide-react'
import { Badge, Button, EmptyState, Field, Select } from '../../components/ui'
import { TODAY_KEY, referenceToday } from '../../data/employeeData.js'
import { findById } from '../../utils/collections.js'
import { formatDate } from '../../utils/format.js'
import { pluralize } from '../../utils/text.js'
import {
  ASSIGNMENT_STATE,
  getAssignmentState,
  getCurrentMilestone,
  getLoggableProjects,
  getProjectsInState,
} from './employeeSelectors.js'
import './TodayWorkCard.css'

const TODAY_LABEL = referenceToday.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
const IS_WEEKEND = referenceToday.getDay() === 0 || referenceToday.getDay() === 6

function LoggedToday({ entry, projects, milestones }) {
  return (
    <div className="today-success">
      <span>
        <CheckCircle2 size={24} />
      </span>
      <div>
        <strong>Today’s work is logged</strong>
        <p>
          {findById(projects, entry.projectId)?.name} <ChevronRight size={13} />{' '}
          {findById(milestones, entry.milestoneId)?.name}
        </p>
        <small>{formatDate(entry.date)} · 8 hours</small>
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

function getIneligibleReason(projects, milestones) {
  const blocked = getProjectsInState(projects, milestones, ASSIGNMENT_STATE.waiting).length
  const unassigned = getProjectsInState(projects, milestones, ASSIGNMENT_STATE.none).length
  return [
    blocked > 0 &&
      `${blocked} ${pluralize(blocked, 'assignment is', 'assignments are')} waiting for prerequisites. `,
    unassigned > 0 &&
      `${unassigned} ${pluralize(unassigned, 'project needs', 'projects need')} a milestone assignment from your manager.`,
  ]
    .filter(Boolean)
    .join('')
}

/**
 * Today's logging card: shows today's entry, why logging is unavailable, or a
 * project picker with its milestone and the "Log today's work" button.
 */
export function TodayWorkCard({
  projects,
  milestones,
  logs,
  selectedProjectId,
  onSelectProject,
  onLog,
}) {
  const todaysEntry = logs.find((log) => log.date === TODAY_KEY)
  const eligible = getLoggableProjects(projects, milestones)
  const selected =
    findById(eligible, selectedProjectId) ||
    (eligible.length === 1 ? eligible[0] : null)
  const selectedMilestone = selected
    ? getCurrentMilestone(milestones, selected.id)
    : null

  const renderBody = () => {
    if (todaysEntry) {
      return (
        <LoggedToday entry={todaysEntry} projects={projects} milestones={milestones} />
      )
    }
    if (IS_WEEKEND) {
      return (
        <Unavailable icon={CalendarDays} title="Work logging is unavailable on weekends">
          Normal work entries can be submitted on weekdays only.
        </Unavailable>
      )
    }
    if (!projects.length) {
      return (
        <EmptyState
          title="No active projects"
          body="You do not currently have an active project assignment."
        />
      )
    }
    if (!eligible.length) {
      return (
        <Unavailable
          icon={CircleAlert}
          title="No assignment is currently eligible for logging"
        >
          {getIneligibleReason(projects, milestones)}
        </Unavailable>
      )
    }
    return (
      <div className="today-form">
        <Field label="Project">
          <Select
            value={selected?.id || ''}
            onChange={(value) => onSelectProject(Number(value))}
          >
            {eligible.length > 1 && <option value="">Select a project</option>}
            {eligible.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="selected-milestone">
          <span>Assigned milestone</span>
          <strong>{selectedMilestone?.name || 'Select a project'}</strong>
          {selectedMilestone && (
            <Badge tone={selectedMilestone.status}>
              {getAssignmentState(milestones, selected.id)}
            </Badge>
          )}
        </div>
        <div className="fixed-hours">
          <span>Total</span>
          <strong>8 hours</strong>
        </div>
        <Button disabled={!selected} onClick={onLog}>
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
          <h2>{TODAY_LABEL}</h2>
        </div>
        <span className="today-hours">8 hours</span>
      </div>
      {renderBody()}
      {!todaysEntry && eligible.length > 0 && (
        <div className="today-rule">
          You can submit one 8-hour entry per weekday across all projects.
        </div>
      )}
    </section>
  )
}
