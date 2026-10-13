import { FolderKanban } from 'lucide-react'
import { Badge } from '../../components/ui'
import {
  getAssignmentState,
  getCurrentMilestone,
  getStateTone,
  sumHours,
} from './employeeSelectors.js'
import './AssignmentCards.css'

/** One card per project with the employee's milestone, state and hours. */
export function AssignmentCards({ projects, milestones, logs, onOpen }) {
  return (
    <div className="employee-assignment-grid">
      {projects.map((project) => {
        const milestone = getCurrentMilestone(milestones, project.id)
        const state = getAssignmentState(milestones, project.id)
        return (
          <button
            className="employee-assignment-card"
            key={project.id}
            onClick={() => onOpen(project)}
          >
            <div>
              <FolderKanban size={18} />
              <Badge tone={getStateTone(state)}>{state}</Badge>
            </div>
            <strong>{project.name}</strong>
            <span>{milestone?.name || 'No milestone assigned'}</span>
            <dl>
              <div>
                <dt>Manager</dt>
                <dd>{project.manager}</dd>
              </div>
              <div>
                <dt>Your logged hours</dt>
                <dd>
                  {sumHours(logs, (log) => log.projectId === project.id)} h
                </dd>
              </div>
            </dl>
          </button>
        )
      })}
    </div>
  )
}
