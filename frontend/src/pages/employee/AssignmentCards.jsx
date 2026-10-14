import { FolderKanban } from 'lucide-react'
import { Badge } from '../../components/ui'
import { getAssignmentTone } from '../../utils/milestones.js'
import { sumHours } from '../../utils/workLogs.js'
import './AssignmentCards.css'

/** One card per project with the employee's milestone, state and hours. assignments from getAssignments. */
export function AssignmentCards({ assignments, logs, onOpen }) {
  return (
    <div className="employee-assignment-grid">
      {assignments.map(({ project, milestone, state }) => (
        <button className="employee-assignment-card" key={project.id} onClick={() => onOpen(project)}>
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
      ))}
    </div>
  )
}
