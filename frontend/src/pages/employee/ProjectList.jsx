import { ChevronRight, FolderKanban } from 'lucide-react'
import { Badge } from '../../components/ui'
import { formatDateRange } from '../../utils/format.js'
import {
  getAssignmentState,
  getCurrentMilestone,
  getStateTone,
  sumHours,
} from './employeeSelectors.js'
import './ProjectList.css'

/** Row list of the employee's projects with manager, milestone, state and hours. */
export function ProjectList({ projects, milestones, logs, onOpen }) {
  return (
    <div className="employee-project-list">
      {projects.map((project) => {
        const milestone = getCurrentMilestone(milestones, project.id)
        const state = getAssignmentState(milestones, project.id)
        return (
          <button key={project.id} onClick={() => onOpen(project)}>
            <div className="project-list-main">
              <span className="project-list-icon">
                <FolderKanban size={18} />
              </span>
              <p>
                <strong>{project.name}</strong>
                <small>{formatDateRange(project.start, project.end)}</small>
              </p>
            </div>
            <div>
              <span>Manager</span>
              <strong>{project.manager}</strong>
            </div>
            <div>
              <span>Assigned milestone</span>
              <strong>{milestone?.name || 'Not assigned'}</strong>
              {milestone && (
                <small>{formatDateRange(milestone.start, milestone.end)}</small>
              )}
            </div>
            <div>
              <span>Assignment state</span>
              <Badge tone={getStateTone(state)}>{state}</Badge>
            </div>
            <div>
              <span>Your hours</span>
              <strong>
                {sumHours(logs, (log) => log.projectId === project.id)} h
              </strong>
            </div>
            <ChevronRight size={17} />
          </button>
        )
      })}
    </div>
  )
}
