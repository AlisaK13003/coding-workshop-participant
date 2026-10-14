import { ChevronRight, FolderKanban } from 'lucide-react'
import { Badge } from '../../components/ui'
import { formatDateRange } from '../../utils/format.js'
import { getAssignmentTone } from '../../utils/milestones.js'
import { sumHours } from '../../utils/workLogs.js'
import './ProjectList.css'

/** Row list of the employee's projects with manager, milestone, state and hours. */
export function ProjectList({ assignments, logs, onOpen }) {
  return (
    <div className="employee-project-list">
      {assignments.map(({ project, milestone, state }) => (
        <button key={project.id} onClick={() => onOpen(project)}>
          <div className="project-list-main">
            <span className="project-list-icon">
              <FolderKanban size={18} />
            </span>
            <p>
              <strong>{project.name}</strong>
              <small>{formatDateRange(project.start_date, project.end_date)}</small>
            </p>
          </div>
          <div>
            <span>Manager</span>
            <strong>{project.manager?.name ?? '—'}</strong>
          </div>
          <div>
            <span>Assigned milestone</span>
            <strong>{milestone?.name ?? 'Not assigned'}</strong>
            {milestone && <small>{formatDateRange(milestone.start_date, milestone.end_date)}</small>}
          </div>
          <div>
            <span>Assignment state</span>
            <Badge tone={getAssignmentTone(state)}>{state}</Badge>
          </div>
          <div>
            <span>Your hours</span>
            <strong>{sumHours(logs, (log) => log.project.id === project.id)} h</strong>
          </div>
          <ChevronRight size={17} />
        </button>
      ))}
    </div>
  )
}
