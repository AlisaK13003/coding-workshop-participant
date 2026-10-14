import { FolderKanban, Send } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import { MILESTONE_STATUS, getAssignmentTone } from '../../utils/milestones.js'
import { sumHours } from '../../utils/workLogs.js'
import { canRequestReview } from './employeeSelectors.js'
import './AssignmentCards.css'

/** Why "Request review" is unavailable for a milestone, shown on hover; null when it's available. */
function reviewBlocker(milestone) {
  if (canRequestReview(milestone)) return null
  if (milestone.status === MILESTONE_STATUS.review) return 'Already waiting for your manager’s review'
  if (milestone.status === MILESTONE_STATUS.blocked) return 'Waiting for prerequisites'
  if (milestone.status === MILESTONE_STATUS.available) return 'Reviews can be requested on weekdays'
  return 'This milestone is complete'
}

/**
 * One card per project with the employee's milestone, state and hours. Clicking the card
 * opens the project; "Request review" asks the manager to review the milestone (which also
 * logs today). assignments from getAssignments.
 */
export function AssignmentCards({ assignments, logs, onOpen, onReview }) {
  return (
    <div className="employee-assignment-grid">
      {assignments.map(({ project, milestone, state }) => (
        <div className="employee-assignment-card" key={project.id}>
          <button className="employee-assignment-open" onClick={() => onOpen(project)}>
            <div>
              <FolderKanban size={18} />
              <Badge tone={getAssignmentTone(state)}>{state}</Badge>
            </div>
            <strong>{project.name}</strong>
            <span>{milestone?.name ?? 'No milestone assigned'}</span>
            <dl>
              <div>
                <dt>Manager</dt>
                <dd>{project.manager?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Your logged hours</dt>
                <dd>{sumHours(logs, (log) => log.project.id === project.id)} h</dd>
              </div>
            </dl>
          </button>
          {milestone && (
            <Button
              variant="secondary"
              disabled={!canRequestReview(milestone)}
              title={reviewBlocker(milestone) ?? undefined}
              onClick={() => onReview({ project, milestone })}
            >
              <Send size={14} />
              {milestone.status === MILESTONE_STATUS.review ? 'Awaiting review' : 'Request review'}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
